/**
 * GENITAL-ESTETIK-01 (Kaan, 2026-11-06) — New Zealand: which cosmetic gynaecology tools of the English set this country
 * offers, under its own law and regulator. MACHINE-WRITTEN AND UNVERIFIED BY A NEW ZEALAND CLINICIAN OR LAWYER.
 *
 *   CRIMES ACT 1961, s.204A as amended by the Crimes (Definition of Female Genital Mutilation) Amendment Act 2020 (in force
 *     7 August 2020; read on legislation.govt.nz 2026-11-06): female genital mutilation includes removal of the clitoris,
 *     labia majora, labia minora or prepuce, but "does not include a procedure carried out for cosmetic or enhancement
 *     purposes only". DECISION: cosmetic labiaplasty and clitoral hood reduction are lawful and offered (adults only here).
 *   ENERGY-BASED DEVICES: the New Zealand Medicines and Medical Devices Safety Authority, 5 September 2018, relaying the United States Food and Drug Administration warning: "The safety and effectiveness of
 *     energy-based medical devices to perform these procedures has not been established"; RANZCOG (C-Gyn 24, current March
 *     2019) strongly discourages laser procedures lacking peer-reviewed evidence outside a properly designed trial, under
 *     ethics-committee supervision. DECISION: OFF (not recognised for routine care).
 *   INJECTIONS AND WHITENING: lawful under s.204A as amended (cosmetic purposes); evidence limited, said on the tool.
 *   PLASTIC AND AESTHETIC SURGERY (owner's decision, 2026-11-06): those roles see the surgical part only (the adult
 *     genital-aesthetics operation note, its consent form `onam-formu-genital`, the photo consent, the COPS-L item slot),
 *     under exactly the same decisions and sources as obstetrics and gynaecology above.
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'

type A = NonNullable<EnUlkeGirdisi['araclar']['genitalEstetik']>
const RANZCOG = 'RANZCOG, Vaginal "rejuvenation" and cosmetic vaginal procedures (C-Gyn 24, current March 2019): the College strongly discourages procedures lacking peer-reviewed evidence, which should not be promoted as enhancing sexual function.'

export const NZ_GENITAL_ESTETIK: A = {
  kapali: {
    'genital-enerji-seansi': { eksik: 'NOT OFFERED IN NEW ZEALAND. the New Zealand Medicines and Medical Devices Safety Authority (5 September 2018): the safety and effectiveness of energy-based devices for vaginal "rejuvenation" or cosmetic vaginal procedures have not been established. RANZCOG (C-Gyn 24, 2019): laser procedures without peer-reviewed evidence only within a properly designed trial, under ethics-committee supervision. Not recognised for routine care.', kimden: 'the New Zealand Medicines and Medical Devices Safety Authority and RANZCOG guidance for routine use, then the owner' },
  },
  degisen: {
    'ameliyat-notu-genital': { not: `New Zealand: lawful for cosmetic purposes (Crimes Act 1961, s.204A, as amended in 2020). ${RANZCOG} ACOG Committee Opinion No. 795 (2020), international. The note is the surgeon's record.` },
    'genital-enjeksiyon': { not: `EVIDENCE LIMITED. Safety and effectiveness data for G-spot filler and genital PRP are insufficient (ACOG Committee Opinion No. 795, 2020, international). ${RANZCOG} Sudden severe pain or colour change at the site needs urgent assessment. The volume is the clinician's: the tool proposes none.` },
    'genital-beyazlatma': { not: `EVIDENCE LIMITED. There is no high-quality evidence on the effectiveness or safety of genital lightening; irritation, burns and lasting lightening or darkening can occur. Cosmetic, with no medical indication. ${RANZCOG}` },
  },
}
