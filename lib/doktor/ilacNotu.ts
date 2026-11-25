/**
 * ILAC-NOTU-AYRIMI (Kaan, 2026-11-25) — a medication carries two notes:
 *
 *   notlar  "Hastaya not" — shown to the patient on Sağlığım › İlaçlarım (unchanged column, unchanged behaviour).
 *   ic_not  "İç not"      — seen only by the doctor who owns the row (migration 211). It is never selected by the portal
 *                           bundle and never enters a PDF, export, e-posta / WhatsApp share text or patient-facing Ayşe
 *                           output: every patient-facing reader of hasta_ilaclar names its columns explicitly.
 *
 * CORE: one shared table and one shared İlaçlar tab for all 30 medical branches and the 10 Özel Branşlar.
 */

/** Upper bound mirrored by the DB check constraint hasta_ilaclar_ic_not_uzunluk (211). */
export const IC_NOT_AZAMI = 2000

/** Trimmed, length-capped internal note; anything empty or not a string → null. */
export function icNotTemizle(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, IC_NOT_AZAMI) : null
}

/** Copy shown on the doctor's İlaçlar form — one source so add, edit and list never drift apart. */
export const ILAC_NOTU_METIN = {
  hastayaEtiket: 'Hastaya not',
  hastayaIpucu: "Hastanın Sağlığım'ında görünür",
  hastayaOrnek: 'Örn. Tok karnına alın',
  icEtiket: 'İç not',
  icIpucu: 'Yalnız siz görürsünüz',
  icOrnek: 'Örn. Uyumu düşük, kontrolde sor',
} as const
