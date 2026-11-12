/**
 * WHATSAPP-ONBURO-01 — what the practice does with a front-desk card: approve / decline a request, undo an automatic
 * booking, acknowledge. Called by the doctor's inbox route and by the Ön büro fısıltısı route (doctor + the doctor's own
 * secretary through pratikOturum — `doktorId` is always the practice doctor, never a secretary's user id).
 *
 * HASTA-IZOLASYON-01: the card is loaded by id AND doctor_id and must be a front-desk card; the appointment and the
 * patient are the card's OWN (read and written with doctor_id AND patient_id). Nothing patient-derived comes from the
 * request except the card id and the action.
 *
 * Approving a request from an UNKNOWN number is the only place a patient is created from a chat: through the same
 * patient-create write the "Hasta ekle" form uses (lib/doktor/hastaOlustur.ts), or — when the number now belongs to
 * exactly one patient of this doctor — by linking that patient. The appointment then goes through the shared create path.
 *
 * Telling the patient: inside the 24-hour session window a fixed sentence; outside it the approved generic template
 * (`genel_bildirim`), exactly as the existing card actions do (lib/iletisim/whatsapp/eylem.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { hastaKaydiOlustur } from '@/lib/doktor/hastaOlustur'
import { baglantiOku } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { whatsappGondericisi } from '@/lib/iletisim/otomatik/whatsapp'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { gunlukYaz } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import { doktorIletisimAyari, hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { hastalariEslestir } from '@/lib/iletisim/whatsapp/eslestir'
import type { KartSonucu } from '@/lib/iletisim/whatsapp/eylem'
import { oturumMetniGonder } from '@/lib/iletisim/whatsapp/serbest'
import { randevuSonrasi } from '@/lib/iletisim/whatsapp/sonrasi'
import { isleriCalistir, pratikIslem, randevuIptalEt, talepOlustur, type Yapan } from '@/lib/randevu/v2/sunucu'
import { portalTuruMu } from '@/lib/randevu/v2/ayar'
import { AKTIF_ON_BURO, ON_BURO_SAAT_DILIMI } from './dil/aktif'
import type { OnBuroDili } from './dil/tipler'
import { KARTLAR, OB, type OnBuroDurumu } from './isle'

export type ObEylem = 'ob_onayla' | 'ob_reddet' | 'ob_geri_al' | 'ob_gordum'
export const OB_EYLEMLERI: readonly ObEylem[] = ['ob_onayla', 'ob_reddet', 'ob_geri_al', 'ob_gordum']
export const obEylemiMi = (x: unknown): x is ObEylem => typeof x === 'string' && (OB_EYLEMLERI as readonly string[]).includes(x)

export const GERI_ALMA_NEDENI = 'Muayenehane geri aldı (WhatsApp ön büro randevusu)'

type Sb = SupabaseClient
type PratikYapan = Exclude<Yapan, 'hasta' | 'sistem'>
interface Deps { fetch?: FetchFn; simdi?: Date; dil?: OnBuroDili }

interface Kart {
  id: string; patient_id: string | null; randevu_id: string | null; durum: string; otomatik_eylem: string | null
  karsi_taraf_encrypted: string | null; secilen_slot: string | null; on_buro: OnBuroDurumu | null
}
const KART_ALANLARI = 'id, patient_id, randevu_id, durum, otomatik_eylem, karsi_taraf_encrypted, secilen_slot, on_buro'
const coz = (v: unknown): string => { try { return decryptPII(String(v || '')) } catch { return '' } }
/** The patient is answered in the language the conversation ran in (multi-language packs). */
const kartDili = (kok: OnBuroDili, kart: Kart): OnBuroDili => (kok.dilSec ? kok.dilSec('', kart.on_buro?.dil) : kok)

