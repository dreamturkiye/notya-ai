import { addDays, diffDays } from './dates'
import type { PatchCourse } from '../schema'

export type PatchStatus = 'not_yet' | 'open_d2' | 'open_d4' | 'done' | 'overdue_d2' | 'overdue_d4'

export function plannedReads(appliedAt: string): { d2: string; d4: string } {
  return { d2: addDays(appliedAt, 2), d4: addDays(appliedAt, 4) }
}

export function patchStatus(course: PatchCourse, todayIso: string): PatchStatus {
  const { d2, d4 } = plannedReads(course.appliedAt)
  if (course.readD2 && course.readD4) return 'done'
  if (!course.readD2) {
    if (diffDays(todayIso, d2) > 0) return 'overdue_d2'
    if (todayIso === d2 || (diffDays(todayIso, course.appliedAt) >= 2 && diffDays(todayIso, d2) <= 0)) return 'open_d2'
    return 'not_yet'
  }
  if (!course.readD4) {
    if (diffDays(todayIso, d4) > 0) return 'overdue_d4'
    if (todayIso === d4 || diffDays(todayIso, d2) >= 0) return 'open_d4'
  }
  return 'done'
}

export type BaselineAlerjen = { kod: string; ad: string; kaynak: string }

/**
 * Avrupa baz serisi (ESCD / EECDRG). Seçilebilir liste — hangi antijenlerin uygulandığı ve
 * hangilerinin pozitif okunduğu hekimin kaydıdır; konsantrasyon ve vehikül seri üreticisinindir.
 */
export const EUROPEAN_BASELINE: readonly BaselineAlerjen[] = [
  { kod: 'potassium-dichromate', ad: 'Potasyum dikromat', kaynak: 'Çimento, deri (kösele), boya' },
  { kod: 'ppd', ad: 'p-Fenilendiamin (PPD)', kaynak: 'Saç boyası, geçici dövme' },
  { kod: 'thiuram-mix', ad: 'Tiuram karışımı', kaynak: 'Lastik eldiven, ayakkabı' },
  { kod: 'neomycin', ad: 'Neomisin sülfat', kaynak: 'Topikal antibiyotik' },
  { kod: 'cobalt-chloride', ad: 'Kobalt klorür', kaynak: 'Metal, çimento, pigment' },
  { kod: 'benzocaine', ad: 'Benzokain (kain karışımı)', kaynak: 'Topikal anestezik' },
  { kod: 'nickel-sulfate', ad: 'Nikel sülfat', kaynak: 'Takı, toka, madeni para' },
  { kod: 'clioquinol', ad: 'Kliokinol', kaynak: 'Antiseptik krem' },
  { kod: 'colophonium', ad: 'Kolofonyum', kaynak: 'Yapışkan bant, kozmetik, reçine' },
  { kod: 'paraben-mix', ad: 'Paraben karışımı', kaynak: 'Koruyucu — kozmetik, topikal ilaç' },
  { kod: 'ippd', ad: 'IPPD (siyah lastik karışımı)', kaynak: 'Siyah lastik, hortum, conta' },
  { kod: 'lanolin', ad: 'Lanolin alkolleri (yün alkolleri)', kaynak: 'Nemlendirici, merhem bazı' },
  { kod: 'mercapto-mix', ad: 'Merkapto karışımı', kaynak: 'Lastik hızlandırıcı' },
  { kod: 'epoxy-resin', ad: 'Epoksi reçine', kaynak: 'Yapıştırıcı, boya, kaplama' },
  { kod: 'myroxylon', ad: 'Myroxylon pereirae (Peru balsamı)', kaynak: 'Parfüm, baharat, topikal' },
  { kod: 'ptbp-formaldehyde', ad: '4-tert-Butilfenol formaldehit reçinesi', kaynak: 'Ayakkabı ve deri yapıştırıcısı' },
  { kod: 'mbt', ad: '2-Merkaptobenzotiazol', kaynak: 'Lastik' },
  { kod: 'formaldehyde', ad: 'Formaldehit', kaynak: 'Koruyucu, tekstil apresi' },
  { kod: 'fragrance-mix-1', ad: 'Koku karışımı I', kaynak: 'Parfüm, kozmetik' },
  { kod: 'sesquiterpene-lactone', ad: 'Seskiterpen lakton karışımı', kaynak: 'Kompozit bitkiler (papatya, kasımpatı)' },
  { kod: 'quaternium-15', ad: 'Quaternium-15', kaynak: 'Formaldehit salan koruyucu' },
  { kod: 'mdbgn', ad: 'Metildibromo glutaronitril', kaynak: 'Islak mendil, kozmetik koruyucu' },
  { kod: 'fragrance-mix-2', ad: 'Koku karışımı II', kaynak: 'Parfüm, deodorant' },
  { kod: 'hicc', ad: 'HICC (Lyral)', kaynak: 'Parfüm bileşeni' },
  { kod: 'budesonide', ad: 'Budesonid', kaynak: 'Topikal / inhaler kortikosteroid' },
  { kod: 'tixocortol', ad: 'Tiksokortol-21-pivalat', kaynak: 'Kortikosteroid (A grubu) göstergesi' },
  { kod: 'mci-mi', ad: 'MCI/MI (Kathon CG)', kaynak: 'Şampuan, temizlik ürünü koruyucusu' },
  { kod: 'mi', ad: 'Metilizotiazolinon (MI)', kaynak: 'Islak mendil, boya, kozmetik' },
  { kod: 'textile-dye-mix', ad: 'Tekstil boya karışımı', kaynak: 'Sentetik kumaş boyaları' },
] as const

/** @deprecated Geriye dönük uyumluluk — yeni kod `EUROPEAN_BASELINE` kullanır. */
export const EUROPEAN_BASELINE_STUB: readonly string[] = EUROPEAN_BASELINE.map((a) => a.kod)

export function baselineAlerjenAdi(kod: string): string {
  return EUROPEAN_BASELINE.find((a) => a.kod === kod)?.ad || kod
}
