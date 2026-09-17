/**
 * KD-KAYNAK-KILIDI — the only guideline numbers / years a KD note or chat answer may carry (lib/doktor/kaynakKilidi).
 * Nothing here is new: every entry is copied from a source already verified in the repo —
 *   ACOG: protocols/acog-map.ts (ACOG Combined List of Titles, September 2026) rows + the related documents named in its notes
 *   SB:   protocols/sources.ts (DÖBYR 2026, Yayın No. 1402) and lib/specialties/kadin-dogum.ts (SB DÖB Rehberi 2018)
 *   TJOD: engines/jinekoloji-v2.ts REF_ACIKLAMA (TJOD PKOS 2023, TJOD Endometriozis 2014 — the other TJOD refs carry no year)
 * Do not add a number or year here from memory; add it to its verified source first (tests check the ACOG rows against acog-map).
 *
 * TURKISH_FIRST: for each topic the Turkish source (SB rehberi / TJOD) is named first; ACOG is cited only where no Turkish
 * equivalent exists or as the separate "klinik öneri" column next to the SB "yasal asgari" one.
 */
import type { DogrulanmisKaynak } from '../../../lib/doktor/kaynakKilidi'
import { ACOG_MAP, type AcogDocType } from './acog-map'
import { REF_ACIKLAMA } from '../engines/jinekoloji-v2'

const ACOG_AILE: Record<AcogDocType, string> = {
  practice_bulletin: 'ACOG:PB',
  committee_opinion: 'ACOG:CO',
  clinical_consensus: 'ACOG:CC',
  obstetric_care_consensus: 'ACOG:OCC',
  // PB 226 was replaced by the January 2026 Practice Advisory; acog-map keeps 226 as the PB number.
  practice_advisory: 'ACOG:PB',
}

/** Topic keywords (lower-case, TR + EN) per acog-map topic; the citing answer or note field must contain one. */
export const KD_KONU_ANAHTARLARI: Record<string, string[]> = {
  izlem_sikligi: ['izlem', 'prenatal', 'antenatal', 'doğum öncesi bakım', 'vizit', 'kontrol sıklığı'],
  gdm_ogtt: ['gestasyonel diyabet', 'gdm', 'ogtt', 'glukoz', 'glikoz', 'diyabet'],
  preeclampsia_hypertension: ['preeklampsi', 'pre-eklampsi', 'preeclampsia', 'eklampsi', 'hellp', 'hipertansiyon', 'kan basıncı', 'hypertension', 'tansiyon'],
  rh_anti_d: ['rh negatif', 'rh-negatif', 'rh−', 'rh (d)', 'rh d', 'rhesus', 'anti-d', 'anti d', 'alloimmün', 'alloimmuniz', 'coombs'],
  preterm_pprom_acs_tocolysis: ['preterm', 'erken doğum', 'prematür', 'pprom', 'membran', 'rüptür', 'ekmr', 'latency', 'latens', 'tokoli', 'kortikosteroid', 'antenatal steroid', 'betametazon', 'deksametazon'],
  aneuploidy_screening: ['anöploidi', 'aneuploidy', 'kromozom', 'nipt', 'cfdna', 'hücre dışı dna', 'ikili tarama', 'üçlü tarama', 'down'],
  indicated_delivery_cs_vbac: ['vbac', 'tolac', 'sezaryen', 'cesarean', 'vajinal doğum'],
  gbs: ['gbs', 'grup b', 'group b', 'streptokok'],
  fetal_surveillance_nst_bpp_doppler: ['nst', 'bpp', 'biyofizik', 'doppler', 'fetal izlem', 'fetal iyilik', 'surveillance', 'antepartum'],
  postpartum_care: ['postpartum', 'doğum sonu', 'doğum sonrası', 'lohusa', 'puerperal'],
}

/** Related ACOG documents named in acog-map notes (not rows of their own). Older replaced documents (PB 145) are not citable. */
const ACOG_ILGILI: { aile: string; numara: number; etiket: string; topic: string }[] = [
  { aile: 'ACOG:PB', numara: 203, etiket: 'ACOG PB 203 (Chronic Hypertension in Pregnancy)', topic: 'preeclampsia_hypertension' },
  { aile: 'ACOG:PB', numara: 192, etiket: 'ACOG PB 192 (Management of Alloimmunization During Pregnancy)', topic: 'rh_anti_d' },
  { aile: 'ACOG:PB', numara: 217, etiket: 'ACOG PB 217 (Prelabor Rupture of Membranes)', topic: 'preterm_pprom_acs_tocolysis' },
  { aile: 'ACOG:PB', numara: 234, etiket: 'ACOG PB 234 (Prediction and Prevention of Spontaneous Preterm Birth)', topic: 'preterm_pprom_acs_tocolysis' },
  { aile: 'SMFM:CS', numara: 74, etiket: 'SMFM Consult Series #74 (cfDNA birincil tarama; ACOG Practice Advisory Ocak 2026)', topic: 'aneuploidy_screening' },
  { aile: 'ACOG:CS', numara: 17, etiket: 'ACOG Committee Statement 17 (primer sezaryen azaltma)', topic: 'indicated_delivery_cs_vbac' },
  { aile: 'ACOG:CO', numara: 828, etiket: 'ACOG CO 828 (Indications for Outpatient Antenatal Fetal Surveillance)', topic: 'fetal_surveillance_nst_bpp_doppler' },
  { aile: 'ACOG:CC', numara: 1, etiket: 'ACOG Clinical Consensus 1 (postpartum ağrı)', topic: 'postpartum_care' },
]