/** One message to the card's number: free text inside the session window, the approved generic template outside it. */
async function hastayaYaz(sb: Sb, g: { doktorId: string; kartId: string; numara: string; patientId: string | null; metin: string; anahtar: string }, deps: Deps): Promise<boolean> {
  const simdi = deps.simdi ?? new Date()
  const bag = await baglantiOku(sb, g.doktorId).catch(() => null)
  if (!bag || !g.numara) return false
  const r = await oturumMetniGonder(sb, { doktorId: g.doktorId, phoneNumberId: bag.phoneNumberId, token: bag.token },
    { to: g.numara, metin: g.metin, tur: 'hekim_yaniti', idemAnahtar: `ob-kart:${g.kartId}:${g.anahtar}`, hastaId: g.patientId }, deps.fetch, simdi)
  if (r.ok || !r.pencereKapali || !g.patientId) return r.ok
  const { data: h } = await sb.from('patients').select('name_encrypted').eq('id', g.patientId).eq('doctor_id', g.doktorId).maybeSingle()
  const hastaAdi = hastaAdiCoz(h?.name_encrypted)
  const ayar = await doktorIletisimAyari(sb, g.doktorId)
  if (!hastaAdi || !ayar.doktorAdi) return false
  const t = await whatsappGondericisi({ sb: () => sb, fetch: deps.fetch }).gonder({
    doktorId: g.doktorId, alici: g.numara, metin: '', sablonKodu: 'genel_bildirim', degiskenler: [hastaAdi, ayar.doktorAdi],
    idemAnahtar: `ob-kart:${g.kartId}:${g.anahtar}:sablon`, hastaId: g.patientId, tur: 'hekim_yaniti',
  })
  return t.ok
}

async function kartKapat(sb: Sb, doktorId: string, kart: Kart, yapanId: string, eylem: string, alanlar: Record<string, unknown>, simdi: Date): Promise<void> {
  await sb.from(KARTLAR).update({ ...alanlar, durum: 'islendi', islendi_at: simdi.toISOString(), islenen_user_id: yapanId }).eq('id', kart.id).eq('doctor_id', doktorId)
  await gunlukYaz(sb, { doktorId, patientId: (alanlar.patient_id as string | undefined) ?? kart.patient_id, yon: 'olay', tur: 'on_buro_eylemi', durum: 'olay', ayrinti: { eylem, kart_id: kart.id } })
}

/**
 * The practice answered a WhatsApp-made appointment REQUEST (from the card, or from the calendar's request list —
 * app/api/doktor/randevu-portal/talepler): tell the patient on WhatsApp and close the card. Returns false when the
 * appointment has no front-desk card behind it (a portal request) — then nothing is sent.
 */
export async function talepSonucuBildir(
  sb: Sb, g: { doktorId: string; randevuId: string; sonuc: 'onaylandi' | 'reddedildi'; yapanId: string }, deps: Deps = {},
): Promise<{ kart: boolean; bildirildi: boolean }> {
  const simdi = deps.simdi ?? new Date()
  const { data, error } = await sb.from(KARTLAR).select(KART_ALANLARI)
    .eq('doctor_id', g.doktorId).eq('randevu_id', g.randevuId).eq('otomatik_eylem', OB.talep).limit(1)
  const kart = (data?.[0] as unknown as Kart | undefined) ?? null
  if (error || !kart || !kart.patient_id) return { kart: false, bildirildi: false }
  const dil = kartDili(deps.dil ?? AKTIF_ON_BURO, kart)
  const { data: r } = await sb.from('randevular').select('baslangic').eq('id', g.randevuId).eq('doktor_id', g.doktorId).eq('patient_id', kart.patient_id).maybeSingle()
  const zaman = r?.baslangic ? dil.zamanEtiketi(String(r.baslangic), ON_BURO_SAAT_DILIMI) : ''
  const metin = g.sonuc === 'onaylandi' ? dil.metin.talepOnaylandi(zaman) : dil.metin.talepReddedildi
  const bildirildi = await hastayaYaz(sb, { doktorId: g.doktorId, kartId: kart.id, numara: coz(kart.karsi_taraf_encrypted), patientId: kart.patient_id, metin, anahtar: g.sonuc }, deps)
  await kartKapat(sb, g.doktorId, kart, g.yapanId, g.sonuc, { otomatik_eylem: g.sonuc === 'onaylandi' ? OB.talepOnaylandi : OB.talepReddedildi }, simdi)
  return { kart: true, bildirildi }
}

