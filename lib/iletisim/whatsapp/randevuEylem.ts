/**
 * WHATSAPP-API-01 — what a patient's WhatsApp reply may do to HIS OWN appointment, and what the doctor's card may do.
 *
 * Every read and write carries doktor_id AND patient_id in the same query (HASTA-IZOLASYON-01). The target appointment is
 * never taken from the message: it is derived from our own records — the appointment of the last reminder we sent this
 * patient, or the patient's single upcoming appointment. Two candidates → no automatic action (the doctor decides).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { DAKIKA_MS, gunEtiketi, saatEtiketi } from '@/lib/randevu/v2/zaman'
import { ayarGetir, olayYaz, slotGirdisi, musaitSlotlar } from '@/lib/randevu/v2/sunucu'
import { bekleyenIsleriIptal, cakismaHatasiMi, isEkle } from '@/lib/randevu/v2/isler'
import { onayIsleri } from '@/lib/randevu/v2/isPlani'
import { slotUygunMu, type Slot } from '@/lib/randevu/v2/slot'

type Sb = SupabaseClient

export interface HedefRandevu { id: string; baslangic: string; bitis: string; durum: string; teyit: boolean }
/** `hatirlatmaVardi`: we sent this patient an appointment reminder on WhatsApp within the reply window. */
export type HedefSonucu = { ok: true; randevu: HedefRandevu } | { ok: false; neden: 'yok' | 'birden_cok'; hatirlatmaVardi: boolean }

const AKTIF = ['planlandi', 'onaylandi', 'talep']
const HATIRLATMA_TURLERI = ['randevu_hatirlatma', 'randevu_degisikligi']
/** A reply counts as an answer to our reminder for this long. */
export const YANIT_PENCERESI_SA = 72
const ILERI_GUN = 14

const alanlar = 'id, baslangic, bitis, durum, hasta_teyit_at'
const hedefe = (r: { id: unknown; baslangic: unknown; bitis: unknown; durum: unknown; hasta_teyit_at?: unknown }): HedefRandevu => ({
  id: String(r.id), baslangic: String(r.baslangic), bitis: String(r.bitis), durum: String(r.durum), teyit: !!r.hasta_teyit_at,
})

export async function hedefRandevu(sb: Sb, doktorId: string, patientId: string, simdi: Date = new Date()): Promise<HedefSonucu> {
  const simdiIso = simdi.toISOString()
  // 1) The appointment of the last reminder we sent this patient on WhatsApp.
  const sinir = new Date(simdi.getTime() - YANIT_PENCERESI_SA * 3600_000).toISOString()
  const { data: kayit } = await sb.from('iletisim_kayitlari').select('randevu_id, created_at')
    .eq('doctor_id', doktorId).eq('patient_id', patientId).eq('kanal', 'whatsapp').in('tur', HATIRLATMA_TURLERI)
    .gte('created_at', sinir).order('created_at', { ascending: false }).limit(1)
  const rid = kayit?.[0]?.randevu_id ? String(kayit[0].randevu_id) : null
  if (rid) {
    const { data: r } = await sb.from('randevular').select(alanlar)
      .eq('id', rid).eq('doktor_id', doktorId).eq('patient_id', patientId).in('durum', AKTIF).gt('baslangic', simdiIso).maybeSingle()
    if (r) return { ok: true, randevu: hedefe(r) }
  }
  // 2) The patient's one upcoming appointment with this doctor.
  const son = new Date(simdi.getTime() + ILERI_GUN * 86_400_000).toISOString()
  const { data: liste } = await sb.from('randevular').select(alanlar)
    .eq('doktor_id', doktorId).eq('patient_id', patientId).in('durum', AKTIF).gt('baslangic', simdiIso).lt('baslangic', son)
    .order('baslangic', { ascending: true }).limit(3)
  if (!liste?.length) return { ok: false, neden: 'yok', hatirlatmaVardi: !!rid }
  if (liste.length > 1) return { ok: false, neden: 'birden_cok', hatirlatmaVardi: !!rid }
  return { ok: true, randevu: hedefe(liste[0]) }
}

/** EVET — the patient confirms. Idempotent: confirming twice is not an error. */
export async function randevuTeyit(sb: Sb, doktorId: string, patientId: string, r: HedefRandevu, simdi: Date = new Date()): Promise<'onaylandi' | 'zaten' | 'olmadi'> {
  if (r.teyit && r.durum === 'onaylandi') return 'zaten'
  if (r.durum === 'talep') return 'olmadi' // still waiting for the practice's own approval: not the patient's to confirm
  const { data, error } = await sb.from('randevular')
    .update({ durum: 'onaylandi', hasta_teyit_at: simdi.toISOString() })
    .eq('id', r.id).eq('doktor_id', doktorId).eq('patient_id', patientId).in('durum', ['planlandi', 'onaylandi']).is('hasta_teyit_at', null)
    .select('id')
  if (error) return 'olmadi'
  if (!data?.length) return 'zaten'
  await olayYaz(sb, { randevuId: r.id, doktorId, olay: 'teyit', yapan: 'hasta', detay: { kanal: 'whatsapp' } })
  return 'onaylandi'
}

/**
 * İPTAL — the patient cancels his appointment. Unlike the portal button this is NOT blocked by the doctor's
 * iptal_sinir_saat: the patient told the practice he is not coming, and refusing to record that helps nobody. A cancel
 * inside the cutoff is flagged (`gec`) so the card says so and the doctor can reinstate it.
 */
