/**
 * KONSULTASYON-01 (Kaan, 2026-09-19): on Sağlığım the patient sees only "… yönlendirildiniz · Sonuç alındı" — never
 * the consultant's report, the clinical question, the diagnosis or the consultant's name. A consultant's upload is
 * also "hekim onaylamadan hasta portalına konulmaz" (lib/doktor/konsultanPortal.ts).
 *
 * NOTYA-PORTAL-TETKIK-01 (2026-10-04) lists the patient's document vault on Sağlığım. These two helpers keep the
 * consultation documents out of that list and out of the download route:
 *   - a document a consultation points at (`sevkler.belge_id` / `sevkler.belge_idler`), whatever its category;
 *   - a document filed as a consultation report (vault category "konsultasyon" from the consultant portal, or the
 *     doctor's "Konsültasyon raporu" document type), linked or not.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

/** Vault category of a consultation report — "konsultasyon", "Konsültasyon raporu", any case. */
export function konsultasyonBelgesiMi(kategori: unknown): boolean {
  const k = String(kategori ?? '').trim().toLocaleLowerCase('tr-TR').replace(/ü/g, 'u')
  return k.startsWith('konsultasyon')
}

type Satir = { belge_id?: unknown; belge_idler?: unknown }

/**
 * Ids of the vault documents this doctor's consultations for this patient point at. `null` = could not be read:
 * the caller must then show NO vault document (fail closed) rather than risk showing a consultant's report.
 */
export async function konsultasyonBelgeIdleri(
  sb: SupabaseClient,
  doctorId: string,
  patientId: string,
): Promise<Set<string> | null> {
  try {
    const tam = await sb.from('sevkler').select('belge_id, belge_idler').eq('patient_id', patientId).eq('doctor_id', doctorId).limit(500)
    let satirlar = tam.data as Satir[] | null
    let hata = tam.error
    if (hata) {
      // `belge_idler` (migration 122) may be missing on an older database — the single link is always there (058).
      const eski = await sb.from('sevkler').select('belge_id').eq('patient_id', patientId).eq('doctor_id', doctorId).limit(500)
      satirlar = eski.data as Satir[] | null
      hata = eski.error
    }
    if (hata) return null
    const idler = new Set<string>()
    for (const s of satirlar || []) {
      if (s.belge_id) idler.add(String(s.belge_id))
      if (Array.isArray(s.belge_idler)) for (const b of s.belge_idler) if (b) idler.add(String(b))
    }
    return idler
  } catch {
    return null
  }
}
