/**
 * WHATSAPP-CANCEL-01 — the Ön büro fısıltısı side of a patient's WhatsApp cancellation: what the front desk (secretary) and
 * the doctor are told, reading ONLY the inbox card (whatsapp_yanitlar) the webhook already wrote.
 *
 * Why this channel: the Ön büro fısıltısı is the one existing in-app surface that both roles reach through pratikOturum
 * (doctor + the doctor's own secretary, scoped to the doctor id), that is already a "what the desk must clear" list with a
 * count, and that links to the calendar (a secretary cannot open Ayarlar › İletişim, where "Gelen Yanıtlar" lives). Because
 * the item is DERIVED from the card (one card per inbound wamid), a redelivered webhook cannot notify twice: there is no
 * second row to create.
 *
 * Data minimisation: the item carries the patient's first name + last initial ("Ayşe Y."), the appointment date and time,
 * and a fixed sentence. Never the message text, never a phone number, never a diagnosis.
 *
 * Read-only on purpose (this file is reachable from the Fısıltı import graph — core/eylemler/tests/sessizYol.test.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import { gunEtiketi, saatEtiketi } from '@/lib/randevu/v2/zaman'
import type { OnBuroFisiltiItem } from '@/lib/doktor/onBuroFisilti'

export type IptalKartTuru = 'iptal' | 'zayif' | 'bekliyor'

export interface IptalKarti {
  id: string
  tur: IptalKartTuru
  /** "Ayşe Y." — already minimised. */
  ad: string
  zaman: string
  /** Start of the appointment concerned, when known. */
  baslangic: string | null
  gec: boolean
}

/** Cards older than this are no longer "waiting on the desk": the delivery window of the information has passed. */
export const IPTAL_KART_OMRU_SA = 72

/** "Ayşe Nur Yılmaz" → "Ayşe Y." (first name + last initial). One word → the word. */
export function kisaAd(tam: string): string {
  const parcalar = String(tam || '').trim().split(/\s+/).filter(Boolean)
  if (!parcalar.length) return 'Hasta'
  if (parcalar.length === 1) return parcalar[0]
  const son = parcalar[parcalar.length - 1]
  return `${parcalar[0]} ${son.charAt(0).toLocaleUpperCase('tr-TR')}.`
}

type KartSatiri = { id: unknown; patient_id: unknown; randevu_id: unknown; niyet: unknown; durum: unknown; otomatik_eylem: unknown; eylem_sonucu: unknown; created_at: unknown }

/** A strong-cancel card that is NOT waiting on the desk: the word was an opt-out, was undone, or the appointment was already cancelled. */
const BEKLEMEYEN_EYLEMLER = ['vazgec_uygulandi', 'randevu_iptal_geri_alindi']
const BEKLEMEYEN_SONUCLAR = ['zaten_iptal']

/** Which desk class does this card belong to? null → not a cancellation matter (never shown on the desk). */
export function iptalKartTuru(k: Pick<KartSatiri, 'niyet' | 'otomatik_eylem' | 'eylem_sonucu' | 'durum'>): IptalKartTuru | null {
  const eylem = String(k.otomatik_eylem || '')
  if (eylem === 'randevu_iptal' || eylem === 'randevu_iptal_gec') return 'iptal'
  if (eylem === 'zayif_iptal') return 'zayif'
  // A cancel wish no rule could carry out (several patients on the number, no appointment found, the write failed …).
  if (String(k.niyet) === 'iptal' && !BEKLEMEYEN_EYLEMLER.includes(eylem) && !BEKLEMEYEN_SONUCLAR.includes(String(k.eylem_sonucu || ''))) return 'bekliyor'
  return null
}