export async function onBuroKartEylemi(
  sb: Sb, g: { doktorId: string; yapanId: string; yapan: PratikYapan; kartId: string; eylem: ObEylem }, deps: Deps = {},
): Promise<KartSonucu> {
  const simdi = deps.simdi ?? new Date()
  const { data, error } = await sb.from(KARTLAR).select(KART_ALANLARI).eq('id', g.kartId).eq('doctor_id', g.doktorId).maybeSingle()
  const kart = data as unknown as Kart | null
  if (error || !kart || !String(kart.otomatik_eylem || '').startsWith('ob_')) return { ok: false, durum: 404, hata: 'Kayıt bulunamadı.' }
  const dil = kartDili(deps.dil ?? AKTIF_ON_BURO, kart)
  const tur = String(kart.otomatik_eylem)
  const numara = coz(kart.karsi_taraf_encrypted)
  const etiket = (iso: string) => dil.zamanEtiketi(iso, ON_BURO_SAAT_DILIMI)

  if (g.eylem === 'ob_gordum') {
    if (kart.durum === 'yeni') await sb.from(KARTLAR).update({ durum: 'goruldu' }).eq('id', kart.id).eq('doctor_id', g.doktorId).eq('durum', 'yeni')
    return { ok: true, mesaj: 'Görüldü olarak işaretlendi.' }
  }

  // ── A pending request of a KNOWN patient (the appointment row exists as 'talep') ──────────────────────────────────
  if (tur === OB.talep && (g.eylem === 'ob_onayla' || g.eylem === 'ob_reddet')) {
    if (!kart.randevu_id || !kart.patient_id) return { ok: false, durum: 409, hata: 'Bu talebin randevusu bulunamadı.' }
    const s = await pratikIslem(sb, { doktorId: g.doktorId, randevuId: kart.randevu_id, islem: g.eylem === 'ob_onayla' ? 'onayla' : 'reddet', yapan: g.yapan, yapanId: g.yapanId, simdi: simdi.getTime() })
    if (!s.ok) return { ok: false, durum: s.durum, hata: s.hata }
    // Same follow-ups as the calendar's request list: the queued notice now, then the calendar push.
    await isleriCalistir(sb, { randevuId: s.randevu.id, doktorId: g.doktorId, limit: 5, bitis: Date.now() + 15_000 }).catch(() => undefined)
    await randevuSonrasi(sb, g.doktorId, s.randevu.id)
    const b = await talepSonucuBildir(sb, { doktorId: g.doktorId, randevuId: s.randevu.id, sonuc: g.eylem === 'ob_onayla' ? 'onaylandi' : 'reddedildi', yapanId: g.yapanId }, deps)
    return { ok: true, mesaj: g.eylem === 'ob_onayla' ? `Randevu onaylandı: ${etiket(s.randevu.baslangic)}.` : 'Talep reddedildi.', bildirildi: b.bildirildi }
  }

  // ── Undo an automatic booking ─────────────────────────────────────────────────────────────────────────────────────
  if (tur === OB.otomatikRandevu && g.eylem === 'ob_geri_al') {
    if (!kart.randevu_id || !kart.patient_id) return { ok: false, durum: 409, hata: 'Bu kartta geri alınacak bir randevu yok.' }
    const { data: r } = await sb.from('randevular').select('id, baslangic, durum').eq('id', kart.randevu_id).eq('doktor_id', g.doktorId).eq('patient_id', kart.patient_id).maybeSingle()
    if (!r) return { ok: false, durum: 404, hata: 'Randevu bulunamadı.' }
    const s = await randevuIptalEt(sb, { doktorId: g.doktorId, randevuId: kart.randevu_id, patientId: kart.patient_id, neden: GERI_ALMA_NEDENI, yapan: g.yapan, yapanId: g.yapanId, detay: { kanal: 'whatsapp', on_buro: true }, simdi: simdi.getTime() })
    if (!s.ok) return { ok: false, durum: s.durum, hata: s.hata }
    await randevuSonrasi(sb, g.doktorId, kart.randevu_id)
    const bildirildi = r.durum === 'iptal' ? false : await hastayaYaz(sb, { doktorId: g.doktorId, kartId: kart.id, numara, patientId: kart.patient_id, metin: dil.metin.randevuGeriAlindi(etiket(String(r.baslangic))), anahtar: 'geri_al' }, deps)
    await kartKapat(sb, g.doktorId, kart, g.yapanId, 'geri_al', { otomatik_eylem: OB.randevuGeriAlindi }, simdi)
    return { ok: true, mesaj: `Randevu geri alındı: ${etiket(String(r.baslangic))}.`, bildirildi }
  }

  // ── A request from an UNKNOWN number: approving creates (or links) the patient, then books ────────────────────────
  if (tur === OB.yeniHastaTalebi && g.eylem === 'ob_reddet') {
    const bildirildi = await hastayaYaz(sb, { doktorId: g.doktorId, kartId: kart.id, numara, patientId: null, metin: dil.metin.talepReddedildi, anahtar: 'reddedildi' }, deps)
    await kartKapat(sb, g.doktorId, kart, g.yapanId, 'reddedildi', { otomatik_eylem: OB.talepReddedildi }, simdi)
    return { ok: true, mesaj: 'Talep reddedildi.', bildirildi }
  }
  if (tur === OB.yeniHastaTalebi && g.eylem === 'ob_onayla') {
    const ad = coz(kart.on_buro?.ad)
    if (!ad || !numara) return { ok: false, durum: 409, hata: 'Bu talepte ad ya da numara okunamadı; hastayı elle ekleyin.' }
    // Link when the number now belongs to exactly one patient of THIS doctor; never guess between several.
    let patientId = kart.patient_id
    if (!patientId) {
      const es = await hastalariEslestir(sb, g.doktorId, numara)
      if (es.hastalar.length > 1) return { ok: false, durum: 409, hata: 'Bu numara birden fazla hastaya kayıtlı; randevuyu takvimden hastayı seçerek verin.' }
      if (es.hastalar.length === 1) patientId = es.hastalar[0].id
      else {
        const y = await hastaKaydiOlustur(sb, g.doktorId, { adSoyad: ad, telefon: `+${numara}` })
        if (!y.ok) return { ok: false, durum: 500, hata: 'Hasta kaydı oluşturulamadı.' }
        patientId = y.patient.id
      }
      // Remember the patient on the card first: a second tap links instead of creating a second record.
      await sb.from(KARTLAR).update({ patient_id: patientId }).eq('id', kart.id).eq('doctor_id', g.doktorId)
    }
    if (!kart.secilen_slot) {
      await kartKapat(sb, g.doktorId, kart, g.yapanId, 'yeni_hasta', { patient_id: patientId, otomatik_eylem: OB.yeniHastaOnaylandi }, simdi)
      return { ok: true, mesaj: 'Hasta kaydı oluşturuldu. Randevuyu takvimden verebilirsiniz.', bildirildi: false }
    }
    const turu = portalTuruMu(kart.on_buro?.tur) ? kart.on_buro!.tur! : 'ilk_muayene'
    const s = await talepOlustur(sb, { doktorId: g.doktorId, patientId, tur: turu, baslangic: kart.secilen_slot, simdi: simdi.getTime(), kanal: 'whatsapp', onay: 'yok' })
    if (!s.ok) {
      return { ok: false, durum: 409, hata: s.durum === 409 ? 'Hasta kaydı oluşturuldu, ancak seçilen saat artık uygun değil. Randevuyu takvimden verin.' : `Hasta kaydı oluşturuldu, ancak randevu açılamadı: ${s.hata}` }
    }
    await isleriCalistir(sb, { randevuId: s.randevu.id, doktorId: g.doktorId, limit: 5, bitis: Date.now() + 15_000 }).catch(() => undefined)
    await randevuSonrasi(sb, g.doktorId, s.randevu.id)
    const bildirildi = await hastayaYaz(sb, { doktorId: g.doktorId, kartId: kart.id, numara, patientId, metin: dil.metin.talepOnaylandi(etiket(s.randevu.baslangic)), anahtar: 'onaylandi' }, deps)
    await kartKapat(sb, g.doktorId, kart, g.yapanId, 'yeni_hasta_onay', { patient_id: patientId, randevu_id: s.randevu.id, otomatik_eylem: OB.yeniHastaOnaylandi }, simdi)
    return { ok: true, mesaj: `Hasta kaydı oluşturuldu ve randevu verildi: ${etiket(s.randevu.baslangic)}.`, bildirildi }
  }

  return { ok: false, durum: 409, hata: 'Bu kart için bu işlem yapılamaz.' }
}
