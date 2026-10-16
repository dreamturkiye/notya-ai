/**
 * NOTYA-HASTA-ILETISIMI-01 — the bulk-send engine itself.
 *
 * Idempotency, two layers:
 *   1) hasta_iletisim_kampanyalari unique(doctor_id, idempotency_key) — a retried "create campaign"
 *      call (same idempotencyKey) returns the SAME campaign row, never a second one.
 *   2) hasta_iletisim_kampanya_alicilari unique(kampanya_id, patient_id, kanal) — kampanyaGonder
 *      INSERTs the recipient row BEFORE attempting the send; a retried/duplicate execute hits
 *      unique_violation on that insert and is treated as "already handled, do not send again" —
 *      not a read-then-write race, an actual constraint.
 *
 * Permission: UNIVERSAL — doktor and any active personel (sekreter) of that doctor have the same
 * full access (see migration 166 comment + lib/iletisim/toplu/README.md); callers pass whichever
 * pratikOturum() resolved and this module does not re-narrow it.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { gonderilebilirMi } from '../izin'
import { smsNumarasi, epostaAdresi } from '../baglantilar'
import { vazgecBaglantisi, vazgecAnahtariVarMi } from '../vazgecJetonu'
import { TOPLU_ACIL_SATIRI, smsVazgecSatiri } from './sablonlar'
import { adaylariGetir } from './filtre'
import { smsGonder, hazirSmsGonderici } from '../sms/gonderici'
import { gonderici as epostaGondericisi } from '../otomatik/eposta'
import type { AdayHasta, AliciSonucu, KampanyaOlusturGirdisi, KampanyaSonucu } from './tipler'

export class KampanyaHatasi extends Error {
  /** Machine-readable reason for the route (e.g. 'onizleme_degisti' maps to 409). */
  constructor(mesaj: string, public kod?: string) { super(mesaj) }
}

export type KimlikBilgisi = { userId: string; personelId: string | null; rol: 'doktor' | 'sekreter' }

export async function kampanyaOnizle(supabase: SupabaseClient, doktorId: string, filtre: KampanyaOlusturGirdisi['filtre']): Promise<{ aday: AdayHasta[]; hedefSayisi: number }> {
  const aday = await adaylariGetir(supabase, doktorId, filtre)
  return { aday, hedefSayisi: aday.length }
}

/** Material = more than 10% AND more than 2 patients apart (small churn between preview and confirm is normal). */
export function onizlemeSapmasiBuyukMu(onizlenen: number, simdi: number): boolean {
  const fark = Math.abs(onizlenen - simdi)
  return fark > 2 && fark > Math.max(onizlenen, simdi) * 0.1
}

