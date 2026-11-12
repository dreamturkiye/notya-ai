/**
 * GERI-CAGIRMA-01 — one-tap recall: SENDING. Server only (Türkiye).
 *
 * Nothing new leaves the product: each message goes through the practice's EXISTING senders — the doctor's own
 * WhatsApp Business number (approved template only), the doctor's own SMS gateway / NetGSM account, or the doctor's
 * own Gmail / Outlook — with their own consent gate (lib/iletisim/izin.ts), quota (WhatsApp tier), audit log and
 * encryption, and is mirrored into the existing contact log (`iletisim_kayitlari`, tur `kontrol_hatirlatma`).
 *
 *   • NEVER TRUSTS THE BROWSER'S LIST. The selection is patient ids only; who is due, why, the consent and the channel
 *     are recomputed here (adaylariTopla with `sadece`). A patient who is no longer due, got an appointment, opted
 *     out or is in cool-down is skipped.
 *   • AT MOST ONCE. The recall row is inserted BEFORE the send; unique (ulke, doctor_id, istek_anahtari, patient_id)
 *     turns a double tap or a retried request into "already handled". A row is never re-sent, also not after a crash.
 *   • GENERIC TEXT. ./sablonlar.ts — no recall reason in any message. WhatsApp gets the already-approved generic
 *     template `genel_bildirim` (no free text, no link).
 *   • THE BOOKING LINK is the patient's existing PIN-protected portal booking page with `?gc=<recall id>`; the portal
 *     booking route credits a booking made through it (./sayac.ts baglantiAtfi).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { epostaAdresi, smsNumarasi, whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import { gonderilebilirMi } from '@/lib/iletisim/izin'
import { ACIL_SATIRI } from '@/lib/iletisim/sablonlar'
import { adaylariTopla, onbellegiTemizle, ULKE, type KaynakBagimliliklari } from './kaynak'
import { mesajKur, sablonMu, VARSAYILAN_SABLON, type SablonAnahtari } from './sablonlar'
import type { GeriCagirmaAdayi, GeriCagirmaKanali } from './tipler'

export class GeriCagirmaHatasi extends Error {
  constructor(mesaj: string, public kod: 'gecersiz' | 'kurulu_degil' | 'yazilamadi') { super(mesaj) }
}

export type Kimlik = { userId: string; personelId: string | null; rol: PratikRol }

/** Work cap per request; the client resends the SAME key to continue (rows already written are skipped). */
export const ISTEK_ALICI_SINIRI = 150
export const ISTEK_SURE_BUTCESI_MS = 240_000
export const SECIM_UST_SINIRI = 600
/** The approved generic WhatsApp template that fits a recall: names no reason, no test, no result. */
export const WHATSAPP_SABLONU = 'genel_bildirim'
export const VELI_HITABI = 'Sayın Veli'

export type KanalSonucu = { ok: true; mesajId?: string | null } | { ok: false; hata: string; belirsiz?: boolean }

export type HastaAdresi = { telefon: string | null; eposta: string | null; izinWhatsapp: boolean | null; izinSms: boolean | null; izinEposta: boolean | null }

export type GonderBagimliliklari = {
  kaynak: Partial<KaynakBagimliliklari>
  /** The patient's contact details, read with the doctor id AND the patient ids in one query. */
  adresler: (sb: SupabaseClient, doktorId: string, idler: string[]) => Promise<Map<string, HastaAdresi>>
  whatsapp: (g: { doktorId: string; patientId: string; alici: string; hitap: string; doktorAdi: string; idem: string }) => Promise<KanalSonucu>
  sms: (sb: SupabaseClient, g: { doktorId: string; patientId: string; alici: string; metin: string }) => Promise<KanalSonucu>
  eposta: (g: { doktorId: string; patientId: string; alici: string; konu: string; metin: string }) => Promise<KanalSonucu>
  siteKoku: () => string
  simdi: () => number
  aliciSiniri: number
  sureButcesiMs: number
}

