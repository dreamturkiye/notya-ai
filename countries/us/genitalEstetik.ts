/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — United States: which cosmetic gynaecology tools of the English set this country
 * offers, under its own law and regulator. MACHINE-WRITTEN AND UNVERIFIED BY A U.S. CLINICIAN OR LAWYER.
 *
 *   18 U.S.C. § 116 (as amended by the STOP FGM Act of 2020, Pub. L. 116-309; read 2026-11-06): an offence to perform
 *     female genital mutilation — "any procedure performed for non-medical reasons that involves partial or total removal
 *     of, or other injury to, the external female genitalia", including the clitoral hood and the labia — on a person who
 *     has not attained the age of 18; a surgical operation necessary to health by a licensed medical practitioner is not a
 *     violation (subsection (b)). DECISION: every tool on, adults only (the product's own 18+ gate).
 *   United States Food and Drug Administration, energy-based devices for vaginal "rejuvenation": safety communication of 30 July 2018 (restated by the New Zealand Medicines and Medical Devices Safety Authority,
 *     5 September 2018; the Food and Drug Administration page itself could not be opened in this session): no device authorised for these
 *     uses; vaginal burns, scarring, pain during intercourse and recurring or chronic pain reported.
 *   ACOG Committee Opinion No. 795, Elective Female Genital Cosmetic Surgery (Obstet Gynecol 2020;135:e36-e42).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['genitalEstetik']>

export const US_GENITAL_ESTETIK: A = {
  degisen: {
    // the audit's one word for this country (as on the other operation notes, ./ayarlar.ts)
    'ameliyat-notu-genital': { alanlar: { anestezist: 'Anesthesiologist or anesthesia professional' }, not: 'United States: ACOG Committee Opinion No. 795 (2020): these procedures are not medically indicated unless done for clinical reasons; their safety and effectiveness are not established; assess for body dysmorphic disorder when indicated and refer women with psychological concerns before surgery. Under 18 U.S.C. § 116 a non-medical procedure on the external genitalia of a person under 18 is a federal offense. The note is the surgeon\'s record.' },
  },
}