export async function kampanyaOlustur(
  supabase: SupabaseClient,
  doktorId: string,
  kimlik: KimlikBilgisi,
  girdi: KampanyaOlusturGirdisi,
): Promise<{ kampanyaId: string; hedefSayisi: number }> {
  const govde = String(girdi.govde || '').trim()
  if (!govde) throw new KampanyaHatasi('Mesaj metni boş olamaz.')
  if (govde.length > 2000) throw new KampanyaHatasi('Mesaj metni çok uzun.')
  if (!girdi.idempotencyKey?.trim()) throw new KampanyaHatasi('idempotencyKey zorunludur.')

  const { aday } = await kampanyaOnizle(supabase, doktorId, girdi.filtre)

  // PREVIEW-vs-SEND DRIFT: the human confirmed N recipients; if the audience recomputed now differs
  // materially, refuse and ask for a fresh preview. A retry of an existing campaign is exempt
  // (the campaign row already froze its audience size).
  const onizlenen = girdi.onizlemeHedefSayisi
  if (typeof onizlenen === 'number' && Number.isFinite(onizlenen) && onizlemeSapmasiBuyukMu(onizlenen, aday.length)) {
    const { data: varOlan } = await supabase.from('hasta_iletisim_kampanyalari').select('id').eq('doctor_id', doktorId).eq('idempotency_key', girdi.idempotencyKey.trim()).maybeSingle()
    if (!varOlan) {
      throw new KampanyaHatasi(`Hedef kitle önizlemeden bu yana değişti (önizleme: ${onizlenen} hasta, şimdi: ${aday.length} hasta). Lütfen önizlemeyi yenileyip tekrar onaylayın.`, 'onizleme_degisti')
    }
  }

  const satir = {
    doctor_id: doktorId,
    idempotency_key: girdi.idempotencyKey.trim(),
    olusturan_user_id: kimlik.userId,
    olusturan_personel_id: kimlik.personelId,
    olusturan_rol: kimlik.rol,
    kanal: girdi.kanal,
    konu: girdi.konu || null,
    govde,
    sablon_anahtari: girdi.sablonAnahtari || null,
    filtre: girdi.filtre as unknown as Record<string, unknown>,
    tetikleyici: girdi.tetikleyici || 'manuel',
    asi_stok_lot_id: girdi.asiStokLotId || null,
    hedef_sayisi: aday.length,
    durum: 'taslak' as const,
  }

  const { data: eklenen, error } = await supabase.from('hasta_iletisim_kampanyalari').insert(satir).select('id, hedef_sayisi').single()
  if (!error && eklenen) return { kampanyaId: eklenen.id, hedefSayisi: eklenen.hedef_sayisi }

  // unique_violation on (doctor_id, idempotency_key) → the retry: return the campaign already made.
  const { data: mevcut } = await supabase
    .from('hasta_iletisim_kampanyalari')
    .select('id, hedef_sayisi')
    .eq('doctor_id', doktorId)
    .eq('idempotency_key', girdi.idempotencyKey.trim())
    .maybeSingle()
  if (mevcut) return { kampanyaId: mevcut.id, hedefSayisi: mevcut.hedef_sayisi }
  throw new KampanyaHatasi('Kampanya oluşturulamadı.')
}

/** A 'bekliyor' row younger than this belongs to a request that may still be running — never touched. */
export const BEKLEYEN_ESIK_MS = 120_000
/** A recipient row is attempted at most this many times in total (first send + ONE resume). */
export const EN_FAZLA_DENEME = 2
/** Work cap per request: after this many rows needing DB/send work, answer 'devam' instead of truncating silently. */
export const ISTEK_ALICI_SINIRI = 150
/** Wall-clock budget per request; route maxDuration is 300s, leave headroom for the last send + bookkeeping. */
export const ISTEK_SURE_BUTCESI_MS = 240_000

const VARSAYILAN_BAGIMLILIKLAR = {
  adaylariGetir,
  epostaGondericisi,
  smsGonder,
  hazirSmsGonderici,
  vazgecBaglantisi,
  vazgecAnahtariVarMi,
  simdi: () => Date.now(),
  bekleyenEsikMs: BEKLEYEN_ESIK_MS,
  istekAliciSiniri: ISTEK_ALICI_SINIRI,
  sureButcesiMs: ISTEK_SURE_BUTCESI_MS,
}
/** Overridable seams (tests inject fakes; production uses the defaults above). */
export type GonderBagimliliklari = typeof VARSAYILAN_BAGIMLILIKLAR

export const VAZGEC_ANAHTARI_YOK_MESAJI = 'E-posta gönderilemiyor: abonelikten çıkma bağlantısı oluşturulamıyor (sunucuda PORTAL_TOKEN_SECRET tanımlı değil). Hiçbir e-posta gönderilmedi; lütfen yöneticiye bildirin.'

type MevcutSatir = { durum: string; deneme: number; talep_at: string | null; created_at: string | null }

/** All recipient rows already written for this campaign, keyed `${patientId}|${kanal}` (paged — PostgREST caps a page). */
async function mevcutAlicilar(supabase: SupabaseClient, doktorId: string, kampanyaId: string): Promise<Map<string, MevcutSatir>> {
  const harita = new Map<string, MevcutSatir>()
  const SAYFA = 1000
  for (let bas = 0; ; bas += SAYFA) {
    const { data, error } = await supabase
      .from('hasta_iletisim_kampanya_alicilari')
      .select('patient_id, kanal, durum, deneme, talep_at, created_at')
      .eq('kampanya_id', kampanyaId)
      .eq('doctor_id', doktorId)
      .range(bas, bas + SAYFA - 1)
    if (error) throw new KampanyaHatasi('Gönderim durumu okunamadı.')
    for (const r of data || []) harita.set(`${r.patient_id}|${r.kanal}`, { durum: r.durum, deneme: Number(r.deneme ?? 1), talep_at: r.talep_at ?? null, created_at: r.created_at ?? null })
    if (!data || data.length < SAYFA) break
  }
  return harita
}