export async function iptalKartlari(sb: SupabaseClient, doktorId: string, simdi: Date = new Date()): Promise<IptalKarti[]> {
  const sinir = new Date(simdi.getTime() - IPTAL_KART_OMRU_SA * 3600_000).toISOString()
  const { data, error } = await sb.from('whatsapp_yanitlar')
    .select('id, patient_id, randevu_id, niyet, durum, otomatik_eylem, eylem_sonucu, created_at')
    .eq('doctor_id', doktorId).eq('durum', 'yeni').gte('created_at', sinir).order('created_at', { ascending: false }).limit(40)
  if (error) {
    if (tabloYokMu(error)) return []
    throw error
  }
  const adaylar = ((data || []) as KartSatiri[]).map((k) => ({ k, tur: iptalKartTuru(k) })).filter((x): x is { k: KartSatiri; tur: IptalKartTuru } => x.tur !== null).slice(0, 10)
  if (!adaylar.length) return []

  const hastaIds = Array.from(new Set(adaylar.map((x) => x.k.patient_id).filter(Boolean).map(String)))
  const adlar = new Map<string, string>()
  if (hastaIds.length) {
    const { data: hastalar } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', hastaIds)
    for (const h of hastalar || []) adlar.set(String(h.id), kisaAd(hastaAdiCoz(h.name_encrypted)))
  }
  const randevuIds = Array.from(new Set(adaylar.map((x) => x.k.randevu_id).filter(Boolean).map(String)))
  const baslangiclar = new Map<string, string>()
  if (randevuIds.length) {
    const { data: rs } = await sb.from('randevular').select('id, baslangic').eq('doktor_id', doktorId).in('id', randevuIds)
    for (const r of rs || []) baslangiclar.set(String(r.id), String(r.baslangic))
  }

  const sonuc: IptalKarti[] = []
  for (const { k, tur } of adaylar) {
    const baslangic = k.randevu_id ? baslangiclar.get(String(k.randevu_id)) ?? null : null
    // A freed slot in the past is nobody's to fill any more.
    if (tur === 'iptal' && baslangic && Date.parse(baslangic) <= simdi.getTime()) continue
    sonuc.push({
      id: String(k.id),
      tur,
      ad: k.patient_id ? adlar.get(String(k.patient_id)) || 'Hasta' : 'Belirsiz gönderen',
      zaman: String(k.created_at),
      baslangic,
      gec: String(k.otomatik_eylem) === 'randevu_iptal_gec',
    })
  }
  return sonuc
}

const zamanMetni = (iso: string | null) => (iso ? `${gunEtiketi(iso)} ${saatEtiketi(iso)}` : '')

/** Pure: cancellation cards → desk items. The slot of an automatic cancel sorts first (it is time-critical). */
export function iptalOgeleri(kartlar: IptalKarti[]): OnBuroFisiltiItem[] {
  return kartlar.map((k) => {
    const zaman = zamanMetni(k.baslangic)
    if (k.tur === 'iptal') {
      return {
        id: `iptal:${k.id}`, kaynak: 'iptal' as const, kartId: k.id, ad: k.ad,
        baslik: 'randevusunu WhatsApp’tan iptal etti — saat boşaldı',
        detay: [`${zaman}${k.gec ? ' (iptal süre sınırı içinde geldi)' : ''}. Bu saati başka bir hastaya önerebilirsiniz.`],
        enErkenTarih: k.zaman, hedefYol: '/dashboard/doktor/randevular', oncelik: 0,
      }
    }
    if (k.tur === 'zayif') {
      return {
        id: `iptal:${k.id}`, kaynak: 'iptal' as const, kartId: k.id, ad: k.ad,
        baslik: 'gelemeyebilir — randevu iptal edilmedi',
        detay: [`${zaman ? `${zaman}. ` : ''}Hasta kesin bir iptal yazmadı; arayıp netleştirin.`],
        enErkenTarih: k.zaman, hedefYol: '/dashboard/doktor/randevular', oncelik: 1,
      }
    }
    return {
      id: `iptal:${k.id}`, kaynak: 'iptal' as const, kartId: k.id, ad: k.ad,
      baslik: 'iptal istedi — işlem bekliyor',
      detay: ['Hangi randevunun iptal edileceği belli değil ya da randevu bulunamadı; takvimden kontrol edin.'],
      enErkenTarih: k.zaman, hedefYol: '/dashboard/doktor/randevular', oncelik: 1,
    }
  })
}
