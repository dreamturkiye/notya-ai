/**
 * BRANS-PAKETI (longevity) — "Değerlerim": the physician-ordered biomarkers shown to the patient over time. Numbers and
 * dates only — no interpretation, no "biological age", no target colour (the physician evaluates). The analyte list
 * mirrors the longevity request list the physician already uses (lib/doktor/bransIstemleri.ts).
 * HOMA-IR is not shown (TEMD Obezite 2024 § 5.6 — see specialties/diyetisyen/engines/lab.ts).
 */
import { labSerileriPanel, type LabPanelOgesi, type LabSatiri, type LabSerisi } from '@/lib/portal/labSerisi'

export const LONGEVITY_PANELI: readonly LabPanelOgesi[] = [
  { anahtar: 'hba1c', ad: 'HbA1c', desen: /hb\s*a1c|a1c|glike\s*hemoglobin/i },
  { anahtar: 'glukoz', ad: 'Açlık glukozu', desen: /^(a[cç]l[iı]k\s*)?(kan\s*)?(glukoz\w*|glikoz\w*|glucose|glu\b)(?!.*(tokluk|ogtt|120|60))/i },
  { anahtar: 'ldl', ad: 'LDL kolesterol', desen: /\bldl/i },
  { anahtar: 'hdl', ad: 'HDL kolesterol', desen: /\bhdl/i },
  { anahtar: 'trigliserid', ad: 'Trigliserid', desen: /trigliserid|triglycerid|^tg\b/i },
  { anahtar: 'apob', ad: 'Apolipoprotein B', desen: /apo\s*-?\s*b\b|apolipoprotein\s*b/i },
  { anahtar: 'lpa', ad: 'Lipoprotein (a)', desen: /lp\s*\(?\s*a\s*\)?|lipoprotein\s*\(?a/i },
  { anahtar: 'hscrp', ad: 'hs-CRP', desen: /hs\s*-?\s*crp|y[uü]ksek\s*duyarl/i },
  { anahtar: 'vitd', ad: '25-OH Vitamin D', desen: /25\s*-?\s*oh|vitamin\s*d|d\s*vitamini/i },
  { anahtar: 'b12', ad: 'Vitamin B12', desen: /b\s*-?\s*12|kobalamin/i },
  { anahtar: 'ferritin', ad: 'Ferritin', desen: /ferritin/i },
]
const ONCELIK = ['hba1c', 'ldl', 'hdl', 'apob', 'lpa', 'hscrp', 'trigliserid', 'vitd', 'b12', 'ferritin', 'glukoz'] as const

export function degerlerim(satirlar: readonly LabSatiri[]): LabSerisi[] {
  return labSerileriPanel(satirlar, LONGEVITY_PANELI, ONCELIK)
}
