/**
 * WHATSAPP-API-01 — the one-tap actions on a "Gelen Yanıtlar" card (Onayla / İptal Et / Yeniden Planla / Yanıtla).
 *
 * HASTA-IZOLASYON-01: the card is loaded with id AND doctor_id; the appointment is looked up with doktor_id AND the card's
 * own patient_id (randevuEylem.ts). Nothing patient-derived comes from the request except the card id, a free-text reply
 * and (for Yeniden Planla) a time that must pass the doctor's slot engine.
 *
 * Answering the patient: inside the 24h session window a plain sentence (serbest.ts); outside it the generic template
 * `genel_bildirim` (no clinical text, Meta-approved) via the normal tier-limited sender.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { baglantiOku } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { whatsappGondericisi } from '@/lib/iletisim/otomatik/whatsapp'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { doktorIletisimAyari, hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { gunlukYaz } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import { doktorIptal, hedefRandevu, iptalGeriAl, randevuTasi, randevuTeyit, slotOner, type OnerilenSlot } from './randevuEylem'
import { geriAlindiMetni, iptalOnayMetni, oturumMetniGonder, SABIT } from './serbest'
import { randevuSonrasi } from './sonrasi'
import { slotMetni, YANITLAR } from './yanit'
import { gunEtiketi, saatEtiketi } from '@/lib/randevu/v2/zaman'

export type KartEylemi = 'onayla' | 'iptal' | 'yeniden_planla' | 'yanitla' | 'goruldu' | 'geri_al'
export const KART_EYLEMLERI: readonly KartEylemi[] = ['onayla', 'iptal', 'yeniden_planla', 'yanitla', 'goruldu', 'geri_al']

export type KartSonucu =
  | { ok: true; mesaj: string; bildirildi?: boolean; slotlar?: OnerilenSlot[] }
  | { ok: false; durum: number; hata: string }

const yok = (): KartSonucu => ({ ok: false, durum: 404, hata: 'Yanıt bulunamadı.' })

interface Kart {
  id: string; patient_id: string | null; randevu_id: string | null; niyet: string; durum: string
  karsi_taraf_encrypted: string | null; secilen_slot: string | null; onerilen_slotlar: unknown; otomatik_eylem: string | null
}

export async function kartEylemi(
  sb: SupabaseClient,
  g: { doktorId: string; yapanId: string; kartId: string; eylem: KartEylemi; metin?: string; baslangic?: string },
  deps: { fetch?: FetchFn; simdi?: Date } = {},
): Promise<KartSonucu> {
  const simdi = deps.simdi ?? new Date()
  const { data, error } = await sb.from(YANITLAR)
    .select('id, patient_id, randevu_id, niyet, durum, karsi_taraf_encrypted, secilen_slot, onerilen_slotlar, otomatik_eylem')
    .eq('id', g.kartId).eq('doctor_id', g.doktorId).maybeSingle()
  if (error || !data) return yok()
  const kart = data as unknown as Kart

  const bitir = async (mesaj: string, ek: Partial<Extract<KartSonucu, { ok: true }>> = {}): Promise<KartSonucu> => {
    await sb.from(YANITLAR).update({ durum: 'islendi', islendi_at: simdi.toISOString(), islenen_user_id: g.yapanId }).eq('id', kart.id).eq('doctor_id', g.doktorId)
    await gunlukYaz(sb, { doktorId: g.doktorId, patientId: kart.patient_id, yon: 'olay', tur: 'yanit_eylemi', durum: 'olay', ayrinti: { eylem: g.eylem, kart_id: kart.id } })
    return { ok: true, mesaj, ...ek }
  }

  if (g.eylem === 'goruldu') {
    await sb.from(YANITLAR).update({ durum: kart.durum === 'islendi' ? 'islendi' : 'goruldu' }).eq('id', kart.id).eq('doctor_id', g.doktorId)
    return { ok: true, mesaj: 'Görüldü olarak işaretlendi.' }
  }

  const numara = (() => { try { return decryptPII(String(kart.karsi_taraf_encrypted || '')) } catch { return '' } })()
  const bag = await baglantiOku(sb, g.doktorId).catch(() => null)
  const bildir = async (metin: string, anahtar: string): Promise<boolean> => {
    if (!bag || !numara) return false
    const r = await oturumMetniGonder(sb, { doktorId: g.doktorId, phoneNumberId: bag.phoneNumberId, token: bag.token },
      { to: numara, metin, tur: 'hekim_yaniti', idemAnahtar: `kart:${kart.id}:${anahtar}`, hastaId: kart.patient_id }, deps.fetch, simdi)
    return r.ok
  }

  // The doctor cancels from the card: the patient gets date and time as free text inside the 24h window, otherwise the approved
  // `randevu_iptal_onay` template (free text may never leave outside the window). Falls back to the generic sentence when the
  // appointment time cannot be read.
  const iptalBildir = async (rid: string): Promise<boolean> => {
    if (!bag || !numara || !kart.patient_id) return false
    const { data: r } = await sb.from('randevular').select('baslangic').eq('id', rid).eq('doktor_id', g.doktorId).eq('patient_id', kart.patient_id).maybeSingle()
    const bas = r?.baslangic ? String(r.baslangic) : null
    const x = await oturumMetniGonder(sb, { doktorId: g.doktorId, phoneNumberId: bag.phoneNumberId, token: bag.token },
      { to: numara, metin: bas ? iptalOnayMetni(bas) : SABIT.iptal, tur: 'hekim_yaniti', idemAnahtar: `kart:${kart.id}:iptal`, hastaId: kart.patient_id }, deps.fetch, simdi)
    if (x.ok || !x.pencereKapali || !bas) return x.ok
    const { data: h } = await sb.from('patients').select('name_encrypted').eq('id', kart.patient_id).eq('doctor_id', g.doktorId).maybeSingle()
    const hastaAdi = hastaAdiCoz(h?.name_encrypted)
    const ayar = await doktorIletisimAyari(sb, g.doktorId)
    if (!hastaAdi || !ayar.doktorAdi) return false
    const t = await whatsappGondericisi({ sb: () => sb, fetch: deps.fetch }).gonder({
      doktorId: g.doktorId, alici: numara, metin: '', sablonKodu: 'randevu_iptal_onay', degiskenler: [hastaAdi, gunEtiketi(bas), saatEtiketi(bas), ayar.doktorAdi],
      idemAnahtar: `kart:${kart.id}:iptal:sablon`, hastaId: kart.patient_id, tur: 'hekim_yaniti',
    })
    return t.ok
  }

  if (g.eylem === 'yanitla') {
    const metin = String(g.metin || '').trim().slice(0, 1000)
    if (!metin) return { ok: false, durum: 400, hata: 'Yanıt boş olamaz.' }
    if (!bag) return { ok: false, durum: 409, hata: 'WhatsApp bağlı değil.' }
    if (!numara) return { ok: false, durum: 409, hata: 'Bu yanıtın numarası okunamadı.' }
    const anahtar = `yanit:${simdi.getTime()}`
    const r = await oturumMetniGonder(sb, { doktorId: g.doktorId, phoneNumberId: bag.phoneNumberId, token: bag.token },
      { to: numara, metin, tur: 'hekim_yaniti', idemAnahtar: `kart:${kart.id}:${anahtar}`, hastaId: kart.patient_id }, deps.fetch, simdi)
    if (r.ok) return bitir('Yanıt gönderildi.', { bildirildi: true })
    if (!r.pencereKapali) return { ok: false, durum: 502, hata: r.hata }
    // 24h window closed → the generic approved template (no free text may leave outside the window).
    let hastaAdi = ''
    if (kart.patient_id) {
      const { data: h } = await sb.from('patients').select('name_encrypted').eq('id', kart.patient_id).eq('doctor_id', g.doktorId).maybeSingle()
      hastaAdi = hastaAdiCoz(h?.name_encrypted)
    }
    const ayar = await doktorIletisimAyari(sb, g.doktorId)
    if (!hastaAdi || !ayar.doktorAdi) return { ok: false, durum: 409, hata: 'Hasta 24 saattir yazmadığı için yalnız şablon gönderilebilir; hasta adı ya da hekim adı eksik.' }
    const s = await whatsappGondericisi({ sb: () => sb, fetch: deps.fetch }).gonder({
      doktorId: g.doktorId, alici: numara, metin: '', sablonKodu: 'genel_bildirim', degiskenler: [hastaAdi, ayar.doktorAdi],
      idemAnahtar: `kart:${kart.id}:sablon:${anahtar}`, hastaId: kart.patient_id, tur: 'hekim_yaniti',
    })
    if (!s.ok) return { ok: false, durum: 502, hata: s.hata }
    return bitir('Hasta 24 saattir yazmadığı için onaylı genel bildirim şablonu gönderildi. Serbest metin gönderilemez.', { bildirildi: true })
  }

  // The remaining actions change an appointment: they need a matched patient (exactly one).
  if (!kart.patient_id) return { ok: false, durum: 409, hata: 'Bu yanıt tek bir hastayla eşleşmedi; işlem yapılamaz.' }
  let randevuId = kart.randevu_id

  // WHATSAPP-CANCEL-01 "Geri al": undo an AUTOMATIC cancel recorded on this card (never a random appointment: the card's own
  // randevu_id, its own patient, a cancel that the patient's WhatsApp reply made).
  if (g.eylem === 'geri_al') {
    if (!randevuId || !String(kart.otomatik_eylem || '').startsWith('randevu_iptal')) return { ok: false, durum: 409, hata: 'Bu kartta geri alınacak bir otomatik iptal yok.' }
    const t = await iptalGeriAl(sb, { doktorId: g.doktorId, patientId: kart.patient_id, randevuId, yapanId: g.yapanId, simdi })
    if (!t.ok) return { ok: false, durum: 409, hata: t.hata }
    await sb.from(YANITLAR).update({ otomatik_eylem: 'randevu_iptal_geri_alindi' }).eq('id', kart.id).eq('doctor_id', g.doktorId)
    await randevuSonrasi(sb, g.doktorId, randevuId)
    const bildirildi = await bildir(geriAlindiMetni(t.etiket), 'geri_al')
    return bitir(`İptal geri alındı: ${t.etiket}.`, { bildirildi })
  }

  if (!randevuId) {
    const h = await hedefRandevu(sb, g.doktorId, kart.patient_id, simdi)
    if (!h.ok) return { ok: false, durum: 409, hata: h.neden === 'birden_cok' ? 'Hastanın birden çok yaklaşan randevusu var; takvimden işlem yapın.' : 'Hastanın yaklaşan randevusu bulunamadı.' }
    randevuId = h.randevu.id
    // Remember it on the card: a second tap (or a later one after the appointment moved/cancelled) hits the same appointment.
    await sb.from(YANITLAR).update({ randevu_id: randevuId }).eq('id', kart.id).eq('doctor_id', g.doktorId)
  }

  if (g.eylem === 'onayla') {
    if (kart.secilen_slot) {
      // The patient picked a proposed time → move the appointment there.
      const t = await randevuTasi(sb, { doktorId: g.doktorId, patientId: kart.patient_id, randevuId, baslangicIso: kart.secilen_slot, yapanId: g.yapanId, simdi, yenidenAc: true })
      if (!t.ok) return { ok: false, durum: 409, hata: t.hata }
      await randevuSonrasi(sb, g.doktorId, randevuId)
      const bildirildi = await bildir(`Randevunuz ${t.etiket} olarak güncellendi.`, 'tasindi')
      return bitir(`Randevu ${t.etiket} olarak güncellendi.`, { bildirildi })
    }
    const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum, hasta_teyit_at')
      .eq('id', randevuId).eq('doktor_id', g.doktorId).eq('patient_id', kart.patient_id).maybeSingle()
    if (!r) return yok()
    const s = await randevuTeyit(sb, g.doktorId, kart.patient_id, { id: String(r.id), baslangic: String(r.baslangic), bitis: String(r.bitis), durum: String(r.durum), teyit: !!r.hasta_teyit_at }, simdi)
    if (s === 'olmadi') return { ok: false, durum: 409, hata: 'Randevu onaylanamadı (bekleyen talep ya da iptal).' }
    const bildirildi = s === 'onaylandi' ? await bildir(SABIT.onay, 'onay') : false
    return bitir(s === 'zaten' ? 'Randevu zaten onaylı.' : 'Randevu onaylandı.', { bildirildi })
  }

  if (g.eylem === 'iptal') {
    const s = await doktorIptal(sb, g.doktorId, kart.patient_id, randevuId, g.yapanId)
    if (s === 'olmadi') return { ok: false, durum: 409, hata: 'Randevu iptal edilemedi.' }
    if (s === 'iptal') await randevuSonrasi(sb, g.doktorId, randevuId)
    const bildirildi = s === 'iptal' ? await iptalBildir(randevuId) : false
    return bitir(s === 'zaten' ? 'Randevu zaten iptal.' : 'Randevu iptal edildi.', { bildirildi })
  }

  // yeniden_planla
  if (g.baslangic) {
    const t = await randevuTasi(sb, { doktorId: g.doktorId, patientId: kart.patient_id, randevuId, baslangicIso: g.baslangic, yapanId: g.yapanId, simdi, yenidenAc: true })
    if (!t.ok) return { ok: false, durum: 409, hata: t.hata }
    await randevuSonrasi(sb, g.doktorId, randevuId)
    const bildirildi = await bildir(`Randevunuz ${t.etiket} olarak güncellendi.`, 'tasindi')
    return bitir(`Randevu ${t.etiket} olarak güncellendi.`, { bildirildi })
  }
  const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum')
    .eq('id', randevuId).eq('doktor_id', g.doktorId).eq('patient_id', kart.patient_id).maybeSingle()
  if (!r) return yok()
  const slotlar = await slotOner(sb, g.doktorId, { id: String(r.id), baslangic: String(r.baslangic), bitis: String(r.bitis), durum: String(r.durum), teyit: false }, simdi)
  if (!slotlar.length) return { ok: false, durum: 409, hata: 'Yakın zamanda boş saat bulunamadı.' }
  const bildirildi = await bildir(slotMetni(slotlar), 'oneri')
  await sb.from(YANITLAR).update({ onerilen_slotlar: slotlar, otomatik_eylem: 'slot_onerildi', randevu_id: randevuId }).eq('id', kart.id).eq('doctor_id', g.doktorId)
  return { ok: true, mesaj: bildirildi ? 'Uygun zamanlar hastaya gönderildi.' : 'Uygun zamanlar bulundu; hastaya iletilemedi (24 saat penceresi kapalı).', bildirildi, slotlar }
}
