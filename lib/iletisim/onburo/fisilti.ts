/**
 * WHATSAPP-ONBURO-01 — the Ön büro fısıltısı side of "Ayşe ön büro": the time-critical front-desk cards the doctor AND
 * the secretary must see, read ONLY from the inbox cards the webhook already wrote (one card per inbound wamid, so a
 * redelivered webhook cannot notify twice).
 *
 *   • a request from an unknown number (name + chosen time) → approve / decline
 *   • an appointment Ayşe booked by herself                 → one-tap undo
 *   • a message with emergency wording                      → call the patient now
 * (A pending request of a KNOWN patient is an appointment row in state 'talep' and already appears as the existing
 * "randevu talebi" item — it is not repeated here.)
 *
 * Data minimisation, same as the cancel items: first name + last initial, the appointment time and a fixed sentence.
 * Never the message text, never a phone number, never anything clinical.
 * Read-only on purpose (this file is reachable from the Fısıltı import graph).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import { kisaAd } from '@/lib/iletisim/whatsapp/onBuro'
import type { OnBuroFisiltiItem } from '@/lib/doktor/onBuroFisilti'
import { AKTIF_ON_BURO, ON_BURO_SAAT_DILIMI } from './dil/aktif'

const KARTLAR = 'whatsapp_yanitlar'
/** Kept in step with isle.ts (not imported: this file must stay free of the write path). */
const YENI_HASTA = 'ob_yeni_hasta_talebi'
const OTOMATIK = 'ob_otomatik_randevu'
const ACIL = 'ob_acil'
export const MASA_KART_OMRU_SA = 72

export type MasaKartTuru = 'yeni_hasta' | 'otomatik' | 'acil'
export interface MasaKarti { id: string; tur: MasaKartTuru; ad: string; zaman: string; baslangic: string | null }

export async function onBuroMasaKartlari(sb: SupabaseClient, doktorId: string, simdi: Date = new Date()): Promise<MasaKarti[]> {
  const sinir = new Date(simdi.getTime() - MASA_KART_OMRU_SA * 3600_000).toISOString()
  const { data, error } = await sb.from(KARTLAR)
    .select('id, patient_id, randevu_id, otomatik_eylem, secilen_slot, on_buro, created_at')
    .eq('doctor_id', doktorId).eq('durum', 'yeni').in('otomatik_eylem', [YENI_HASTA, OTOMATIK, ACIL]).gte('created_at', sinir)
    .order('created_at', { ascending: false }).limit(20)
  if (error) {
    if (tabloYokMu(error)) return []
    throw error
  }
  const satirlar = (data || []) as Array<Record<string, unknown>>
  if (!satirlar.length) return []
  const hastaIds = Array.from(new Set(satirlar.map((k) => k.patient_id).filter(Boolean).map(String)))
  const adlar = new Map<string, string>()
  if (hastaIds.length) {
    const { data: hastalar } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', hastaIds)
    for (const h of hastalar || []) adlar.set(String(h.id), kisaAd(hastaAdiCoz(h.name_encrypted)))
  }
  const sonuc: MasaKarti[] = []
  for (const k of satirlar) {
    const eylem = String(k.otomatik_eylem)
    const baslangic = k.secilen_slot ? String(k.secilen_slot) : null
    if (eylem !== ACIL && baslangic && Date.parse(baslangic) <= simdi.getTime()) continue
    let ad = k.patient_id ? adlar.get(String(k.patient_id)) || 'Hasta' : 'Bilinmeyen numara'
    if (eylem === YENI_HASTA) {
      try { ad = kisaAd(decryptPII(String((k.on_buro as { ad?: string } | null)?.ad || ''))) } catch { ad = 'Yeni hasta' }
    }
    sonuc.push({ id: String(k.id), tur: eylem === YENI_HASTA ? 'yeni_hasta' : eylem === OTOMATIK ? 'otomatik' : 'acil', ad, zaman: String(k.created_at), baslangic })
  }
  return sonuc
}

/** Pure: front-desk cards → desk items. Emergency wording sorts first. */
export function onBuroMasaOgeleri(kartlar: MasaKarti[]): OnBuroFisiltiItem[] {
  const zaman = (iso: string | null) => (iso ? AKTIF_ON_BURO.zamanEtiketi(iso, ON_BURO_SAAT_DILIMI) : '')
  return kartlar.map((k) => {
    const ortak = { id: `onburo:${k.id}`, kaynak: 'onburo' as const, kartId: k.id, ad: k.ad, enErkenTarih: k.zaman }
    if (k.tur === 'acil') {
      return { ...ortak, baslik: 'WhatsApp’tan acil ifade içeren bir mesaj yazdı', detay: ['Ayşe acil numarasını bildirdi. Hastayı şimdi arayın.'], hedefYol: '/dashboard/doktor/randevular', oncelik: 0, obEylemler: ['ob_gordum' as const] }
    }
    if (k.tur === 'yeni_hasta') {
      return { ...ortak, baslik: 'yeni hasta, WhatsApp’tan randevu istiyor', detay: [`${zaman(k.baslangic) || 'Saat seçilmedi'}. Onaylarsanız hasta kaydı açılır ve randevu verilir.`], hedefYol: '/dashboard/doktor/randevular', oncelik: 1, obEylemler: ['ob_onayla' as const, 'ob_reddet' as const] }
    }
    return { ...ortak, baslik: 'için Ayşe WhatsApp’tan randevu verdi', detay: [`${zaman(k.baslangic)}. Uygun değilse tek dokunuşla geri alabilirsiniz.`], hedefYol: '/dashboard/doktor/randevular', oncelik: 2, obEylemler: ['ob_geri_al' as const, 'ob_gordum' as const] }
  })
}