async function varsayilanAdresler(sb: SupabaseClient, doktorId: string, idler: string[]): Promise<Map<string, HastaAdresi>> {
  const { decrypt } = await import('@/lib/security/encryption')
  const coz = (v: unknown) => { if (!v) return null; try { return String(decrypt(String(v)) || '').trim() || null } catch { return null } }
  const { data } = await sb.from('patients').select('id, phone_encrypted, email_encrypted, iletisim_izni_whatsapp, iletisim_izni_eposta, iletisim_izni_sms').eq('doctor_id', doktorId).in('id', idler)
  const m = new Map<string, HastaAdresi>()
  for (const p of (data || []) as Record<string, unknown>[]) {
    m.set(String(p.id), { telefon: coz(p.phone_encrypted), eposta: coz(p.email_encrypted), izinWhatsapp: (p.iletisim_izni_whatsapp as boolean | null) ?? null, izinSms: (p.iletisim_izni_sms as boolean | null) ?? null, izinEposta: (p.iletisim_izni_eposta as boolean | null) ?? null })
  }
  return m
}

const VARSAYILAN: GonderBagimliliklari = {
  kaynak: {},
  adresler: varsayilanAdresler,
  whatsapp: async (g) => {
    const { gonderici } = await import('@/lib/iletisim/otomatik/whatsapp')
    const s = await gonderici.gonder({ doktorId: g.doktorId, alici: g.alici, metin: '', sablonKodu: WHATSAPP_SABLONU, degiskenler: [g.hitap, g.doktorAdi], idemAnahtar: g.idem, hastaId: g.patientId, tur: 'kontrol_hatirlatma' })
    return s.ok ? { ok: true, mesajId: s.disId ?? null } : { ok: false, hata: s.hata, ...(s.belirsiz ? { belirsiz: true } : {}) }
  },
  sms: async (sb, g) => {
    const [{ smsGonder, hazirSmsGonderici }, { smsVazgecSatiri }] = await Promise.all([import('@/lib/iletisim/sms/gonderici'), import('@/lib/iletisim/toplu/sablonlar')])
    const hazir = await hazirSmsGonderici(sb, g.doktorId)
    if (!hazir) return { ok: false, hata: 'SMS gateway bağlı değil.' }
    const saglayici = hazir.ayar.saglayici
    const r = await smsGonder(sb, { doktorId: g.doktorId, patientId: g.patientId, alici: g.alici, metin: `${g.metin} ${ACIL_SATIRI} ${smsVazgecSatiri(saglayici)}`, beklenenSaglayici: saglayici })
    return r.ok ? { ok: true, mesajId: r.saglayiciMesajId ?? null } : { ok: false, hata: r.hata }
  },
  eposta: async (g) => {
    const [{ gonderici }, { vazgecBaglantisi }] = await Promise.all([import('@/lib/iletisim/otomatik/eposta'), import('@/lib/iletisim/vazgecJetonu')])
    const vazgec = vazgecBaglantisi(g.doktorId, g.patientId, 'eposta')
    // FAIL CLOSED, as the bulk engine does: no opt-out link → no e-mail.
    if (!vazgec) return { ok: false, hata: 'E-posta gönderilemiyor: abonelikten çıkma bağlantısı oluşturulamıyor.' }
    const r = await gonderici.gonder({ doktorId: g.doktorId, alici: g.alici, konu: g.konu, metin: `${g.metin}\n\n${ACIL_SATIRI}\n\n—\nBu bilgilendirme mesajlarını almak istemiyorsanız: ${vazgec}` })
    return r.ok ? { ok: true, mesajId: r.disId ?? null } : { ok: false, hata: r.hata }
  },
  siteKoku: () => String(process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io').replace(/\/$/, ''),
  simdi: () => Date.now(),
  aliciSiniri: ISTEK_ALICI_SINIRI,
  sureButcesiMs: ISTEK_SURE_BUTCESI_MS,
}

export type GonderGirdisi = { patientIds: unknown; sablon?: unknown; istekAnahtari: unknown }

export type GonderSonucu = {
  durum: 'tamamlandi' | 'devam'
  gonderilen: number
  basarisiz: number
  /** Selected but not sent: no longer due / has an appointment / in cool-down / no consent / no connected sender. */
  atlanan: number
  /** Rows this same key had already handled (double tap, retry). */
  zatenIslenen: number
  kanal: Record<GeriCagirmaKanali, number>
  kalan: number
  hatalar: string[]
}

/** The personal booking link of one recall: the patient's own PIN-protected portal booking page, tagged. */
export function randevuBaglantisi(siteKoku: string, portalJetonu: string, cagriId: string): string {
  return `${siteKoku}/portal/hasta/${portalJetonu}/randevu?gc=${encodeURIComponent(cagriId)}`
}

const anahtarGecerli = (x: unknown): x is string => typeof x === 'string' && /^[A-Za-z0-9:_-]{8,80}$/.test(x)
const uuid = (x: unknown): x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)

