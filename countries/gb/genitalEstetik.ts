/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — United Kingdom: which cosmetic gynaecology tools of the English set this country
 * offers, under its own law and its national bodies (the regulatory recognition gate; Kaan's instruction: switch off
 * anything that is not clearly lawful and recognised). MACHINE-WRITTEN AND UNVERIFIED BY A UK CLINICIAN OR LAWYER.
 *
 *   FEMALE GENITAL MUTILATION ACT 2003, s.1 (England, Wales, Northern Ireland; read on legislation.gov.uk 2026-11-06):
 *     excising, infibulating or otherwise mutilating the whole or any part of the labia majora, labia minora or clitoris is
 *     an offence; no offence for a surgical operation NECESSARY FOR PHYSICAL OR MENTAL HEALTH by a registered medical
 *     practitioner (s.1(2)(a), (3)); in deciding mental health, a belief that it is required as a matter of custom or
 *     ritual is immaterial (s.1(5)). HM Government, Multi-agency statutory guidance on FGM (updated 30 July 2020), section
 *     3.1.8: the Act has no exemption for cosmetic procedures; such a procedure that is not necessary for physical or
 *     mental health is an offence even with consent; RCOG: "All surgeons who undertake FGCS must take appropriate measures
 *     to ensure conformity with the FGM Act." Section 3.1.4: Type 4 procedures may be an offence depending on the
 *     circumstances. Scotland: Prohibition of Female Genital Mutilation (Scotland) Act 2005, s.1 (not re-read here).
 *     DECISION: cosmetic labiaplasty and clitoral hood reduction are NOT offered; medically indicated labiaplasty is written
 *     with the O&G operation note (medical indication required). Vaginoplasty and perineoplasty touch no part the Act names.
 *   ENERGY-BASED DEVICES: NICE IPG697 (now HTG582), transvaginal laser therapy for urogenital atrophy, and IPG696 (now
 *     HTG581), for stress urinary incontinence: "this procedure should only be used in the context of research" (read
 *     2026-11-06). DECISION: OFF (not recognised for routine care).
 *   INJECTIONS AND WHITENING: labial sites are within s.1; Type 4 uncertainty (guidance 3.1.4); no UK body recognises G-spot
 *     filler, genital PRP or genital lightening. DECISION: OFF.
 *   Hymenoplasty is an offence (Health and Care Act 2022, ss.148-149) and is never offered.
 *   RCOG Ethical Opinion Paper (2013), Ethical considerations in relation to female genital cosmetic surgery: FGCS should not
 *     normally be carried out on girls under 18; women must be informed of the risks and of the lack of reliable evidence.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['genitalEstetik']>
const FGM = 'Female Genital Mutilation Act 2003, s.1 (and the Prohibition of Female Genital Mutilation (Scotland) Act 2005): a procedure on the labia or clitoris that is not necessary for physical or mental health is an offence even with consent (HM Government, Multi-agency statutory guidance on FGM, 2020, section 3.1.8; Type 4 procedures, section 3.1.4).'

export const GB_GENITAL_ESTETIK: A = {
  kapali: {
    'genital-enerji-seansi': { eksik: 'NOT OFFERED IN THE UNITED KINGDOM. NICE interventional procedures guidance IPG697 (now HTG582, urogenital atrophy) and IPG696 (now HTG581, stress urinary incontinence): transvaginal laser therapy "should only be used in the context of research". Not recognised for routine care.', kimden: 'NICE (guidance for routine use), then the owner; a research-only mode would need the owner\'s decision' },
    'genital-enjeksiyon': { eksik: `NOT OFFERED IN THE UNITED KINGDOM. Labial sites: ${FGM} G-spot filler and genital PRP: not recognised by any UK national body.`, kimden: 'a UK health lawyer and RCOG guidance, then the owner' },
    'genital-beyazlatma': { eksik: `NOT OFFERED IN THE UNITED KINGDOM. Genital lightening of the labia: ${FGM} Not recognised by any UK national body.`, kimden: 'a UK health lawyer, then the owner' },
  },
  uyarlama: { 'ameliyat-notu-genital': { secenekler: { sablon: ['vajinoplasti', 'perineoplasti'] } } },
  degisen: {
    'ameliyat-notu-genital': {
      aciklama: 'Vaginoplasty / colpoperineorrhaphy and perineoplasty, with the indication (cosmetic or medically indicated), body-image screening and pre-filled standard steps you correct to what was done. Labiaplasty and clitoral hood reduction are not offered here for cosmetic reasons (Female Genital Mutilation Act 2003); a medically indicated labiaplasty is written with the obstetric and gynaecological operation note.',
      not: 'United Kingdom: RCOG, Ethical considerations in relation to female genital cosmetic surgery (2013): women must be informed of the risks and of the lack of reliable evidence of benefit; not normally for girls under 18. ACOG Committee Opinion No. 795 (2020), international. Hymenoplasty is an offence (Health and Care Act 2022) and is not offered. The note is the surgeon\'s record.',
    },
    'ameliyat-notu-kd': { alanlar: { tibbi_endikasyon: 'Medically indicated (necessary for physical or mental health, Female Genital Mutilation Act 2003, s.1(2)). A cosmetic operation on the labia or clitoris is not offered.', tibbi_gerekce: 'Why it is necessary for her physical or mental health (custom or ritual is not a reason, s.1(5))' } },
  },
}
