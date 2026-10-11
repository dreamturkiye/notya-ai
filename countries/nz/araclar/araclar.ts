/**
 * NOTYA-ULKE-UYGULA-NZ — New Zealand: THE TOOLS ONLY THIS COUNTRY HAS, as the pack lists them: every word a doctor
 * reads, WHO SEES EACH, for which patients, and the licence. The mechanisms are in ./tanimlar.ts.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN, EVERY WORD, in New Zealand spelling. NO CLINICIAN AND NO NATIVE EDITOR OF NEW ZEALAND HAS READ
 * IT. The three tools are SWITCHED ON by the owner's order of 2026-10-10 and listed in ./onaysiz.ts as switched on
 * without a clinician's sign-off.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * CLASSIFIED BEFORE ADDING (.cursor/skills/specialty-doktor-araclari/SKILL.md) — the audit's decisions
 * (docs/araclar-denetim/nz-kararlar.json, `addTools` and `coreSet`):
 *   nz-bmi-waist        core set → every DOCTOR role whose patients are adults, and the dietitian (the audit gives
 *                       that profession this tool). NOT Paediatrics and NOT Paediatric surgery: the classes are the
 *                       adult guideline's and the tool is for patients aged 19 and over, so it would be a tool those
 *                       two roles could never use. Not base: no other allied profession sees it.
 *   nz-smoking-abc      core set → every DOCTOR role (`sinif: 'hekimler'`). No allied profession.
 *   nz-psa-thresholds   specialty → General practice and Urology. Not emergency medicine, not paediatrics, no allied
 *                       profession.
 * COUNTRIES: New Zealand only — the three keys are listed for `nz` in countries/yasak-araclar.json.
 *
 * LICENCE: "free" (`serbest`) is stated for each because the document that defines the tool PRINTS its own licence —
 * Creative Commons Attribution 4.0 International — and that notice was read on 2026-10-10. The licence asks for
 * credit, so each tool carries a notice (`bildirim`) under every result and in the summary that is copied. The notice
 * says whose the figures are and that the tool is not the Ministry's: it is credit, never a claim of approval.
 */
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { EnEkAraclar } from '../../_dil/en/araclar'
import { enCocukRolleri, enRolSatirlari } from '../../_dil/en/klinik/roller'
import { NZ_ROLLER } from '../ayarlar'
import { NZ_TANIMLAR } from './tanimlar'

const D = 'en-NZ'
const m = (metin: string) => ({ [D]: metin })

/** Every doctor role of this pack (not the allied professions), in the pack's order. */
const HEKIMLER: readonly string[] = hekimRolleri(enRolSatirlari(NZ_ROLLER))
/** The roles of this pack whose patients are children (Paediatrics, Paediatric surgery): a tool for adults only is not theirs. */
const COCUK_ROLLERI: readonly string[] = enCocukRolleri(NZ_ROLLER)

const CC_BY = 'Used under the Creative Commons Attribution 4.0 International licence (creativecommons.org/licenses/by/4.0). The wording and the arithmetic of this tool are the product\'s own, not the Ministry\'s.'
const OKUNDU = 'the licence statement printed in the document itself (Creative Commons Attribution 4.0 International), read 2026-10-10'