export async function geriCagir(sb: SupabaseClient, doktorId: string, kimlik: Kimlik, girdi: GonderGirdisi, bag: Partial<GonderBagimliliklari> = {}): Promise<GonderSonucu> {
  const b: GonderBagimliliklari = { ...VARSAYILAN, ...bag }
  if (!anahtarGecerli(girdi.istekAnahtari)) throw new GeriCagirmaHatasi('istekAnahtari zorunludur.', 'gecersiz')
  const istekAnahtari = girdi.istekAnahtari
  const idler = [...new Set((Array.isArray(girdi.patientIds) ? girdi.patientIds : []).filter(uuid).map((x) => x.toLowerCase()))]
  if (!idler.length) throw new GeriCagirmaHatasi('Hasta seçilmedi.', 'gecersiz')
  if (idler.length > SECIM_UST_SINIRI) throw new GeriCagirmaHatasi('Çok fazla hasta seçildi.', 'gecersiz')
  const sablon: SablonAnahtari = sablonMu(girdi.sablon) ? girdi.sablon : VARSAYILAN_SABLON
  const baslangic = b.simdi()

  const { liste, portal, doktorAdi } = await adaylariTopla(sb, doktorId, { sadece: idler, simdi: baslangic }, b.kaynak)
  if (!liste.kurulu) throw new GeriCagirmaHatasi('Geri çağırma henüz kurulmadı.', 'kurulu_degil')

  // What this same key has already handled (double tap / retry / "devam").
  const { data: onceki, error: oncekiHata } = await sb.from('geri_cagirma_kayitlari').select('patient_id').eq('ulke', ULKE).eq('doctor_id', doktorId).eq('istek_anahtari', istekAnahtari).limit(SECIM_UST_SINIRI)
  if (oncekiHata) throw new GeriCagirmaHatasi('Gönderim durumu okunamadı.', 'yazilamadi')
  const islenmis = new Set(((onceki || []) as { patient_id: string }[]).map((r) => String(r.patient_id)))

  const sonuc: GonderSonucu = { durum: 'tamamlandi', gonderilen: 0, basarisiz: 0, atlanan: 0, zatenIslenen: 0, kanal: { whatsapp: 0, sms: 0, eposta: 0 }, kalan: 0, hatalar: [] }
  const aday = new Map(liste.adaylar.map((a) => [a.patientId, a]))
  const gonderilecek: GeriCagirmaAdayi[] = []
  for (const id of idler) {
    if (islenmis.has(id)) { sonuc.zatenIslenen++; continue }
    const a = aday.get(id)
    if (!a || !a.kanal) { sonuc.atlanan++; continue }
    gonderilecek.push(a)
  }
  if (!gonderilecek.length) return sonuc
  const adresler = await b.adresler(sb, doktorId, gonderilecek.map((a) => a.patientId))

  let is = 0
  for (const a of gonderilecek) {
    if (is >= b.aliciSiniri || b.simdi() - baslangic > b.sureButcesiMs) { sonuc.kalan++; continue }
    is++
    const h = adresler.get(a.patientId)
    // Consent is read again at the moment of sending: an opt-out that arrived a second ago wins.
    const sira = (['whatsapp', 'sms', 'eposta'] as GeriCagirmaKanali[]).filter((k) => h && gonderilebilirMi(h, k))
    const kanallar = [a.kanal!, ...sira.filter((k) => k !== a.kanal)].filter((k) => sira.includes(k))
    if (!h || !kanallar.length) { sonuc.atlanan++; continue }

    // IDEMPOTENCY GATE: the row first. A duplicate (same key, same patient) stops here and nothing is sent.
    const { data: satir, error: ekHata } = await sb.from('geri_cagirma_kayitlari').insert({
      ulke: ULKE, doctor_id: doktorId, patient_id: a.patientId, istek_anahtari: istekAnahtari,
      nedenler: a.nedenler.map((n) => n.anahtar), kaynak: a.nedenler[0]?.kaynak || '', vade: a.vade, kanal: kanallar[0], sablon,
      durum: 'bekliyor', baglanti_var: portal.has(a.patientId) && kanallar[0] !== 'whatsapp',
      gonderen_user_id: kimlik.userId, gonderen_personel_id: kimlik.personelId, gonderen_rol: kimlik.rol,
    }).select('id').single()
    if (ekHata || !satir) {
      if ((ekHata as { code?: string } | null)?.code === '23505') { sonuc.zatenIslenen++; continue }
      throw new GeriCagirmaHatasi('Geri çağırma kaydı yazılamadı; bu hastaya mesaj gönderilmedi.', 'yazilamadi')
    }
    const cagriId = String((satir as { id: string }).id)
    const satirSec = <Q extends { eq: (k: string, v: unknown) => Q }>(q: Q): Q => q.eq('id', cagriId).eq('ulke', ULKE).eq('doctor_id', doktorId).eq('patient_id', a.patientId)

    let son: KanalSonucu = { ok: false, hata: 'Gönderilemedi.' }
    let kullanilan: GeriCagirmaKanali = kanallar[0]
    for (const kanal of kanallar) {
      kullanilan = kanal
      try {
        if (kanal === 'whatsapp') {
          const alici = whatsappNumarasi(h.telefon)
          son = alici && doktorAdi ? await b.whatsapp({ doktorId, patientId: a.patientId, alici, hitap: a.veliDili ? VELI_HITABI : a.ad, doktorAdi, idem: `geri-cagirma:${cagriId}` }) : { ok: false, hata: 'WhatsApp için gerekli bilgi eksik.' }
        } else {
          const link = portal.has(a.patientId) ? randevuBaglantisi(b.siteKoku(), portal.get(a.patientId)!, cagriId) : null
          const m = mesajKur(sablon, { hastaAdi: a.ad, veliDili: a.veliDili, doktorAdi, link })
          if (kanal === 'sms') {
            const alici = smsNumarasi(h.telefon)
            son = alici ? await b.sms(sb, { doktorId, patientId: a.patientId, alici, metin: m.metin }) : { ok: false, hata: 'Telefon yok.' }
          } else {
            const alici = epostaAdresi(h.eposta)
            son = alici ? await b.eposta({ doktorId, patientId: a.patientId, alici, konu: m.konu, metin: m.metin }) : { ok: false, hata: 'E-posta adresi yok.' }
          }
        }
      } catch {
        // A sender that threw may or may not have sent: treat as uncertain, never try another channel.
        son = { ok: false, hata: 'Gönderici yanıt vermedi.', belirsiz: true }
      }
      // A definite "no" may fall through to the next consented channel; an uncertain one never does.
      if (son.ok || son.belirsiz) break
    }

    const simdiIso = new Date(b.simdi()).toISOString()
    const guncelleme = son.ok
      ? { durum: 'gonderildi', kanal: kullanilan, gonderildi_at: simdiIso, saglayici_mesaj_id: son.mesajId || null, baglanti_var: portal.has(a.patientId) && kullanilan !== 'whatsapp' }
      : { durum: 'basarisiz', kanal: kullanilan, hata: String(son.hata || '').slice(0, 500) }
    await satirSec(sb.from('geri_cagirma_kayitlari').update(guncelleme) as any)
    if (son.ok) {
      sonuc.gonderilen++
      sonuc.kanal[kullanilan]++
      // The EXISTING contact log (lib/iletisim/README.md): one row per message that left.
      await sb.from('iletisim_kayitlari').insert({ doctor_id: doktorId, patient_id: a.patientId, kanal: kullanilan, tur: 'kontrol_hatirlatma', durum: 'gonderildi', gonderen_user_id: kimlik.userId, gonderen_personel_id: kimlik.personelId }).then(() => {}, () => {})
    } else {
      sonuc.basarisiz++
      if (sonuc.hatalar.length < 5 && !sonuc.hatalar.includes(son.hata)) sonuc.hatalar.push(son.hata)
    }
  }
  if (sonuc.kalan > 0) sonuc.durum = 'devam'
  onbellegiTemizle(doktorId)
  return sonuc
}

