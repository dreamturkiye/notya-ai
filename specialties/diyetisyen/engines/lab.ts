/**
 * BRANS-PAKETI (diyetisyen) — lab follow-up panel: PHYSICIAN-ORDERED results (lab_satirlar, approved rows of this
 * doctor's patient) drawn as series across visits. Numbers and dates only — no interpretation, no target, no flag colour.
 *
 * HOMA-IR is deliberately NOT computed or shown. TEMD Obezite Tanı ve Tedavi Kılavuzu 2024 § 5.6 (laboratuvar):
 * "İnsülin ve İnsülin Direnci ölçümünün tanı, tedavi planı ve takip açısından yararı yoktur." A derived index would
 * contradict the Turkish source (CLAUDE.md: on conflict the Turkish source wins). A fasting insulin value the physician
 * did order is shown as recorded, like any other result, with the same note that evaluation is the physician's.
 */
import { labAnahtariBul, labSerileriPanel, type LabSatiri, type LabSerisi } from '@/lib/portal/labSerisi'

export type LabAnahtari = 'glukoz' | 'hba1c' | 'insulin' | 'tsh' | 'total-kolesterol' | 'ldl' | 'hdl' | 'trigliserid'

export const LAB_PANELI: ReadonlyArray<{ anahtar: LabAnahtari; ad: string; desen: RegExp }> = [
  { anahtar: 'glukoz', ad: 'Açlık glukozu', desen: /^(a[cç]l[iı]k\s*)?(kan\s*)?(glukoz\w*|glikoz\w*|glucose|glu\b|ak[sş]\b)(?!.*(tokluk|ogtt|120|60))/i },
  { anahtar: 'hba1c', ad: 'HbA1c', desen: /hb\s*a1c|a1c|glike\s*hemoglobin|glikozile/i },
  { anahtar: 'insulin', ad: 'İnsülin (açlık)', desen: /^(a[cç]l[iıİ]k\s*)?[iİı]ns[uü]lin\b(?!.*(anti|antikor))/i },
  { anahtar: 'tsh', ad: 'TSH', desen: /^tsh\b|tiroid\s*stim[uü]le/i },
  { anahtar: 'total-kolesterol', ad: 'Total kolesterol', desen: /^(total\s*)?kolesterol(\s*total)?$|^cholesterol|^t\.?\s*kol/i },
  { anahtar: 'ldl', ad: 'LDL kolesterol', desen: /\bldl/i },
  { anahtar: 'hdl', ad: 'HDL kolesterol', desen: /\bhdl/i },
  { anahtar: 'trigliserid', ad: 'Trigliserid', desen: /trigliserid|triglycerid|^tg\b/i },
]

export const HOMA_IR_NOTU = 'HOMA-IR hesaplanmaz: TEMD 2024, insülin ve insülin direnci ölçümünün tanı, tedavi ve izlemde yararı olmadığını belirtir.'
export const LAB_NOTU = 'Hekimin istediği sonuçlar, kayıt tarihine göre. Değerlendirme ve hedef hekimdedir.'

export type { LabSatiri, LabSerisi } from '@/lib/portal/labSerisi'

/** LDL / HDL / HbA1c before total cholesterol and glucose (names overlap loosely). */
const ONCELIK: readonly LabAnahtari[] = ['hba1c', 'ldl', 'hdl', 'trigliserid', 'tsh', 'insulin', 'glukoz', 'total-kolesterol']

export function labAnahtari(s: Pick<LabSatiri, 'canonical_key' | 'raw_name'>): LabAnahtari | null {
  return labAnahtariBul(s, LAB_PANELI, ONCELIK) as LabAnahtari | null
}

/** Rows (newest first, as read) → one series per diyetisyen panel analyte. */
export function labSerileri(satirlar: readonly LabSatiri[]): LabSerisi[] {
  return labSerileriPanel(satirlar, LAB_PANELI, ONCELIK)
}
