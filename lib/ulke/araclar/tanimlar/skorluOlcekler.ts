/**
 * NOTYA-ULKE-ARACLAR-AU-07 — six validated, international, published scored instruments, arithmetic only: IPSS
 * (urology), PHQ-9 and GAD-7 (psychiatry), MIDAS (neurology), and a pain VAS with the Oswestry Disability Index
 * (physiotherapy / rehabilitation medicine). Every one is published, free of a national authority's content and
 * free of a single country's units — the kit holds the arithmetic once, as it does for K10 (./tanimlar.ts, the
 * Australian pack's own tool) and for psa-hizi, hedef-boy and the other kit tools beside them.
 *
 * NO ITEM OF ANY QUESTIONNAIRE IS WORDED HERE (same discipline as K10, ECOG and psa-hizi): every item field is
 * `numarali: true` — the screen shows "Item 1" … "Item N" and the doctor reads the item from the instrument's own
 * authorised form. Only the published SCORING (sums, cut-offs) is kit content. Each tool's published source is its
 * own `kaynak`; no rights-holder notice beyond the citation was needed because no proprietary wording is carried.
 *
 * Stands beside:
 *   ipss    specialties/uroloji/engines/ipss.ts     → skorla
 *   phq9    specialties/psikiyatri/engines/phq9.ts  → skorla
 *   gad7    specialties/psikiyatri/engines/gad7.ts  → skorla
 *   midas   specialties/noroloji/engines/migren.ts  → skorla
 *   vas-agri, odi   specialties/fizik-tedavi/engines/vasOdi.ts → skorlaVas, skorlaOdi
 */
import type { AracTanimi } from '../tipler'
import { BOS_SONUC, puan, sayi, sayiMi } from '../yardimci'

// ───────────────────────── urology: IPSS ─────────────────────────

/**
 * International Prostate Symptom Score (IPSS) — 7 items, each 0–5 (0–35 total) plus a separate quality-of-life
 * item (0–6, not added to the total). Bands are the instrument's own published cut-offs: mild 0–7, moderate 8–19,
 * severe 20–35. A severity score, not a diagnosis of benign prostatic hyperplasia or anything else.
 *
 * Source: Barry MJ, Fowler FJ Jr, O'Leary MP, et al. The American Urological Association symptom index for benign
 * prostatic hyperplasia. J Urol. 1992;148(5):1549-1557 — adopted internationally (WHO consultation) as the IPSS.
 * Stands beside specialties/uroloji/engines/ipss.ts → skorla (same 7 items, same 0–7/8–19/20–35 bands, same
 * separate QoL item).
 */
