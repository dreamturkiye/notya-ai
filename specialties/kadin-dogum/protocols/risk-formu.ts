/**
 * DÖBYR Gebelikte Risk Değerlendirme Formu — tickable catalog.
 * Cite yasal_taban_sb (DÖBYR 2026 / Riskli Gebelikler). Do not copy the official form layout.
 * Ticks drive risk_class; high-risk ticks also feed sevk-perinatoloji.
 */
import type { KadinDogumPayload } from '../schema'

export type RiskSinifi = KadinDogumPayload['risk_class']
export type RiskMaddeSinif = 'orta' | 'yuksek'

export type RiskMadde = {
  id: string
  etiket: string
  sinif: RiskMaddeSinif
  sevk?: boolean
}

/** Public DÖBYR / Riskli Gebelikler categories used in private-practice KD. */
export const DOBYR_RISK_MADDELERI: RiskMadde[] = [
  { id: 'yas_uc', etiket: 'Anne yaşı <18 veya ≥40', sinif: 'orta' },
  { id: 'ileri_yas', etiket: 'Anne yaşı ≥35', sinif: 'orta' },
  { id: 'bmi_yuksek', etiket: 'Gebelik öncesi VKİ ≥30', sinif: 'orta' },
  { id: 'sigara', etiket: 'Sigara / madde kullanımı', sinif: 'orta' },
  { id: 'onceki_cs', etiket: 'Önceki sezaryen', sinif: 'orta' },
  { id: 'tekrarlayan_abortus', etiket: 'Tekrarlayan gebelik kaybı (≥3)', sinif: 'orta' },
  { id: 'anemi', etiket: 'Anemi (Hb 7–11 g/dL)', sinif: 'orta' },
  { id: 'tiroid', etiket: 'Tiroid hastalığı', sinif: 'orta' },
  { id: 'olu_dogum', etiket: 'Önceki ölü doğum', sinif: 'yuksek', sevk: true },
  { id: 'onceki_pe', etiket: 'Önceki preeklampsi / eklampsi', sinif: 'yuksek', sevk: true },
  { id: 'kronik_ht', etiket: 'Kronik hipertansiyon', sinif: 'yuksek', sevk: true },
  { id: 'pregestasyonel_dm', etiket: 'Pregestasyonel diyabet', sinif: 'yuksek', sevk: true },
  { id: 'kalp', etiket: 'Kalp hastalığı', sinif: 'yuksek', sevk: true },
  { id: 'bobrek', etiket: 'Böbrek hastalığı', sinif: 'yuksek', sevk: true },
  { id: 'cogul', etiket: 'Çoğul gebelik', sinif: 'yuksek', sevk: true },
  { id: 'rh_izo', etiket: 'Rh izoimmünizasyon', sinif: 'yuksek', sevk: true },
  { id: 'previa', etiket: 'Plasenta previa / akreta şüphesi', sinif: 'yuksek', sevk: true },
  { id: 'iugr_oykusu', etiket: 'Önceki IUGR / fetal büyüme kısıtlılığı', sinif: 'yuksek', sevk: true },
  { id: 'preterm_oykusu', etiket: 'Tekrarlayan preterm doğum öyküsü', sinif: 'yuksek', sevk: true },
  { id: 'ciddi_anemi', etiket: 'Ciddi anemi (Hb <7 g/dL)', sinif: 'yuksek', sevk: true },
  { id: 'serviks_kisa', etiket: 'Kısa serviks / servikal yetmezlik', sinif: 'yuksek', sevk: true },
  { id: 'anomali', etiket: 'Fetal anomali (18–22. hafta tarama)', sinif: 'yuksek', sevk: true },
]

export type RiskFormuState = {
  maddeler: string[]
  not?: string
}

export function riskClassFromForm(maddeler: readonly string[]): RiskSinifi {
  const set = new Set(maddeler)
  const hit = DOBYR_RISK_MADDELERI.filter((m) => set.has(m.id))
  if (hit.some((m) => m.sinif === 'yuksek')) return 'yuksek'
  if (hit.some((m) => m.sinif === 'orta')) return 'orta'
  return 'dusuk'
}

export function sevkFlagsFromRiskForm(maddeler: readonly string[]) {
  const set = new Set(maddeler)
  return {
    pe_severe: set.has('onceki_pe') || set.has('kronik_ht'),
    previa: set.has('previa'),
    accreta: set.has('previa'),
    insulin_gdm_poor_control: set.has('pregestasyonel_dm'),
    cervix_short: set.has('serviks_kisa'),
    anomaly_18_22: set.has('anomali'),
    stillbirth_history: set.has('olu_dogum'),
    efw_below_10th: set.has('iugr_oykusu'),
  }
}
