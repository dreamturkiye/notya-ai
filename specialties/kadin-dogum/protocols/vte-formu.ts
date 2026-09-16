/**
 * DÖBYR gebelik VTE risk formu — tickables + score.
 * Score ≥3 → existing evaluateVTE tromboprofilaksi hint (enoxaparin note).
 * Do not invent IU / mg doses that contradict protocol stubs.
 */
import { evaluateVTE } from './risk-pe-gdm-rh'

export type VteMadde = {
  id: string
  etiket: string
  puan: number
}

export const DOBYR_VTE_MADDELERI: VteMadde[] = [
  { id: 'onceki_vte', etiket: 'Önceki VTE', puan: 3 },
  { id: 'yuksek_trombofili', etiket: 'Yüksek riskli trombofili', puan: 3 },
  { id: 'komorbidite', etiket: 'Tıbbi komorbidite (kalp, SLE, kanser, inflamatuvar)', puan: 3 },
  { id: 'bmi40', etiket: 'VKİ ≥40', puan: 2 },
  { id: 'cs', etiket: 'Sezaryen (bu gebelik / planlanan)', puan: 2 },
  { id: 'dusuk_trombofili', etiket: 'Düşük riskli trombofili', puan: 1 },
  { id: 'yas35', etiket: 'Anne yaşı >35', puan: 1 },
  { id: 'bmi30', etiket: 'VKİ ≥30', puan: 1 },
  { id: 'parite3', etiket: 'Parite ≥3', puan: 1 },
  { id: 'sigara', etiket: 'Sigara', puan: 1 },
  { id: 'cogul', etiket: 'Çoğul gebelik', puan: 1 },
  { id: 'ivf', etiket: 'IVF / yardımcı üreme', puan: 1 },
  { id: 'varis', etiket: 'Belirgin varis', puan: 1 },
  { id: 'immobilite', etiket: 'İmmobilite', puan: 1 },
  { id: 'pph', etiket: 'Postpartum kanama öyküsü / riski', puan: 1 },
  { id: 'preterm', etiket: 'Preterm doğum öyküsü', puan: 1 },
  { id: 'olu_dogum', etiket: 'Ölü doğum öyküsü', puan: 1 },
  { id: 'pe', etiket: 'Preeklampsi', puan: 1 },
  { id: 'enfeksiyon', etiket: 'Sistemik enfeksiyon', puan: 1 },
]

export type VteFormuState = {
  maddeler: string[]
  puan?: number
  not?: string
}

export function vteScoreFromForm(maddeler: readonly string[]): number {
  const set = new Set(maddeler)
  // BMI ≥40 already includes ≥30 — do not double-count.
  return DOBYR_VTE_MADDELERI.reduce((sum, m) => {
    if (!set.has(m.id)) return sum
    if (m.id === 'bmi30' && set.has('bmi40')) return sum
    return sum + m.puan
  }, 0)
}

export function vteHint(maddeler: readonly string[]): { puan: number; triage: string; next: string[] } {
  const puan = vteScoreFromForm(maddeler)
  const ev = evaluateVTE({ score: puan })
  return { puan, triage: ev.triage, next: ev.next }
}