const ACOG_KISA: Record<string, string> = { 'ACOG:PB': 'PB', 'ACOG:CO': 'CO', 'ACOG:CC': 'Clinical Consensus', 'ACOG:OCC': 'OCC' }

export const KD_ACOG_ILGILI = ACOG_ILGILI

/**
 * Turkish source preferred over the ACOG document for the same topic (only sources already in protocols/sources.ts).
 * null = no Turkish guideline in the repo for this topic; the model names it generically ("uluslararası kılavuzlar (ör. ACOG)").
 */
export const KD_TR_TERCIH: Record<string, string | null> = {
  izlem_sikligi: 'SB Doğum Öncesi Bakım Yönetim Rehberi (DÖBYR 2026) — 4 izlem yasal asgari',
  gdm_ogtt: 'SB DÖBYR 2026 — 24–28. hafta OGTT penceresi',
  preeclampsia_hypertension: 'SB Riskli Gebelikler Yönetim Rehberi + DÖBYR 2026 (her izlemde TA)',
  rh_anti_d: 'SB DÖBYR 2026 — Rh(−), indirekt Coombs (−) gebede ~28. hafta anti-D',
  preterm_pprom_acs_tocolysis: 'SB Riskli Gebelikler Yönetim Rehberi — preterm / sevk',
  aneuploidy_screening: 'SB DÖBYR 2026 + SUT (ikili P.901.120, üçlü P.904.090)',
  indicated_delivery_cs_vbac: null,
  gbs: null,
  fetal_surveillance_nst_bpp_doppler: 'SB DÖBYR 2026 — izlem NST',
  postpartum_care: 'SB Doğum Sonu Bakım Yönetim Rehberi (taburculuk süreleri, lohusa izlemleri)',
}

export function kdDogrulanmisKaynaklar(): DogrulanmisKaynak[] {
  const acog: DogrulanmisKaynak[] = ACOG_MAP.map((r) => ({
    aile: ACOG_AILE[r.acogDocType],
    numara: r.pbNumber,
    etiket: `ACOG ${ACOG_KISA[ACOG_AILE[r.acogDocType]]} ${r.pbNumber} (${r.title.replace(/\s*\(PB \d+\).*$/, '')})`,
    konu: KD_KONU_ANAHTARLARI[r.topic] || [],
  }))
  const ilgili = ACOG_ILGILI.map((r) => ({ aile: r.aile, numara: r.numara, etiket: r.etiket, konu: KD_KONU_ANAHTARLARI[r.topic] || [] }))
  const dobyr = ['döbyr', 'dobyr', 'doğum öncesi bakım']
  const tr: DogrulanmisKaynak[] = [
    { aile: 'DÖBYR', numara: 2026, etiket: 'SB Doğum Öncesi Bakım Yönetim Rehberi — DÖBYR 2026 (HSGM Yayın No. 1402)', konu: dobyr },
    { aile: 'DÖBYR', numara: 2018, etiket: 'SB Doğum Öncesi Bakım Yönetim Rehberi 2018 (önceki baskı)', konu: dobyr },
    { aile: 'SB-YAYIN', numara: 1402, etiket: 'HSGM Yayın No. 1402 (DÖBYR 2026)', konu: dobyr },
    { aile: 'TJOD', numara: 2023, etiket: REF_ACIKLAMA.TJOD_PCOS23, konu: ['pkos', 'pcos', 'polikistik'] },
    { aile: 'TJOD', numara: 2014, etiket: REF_ACIKLAMA.TJOD_ENDO14, konu: ['endometriozis', 'endometriosis'] },
  ]
  return [...tr, ...acog, ...ilgili]
}

/** Prompt block: Turkish-first source per topic + the verified numbers. Rendered from code so the prompt and the backstop agree. */
export function kdKaynakListesiBlogu(): string {
  const trJine = [REF_ACIKLAMA.TJOD_OK, REF_ACIKLAMA.TJOD_MENORAJI, REF_ACIKLAMA.TJOD_PCOS23, REF_ACIKLAMA.TJOD_ENDO14, REF_ACIKLAMA.TJOD_RM, REF_ACIKLAMA.HSGM_HPV].join('; ')
  const konular = ACOG_MAP.map((r) => {
    const tr = KD_TR_TERCIH[r.topic]
    const ilgili = ACOG_ILGILI.filter((i) => i.topic === r.topic).map((i) => i.etiket.split(' (')[0])
    const acog = [`ACOG ${ACOG_KISA[ACOG_AILE[r.acogDocType]]} ${r.pbNumber}`, ...ilgili].join(', ')
    return `- ${r.topic}: ${tr ? `önce ${tr}; ` : 'Türk rehberi repoda yok; '}uluslararası: ${acog}`
  })
  return [
    '## Doğrulanmış kaynaklar (Kaynak kilidi — yalnız bunlar numara / yılla yazılabilir)',
    ...konular,
    `- jinekoloji (Türk kaynağı adıyla, numarasız): ${trJine}`,
    '- SB yasal taban: DÖBYR 2026 (HSGM Yayın No. 1402), Doğum Sonu Bakım Yönetim Rehberi, Riskli Gebelikler Yönetim Rehberi',
    'Numara yalnız kendi satırının konusu için yazılır; listede satırı olmayan konu (ör. postpartum kanama, ektopik, menopoz) numarasız anılır.',
    'Bu listede olmayan her numara / yıl (ör. başka bir ACOG PB/CO, RCOG Green-top, NICE NG, SMFM Consult Series, TJOD kılavuz yılı) yazılmaz; kaynak adıyla genel anılır.',
  ].join('\n')
}
