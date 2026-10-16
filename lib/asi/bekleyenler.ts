/**
 * NOTYA-HASTA-ILETISIMI-01 — "patients waiting on vaccine X", for the bulk-communication audience
 * filter and the Aşı Stok "Bekleyen ailelere bildir" action.
 *
 * Definition (stated plainly — there is no formal per-vaccine due/waitlist table in this product
 * outside the pediatri-only kohort engine, and this feature is universal): a patient is "waiting"
 * on vaccine X for a doctor when their MOST RECENT `asilar` row for that exact `asi_adi` carries a
 * `sonraki_doz_tarihi` (the doctor explicitly planned a next dose — "aşı planlayıcı 'sonraki doz
 * tarihini de yaz'", docs/OPEN-COMMITMENTS.md 2026-09-18) AND no LATER `asilar` row of the same
 * `asi_adi` has been recorded since (i.e. that next dose has not been given yet). This reuses real
 * data the doctor already entered rather than inventing a new schedule concept, and intentionally
 * says nothing about medical appropriateness — it is a candidate list for a human (doktor/sekreter)
 * to review before sending, exactly as the brief asks ("ready for asistan/secretary review").
 *
 * HASTA-IZOLASYON-01: every read is scoped by doktorId in the same query.
 * NOTYA-ASI-NOT-01: reads go through arsivsizAsilar (lib/doktor/arsiv) — a vaccine an archived
 * muayene's note wrote must not surface as "waiting" here either, same as everywhere else.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'

export type AsiBekleyenHasta = { patientId: string; sonrakiDozTarihi: string }
export type AsiSatiri = { patient_id: string; asi_adi: string; uygulama_tarihi: string; sonraki_doz_tarihi: string | null }

/**
 * Pure reduction, exported for testing: `satirlar` already DESC by uygulama_tarihi (as the real
 * query orders them). One row per (patient_id, asi_adi) survives — its sonraki_doz_tarihi, if any,
 * is "still waiting" by definition (nothing newer for that pair exists, so that next dose was
 * never recorded as given).
 */
export function asiBekleyenleriHesapla(satirlar: readonly AsiSatiri[]): AsiBekleyenHasta[] {
  const sonSatir = new Map<string, AsiSatiri>()
  for (const r of satirlar) {
    const anahtar = `${r.patient_id}::${r.asi_adi}`
    if (!sonSatir.has(anahtar)) sonSatir.set(anahtar, r)
  }
  const sonuc: AsiBekleyenHasta[] = []
  for (const r of sonSatir.values()) {
    if (r.sonraki_doz_tarihi) sonuc.push({ patientId: r.patient_id, sonrakiDozTarihi: r.sonraki_doz_tarihi })
  }
  return sonuc
}

/**
 * asiAdi omitted/null → every vaccine with a planned next dose not yet given (used by the general
 * "aşı bekleme listesi" filter). asiAdi set → one vaccine only (used by the stock-arrival flow).
 */
export async function asiBekleyenHastalar(supabase: SupabaseClient, doktorId: string, asiAdi?: string | null): Promise<AsiBekleyenHasta[]> {
  let sorgu = arsivsizAsilar(supabase, 'patient_id, asi_adi, uygulama_tarihi, sonraki_doz_tarihi, created_at')
    .eq('doktor_id', doktorId)
    .order('uygulama_tarihi', { ascending: false })
    .limit(5000)
  if (asiAdi) sorgu = sorgu.eq('asi_adi', asiAdi)
  const { data, error } = await sorgu
  if (error || !data) return []
  return asiBekleyenleriHesapla(data as AsiSatiri[])
}

/** Convenience: just the patient id set, for filtre.ts to intersect against. */
export async function asiBekleyenHastaIdleri(supabase: SupabaseClient, doktorId: string, asiAdi?: string | null): Promise<Set<string>> {
  const liste = await asiBekleyenHastalar(supabase, doktorId, asiAdi)
  return new Set(liste.map((x) => x.patientId))
}
