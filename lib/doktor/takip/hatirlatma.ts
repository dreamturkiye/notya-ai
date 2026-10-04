/**
 * NOTYA-TAKIP-01 — prepare kontrol_hatirlatma (and desk-safe gelmedi logistics) in Hazır mesajlar.
 *
 * Clinical recall (kontrol_hatirlatma) is doctor-only and NOT in OTOMATIK_TURLER — a human still
 * taps send (same policy as asi_hatirlatma). Gelmedi uses randevu_iptali-style wording via
 * randevu_degisikligi is wrong; we enqueue nothing clinical for gelmedi — the desk calls / uses
 * existing randevu templates after rebooking. Cron only prepares kontrol_hatirlatma for due cases.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { kuyrugaEkle } from '@/lib/iletisim/sunucu'
import type { KuyrukAdayi } from '@/lib/iletisim/kuyruk'
import { gunEkle } from '@/lib/iletisim/kuyruk'
import { takipAcikListe } from './oku'

type Sb = SupabaseClient

/** Due window: up to 2 days ahead, up to 14 days overdue. */
export const TAKIP_HATIRLAT_ILERI = 2
export const TAKIP_HATIRLAT_GERI = 14

export function takipHatirlatmaAnahtar(takipId: string, vadeIso: string): string {
  return `kontrol_hatirlatma:takip:${takipId}:${vadeIso}`
}

/** Pure filter of open kontrol cases that should get a prepared reminder today. */
export function takipHatirlatmaAdaylari(
  isler: Array<{ id: string; doktorId: string; patientId: string; tur: string; vade: string | null; kosullu: boolean }>,
  bugunIso: string,
): KuyrukAdayi[] {
  const min = gunEkle(bugunIso, -TAKIP_HATIRLAT_GERI)
  const max = gunEkle(bugunIso, TAKIP_HATIRLAT_ILERI)
  return isler
    .filter((t) => t.tur === 'kontrol' && t.vade && !t.kosullu)
    .filter((t) => String(t.vade) >= min && String(t.vade) <= max)
    .map((t) => ({
      doctor_id: t.doktorId,
      patient_id: t.patientId,
      tur: 'kontrol_hatirlatma' as const,
      planlanan_gun: bugunIso,
      tekil_anahtar: takipHatirlatmaAnahtar(t.id, String(t.vade)),
    }))
}

/** Enqueue kontrol reminders for one practice (or all open cases when called from cron per doctor). */
export async function takipHatirlatmalariHazirla(
  sb: Sb,
  doktorId: string,
  bugunIso: string = bugunTrIso(),
): Promise<number> {
  const liste = await takipAcikListe(sb, doktorId, { turler: ['kontrol'], isimlerle: false, limit: 200 })
  const adaylar = takipHatirlatmaAdaylari(liste, bugunIso)
  if (!adaylar.length) return 0
  // Ownership check — only this doctor's patients.
  const { data: hastalar } = await sb.from('patients').select('id')
    .eq('doctor_id', doktorId).in('id', adaylar.map((a) => a.patient_id))
  const sahip = new Set((hastalar || []).map((p) => String(p.id)))
  return kuyrugaEkle(sb, adaylar.filter((a) => sahip.has(a.patient_id)))
}
