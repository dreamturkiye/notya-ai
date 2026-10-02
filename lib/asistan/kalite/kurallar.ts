/**
 * NOTYA-KALITE-STANDART-01 — the rule catalogue of docs/AYSE-KALITE-STANDARDI.md.
 *
 * One row per rule of the standard, with the mechanical checks that cite it (lib/asistan/kalite/denetimler.ts) and
 * what those checks cannot see. Rule ids are stable: tests, reports and the baseline cite them. A unit test keeps this
 * list, the standard's text and the checks in step.
 */

export type KuralId =
  | 'Q-01' | 'Q-02' | 'Q-03' | 'Q-04' | 'Q-05' | 'Q-06' | 'Q-07' | 'Q-08' | 'Q-09' | 'Q-10' | 'Q-11'
  | 'Q-20' | 'Q-21'
  | 'Q-30' | 'Q-31' | 'Q-32' | 'Q-33' | 'Q-34'
  | 'Q-40' | 'Q-41'

export type DenetimAdi =
  | 'cevap-once' | 'tek-olcum' | 'dayanak-yorum' | 'yapilmadi' | 'plan-uygulandi' | 'tam-tarih' | 'takip-bugun' | 'takip-gecti'
  | 'hasta-adi' | 'yabanci-hasta' | 'persentil-tarih' | 'mgkg-kilo' | 'dikkat-sonda'
  | 'yasak-ifade' | 'bos-savusturma' | 'ham-artik' | 'turkce'
  | 'uzunluk' | 'seri-tablo' | 'bolumler'
  | 'ses-uzunluk' | 'ses-anlati' | 'ses-tarih' | 'ses-bicim' | 'ses-birim' | 'ses-kimlik' | 'sessiz-degil' | 'ses-kisaltma'

export interface KaliteKurali {
  id: KuralId
  /** A universal, B text, C voice, D process. */
  bolum: 'A' | 'B' | 'C' | 'D'
  ad: string
  /** Checks of the rubric that give a verdict under this rule; empty = not checked by the rubric. */
  denetimler: DenetimAdi[]
  /** What the rubric cannot see — the live pass or a human reads it. */
  olculemez: string
}

export const KALITE_KURALLARI: readonly KaliteKurali[] = [
  { id: 'Q-01', bolum: 'A', ad: 'Answer first', denetimler: ['cevap-once'], olculemez: 'Whether the first sentence is the right answer.' },
  { id: 'Q-02', bolum: 'A', ad: 'Specific', denetimler: ['tek-olcum'], olculemez: 'Specificity of questions other than a single measurement; clinical weight of the added safety finding.' },
  { id: 'Q-03', bolum: 'A', ad: 'Source versus interpretation', denetimler: ['dayanak-yorum'], olculemez: 'Interpretation inside the record lines; a contradiction the answer missed (corpus entries require both values where the fixture has one).' },
  { id: 'Q-04', bolum: 'A', ad: 'Planned is not given', denetimler: ['yapilmadi', 'plan-uygulandi'], olculemez: 'States the entry\'s evidence does not list.' },
  { id: 'Q-05', bolum: 'A', ad: 'Never invent', denetimler: [], olculemez: 'Any invented value: only corpus assertions on fixture values and a human reader see it.' },
  { id: 'Q-06', bolum: 'A', ad: 'Dates', denetimler: ['tam-tarih', 'takip-bugun', 'takip-gecti'], olculemez: 'Whether the stated day is the right one on a real chart (visit day = note day is a corpus entry on the late-entry fixture).' },
  { id: 'Q-07', bolum: 'A', ad: 'Right patient', denetimler: ['hasta-adi', 'yabanci-hasta'], olculemez: 'Address versus patient is a bound-patient assertion of the corpus, not a rubric check.' },
  { id: 'Q-08', bolum: 'A', ad: 'Paediatrics', denetimler: ['persentil-tarih', 'mgkg-kilo'], olculemez: 'Whether the percentile is the growth engine\'s and the weight is the one at the prescription date.' },
  { id: 'Q-09', bolum: 'A', ad: 'Safety first, without alarm', denetimler: ['dikkat-sonda'], olculemez: 'Whether what should be flagged is flagged, and whether trivia is flagged.' },
  { id: 'Q-10', bolum: 'A', ad: 'Privacy', denetimler: [], olculemez: 'Model payloads are checked by lib/asistan/alanSizinti.test.ts; the spoken side by ses-kimlik (Q-31).' },
  { id: 'Q-11', bolum: 'A', ad: 'Tone', denetimler: ['yasak-ifade', 'bos-savusturma', 'ham-artik', 'turkce'], olculemez: 'Tone and readability.' },
  { id: 'Q-20', bolum: 'B', ad: 'Length', denetimler: ['uzunluk', 'seri-tablo'], olculemez: 'Whether the supporting lines are the important ones.' },
  { id: 'Q-21', bolum: 'B', ad: 'Structure by question', denetimler: ['bolumler'], olculemez: 'Whether each part says the right thing; record-dependent parts of the snapshot.' },
  { id: 'Q-30', bolum: 'C', ad: 'The doctor must hear the answer', denetimler: ['ses-uzunluk', 'ses-anlati'], olculemez: 'Real duration; whether the condensed narrative chose the right facts; "devam et" with real audio.' },
  { id: 'Q-31', bolum: 'C', ad: 'Speakable', denetimler: ['ses-tarih', 'ses-bicim', 'ses-birim', 'ses-kimlik'], olculemez: 'Pronunciation — judged by ear.' },
  { id: 'Q-32', bolum: 'C', ad: 'Never silent', denetimler: ['sessiz-degil'], olculemez: 'Silence caused by audio, ASR, TTS or the browser.' },
  { id: 'Q-33', bolum: 'C', ad: 'Latency budgets', denetimler: [], olculemez: 'Time to first sound: live spot check. A live corpus run reports harness turn times against the budgets as an indication only.' },
  { id: 'Q-34', bolum: 'C', ad: 'Medical speech', denetimler: ['ses-kisaltma'], olculemez: 'Whether a reading is the one a clinician would use — judged by ear, by Dr. Gökhan. Abbreviations that are not in the dictionary: npm run denetim:ses-kisaltma lists them.' },
  { id: 'Q-40', bolum: 'D', ad: 'The corpus only grows', denetimler: [], olculemez: 'Checked by the baseline comparison (fewer graded turns than the baseline fails), not per answer.' },
  { id: 'Q-41', bolum: 'D', ad: 'Release gate', denetimler: [], olculemez: 'Checked by npm run denetim:kalite-karsilastir, not per answer.' },
]

/** Rule a check reports under. */
export const DENETIM_KURALI: Readonly<Record<DenetimAdi, KuralId>> = Object.fromEntries(
  KALITE_KURALLARI.flatMap((k) => k.denetimler.map((d) => [d, k.id] as const)),
) as Record<DenetimAdi, KuralId>

/** Q-33 budgets, milliseconds to first sound. */
export const GECIKME_BUTCESI = { hizliP50: 2_000, modelP50: 8_000, modelP95: 15_000 } as const