/**
 * "Arandı" — the practice phoned a patient from the recall list and marks it. Nothing is sent; the row makes the
 * call count as a recall for the cool-down and for attribution. One per patient per day (the key carries the day).
 */
export async function arandiIsaretle(sb: SupabaseClient, doktorId: string, kimlik: Kimlik, patientId: unknown, bag: Partial<GonderBagimliliklari> = {}): Promise<{ ok: true; yeni: boolean } | { ok: false; durum: 400 | 404 | 503 }> {
  const b: GonderBagimliliklari = { ...VARSAYILAN, ...bag }
  if (!uuid(patientId)) return { ok: false, durum: 400 }
  const simdi = b.simdi()
  const { liste } = await adaylariTopla(sb, doktorId, { sadece: [patientId.toLowerCase()], simdi }, b.kaynak)
  if (!liste.kurulu) return { ok: false, durum: 503 }
  // Not this doctor's patient, or not due: exactly "not found".
  const a = liste.adaylar.find((x) => x.patientId === patientId.toLowerCase())
  if (!a) return { ok: false, durum: 404 }
  const simdiIso = new Date(simdi).toISOString()
  const { error } = await sb.from('geri_cagirma_kayitlari').insert({
    ulke: ULKE, doctor_id: doktorId, patient_id: a.patientId, istek_anahtari: `elle:${simdiIso.slice(0, 10)}`,
    nedenler: a.nedenler.map((n) => n.anahtar), kaynak: a.nedenler[0]?.kaynak || '', vade: a.vade, kanal: 'elle', sablon: 'telefon',
    durum: 'gonderildi', gonderildi_at: simdiIso, gonderen_user_id: kimlik.userId, gonderen_personel_id: kimlik.personelId, gonderen_rol: kimlik.rol,
  })
  onbellegiTemizle(doktorId)
  if (error) return (error as { code?: string }).code === '23505' ? { ok: true, yeni: false } : { ok: false, durum: 503 }
  return { ok: true, yeni: true }
}

/** What the confirmation shows about WhatsApp before a send: what the existing code already knows, nothing more. */
export async function whatsappKotaBilgisi(sb: SupabaseClient, doktorId: string): Promise<{ limit: number; son24Saat: number; birimUsd: number } | null> {
  try {
    const [{ baglantiOku }, { son24Saat, tierLimiti, TR_UTILITY_USD }] = await Promise.all([import('@/lib/iletisim/otomatik/whatsapp/depo'), import('@/lib/iletisim/otomatik/whatsapp/kota')])
    const bgl = await baglantiOku(sb, doktorId)
    if (!bgl) return null
    return { limit: tierLimiti(bgl.tier), son24Saat: await son24Saat(sb, doktorId), birimUsd: TR_UTILITY_USD }
  } catch {
    return null
  }
}
