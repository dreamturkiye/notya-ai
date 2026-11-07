/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — Australia: which cosmetic gynaecology tools of the English set this country
 * offers, under its own law and regulator (the regulatory recognition gate). MACHINE-WRITTEN AND UNVERIFIED BY AN
 * AUSTRALIAN CLINICIAN OR LAWYER. Every decision names its source; what could not be opened is in docs/OPEN-COMMITMENTS.md.
 *
 *   FGM LAWS (every state and territory): excising or otherwise mutilating any part of the labia majora, labia minora or
 *     clitoris is an offence; consent is no defence; the exceptions are "genuine therapeutic purpose" (ACT, NT, Qld, SA,
 *     Tas), "proper medical purpose" (WA) and "necessary for the health" (NSW, Vic). Whether a purely cosmetic labiaplasty
 *     falls within them is legally uncertain (RACGP, Female genital cosmetic surgery, 2015, Appendix 4, read 2026-11-06).
 *     DECISION: cosmetic labiaplasty and clitoral hood reduction are NOT offered; medically indicated labiaplasty is written
 *     with the O&G operation note (medical indication required there). Vaginoplasty and perineoplasty do not touch the
 *     parts the laws name and stay on, cosmetic or medical, with the evidence line.
 *   ENERGY-BASED DEVICES: the Therapeutic Goods Administration's post-market review cancelled every ARTG entry, or its vaginal-rejuvenation use, for RF,
 *     CO2 and Er:YAG devices used for vaginal laxity, stress incontinence, sexual dysfunction, labial hypertrophy, vulvovaginal
 *     atrophy and the genitourinary syndrome of menopause (effective 30 June 2023 to 15 November 2024): "currently no
 *     devices included in the ARTG that are approved for use for vaginal rejuvenation" (Therapeutic Goods Administration, Post-market review:
 *     energy-based devices used for vaginal rejuvenation, read 2026-11-06). DECISION: the energy-session tool is OFF.
 *   INJECTIONS: labial sites fall under the FGM laws above; for intravaginal ("G-spot") filler and PRP no ARTG inclusion
 *     with a genital intended purpose was verified in this session, and RANZCOG strongly discourages procedures without
 *     peer-reviewed evidence outside a trial (C-Gyn 24, current March 2019). DECISION: OFF until verified.
 *   WHITENING: applied to the labia, within the FGM laws' uncertainty; no recognition found. DECISION: OFF.
 *   BODY-IMAGE SCREENING: the Medical Board of Australia's guidelines for cosmetic surgery require a validated psychological
 *     screening tool for body dysmorphic disorder (Medical Board FAQ on patient assessment and BDD screening, read 2026-11-06).
 *   PLASTIC AND AESTHETIC SURGERY (owner's decision, 2026-11-06): those roles see the surgical part only (the adult
 *     genital-aesthetics operation note, its consent form `onam-formu-genital`, the photo consent, the COPS-L item slot),
 *     under exactly the same decisions and sources as obstetrics and gynaecology above.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['genitalEstetik']>
const KAYNAK_FGM = 'State and territory FGM laws (Crimes Act 1900 NSW and ACT; Crimes Act 1958 Vic; Criminal Code 1899 Qld; Criminal Law Consolidation Act 1935 SA; Criminal Code Act Compilation Act 1913 WA; Criminal Code Act 1924 Tas; Criminal Code Act 1983 NT): consent is no defence, and whether a purely cosmetic procedure on the labia or clitoris falls within the medical exceptions is legally uncertain (RACGP, Female genital cosmetic surgery, 2015).'

export const AU_GENITAL_ESTETIK: A = {
  kapali: {
    'genital-enerji-seansi': { eksik: 'NOT OFFERED IN AUSTRALIA. The Therapeutic Goods Administration cancelled every ARTG entry, or its vaginal-rejuvenation use, for radiofrequency, CO2 and Er:YAG devices used for vaginal laxity, incontinence, sexual dysfunction, labial hypertrophy, vulvovaginal atrophy and the genitourinary syndrome of menopause (Therapeutic Goods Administration, Post-market review: energy-based devices used for vaginal rejuvenation; effective dates 30 June 2023 to 15 November 2024). There is currently no device on the ARTG approved for this use.', kimden: 'the Therapeutic Goods Administration (a device included on the ARTG for the use), then the owner' },
    'genital-enjeksiyon': { eksik: `NOT OFFERED IN AUSTRALIA until verified. Labial sites: ${KAYNAK_FGM} Intravaginal ("G-spot") filler and PRP: no ARTG inclusion with a genital intended purpose was verified, and RANZCOG strongly discourages procedures without peer-reviewed evidence outside a properly designed trial (C-Gyn 24, Vaginal "rejuvenation" and cosmetic vaginal procedures, current March 2019).`, kimden: 'an Australian health lawyer and the ARTG entry of the product, then the owner' },
    'genital-beyazlatma': { eksik: `NOT OFFERED IN AUSTRALIA. Lightening applied to the labia: ${KAYNAK_FGM} No Australian recognition of the procedure was found.`, kimden: 'an Australian health lawyer, then the owner' },
  },
  uyarlama: {
    // Cosmetic labiaplasty and clitoral hood reduction are not offered (FGM laws); medically indicated labiaplasty: the O&G operation note.
    'ameliyat-notu-genital': { secenekler: { sablon: ['vajinoplasti', 'perineoplasti'] } },
    // the consent form of the operations, for plastic and aesthetic surgery: the same two (state and territory FGM laws)
    'onam-formu-genital': { secenekler: { islem: ['vajinoplasti', 'perineoplasti'] } },
  },
  degisen: {
    'ameliyat-notu-genital': {
      aciklama: 'Vaginoplasty / colpoperineorrhaphy and perineoplasty, with the indication (cosmetic or medically indicated), body-image screening and pre-filled standard steps you correct to what was done. Labiaplasty and clitoral hood reduction are not offered here for cosmetic reasons (state and territory FGM laws); a medically indicated labiaplasty is written with the obstetric and gynaecological operation note (plastic and aesthetic surgery: the general operation note).',
      not: 'Australia: the Medical Board of Australia\'s guidelines for cosmetic surgery require a validated psychological screening tool for body dysmorphic disorder, used by the surgeon. Evidence on cosmetic genital surgery is limited; RANZCOG strongly discourages procedures lacking peer-reviewed evidence and says they should not be promoted as enhancing sexual function (C-Gyn 24, 2019); ACOG Committee Opinion No. 795 (2020), international. The note is the surgeon\'s record.',
    },
    'genital-sonuc-olcegi': { not: 'Australia: the Medical Board of Australia requires a validated screening tool for body dysmorphic disorder before cosmetic surgery. The instruments\' wording belongs to their authors and permission for commercial software has not been obtained: no item is shown. Sources: FSFI, Rosen et al. 2000 (cut-off Wiegel et al. 2005); FGSIS, Herbenick and Reece 2010; COPS-L, Veale et al. 2013.' },
  },
}