export const NZ_EK_ARACLAR: readonly PaketAraci[] = [
  {
    anahtar: 'nz-bmi-waist',
    roller: [...HEKIMLER.filter((r) => !COCUK_ROLLERI.includes(r)), 'dietetics'],
    metin: {
      ad: m('Body mass index and waist'),
      aciklama: m('From weight and height, the body mass index (weight in kilograms divided by the square of the height in metres) and its class in the weight-management guideline for adults of the Ministry of Health (2017). With a waist measurement and the sex, the waist band of the same guideline. The tool takes no account of ethnicity or of muscle mass.'),
      alanlar: { kilo: m('Weight'), boy: m('Height'), bel: m('Waist circumference (optional)'), cinsiyet: m('Sex (needed with a waist measurement)') },
      secenekler: { cinsiyet: { kadin: m('Woman'), erkek: m('Man') } },
      sayilar: { bmi: m('Body mass index') },
      bantlar: {
        zayif: m('Underweight (below 18.5)'),
        normal: m('Normal weight (18.5 to 24.9)'),
        fazla_kilolu: m('Overweight (25.0 to 29.9)'),
        obez_1: m('Obese, class I (30.0 to 34.9)'),
        obez_2: m('Obese, class II (35.0 to 39.9)'),
        obez_3: m('Obese, class III (40.0 or above)'),
      },
      uyarilar: {
        bel_alt_bant: m('Waist in the range the guideline links with increased disease risk (men 94 to 102 cm, women 80 to 88 cm)'),
        bel_ust_bant: m('Waist above the figure at which the guideline considers disease risk high (men 102 cm, women 88 cm)'),
      },
      not: m('A decision-support tool: assessment, diagnosis and treatment are the doctor\'s.'),
      hastaKapisi: m('This tool is for adults aged 19 and over: its classes are those of the guideline for adults.'),
    },
    // ADULTS. The guideline for adults states no age. Its companion for children and young people covers ages 2 to 18
    // (OPENED 2026-10-10: Ministry of Health, "Clinical Guidelines for Weight Management in New Zealand Children and
    // Young People", December 2016, https://www.health.govt.nz/system/files/2011-10/clinical-guidelines-weight-management-nz-children-young-people-dec16.pdf),
    // so the tool is offered from the age of 19: the cautious side of the two readings of "to 18". FOR A LOCAL CLINICIAN.
    hasta: { enAzYas: 19 },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Ministry of Health (New Zealand)',
      kaynak: `${OKUNDU}: https://health.govt.nz/system/files/2017-11/clinical-guidelines-for-weight-management-in-new-zealand-adultsv2.pdf`,
      bildirim: m(`Figures from: Ministry of Health. 2017. Clinical Guidelines for Weight Management in New Zealand Adults. Wellington: Ministry of Health. ${CC_BY}`),
    },
  },
  {
    anahtar: 'nz-smoking-abc',
    roller: [...HEKIMLER], sinif: 'hekimler',
    metin: {
      ad: m('Smoking: record of the ABC steps'),
      aciklama: m('A record of the three steps of the stop-smoking guidelines of the Ministry of Health (2021): smoking status asked about and documented, brief advice given, cessation support offered. The tool works out nothing and proposes no date.'),
      alanlar: {
        soruldu: m('Smoking status asked about and documented'),
        kisa_tavsiye: m('Brief advice to stop smoking given'),
        destek_onerildi: m('Cessation support strongly encouraged, and help to access it offered'),
        destek_saglandi: m('Offer accepted: referred to, or given, cessation support'),
        durum: m('Smoking status, in your own words (optional)'),
      },
      sayilar: { isaretli: m('Items selected') },
      not: m('A record only: the advice and the support offered are the doctor\'s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Ministry of Health (New Zealand)',
      kaynak: `${OKUNDU}: https://health.govt.nz/system/files/2014-06/the-new-zealand-guidelines-for-helping-people-to-stop-smoking-2021.pdf`,
      bildirim: m(`Steps from: Ministry of Health. 2021. The New Zealand Guidelines for Helping People to Stop Smoking: 2021 Update. Wellington: Ministry of Health. ${CC_BY}`),
    },
  },
  {
    anahtar: 'nz-psa-thresholds',
    roller: ['family-medicine', 'urology'],
    metin: {
      ad: m('Prostate-specific antigen: level by age and referral group'),
      aciklama: m('Holds a PSA result against the level that the prostate cancer guidance of the Ministry of Health (2015) lists as abnormal for the man\'s age, and shows which group of its referral table the entries match: immediate, urgent or routine. Entries that match no line of the table show no group: that is not a finding. The guidance states no rate of change.'),
      alanlar: {
        yas: m('Age'),
        psa: m('PSA result'),
        dre_anormal: m('Prostate feels hard or irregular on digital rectal examination'),
        sirt_noro: m('Severe back pain with acute neurological symptoms (consistent with compression of the spinal cord or cauda equina)'),
        bobrek_yetmezligi: m('Renal failure is present'),
        kemik_agrisi: m('Bone pain: new onset, progressive and severe'),
        hematuri: m('Macroscopic haematuria (without urinary tract infection)'),
        iki_anormal: m('Two clearly abnormal PSA results 6 to 12 weeks apart'),
      },
      sayilar: { esik: m('Abnormal level for this age group') },
      bantlar: {
        anormal: m('At or above the level the guidance lists as abnormal for this age'),
        esik_alti: m('Below the level the guidance lists as abnormal for this age'),
      },
      uyarilar: {
        sevk_hemen: m('The entries match the group "immediate referral" of the guidance: to be seen within 24 hours'),
        sevk_ivedi: m('The entries match the group "urgent referral" of the guidance: to be seen within 14 days'),
        sevk_rutin: m('The entries match the group "routine referral" of the guidance: to be seen within 6 to 8 weeks'),
        tekrar: m('The guidance asks for a repeat PSA test after 6 to 12 weeks to confirm a raised result'),
      },
      not: m('A decision-support tool: the examination, the decision to refer and its urgency are the doctor\'s. A result below the listed level does not exclude prostate cancer.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Ministry of Health (New Zealand)',
      kaynak: `${OKUNDU}: https://www.health.govt.nz/system/files/2015-09/prostate-cancer-management-referral-guidance_sept15-c.pdf`,
      bildirim: m(`Levels and referral groups from: Ministry of Health. 2015. Prostate Cancer Management and Referral Guidance. Wellington: Ministry of Health. ${CC_BY}`),
    },
  },
]

/** The tools this country has beyond the shared English set, as the set takes them (countries/_dil/en/araclar → `ek`). */
export const NZ_EK: EnEkAraclar = { araclar: NZ_EK_ARACLAR, tanimlar: NZ_TANIMLAR }
