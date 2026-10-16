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
import { vazgecBaglantisi } from '../vazgecJetonu'
import { TOPLU_ACIL_SATIRI, TOPLU_SMS_VAZGEC_SATIRI } from './sablonlar'
import { adaylariGetir } from './filtre'
import { smsGonder, hazirSmsGonderici } from '../sms/gonderici'
import { gonderici as epostaGondericisi } from '../otomatik/eposta'
import type { AdayHasta, AliciSonucu, KampanyaOlusturGirdisi, KampanyaSonucu } from './tipler'

export class KampanyaHatasi extends Error {}

export type KimlikBilgisi = { userId: string; personelId: string | null; rol: 'doktor' | 'sekreter' }

export async function kampanyaOnizle(supabase: SupabaseClient, doktorId: string, filtre: KampanyaOlusturGirdisi['filtre']): Promise<{ aday: AdayHasta[]; hedefSayisi: number }> {
  const aday = await adaylariGetir(supabase, doktorId, filtre)
  return { aday, hedefSayisi: aday.length }
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

export async function kampanyaGonder(supabase: SupabaseClient, doktorId: string, kampanyaId: string): Promise<KampanyaSonucu> {
  const { data: kampanya, error } = await supabase
    .from('hasta_iletisim_kampanyalari')
    .select('*')
    .eq('id', kampanyaId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !kampanya) throw new KampanyaHatasi('Kampanya bulunamadı.')
  if (kampanya.durum === 'tamamlandi') return { kampanyaId, hedefSayisi: kampanya.hedef_sayisi, sonuclar: [], durum: 'tamamlandi' }

  await supabase.from('hasta_iletisim_kampanyalari').update({ durum: 'gonderiliyor' }).eq('id', kampanyaId).eq('doctor_id', doktorId)

  const aday = await adaylariGetir(supabase, doktorId, kampanya.filtre || {})
  const kanallar: ('sms' | 'eposta')[] = kampanya.kanal === 'ikisi' ? ['sms', 'eposta'] : [kampanya.kanal]
  const epostaHazir = kanallar.includes('eposta') ? await epostaGondericisi.hazirMi(doktorId) : false
  const smsHazir = kanallar.includes('sms') ? (await hazirSmsGonderici(supabase, doktorId)) !== null : false
  const gondericiHazir: Record<'sms' | 'eposta', boolean> = { sms: smsHazir, eposta: epostaHazir }

  const sonuclar: AliciSonucu[] = []
  for (const h of aday) {
    for (const kanal of kanallar) {
      const sonuc = await tekAliciyaGonder(supabase, doktorId, kampanyaId, kampanya.konu, kampanya.govde, h, kanal, gondericiHazir[kanal], kampanya.olusturan_user_id, kampanya.olusturan_personel_id)
      if (sonuc) sonuclar.push(sonuc) // null → already handled by an earlier attempt (idempotency), not double-counted
    }
  }

  await supabase.from('hasta_iletisim_kampanyalari').update({ durum: 'tamamlandi', tamamlanan_at: new Date().toISOString() }).eq('id', kampanyaId).eq('doctor_id', doktorId)
  return { kampanyaId, hedefSayisi: kampanya.hedef_sayisi, sonuclar, durum: 'tamamlandi' }
}

async function tekAliciyaGonder(
  supabase: SupabaseClient,
  doktorId: string,
  kampanyaId: string,
  konu: string | null,
  govde: string,
  h: AdayHasta,
  kanal: 'sms' | 'eposta',
  gondericiHazir: boolean,
  olusturanUserId: string | null,
  olusturanPersonelId: string | null,
): Promise<AliciSonucu | null> {
  const hazirMi = gonderilebilirMi({ telefon: h.telefon, eposta: h.eposta, izinWhatsapp: h.izinWhatsapp, izinEposta: h.izinEposta, izinSms: h.izinSms }, kanal)
  const atlamaSebebi: 'izin_yok' | 'adres_yok' | 'gonderici_yok' | null = hazirMi
    ? !gondericiHazir ? 'gonderici_yok' : null
    : (kanal === 'eposta' ? epostaAdresi(h.eposta) : smsNumarasi(h.telefon)) ? 'izin_yok' : 'adres_yok'

  // IDEMPOTENCY GATE: insert the row FIRST. A duplicate call for the same (campaign, patient,
  // channel) hits unique_violation here and returns null — it is NOT sent a second time.
  const { error: ekHata } = await supabase.from('hasta_iletisim_kampanya_alicilari').insert({
    kampanya_id: kampanyaId, doctor_id: doktorId, patient_id: h.id, kanal,
    durum: atlamaSebebi ? 'atlandi' : 'bekliyor', atlama_sebebi: atlamaSebebi,
  })
  if (ekHata) return null // 23505 unique_violation (or any insert failure) → already attempted, skip silently.

  if (atlamaSebebi) return { patientId: h.id, kanal, durum: 'atlandi', sebep: atlamaSebebi }

  let sonuc: { ok: true; mesajId?: string } | { ok: false; hata: string }
  if (kanal === 'sms') {
    const alici = smsNumarasi(h.telefon)!
    const r = await smsGonder(supabase, { doktorId, patientId: h.id, alici, metin: `${govde} ${TOPLU_ACIL_SATIRI} ${TOPLU_SMS_VAZGEC_SATIRI}` })
    sonuc = r.ok ? { ok: true, mesajId: r.saglayiciMesajId } : r
  } else {
    const alici = epostaAdresi(h.eposta)!
    const vazgecLink = vazgecBaglantisi(doktorId, h.id, 'eposta')
    const altbilgi = vazgecLink
      ? `\n\n—\nBu bilgilendirme mesajlarını almak istemiyorsanız: ${vazgecLink}`
      : ''
    const r = await epostaGondericisi.gonder({ doktorId, alici, konu: konu || 'Bilgilendirme', metin: `${govde} ${TOPLU_ACIL_SATIRI}${altbilgi}` })
    sonuc = r.ok ? { ok: true, mesajId: r.disId } : r
  }

  const guncelleme = sonuc.ok
    ? { durum: 'gonderildi' as const, saglayici_mesaj_id: sonuc.mesajId || null, gonderildi_at: new Date().toISOString() }
    : { durum: 'basarisiz' as const, hata: sonuc.hata.slice(0, 500) }
  await supabase.from('hasta_iletisim_kampanya_alicilari').update(guncelleme).eq('kampanya_id', kampanyaId).eq('patient_id', h.id).eq('kanal', kanal)

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