export const IPSS_MADDELER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'] as const
export const IPSS: AracTanimi = {
  anahtar: 'ipss',
  tur: 'olcek',
  alanlar: [...IPSS_MADDELER.map((k) => puan(k, 0, 5, { numarali: true })), puan('qol', 0, 6, { numarali: true, istege: true })],
  cikti: { sayilar: ['toplam', 'qol'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: 'Barry MJ, Fowler FJ Jr, O\'Leary MP, et al. J Urol. 1992;148(5):1549-1557 (the International Prostate Symptom Score).',
  hesapla: (g) => {
    if (!IPSS_MADDELER.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = IPSS_MADDELER.reduce((t, k) => t + (g[k] as number), 0)
    const bant = toplam <= 7 ? 'hafif' : toplam <= 19 ? 'orta' : 'siddetli'
    const qol = sayiMi(g.qol) ? [{ anahtar: 'qol', deger: g.qol as number, ondalik: 0, enCok: 6 }] : []
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 35 }, ...qol], bant, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── psychiatry: PHQ-9, GAD-7 ─────────────────────────

/**
 * Patient Health Questionnaire-9 (PHQ-9) — 9 items, each 0–3 (0–27 total). Bands are the instrument's own published
 * cut-offs: none/minimal 0–4, mild 5–9, moderate 10–14, moderately severe 15–19, severe 20–27. Item 9 (thoughts of
 * death or self-harm) scoring 1 or more raises a safety flag whatever the total.
 *
 * Source: Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: validity of a brief depression severity measure. J Gen
 * Intern Med. 2001;16(9):606-613. Freely reproducible ("no permission required to reproduce, translate, display or
 * distribute"). Stands beside specialties/psikiyatri/engines/phq9.ts → skorla (same 9 items, same bands, same
 * item-9 safety rule).
 */
export const PHQ9_MADDELER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'] as const
export const PHQ9: AracTanimi = {
  anahtar: 'phq9',
  tur: 'olcek',
  alanlar: PHQ9_MADDELER.map((k) => puan(k, 0, 3, { numarali: true })),
  cikti: { sayilar: ['toplam'], bantlar: ['yok', 'hafif', 'orta', 'orta_siddetli', 'siddetli'], uyarilar: ['madde9_pozitif'], tarihler: [] },
  kaynak: 'Kroenke K, Spitzer RL, Williams JBW. J Gen Intern Med. 2001;16(9):606-613 (PHQ-9).',
  hesapla: (g) => {
    if (!PHQ9_MADDELER.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = PHQ9_MADDELER.reduce((t, k) => t + (g[k] as number), 0)
    const bant = toplam <= 4 ? 'yok' : toplam <= 9 ? 'hafif' : toplam <= 14 ? 'orta' : toplam <= 19 ? 'orta_siddetli' : 'siddetli'
    const madde9 = (g.m9 as number) >= 1
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 27 }], bant, uyarilar: madde9 ? ['madde9_pozitif'] : [], tarihler: [] }
  },
}

/**
 * Generalized Anxiety Disorder-7 (GAD-7) — 7 items, each 0–3 (0–21 total). Bands are the instrument's own published
 * cut-offs: none/minimal 0–4, mild 5–9, moderate 10–14, severe 15–21; 10 or more is the published further-evaluation
 * threshold, not a diagnosis.
 *
 * Source: Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder:
 * the GAD-7. Arch Intern Med. 2006;166(10):1092-1097. Freely reproducible, same notice as the PHQ-9. Stands beside
 * specialties/psikiyatri/engines/gad7.ts → skorla (same 7 items, same bands, same threshold).
 */
export const GAD7_MADDELER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'] as const
export const GAD7_ESIK = 10
export const GAD7: AracTanimi = {
  anahtar: 'gad7',
  tur: 'olcek',
  alanlar: GAD7_MADDELER.map((k) => puan(k, 0, 3, { numarali: true })),
  cikti: { sayilar: ['toplam'], bantlar: ['yok', 'hafif', 'orta', 'siddetli'], uyarilar: ['esik_ustu'], tarihler: [] },
  kaynak: 'Spitzer RL, Kroenke K, Williams JBW, Lowe B. Arch Intern Med. 2006;166(10):1092-1097 (GAD-7).',
  hesapla: (g) => {
    if (!GAD7_MADDELER.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = GAD7_MADDELER.reduce((t, k) => t + (g[k] as number), 0)
    const bant = toplam <= 4 ? 'yok' : toplam <= 9 ? 'hafif' : toplam <= 14 ? 'orta' : 'siddetli'
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 21 }], bant, uyarilar: toplam >= GAD7_ESIK ? ['esik_ustu'] : [], tarihler: [] }
  },
}

// ───────────────────────── neurology: MIDAS ─────────────────────────

/**
 * Migraine Disability Assessment (MIDAS) — 5 items, each a day-count over the last 3 months (0–90), summed (0–90
 * total, clinically capped at the sum of the 5 items which cannot together exceed roughly a quarter's days; the
 * tool itself does not cap the sum further than each item's own 0–90 range). Bands are the instrument's own
 * published cut-offs: minimal 0–5, mild 6–10, moderate 11–20, severe 21 or more.
 *
 * Source: Stewart WF, Lipton RB, Dowson AJ, Sawyer J. Development and testing of the Migraine Disability Assessment
 * (MIDAS) Questionnaire. Neurology. 2001;56(6 Suppl 1):S20-28. The scoring (sum of 5 items, published bands) is
 * cited in open literature; no item wording is reproduced here. Stands beside
 * specialties/noroloji/engines/migren.ts → skorla (same 5 items, same 0–5/6–10/11–20/21+ bands).
 */