export async function kampanyaGonder(supabase: SupabaseClient, doktorId: string, kampanyaId: string, bag: Partial<GonderBagimliliklari> = {}): Promise<KampanyaSonucu> {
  const b: GonderBagimliliklari = { ...VARSAYILAN_BAGIMLILIKLAR, ...bag }
  const { data: kampanya, error } = await supabase
    .from('hasta_iletisim_kampanyalari')
    .select('*')
    .eq('id', kampanyaId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !kampanya) throw new KampanyaHatasi('Kampanya bulunamadı.')
  if (kampanya.durum === 'tamamlandi') return { kampanyaId, hedefSayisi: kampanya.hedef_sayisi, sonuclar: [], durum: 'tamamlandi', kalan: 0 }

  const kanallar: ('sms' | 'eposta')[] = kampanya.kanal === 'ikisi' ? ['sms', 'eposta'] : [kampanya.kanal]
  // FAIL CLOSED (belt and braces — the route checks first too): no unsubscribe secret → no e-mail at all.
  if (kanallar.includes('eposta') && !b.vazgecAnahtariVarMi()) throw new KampanyaHatasi(VAZGEC_ANAHTARI_YOK_MESAJI, 'vazgec_anahtari_yok')

  await supabase.from('hasta_iletisim_kampanyalari').update({ durum: 'gonderiliyor' }).eq('id', kampanyaId).eq('doctor_id', doktorId)

  const aday = await b.adaylariGetir(supabase, doktorId, kampanya.filtre || {})
  const epostaHazir = kanallar.includes('eposta') ? await b.epostaGondericisi.hazirMi(doktorId) : false
  const smsHazirSonuc = kanallar.includes('sms') ? await b.hazirSmsGonderici(supabase, doktorId) : null
  const smsHazir = smsHazirSonuc !== null
  const smsSaglayici = smsHazirSonuc?.ayar?.saglayici // NETGSM-01: the opt-out footer depends on the channel
  const gondericiHazir: Record<'sms' | 'eposta', boolean> = { sms: smsHazir, eposta: epostaHazir }

  const mevcut = await mevcutAlicilar(supabase, doktorId, kampanyaId)
  const baslangic = b.simdi()
  const sonuclar: AliciSonucu[] = []
  let isSayisi = 0
  let kalan = 0 // rows we did not get to because of the work/time cap
  let mesgul = 0 // rows held by a concurrent request (fresh 'bekliyor') or lost a claim race

  for (const h of aday) {
    for (const kanal of kanallar) {
      const m = mevcut.get(`${h.id}|${kanal}`)
      if (m && m.durum !== 'bekliyor') continue // already gonderildi / basarisiz / atlandi → never touched again
      if (isSayisi >= b.istekAliciSiniri || b.simdi() - baslangic > b.sureButcesiMs) { kalan++; continue }
      isSayisi++
      const sonuc = await tekAliciyaGonder(supabase, b, doktorId, kampanyaId, kampanya.konu, kampanya.govde, h, kanal, gondericiHazir[kanal], kampanya.olusturan_user_id, kampanya.olusturan_personel_id, m, smsSaglayici)
      if (sonuc === 'mesgul') mesgul++
      else if (sonuc) sonuclar.push(sonuc)
    }
  }

  // Rows left 'bekliyor' for patients who are no longer in the audience can never be sent — close them out.
  const adayAnahtarlari = new Set(aday.flatMap((h) => kanallar.map((k) => `${h.id}|${k}`)))
  for (const [anahtar, m] of mevcut) {
    if (m.durum !== 'bekliyor' || adayAnahtarlari.has(anahtar)) continue
    if (b.simdi() - Date.parse(m.talep_at || m.created_at || '') < b.bekleyenEsikMs) { mesgul++; continue }
    const [patientId, kanal] = anahtar.split('|')
    await supabase.from('hasta_iletisim_kampanya_alicilari')
      .update({ durum: 'atlandi', atlama_sebebi: 'hedef_disi' })
      .eq('kampanya_id', kampanyaId).eq('doctor_id', doktorId).eq('patient_id', patientId).eq('kanal', kanal).eq('durum', 'bekliyor')
  }

  if (kalan > 0 || mesgul > 0) {
    // NOT completed: the campaign stays 'gonderiliyor' and the client resends the same key to continue.
    return { kampanyaId, hedefSayisi: kampanya.hedef_sayisi, sonuclar, durum: 'devam', kalan: kalan + mesgul }
  }
  await supabase.from('hasta_iletisim_kampanyalari').update({ durum: 'tamamlandi', tamamlanan_at: new Date().toISOString() }).eq('id', kampanyaId).eq('doctor_id', doktorId)
  return { kampanyaId, hedefSayisi: kampanya.hedef_sayisi, sonuclar, durum: 'tamamlandi', kalan: 0 }
}

