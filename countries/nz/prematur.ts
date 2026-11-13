/**
 * PREMATUR-ULKE-01 (Kaan, 2026-11-13) — New Zealand: the preterm baby's follow-up table and the early-birth thresholds. MACHINE-WRITTEN AND
 * UNVERIFIED BY A CLINICIAN of New Zealand. A rule never states a number its source was not read for. HERE NO NATIONAL SOURCE COULD BE READ
 * FOR ANY ITEM, so every item is "follow your local protocol" and no criterion or date is stated; what was read is listed beside the item.
 *
 *   ROP        Starship Children's Health (Te Whatu Ora, Auckland) patient page: babies born before 30 weeks or under 1250 g are screened,
 *              the first examination at 4 to 6 weeks after birth or 31 to 33 weeks gestation; it names no guideline and no year. A paper
 *              "Retinopathy of prematurity: New Zealand recommendations for case detection and treatment" (J Paediatr Child Health) exists
 *              and was NOT read (only found in a search result).
 *   STEROIDS   Liggins Institute, Antenatal corticosteroids ... New Zealand and Australian Clinical Practice Guidelines 2015 — read in part: it
 *              sets no lowest gestation, so no window can be stated from it.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { DUZELTME_KAYNAGI, prematurKurucu } from '../_dil/en/prematurKurucu'

type P = NonNullable<EnUlkeGirdisi['araclar']['prematur']>

const { kaynak, yerel, protokol, erkenDogum } = prematurKurucu('en-NZ')

const STARSHIP_ROP = kaynak('Starship ROP page', 'Starship Children\'s Health, Auckland. Retinopathy of prematurity (patient information page, www.starship.org.nz/retinopathy-of-prematurity/).', 'ikincil-ozet', 'A hospital\'s patient page, not a guideline: it says babies born before 30 weeks or under 1250 g are screened, with the first examination at 4 to 6 weeks after birth or between 31 and 33 weeks gestation. It names no guideline and no year, and it is not a national source.')
const LIGGINS = kaynak('Liggins steroids 2015', 'Liggins Institute, University of Auckland. Antenatal corticosteroids given to women prior to birth to improve fetal, infant, child and adult health: Clinical Practice Guidelines (2015).', 'ikincil-ozet', 'The first 100,000 characters of the guideline were read: a single course for a woman at risk of early preterm, imminent birth (34+6 weeks or less), a repeat course at 32+6 weeks or less and at least 7 days after the first. The guideline sets no lowest gestation, so this table states no window.')

export const NZ_PREMATUR: P = {
  protokol: protokol({
    ulke: 'New Zealand',
    kapsamKaynagi: 'The product\'s own scope: born before 37 weeks or at 1500 g or less. Every item is "follow your local protocol" here: no national source was read.',
    duzeltmeKaynagi: DUZELTME_KAYNAGI,
    kurallar: {
      rop: yerel('rop', [STARSHIP_ROP], 'The only source read is one hospital\'s patient page; the New Zealand recommendations for case detection and treatment were not read.'),
    },
  }),
  erkenDogum: erkenDogum({
    ulke: 'New Zealand',
    serviks: null,
    steroid: null,
    kaynaklar: [LIGGINS],
    serviksKaynaklari: [],
    steroidKaynaklari: [],
    kapsam: 'No threshold is stated for New Zealand: the Liggins Institute steroid guideline of 2015 sets no lowest gestation, and no national source was read for the cervical length. The record and the trend are kept; follow your local protocol.',
  }),
}