export const MIDAS_MADDELER = ['m1', 'm2', 'm3', 'm4', 'm5'] as const
export const MIDAS: AracTanimi = {
  anahtar: 'midas',
  tur: 'olcek',
  alanlar: MIDAS_MADDELER.map((k) => sayi(k, 0, 90, { tam: true, numarali: true })),
  cikti: { sayilar: ['toplam'], bantlar: ['minimal', 'hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: 'Stewart WF, Lipton RB, Dowson AJ, Sawyer J. Neurology. 2001;56(6 Suppl 1):S20-28 (MIDAS).',
  hesapla: (g) => {
    if (!MIDAS_MADDELER.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = MIDAS_MADDELER.reduce((t, k) => t + (g[k] as number), 0)
    const bant = toplam <= 5 ? 'minimal' : toplam <= 10 ? 'hafif' : toplam <= 20 ? 'orta' : 'siddetli'
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0 }], bant, uyarilar: [], tarihler: [] }
  },
}

// ───────────────────────── physiotherapy / rehabilitation medicine: pain VAS, ODI ─────────────────────────

/** A plain 0–10 pain visual analogue scale: not a published form's numbered item, so it is worded by the pack. */
export const VAS_AGRI: AracTanimi = {
  anahtar: 'vas-agri',
  tur: 'hesap',
  alanlar: [puan('deger', 0, 10)],
  cikti: { sayilar: ['deger'], bantlar: ['hafif', 'orta', 'siddetli'], uyarilar: [], tarihler: [] },
  kaynak: null,
  hesapla: (g) => {
    if (!sayiMi(g.deger)) return BOS_SONUC
    const deger = g.deger as number
    const bant = deger <= 3 ? 'hafif' : deger <= 6 ? 'orta' : 'siddetli'
    return { tamam: true, sayilar: [{ anahtar: 'deger', deger, ondalik: 0, enCok: 10 }], bant, uyarilar: [], tarihler: [] }
  },
}

/**
 * Oswestry Disability Index (ODI) — 10 items, each 0–5 (0–50 total, shown as a percentage of 50). Bands are the
 * instrument's own published cut-offs: minimal 0–20%, moderate 21–40%, severe 41–60%, crippling 61–80%, bed-bound
 * or exaggerating 81–100%.
 *
 * Source: Fairbank JCT, Pynsent PB. The Oswestry Disability Index. Spine. 2000;25(22):2940-2952. Use in clinical
 * practice is freely given by the original author; no item wording is reproduced here. Stands beside
 * specialties/fizik-tedavi/engines/vasOdi.ts → skorlaOdi (same 10 items, same percentage, same five bands).
 */
export const ODI_MADDELER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'] as const
export const ODI: AracTanimi = {
  anahtar: 'odi',
  tur: 'olcek',
  alanlar: ODI_MADDELER.map((k) => puan(k, 0, 5, { numarali: true })),
  cikti: { sayilar: ['toplam', 'yuzde'], bantlar: ['minimal', 'orta', 'siddetli', 'cok_siddetli', 'yataga_bagli'], uyarilar: [], tarihler: [] },
  kaynak: 'Fairbank JCT, Pynsent PB. Spine. 2000;25(22):2940-2952 (the Oswestry Disability Index).',
  hesapla: (g) => {
    if (!ODI_MADDELER.every((k) => sayiMi(g[k]))) return BOS_SONUC
    const toplam = ODI_MADDELER.reduce((t, k) => t + (g[k] as number), 0)
    const yuzde = Math.round((toplam / 50) * 100)
    const bant = yuzde <= 20 ? 'minimal' : yuzde <= 40 ? 'orta' : yuzde <= 60 ? 'siddetli' : yuzde <= 80 ? 'cok_siddetli' : 'yataga_bagli'
    return { tamam: true, sayilar: [{ anahtar: 'toplam', deger: toplam, ondalik: 0, enCok: 50 }, { anahtar: 'yuzde', deger: yuzde, ondalik: 0, enCok: 100, birim: '%' }], bant, uyarilar: [], tarihler: [] }
  },
}

export const SKORLU_OLCEKLER: readonly AracTanimi[] = [IPSS, PHQ9, GAD7, MIDAS, VAS_AGRI, ODI]