async function tekAliciyaGonder(
  supabase: SupabaseClient,
  b: GonderBagimliliklari,
  doktorId: string,
  kampanyaId: string,
  konu: string | null,
  govde: string,
  h: AdayHasta,
  kanal: 'sms' | 'eposta',
  gondericiHazir: boolean,
  olusturanUserId: string | null,
  olusturanPersonelId: string | null,
  mevcut: MevcutSatir | undefined,
  smsSaglayici?: 'android_sms_gateway' | 'netgsm',
): Promise<AliciSonucu | 'mesgul' | null> {
  // Consent is re-evaluated on EVERY attempt, including a resume: an opt-out that arrived after the
  // first (crashed) attempt must win over the stale 'bekliyor' row.
  const hazirMi = gonderilebilirMi({ telefon: h.telefon, eposta: h.eposta, izinWhatsapp: h.izinWhatsapp, izinEposta: h.izinEposta, izinSms: h.izinSms }, kanal)
  const vazgecLink = kanal === 'eposta' ? b.vazgecBaglantisi(doktorId, h.id, 'eposta') : null
  const atlamaSebebi: 'izin_yok' | 'adres_yok' | 'gonderici_yok' | 'vazgec_baglantisi_yok' | null = hazirMi
    ? !gondericiHazir ? 'gonderici_yok' : (kanal === 'eposta' && !vazgecLink ? 'vazgec_baglantisi_yok' : null) // FAIL CLOSED: no opt-out link → no e-mail
    : (kanal === 'eposta' ? epostaAdresi(h.eposta) : smsNumarasi(h.telefon)) ? 'izin_yok' : 'adres_yok'
  const simdiIso = new Date(b.simdi()).toISOString()
  const aliciSec = <Q extends { eq: (k: string, v: unknown) => Q }>(q: Q): Q =>
    q.eq('kampanya_id', kampanyaId).eq('doctor_id', doktorId).eq('patient_id', h.id).eq('kanal', kanal)

  if (!mevcut) {
    // IDEMPOTENCY GATE: insert the row FIRST. A duplicate call for the same (campaign, patient,
    // channel) hits unique_violation here and is NOT sent a second time.
    const { error: ekHata } = await supabase.from('hasta_iletisim_kampanya_alicilari').insert({
      kampanya_id: kampanyaId, doctor_id: doktorId, patient_id: h.id, kanal,
      durum: atlamaSebebi ? 'atlandi' : 'bekliyor', atlama_sebebi: atlamaSebebi, talep_at: simdiIso, deneme: 1,
    })
    if (ekHata) {
      if ((ekHata as { code?: string }).code === '23505') return 'mesgul' // a concurrent request owns this row
      throw new Error(`alici satiri yazilamadi: ${(ekHata as { message?: string }).message || 'bilinmeyen hata'}`) // e.g. migration 167 not applied — nothing was sent
    }
  } else {
    // RESUME of a stale 'bekliyor' row (the earlier request died between insert and the final update).
    const yas = b.simdi() - Date.parse(mevcut.talep_at || mevcut.created_at || '')
    if (!(yas >= b.bekleyenEsikMs)) return 'mesgul' // may still be in flight in another request
    if (mevcut.deneme >= EN_FAZLA_DENEME) {
      // Already re-attempted once and it died again → stop; do not risk a third message.
      const { data: kapatilan } = await aliciSec(supabase.from('hasta_iletisim_kampanya_alicilari')
        .update({ durum: 'basarisiz', hata: 'Gönderim tamamlanamadı (zaman aşımı); tekrar denenmedi.' }) as any)
        .eq('durum', 'bekliyor').eq('deneme', mevcut.deneme).select('id')
      return (kapatilan && kapatilan.length) ? { patientId: h.id, kanal, durum: 'basarisiz', sebep: 'zaman_asimi' } : 'mesgul'
    }
    // ATOMIC CLAIM (compare-and-swap on deneme): of two concurrent retries only one UPDATE matches.
    const talep = { talep_at: simdiIso, deneme: mevcut.deneme + 1, ...(atlamaSebebi ? { durum: 'atlandi', atlama_sebebi: atlamaSebebi } : {}) }
    const { data: alindi } = await aliciSec(supabase.from('hasta_iletisim_kampanya_alicilari').update(talep) as any)
      .eq('durum', 'bekliyor').eq('deneme', mevcut.deneme).select('id')
    if (!alindi || alindi.length === 0) return 'mesgul'
  }

  if (atlamaSebebi) return { patientId: h.id, kanal, durum: 'atlandi', sebep: atlamaSebebi }

  let sonuc: { ok: true; mesajId?: string } | { ok: false; hata: string }
  if (kanal === 'sms') {
    const alici = smsNumarasi(h.telefon)!
    const r = await b.smsGonder(supabase, { doktorId, patientId: h.id, alici, metin: `${govde} ${TOPLU_ACIL_SATIRI} ${smsVazgecSatiri(smsSaglayici)}`, ...(smsSaglayici ? { beklenenSaglayici: smsSaglayici } : {}) })
    sonuc = r.ok ? { ok: true, mesajId: r.saglayiciMesajId } : r
  } else {
    const alici = epostaAdresi(h.eposta)!
    const altbilgi = `\n\n—\nBu bilgilendirme mesajlarını almak istemiyorsanız: ${vazgecLink}`
    const r = await b.epostaGondericisi.gonder({ doktorId, alici, konu: konu || 'Bilgilendirme', metin: `${govde} ${TOPLU_ACIL_SATIRI}${altbilgi}` })
    sonuc = r.ok ? { ok: true, mesajId: r.disId } : r
  }

  const guncelleme = sonuc.ok
    ? { durum: 'gonderildi' as const, saglayici_mesaj_id: sonuc.mesajId || null, gonderildi_at: new Date().toISOString() }
    : { durum: 'basarisiz' as const, hata: sonuc.hata.slice(0, 500) }
  await aliciSec(supabase.from('hasta_iletisim_kampanya_alicilari').update(guncelleme) as any)

  if (sonuc.ok) {
    // Mirror into the EXISTING contact log (lib/iletisim/README.md rule 4) — same table NOTYA-ILETISIM-01 logs to.
    await supabase.from('iletisim_kayitlari').insert({
      doctor_id: doktorId, patient_id: h.id, kanal, tur: 'toplu_mesaj', durum: 'gonderildi',
      gonderen_user_id: olusturanUserId, gonderen_personel_id: olusturanPersonelId,
    }).then(() => {}, () => {})
  }

  return { patientId: h.id, kanal, durum: sonuc.ok ? 'gonderildi' : 'basarisiz', sebep: sonuc.ok ? undefined : sonuc.hata }
}

/** For the UI's semi-automated SMS fallback when no gateway is connected: the exact per-recipient list to copy/export. */
export async function smsManuelListesi(supabase: SupabaseClient, doktorId: string, filtre: KampanyaOlusturGirdisi['filtre'], govde: string): Promise<{ ad: string; telefon: string }[]> {
  const { aday } = await kampanyaOnizle(supabase, doktorId, filtre)
  return aday
    .filter((h) => gonderilebilirMi({ telefon: h.telefon, izinSms: h.izinSms }, 'sms'))
    .map((h) => ({ ad: h.ad, telefon: smsNumarasi(h.telefon)! }))
}