export async function randevuIptal(
  sb: Sb, doktorId: string, patientId: string, r: HedefRandevu, simdi: Date = new Date(),
): Promise<{ sonuc: 'iptal' | 'zaten' | 'olmadi'; gec: boolean }> {
  if (r.durum === 'iptal') return { sonuc: 'zaten', gec: false }
  const ayar = await ayarGetir(sb, doktorId)
  const gec = Date.parse(r.baslangic) - simdi.getTime() < ayar.iptalSinirSaat * 3_600_000
  const { data, error } = await sb.from('randevular')
    .update({ durum: 'iptal', iptal_nedeni: gec ? 'Hasta WhatsApp ile iptal etti (süre sınırı içinde)' : 'Hasta WhatsApp ile iptal etti' })
    .eq('id', r.id).eq('doktor_id', doktorId).eq('patient_id', patientId).in('durum', AKTIF).gt('baslangic', simdi.toISOString())
    .select('id')
  if (error) return { sonuc: 'olmadi', gec }
  if (!data?.length) return { sonuc: 'zaten', gec }
  await bekleyenIsleriIptal(sb, doktorId, r.id)
  await olayYaz(sb, { randevuId: r.id, doktorId, olay: 'iptal', yapan: 'hasta', detay: { kanal: 'whatsapp', gec } })
  return { sonuc: 'iptal', gec }
}

export interface OnerilenSlot { bas: string; son: string; etiket: string }

/** Up to three next free times, at most one per day, for the proposal. Empty when the calendar cannot be read. */
export async function slotOner(sb: Sb, doktorId: string, r: HedefRandevu, simdi: Date = new Date(), adet = 3): Promise<OnerilenSlot[]> {
  const ayar = await ayarGetir(sb, doktorId)
  const sure = Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / DAKIKA_MS))
  const slotlar: Slot[] | null = await musaitSlotlar(sb, doktorId, ayar, sure, simdi.getTime(), r.id)
  if (!slotlar) return []
  const gunler = new Set<string>()
  const secilen: OnerilenSlot[] = []
  for (const s of slotlar) {
    if (gunler.has(s.gun)) continue
    gunler.add(s.gun)
    secilen.push({ bas: s.bas, son: s.son, etiket: `${gunEtiketi(s.bas)} ${saatEtiketi(s.bas)}` })
    if (secilen.length >= adet) break
  }
  return secilen
}

/** Doctor's card: move the appointment to a chosen free time. The doctor is answering now, so the notice window is waived. */
export async function randevuTasi(
  sb: Sb, g: { doktorId: string; patientId: string; randevuId: string; baslangicIso: string; yapanId: string; simdi?: Date },
): Promise<{ ok: true; etiket: string } | { ok: false; hata: string }> {
  const simdi = g.simdi ?? new Date()
  const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum')
    .eq('id', g.randevuId).eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).in('durum', AKTIF).maybeSingle()
  if (!r) return { ok: false, hata: 'Randevu bulunamadı ya da artık değiştirilemez.' }
  const sure = Math.max(5, Math.round((Date.parse(String(r.bitis)) - Date.parse(String(r.baslangic))) / DAKIKA_MS))
  const ayar = await ayarGetir(sb, g.doktorId)
  const girdi = await slotGirdisi(sb, g.doktorId, ayar, sure, simdi.getTime(), r.id)
  if (!girdi) return { ok: false, hata: 'Takvim şu an okunamadı. Lütfen yeniden deneyin.' }
  const slot = slotUygunMu({ ...girdi, minBildirimDk: 0 }, g.baslangicIso)
  if (!slot) return { ok: false, hata: 'Bu saat artık uygun değil. Başka bir saat seçin.' }
  const { data, error } = await sb.from('randevular')
    .update({ baslangic: slot.bas, bitis: slot.son, durum: 'onaylandi', hasta_teyit_at: null, hatirlatma_gonderildi: false, oneri_at: null })
    .eq('id', r.id).eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).in('durum', AKTIF).select('id')
  if (error) return { ok: false, hata: cakismaHatasiMi(error) ? 'Bu saat artık uygun değil. Başka bir saat seçin.' : 'İşlem şu an yapılamadı.' }
  if (!data?.length) return { ok: false, hata: 'Randevu bulunamadı ya da artık değiştirilemez.' }
  await bekleyenIsleriIptal(sb, g.doktorId, r.id)
  await isEkle(sb, { id: r.id as string, doktor_id: g.doktorId }, onayIsleri(slot.bas, simdi.getTime()))
  await olayYaz(sb, { randevuId: r.id as string, doktorId: g.doktorId, olay: 'ertelendi', yapan: 'doktor', yapanId: g.yapanId, detay: { kanal: 'whatsapp', eski: String(r.baslangic), yeni: slot.bas } })
  return { ok: true, etiket: `${gunEtiketi(slot.bas)} ${saatEtiketi(slot.bas)}` }
}

/** Doctor's card: cancel on behalf of the patient (same effect as the patient's own İPTAL). */
export async function doktorIptal(sb: Sb, doktorId: string, patientId: string, randevuId: string, yapanId: string): Promise<'iptal' | 'zaten' | 'olmadi'> {
  const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum')
    .eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  if (!r) return 'olmadi'
  if (r.durum === 'iptal') return 'zaten'
  const { data, error } = await sb.from('randevular').update({ durum: 'iptal', iptal_nedeni: 'Hekim iptal etti (WhatsApp yanıtı)' })
    .eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId).in('durum', AKTIF).select('id')
  if (error || !data?.length) return 'olmadi'
  await bekleyenIsleriIptal(sb, doktorId, randevuId)
  await olayYaz(sb, { randevuId, doktorId, olay: 'iptal', yapan: 'doktor', yapanId, detay: { kanal: 'whatsapp' } })
  return 'iptal'
}
