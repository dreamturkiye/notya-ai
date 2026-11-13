/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — The United Kingdom: the preterm baby's follow-up table and the early-birth thresholds, each with the
 * source it was read from on 2026-11-13 and HOW it was read. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of the United Kingdom.
 * A rule never states a number its source was not read for: where a source could not be read, the item is "follow your local protocol".
 *
 *   ROP        RCPCH / RCOphth / BAPM, Screening of retinopathy of prematurity (ROP) – clinical guideline, 2022, revised October 2024: the
 *              RCPCH page read for the criteria; the timing read in an NHS trust's guideline that quotes it (NNUH CA4066 v4) — the guideline's
 *              own text was not opened.
 *   HEARING    NHS England, Newborn hearing screening programme (NHSP): care pathways for babies in NICU (GOV.UK, updated 16 December 2024) —
 *              read: audiology at 7 to 9 months where risk factors are present; the page does not list the risk factors, so the item stays
 *              "follow your local protocol".
 *   CERVIX, STEROIDS   NICE quality standard QS135 (Preterm labour and birth) — statements 2, 5 and 6 read; NG25 itself was not opened.
 *              NICE-KAYNAKLI items: numbers of NICE guidance, by the owner's order of 2026-10-10, each on the lawyer's list (./nice-kaynakli.json).
 *   NOT STATED BY THIS TABLE (follow your local protocol): cranial ultrasound, chronic lung disease, RSV, iron, bone health.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { DUZELTME_KAYNAGI, prematurKurucu } from '../_dil/en/prematurKurucu'

type P = NonNullable<EnUlkeGirdisi['araclar']['prematur']>

const { kaynak, kosul: c, zaman, kural, yerel, protokol, erkenDogum } = prematurKurucu('en-GB')

const RCPCH_ROP = kaynak('RCPCH 2022 (2024)', 'Royal College of Paediatrics and Child Health, in collaboration with the Royal College of Ophthalmologists and the British Association of Perinatal Medicine. Screening of retinopathy of prematurity (ROP) – clinical guideline. Published 2022, revised October 2024.', 'ikincil-ozet', 'The criteria were read on the RCPCH page for the guideline; its timing of the first examination was not on that page and was read in an NHS trust\'s own guideline that quotes it (below). The guideline itself was not opened.')
const NNUH_ROP = kaynak('NNUH CA4066 v4', 'Norfolk and Norwich University Hospitals NHS Foundation Trust. Screening and management of retinopathy of prematurity (ROP), CA4066 v4 (a local guideline following the RCPCH and RCOphth guideline of March 2022).', 'ikincil-ozet', 'A hospital\'s local guideline, read for the timing: first examination between 31+0 and 31+6 weeks postmenstrual age or at 4 completed weeks after birth, whichever is later, for babies born before 31 weeks; at 36 weeks postmenstrual age or 4 completed weeks, whichever is earlier, for babies of 31 weeks or more under 1501 g. It is not the national guideline.')
const NHSP = kaynak('NHSP NICU pathway', 'NHS England. Newborn hearing screening programme (NHSP): care pathways for babies in neonatal intensive care units (NICU). GOV.UK, first published 29 October 2020, updated 16 December 2024.', 'birincil-okundu')
const QS135 = kaynak('NICE QS135', 'National Institute for Health and Care Excellence. Preterm labour and birth: quality standard [QS135]. Statements 2, 5 and 6.', 'birincil-okundu', 'Statements 2 (cervical length of 25 mm or less measured between 16+0 and 24+0 weeks, for a woman with an earlier preterm birth or loss), 5 (corticosteroids between 24+0 and 33+6 weeks) and 6 (magnesium sulphate between 24+0 and 29+6 weeks) were read. The guideline NG25 behind them was not opened.')

export const GB_PREMATUR: P = {
  protokol: protokol({
    ulke: 'United Kingdom',
    kapsamKaynagi: 'The product\'s own scope: born before 37 weeks or at 1500 g or less. Each item then applies the criterion of its own source.',
    duzeltmeKaynagi: DUZELTME_KAYNAGI,
    kurallar: {
      rop: kural('rop', {
        aciklama: 'RCPCH 2022 (revised 2024): babies born before 31 weeks, or weighing under 1501 g, are screened; from 2024 babies of 31+0 to 31+6 weeks are to be considered by the baby\'s doctor. First examination (as an NHS trust\'s guideline quotes it): between 31+0 and 31+6 weeks postmenstrual age or at 4 completed weeks after birth, whichever is later, for babies born before 31 weeks; at 36 weeks postmenstrual age or 4 completed weeks, whichever is earlier, for babies of 31 weeks or more. The plan shows the date that follows from those two rules; check it against the guideline.',
        kriter: { herhangiBiri: [[c('gestasyonHafta', '<', 31, 'born before 31 weeks')], [c('dogumKiloGr', '<=', 1500, 'birth weight under 1501 g')], [c('ropSecili', 'dogru', undefined, 'selected by the baby\'s doctor (the guideline asks for 31+0 to 31+6 weeks to be considered)')]] },
        zamanlamalar: [
          zaman({ kod: 'ilk-pma', etiket: 'First examination: 31 weeks postmenstrual age (born at 26 weeks or less)', kosul: [c('gestasyonHafta', '<=', 26, 'born at 26 weeks or less')], bas: { tur: 'pma-hafta', hafta: 31 } }),
          zaman({ kod: 'ilk-4hf', etiket: 'First examination: 4 completed weeks after birth (born at 27 to 32 weeks)', kosul: [c('gestasyonHafta', '>=', 27, 'born at 27 weeks or more'), c('gestasyonHafta', '<=', 32, 'born at 32 weeks or less')], bilinmiyorsa: 'dahil', bas: { tur: 'dogumdan-hafta', hafta: 4 } }),
          zaman({ kod: 'ilk-36', etiket: 'First examination: 36 weeks postmenstrual age (born at 33 weeks or more)', kosul: [c('gestasyonHafta', '>=', 33, 'born at 33 weeks or more')], bas: { tur: 'pma-hafta', hafta: 36 } }),
        ],
        kaynaklar: [RCPCH_ROP, NNUH_ROP],
      }),
      'hearing-9m': yerel('hearing-9m', [NHSP], 'The NHS pathway says a baby with risk factors is referred for audiology at 7 to 9 months, but the page read does not list the risk factors, so no criterion is stated here.'),
    },
  }),
  erkenDogum: erkenDogum({
    ulke: 'United Kingdom',
    // NICE-KAYNAKLI: QS135 statements 2 and 5 — a cervical length of 25 mm or less measured between 16+0 and 24+0 weeks; corticosteroids from 24+0 to 33+6 weeks
    serviks: { pencereBasGun: 16 * 7, pencereSonGun: 24 * 7, kisaMm: 25, kisaDahil: true, progesteron: null, cokKisaMm: null },
    steroid: { yasayabilirlik: 24 * 7, anaBas: 24 * 7, anaSon: 33 * 7 + 6, gecBas: null, gecSon: null, tekrarGun: null },
    kaynaklar: [QS135],
    serviksKaynaklari: [QS135.kisa],
    steroidKaynaklari: [QS135.kisa],
    kapsam: 'Cervical length: NICE QS135 statement 2 names 25 mm or less, measured between 16+0 and 24+0 weeks, for a woman with an earlier preterm birth or loss; the same figure is shown for every woman as a reference, not as NICE\'s statement for her. Steroids: corticosteroids are offered between 24+0 and 33+6 weeks (statement 5); this table states no other window. The standard names no separate progesterone length range and no very short band, so none is shown.',
  }),
}
