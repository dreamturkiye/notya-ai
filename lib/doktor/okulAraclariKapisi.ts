/**
 * NOTYA-OKUL-RAPOR-01 — age/öğrenci gate for the three base school-report tools (İstirahat ve Geçici
 * Hastalık Raporu, Durum Bildirir Sağlık Raporları/Katılım Belgeleri, ÇÖZGER takip ve katkı).
 *
 * Classification (.cursor/skills/specialty-doktor-araclari/SKILL.md), already made, not re-derived here:
 *   Bucket: base (ORTAK_DOKTOR_ARACLARI) — a cardiologist, dermatologist, etc. treating a child/öğrenci
 *     patient can equally need to write a school absence note or a sports clearance; a pediatrist is only
 *     one of ≥4 branches on a ÇÖZGER kurul. These are NOT pediatri-exclusive chapter tools.
 *   Visibility: all ~30 specialties — the tile itself. What is gated here is relevance/reachability for
 *     THIS patient, never the doctor's branş.
 *
 * Same shape as brans-alan-sizmasi's veliDiliMi/veliOnamGerekliMi: a patient-dependent (age) gate, branch-
 * independent, layered ON TOP of the (non-)branch gate — never instead of it. An unknown age never counts
 * as a minor (fails closed, same as veliOnamGerekliMi); "öğrenci" is a doctor-entered fact (notes.ogrenciMi,
 * lib/doktor/hastaOzetKayit.ts) for the non-minor student case (lise/üniversite öğrencisi of legal age who
 * still needs a devamsızlık/katılım raporu).
 */
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'

export type OkulAracGirdisi = {
  hastaDogumIso?: string | null
  ogrenciMi?: boolean | null
  nowMs?: number
}

/** True when this patient is in scope for the school-report tools: a minor (any branş) OR marked öğrenci. */
export function okulAraclariGorunurMu(g: OkulAracGirdisi): boolean {
  if (g.ogrenciMi) return true
  return veliOnamGerekliMi(g.hastaDogumIso, g.nowMs)
}
