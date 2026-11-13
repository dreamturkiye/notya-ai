/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — Canada: the preterm baby's follow-up table and the early-birth thresholds, each with the source it
 * was read from on 2026-11-13 and HOW it was read. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of Canada. A rule never states a number
 * its source was not read for: where a source could not be read, the item is "follow your local protocol".
 *
 *   ROP        Canadian Paediatric Society, Fetus and Newborn Committee: Retinopathy of prematurity: Strategies to optimize screening and
 *              management (position statement posted 23 October 2026; updates Jefferies 2016) — the statement read (Recommendation 2, Table 2).
 *   STEROIDS   SOGC Clinical Practice Guideline No. 364, Antenatal corticosteroid therapy for improving neonatal outcomes (JOGC, 2018) —
 *              read through its abstract page (the benefit for birth between 24+0 and 34+6 weeks); the guideline text was not opened.
 *   NOT STATED BY THIS TABLE (follow your local protocol): cranial ultrasound, hearing, chronic lung disease, RSV, iron, bone health and
 *              the cervical-length thresholds (no Canadian source was read for them).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { DUZELTME_KAYNAGI, prematurKurucu } from '../_dil/en/prematurKurucu'

type P = NonNullable<EnUlkeGirdisi['araclar']['prematur']>

const { kaynak, kosul: c, zaman, kural, protokol, erkenDogum } = prematurKurucu('en-CA')

const CPS_ROP = kaynak('CPS 2026', 'Altit G, Beltempo M, Lamer P, Najm-Tehrani N; Canadian Paediatric Society, Fetus and Newborn Committee. Retinopathy of prematurity: Strategies to optimize screening and management. Canadian Paediatric Society position statement, posted 23 October 2026 (an update of Jefferies AL, Paediatr Child Health 2016;21(2):101-108).', 'birincil-okundu')
const SOGC_STEROID = kaynak('SOGC No. 364', 'Skoll A, Boutin A, Bujold E, et al. No. 364 – Antenatal corticosteroid therapy for improving neonatal outcomes. J Obstet Gynaecol Can 2018 (September).', 'ikincil-ozet', 'Read on the abstract page only: "significantly reduces perinatal morbidity/mortality associated with preterm birth between 24+0 and 34+6 weeks gestation" and "after 34+6 weeks gestation, the adverse effects may outweigh the benefits". The recommendations themselves were not opened.')

export const CA_PREMATUR: P = {
  protokol: protokol({
    ulke: 'Canada',
    kapsamKaynagi: 'The product\'s own scope: born before 37 weeks or at 1500 g or less. Each item then applies the criterion of its own source.',
    duzeltmeKaynagi: DUZELTME_KAYNAGI,
    kurallar: {
      rop: kural('rop', {
        aciklama: 'CPS 2026 (Recommendation 2, Table 2): screen infants with a birth weight under 1200 g, whatever the gestation, and infants born before 30+0 weeks, whatever the weight. The first examination is at 31 weeks postmenstrual age for babies born at 22 to 27 weeks, and at 4 weeks after birth from 28 weeks (the table gives 32, 33 and 34 weeks or more postmenstrual age for 28, 29 and 30 weeks or more). The statement also advises booking the first screen on admission and/or at 4 weeks of age.',
        kriter: { herhangiBiri: [[c('gestasyonHafta', '<', 30, 'born before 30 weeks')], [c('dogumKiloGr', '<', 1200, 'birth weight under 1200 g')]] },
        zamanlamalar: [
          zaman({ kod: 'ilk-pma', etiket: 'First examination: 31 weeks postmenstrual age (born at 27 weeks or less)', kosul: [c('gestasyonHafta', '<=', 27, 'born at 27 weeks or less')], bas: { tur: 'pma-hafta', hafta: 31 } }),
          zaman({ kod: 'ilk-4hf', etiket: 'First examination: 4 weeks after birth (born at 28 weeks or more)', kosul: [c('gestasyonHafta', '>=', 28, 'born at 28 weeks or more')], bilinmiyorsa: 'dahil', bas: { tur: 'dogumdan-hafta', hafta: 4 } }),
        ],
        kaynaklar: [CPS_ROP],
      }),
    },
  }),
  erkenDogum: erkenDogum({
    ulke: 'Canada',
    serviks: null,
    steroid: { yasayabilirlik: 24 * 7, anaBas: 24 * 7, anaSon: 34 * 7 + 6, gecBas: null, gecSon: null, tekrarGun: null },
    kaynaklar: [SOGC_STEROID],
    serviksKaynaklari: [],
    steroidKaynaklari: [SOGC_STEROID.kisa],
    kapsam: 'Steroids: the window of the abstract read, 24+0 to 34+6 weeks (SOGC No. 364); a gestation past it is shown as outside the window the source states. No Canadian source was read for the cervical-length thresholds, the repeat course or the periviable weeks, so none is shown: follow your local protocol.',
  }),
}
