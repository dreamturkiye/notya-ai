/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — The United States: the preterm baby's follow-up table and the early-birth thresholds, each with
 * the source it was read from on 2026-11-13 and HOW it was read. MACHINE-WRITTEN AND UNVERIFIED BY A CLINICIAN of the United States.
 * A rule never states a number its source was not read for: where a source could not be read, the item is "follow your local protocol".
 *
 *   ROP        Fierson WM et al., AAP / AAO / AAPOS / AACO, Pediatrics 2018;142(6):e20183061 — the guideline text read (criteria, Table 1).
 *   CRANIAL US Ment LR et al., AAN / CNS practice parameter, Neurology 2002;58(12):1726-1738 — the abstract read.
 *   HEARING    Joint Committee on Infant Hearing, Year 2019 Position Statement, Table 1 — read in a reproduction of the table hosted by a
 *              state health department (Utah), not in the position statement itself.
 *   RSV        CDC, 3 August 2023 (nirsevimab) — the CDC press release read; the season is not known to the plan.
 *   IRON       AAP clinical report (Baker, Greer), Pediatrics 2010, as summarised in Am Fam Physician 2011;83(5):624 — the summary read.
 *   CERVIX     ACOG, Prediction and Prevention of Spontaneous Preterm Birth, Obstet Gynecol 2021;138(2):e65-e90 — read in the AAFP's summary.
 *   STEROIDS   ACOG Committee Opinion No. 677 (2016) as quoted in OBG Management, with its late-preterm recommendation; the later
 *              Committee Opinion No. 713 (2017) was not opened.
 *   NOT STATED BY THIS TABLE (follow your local protocol): chronic lung disease, bone health.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { DUZELTME_KAYNAGI, prematurKurucu } from '../_dil/en/prematurKurucu'

type P = NonNullable<EnUlkeGirdisi['araclar']['prematur']>

const { m, kaynak, kosul: c, zaman, kural, yerel, protokol, erkenDogum } = prematurKurucu('en-US')

const AAP_ROP = kaynak('AAP/AAO 2018', 'Fierson WM; American Academy of Pediatrics Section on Ophthalmology; American Academy of Ophthalmology; American Association for Pediatric Ophthalmology and Strabismus; American Association of Certified Orthoptists. Screening Examination of Premature Infants for Retinopathy of Prematurity. Pediatrics 2018;142(6):e20183061. doi:10.1542/peds.2018-3061', 'birincil-okundu')
const AAN_CRANIAL = kaynak('AAN/CNS 2002', 'Ment LR, Bada HS, Barnes P, et al. Practice parameter: neuroimaging of the neonate. Report of the Quality Standards Subcommittee of the American Academy of Neurology and the Practice Committee of the Child Neurology Society. Neurology 2002;58(12):1726-1738. doi:10.1212/WNL.58.12.1726', 'ikincil-ozet', 'Only the abstract of the practice parameter was read. The practice parameter is old (2002): check it against your unit\'s current practice.')
const JCIH = kaynak('JCIH 2019', 'Joint Committee on Infant Hearing. Year 2019 Position Statement: Principles and Guidelines for Early Hearing Detection and Intervention Programs. Journal of Early Hearing Detection and Intervention 2019;4(2), Table 1: Risk Factors for Early Childhood Hearing Loss, Guidelines for Infants who Pass the Newborn Hearing Screen.', 'ikincil-ozet', 'Table 1 was read in a copy hosted by a state health department; the position statement itself was not opened.')
const CDC_RSV = kaynak('CDC 2023', 'Centers for Disease Control and Prevention. CDC Recommends a Powerful New Tool to Protect Infants from the Leading Cause of Hospitalization (press release, 3 August 2023; ACIP recommendation adopted by the CDC Director).', 'ikincil-ozet', 'Read in the CDC press release. The ACIP recommendation and its clinical guidance were not opened, and the 8 to 19 month higher-risk group is not stated here.')
const AAP_IRON = kaynak('AAP 2010', 'Baker RD, Greer FR; AAP Committee on Nutrition. Diagnosis and prevention of iron deficiency and iron-deficiency anemia in infants and young children (0-3 years of age). Pediatrics 2010;126(5):1040-1050; summarised in Armstrong C. AAP Reports on Diagnosis and Prevention of Iron Deficiency Anemia. Am Fam Physician 2011;83(5):624.', 'ikincil-ozet', 'Read in the American Family Physician summary: the AAP report itself was not opened.')
const ACOG_CERVIX = kaynak('ACOG 2021', 'American College of Obstetricians and Gynecologists. Prediction and Prevention of Spontaneous Preterm Birth. Obstet Gynecol 2021;138(2):e65-e90.', 'ikincil-ozet', 'Read in the American Family Physician summary of the document (Practice Guidelines, September 2022): the ACOG text itself was not opened.')
const ACOG_STEROID = kaynak('ACOG 2016/2017', 'American College of Obstetricians and Gynecologists\' Committee on Obstetric Practice; Society for Maternal-Fetal Medicine. Committee Opinion No. 677: Antenatal corticosteroid therapy for fetal maturation. Obstet Gynecol 2016;128(4):e187-e194; the late-preterm recommendation is that of the later Committee Opinion No. 713 (2017).', 'ikincil-ozet', 'Read as quoted in OBG Management. Neither Committee Opinion itself was opened, and No. 713 (2017) is not cited directly.')

