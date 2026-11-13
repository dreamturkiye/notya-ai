/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — Australia: the preterm baby's follow-up table and the early-birth thresholds. MACHINE-WRITTEN AND
 * UNVERIFIED BY A CLINICIAN of Australia. A rule never states a number its source was not read for. HERE NO NATIONAL SOURCE COULD BE READ
 * FOR ANY ITEM, so every item is "follow your local protocol" and no criterion or date is stated; what was read is listed beside the item so
 * that the doctor can see where the local rules differ.
 *
 *   ROP        Local sources read on 2026-11-13 disagree: South Eastern Sydney LHD (June 2019; based on a RANZCO working document, "draft
 *              RANZCO ROP Screening and Treatment Guideline accessed 8 December 2017") screens babies born before 31+0 weeks or at 1250 g or
 *              less; Safer Care Victoria (published August 2013, review date August 2016 passed) follows the AAP 2013 criteria and says
 *              "there are no consensus Australasian guidelines on screening for ROP". The RANZCO guideline itself was not read.
 *   STEROIDS   Liggins Institute, Antenatal corticosteroids ... New Zealand and Australian Clinical Practice Guidelines 2015 — read in part: it
 *              sets no lowest gestation, so no window can be stated from it.
 *   CERVIX     Canberra Health Services (ACT) preterm birth screening and prevention guideline — a state service's document that cites no
 *              Australian national guideline and takes its pathways from a Western Australian hospital; not used.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { DUZELTME_KAYNAGI, prematurKurucu } from '../_dil/en/prematurKurucu'

type P = NonNullable<EnUlkeGirdisi['araclar']['prematur']>

const { kaynak, yerel, protokol, erkenDogum } = prematurKurucu('en-AU')

const SESLHD_ROP = kaynak('SESLHD 2019', 'South Eastern Sydney Local Health District, Network Clinical Policy / Local Operating Procedure: Retinopathy of prematurity (June 2019), based on a RANZCO working document (draft, accessed 8 December 2017).', 'ikincil-ozet', 'A local procedure, not a national guideline. It screens babies born before 31+0 weeks or weighing 1250 g or less; the first examination is at 31 weeks postmenstrual age for babies born before 28+0 weeks and 5 weeks after birth from 28+0 weeks.')
const SCV_ROP = kaynak('Safer Care Victoria', 'Safer Care Victoria. Retinopathy of prematurity (ROP), neonatal clinical guidance. First published August 2013; review date August 2016, now passed.', 'ikincil-ozet', 'A state guidance that follows the AAP 2013 criteria (under 1500 g, or under 30 weeks, and selected larger infants) and says there are no consensus Australasian guidelines on screening for ROP. Its review date has passed.')
const LIGGINS = kaynak('Liggins steroids 2015', 'Liggins Institute, University of Auckland. Antenatal corticosteroids given to women prior to birth to improve fetal, infant, child and adult health: Clinical Practice Guidelines (2015).', 'ikincil-ozet', 'The first 100,000 characters of the guideline were read: a single course for a woman at risk of early preterm, imminent birth (34+6 weeks or less), a repeat course at 32+6 weeks or less and at least 7 days after the first. The guideline sets no lowest gestation, so this table states no window.')

export const AU_PREMATUR: P = {
  protokol: protokol({
    ulke: 'Australia',
    kapsamKaynagi: 'The product\'s own scope: born before 37 weeks or at 1500 g or less. Every item is "follow your local protocol" here: no national source was read.',
    duzeltmeKaynagi: DUZELTME_KAYNAGI,
    kurallar: {
      rop: yerel('rop', [SESLHD_ROP, SCV_ROP], 'The local sources read disagree (under 31 weeks or 1250 g or less in one, under 30 weeks or under 1500 g in the other), and the RANZCO guideline itself was not read.'),
    },
  }),
  erkenDogum: erkenDogum({
    ulke: 'Australia',
    serviks: null,
    steroid: null,
    kaynaklar: [LIGGINS],
    serviksKaynaklari: [],
    steroidKaynaklari: [],
    kapsam: 'No threshold is stated for Australia: the only national source read for steroids (the Liggins guideline of 2015) sets no lowest gestation, and no national source was read for the cervical length. The record and the trend are kept; follow your local protocol.',
  }),
}
