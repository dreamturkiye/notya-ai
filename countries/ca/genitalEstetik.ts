/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — Canada: which cosmetic gynaecology tools of the English set this country offers,
 * under its own law. MACHINE-WRITTEN AND UNVERIFIED BY A CANADIAN CLINICIAN OR LAWYER.
 *
 *   CRIMINAL CODE, s.268(3) (as quoted 2026-11-06; the Justice Laws page itself could not be opened in this session):
 *     "wounds" or "maims" includes to excise, infibulate or mutilate the labia majora, labia minora or clitoris, EXCEPT where
 *     (a) a surgical procedure is performed by a person duly qualified by provincial law to practise medicine, for the
 *     benefit of the physical health of the person or for the purpose of that person having normal reproductive functions
 *     or normal sexual appearance or function, or (b) the person is at least eighteen years of age and there is no
 *     resulting bodily harm. DECISION: every tool on, adults only.
 *   SOGC Guideline No. 423, Female Genital Cosmetic Surgery and Procedures (J Obstet Gynaecol Can 2022;44:204-214):
 *     FGCS for non-medical indications cannot be supported, for lack of rigorous evidence of short- and long-term efficacy
 *     and safety; most women requesting it have normal genitalia and counselling reassures most.
 *   ENERGY-BASED DEVICES: no notice of the Canadian federal medical devices regulator was found in this session; the United States Food and Drug Administration safety communication of 30 July
 *     2018 is shown, labelled international.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['genitalEstetik']>
const SOGC = 'SOGC Guideline No. 423, Female Genital Cosmetic Surgery and Procedures (2022): FGCS for non-medical indications cannot be supported, for lack of rigorous evidence of short- and long-term efficacy and safety.'

export const CA_GENITAL_ESTETIK: A = {
  degisen: {
    'ameliyat-notu-genital': { not: `Canada: ${SOGC} Criminal Code, s.268(3): lawful when performed by a qualified physician for physical health or normal sexual appearance or function, or for an adult with no resulting bodily harm. The note is the surgeon's record.` },
    'genital-enerji-seansi': { not: `EVIDENCE LIMITED. ${SOGC} Food and Drug Administration safety communication (30 July 2018, international source; no notice of the Canadian federal medical devices regulator found): no energy-based device is authorized for vaginal "rejuvenation", and burns, scarring, painful intercourse and chronic pain have been reported. Tell the patient if the device is not approved for this use. The settings are the clinician's.` },
    'genital-enjeksiyon': { not: `EVIDENCE LIMITED. ${SOGC} ACOG lists G-spot amplification among procedures that are not medically indicated (Committee Opinion No. 795, 2020, international). Sudden severe pain or colour change at the site needs urgent assessment. The volume is the clinician's.` },
    'genital-beyazlatma': { not: `EVIDENCE LIMITED. ${SOGC} Irritation, burns and lasting lightening or darkening can occur. Cosmetic, with no medical indication.` },
  },
}