export const US_PREMATUR: P = {
  protokol: protokol({
    ulke: 'United States',
    kapsamKaynagi: 'The product\'s own scope: born before 37 weeks or at 1500 g or less. Each item then applies the criterion of its own source.',
    duzeltmeKaynagi: DUZELTME_KAYNAGI,
    kurallar: {
      rop: kural('rop', {
        aciklama: 'AAP/AAO 2018: all infants with a birth weight of 1500 g or less or a gestational age of 30 weeks or less, and selected infants of 1500 to 2000 g or over 30 weeks judged at risk by the baby\'s doctor. The first examination is at 31 weeks postmenstrual age for babies born at 22 to 27 weeks, and at 4 weeks after birth from 28 weeks (the table gives 32, 33 and 34 weeks postmenstrual age for 28, 29 and 30 weeks). Tentative for 22 and 23 weeks.',
        kriter: { herhangiBiri: [[c('gestasyonHafta', '<=', 30, 'gestational age 30 weeks or less')], [c('dogumKiloGr', '<=', 1500, 'birth weight 1500 g or less')], [c('ropSecili', 'dogru', undefined, 'selected by the baby\'s doctor as at risk')]] },
        zamanlamalar: [
          zaman({ kod: 'ilk-pma', etiket: 'First examination: 31 weeks postmenstrual age (born at 27 weeks or less)', kosul: [c('gestasyonHafta', '<=', 27, 'gestational age 27 weeks or less')], bas: { tur: 'pma-hafta', hafta: 31 } }),
          zaman({ kod: 'ilk-4hf', etiket: 'First examination: 4 weeks after birth (born at 28 weeks or more)', kosul: [c('gestasyonHafta', '>=', 28, 'gestational age 28 weeks or more')], bilinmiyorsa: 'dahil', bas: { tur: 'dogumdan-hafta', hafta: 4 } }),
        ],
        kaynaklar: [AAP_ROP],
      }),
      'cranial-us': kural('cranial-us', {
        aciklama: 'AAN/CNS 2002: routine screening cranial ultrasound for all infants born before 30 weeks: a single study at 7 to 14 days of age, repeated at 36 to 40 weeks postmenstrual age.',
        kriter: { herhangiBiri: [[c('gestasyonHafta', '<', 30, 'gestational age under 30 weeks')]] },
        zamanlamalar: [
          zaman({ kod: 'first', etiket: 'First scan: 7 to 14 days of age', bas: { tur: 'dogumdan-gun', gun: 7 }, son: { tur: 'dogumdan-gun', gun: 14 } }),
          zaman({ kod: 'term', etiket: 'Repeat scan: 36 to 40 weeks postmenstrual age', bas: { tur: 'pma-hafta', hafta: 36 }, son: { tur: 'pma-hafta', hafta: 40 } }),
        ],
        kaynaklar: [AAN_CRANIAL],
      }),
      'hearing-9m': kural('hearing-9m', {
        aciklama: 'JCIH 2019, Table 1: for infants who passed the newborn screen, audiology assessment by 9 months of age after a neonatal intensive care stay of more than 5 days, exchange transfusion for hyperbilirubinaemia, or an aminoglycoside for more than 5 days. (The table has other risk factors that are not on this plan: family history, asphyxia, infections, syndromes.)',
        kriter: { herhangiBiri: [[c('nicuGun', '>', 5, 'neonatal intensive care for more than 5 days')], [c('ototoksik5Gun', 'dogru', undefined, 'aminoglycoside or another ototoxic medicine for more than 5 days')], [c('degisimTransfuzyonu', 'dogru', undefined, 'exchange transfusion')]] },
        zamanlamalar: [zaman({ kod: 'assess', etiket: 'Audiology assessment by 9 months of age', son: { tur: 'kronolojik-ay', ay: 9 } })],
        kaynaklar: [JCIH],
      }),
      'hearing-ecmo': kural('hearing-ecmo', {
        aciklama: 'JCIH 2019, Table 1: after extracorporeal membrane oxygenation, audiology assessment no later than 3 months after the occurrence. The plan counts 3 months from birth: check it against the date of the event.',
        kriter: { herhangiBiri: [[c('ecmo', 'dogru', undefined, 'extracorporeal membrane oxygenation')]] },
        zamanlamalar: [zaman({ kod: 'assess', etiket: 'No later than 3 months after the event (counted here from birth)', son: { tur: 'kronolojik-ay', ay: 3 } })],
        kaynaklar: [JCIH],
      }),
      bpd: yerel('bpd'),
      rsv: kural('rsv', {
        aciklama: 'CDC, 3 August 2023: one dose of nirsevimab for all infants younger than 8 months born during or entering their first RSV season. The plan does not know the season: the doctor confirms. A small group of 8 to 19 month olds at higher risk is not stated here.',
        kriter: { herhangiBiri: [[c('yasAy', '<', 8, 'younger than 8 months')]] },
        zamanlamalar: [],
        kaynaklar: [CDC_RSV],
      }),
      iron: kural('iron', {
        aciklama: 'AAP 2010: breastfed preterm infants receive iron supplementation by 1 month of age, until they are weaned to iron-fortified formula or eat foods that supply enough iron; iron intake is sustained through 12 months of age. Not needed after multiple red cell transfusions. The medicine and its dose are yours.',
        kriter: { herhangiBiri: [[c('gestasyonHafta', '<', 37, 'born before 37 weeks')]] },
        zamanlamalar: [zaman({ kod: 'start', etiket: 'Breastfed preterm infants: start by 1 month of age', son: { tur: 'dogumdan-gun', gun: 30 } })],
        kaynaklar: [AAP_IRON],
      }),
      bone: yerel('bone'),
    },
  }),
  erkenDogum: erkenDogum({
    ulke: 'United States',
    serviks: { pencereBasGun: 16 * 7, pencereSonGun: 24 * 7, kisaMm: 25, kisaDahil: false, progesteron: null, cokKisaMm: 10 },
    steroid: { yasayabilirlik: 23 * 7, anaBas: 24 * 7, anaSon: 33 * 7 + 6, gecBas: 34 * 7, gecSon: 36 * 7 + 6, tekrarGun: 14 },
    kaynaklar: [ACOG_CERVIX, ACOG_STEROID],
    serviksKaynaklari: [ACOG_CERVIX.kisa],
    steroidKaynaklari: [ACOG_STEROID.kisa],
    kapsam: 'Cervical length: a length below 25 mm measured by endovaginal ultrasound between 16 and 24 weeks (ACOG 2021, as summarised). The summary names a benefit of cerclage below 10 mm only in a small planned subgroup: the "very short" band here is that figure, shown as a fact and not as advice. Steroids: a single course from 24 0/7 to 33 6/7 weeks, from 23 0/7 may be considered, and 34 0/7 to 36 6/7 for a baby at risk of birth within 7 days who had no earlier course (ACOG, as quoted). The source states no separate progesterone length range here, so none is shown.',
  }),
}
