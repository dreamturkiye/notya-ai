/**
 * NOTYA-ULKE-UYGULA-AU — Australia: THE WORDS, THE ROLES AND THE LICENCE of the tools only Australia has. The
 * arithmetic of each is in ./tanimlar.ts, with the source every number was read on.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNREAD, EVERY LINE. No clinician and no native editor of Australia has read a word below.
 * Australian spelling; used AS WRITTEN (the spelling table never touches a country's own words).
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * CLASSIFIED BEFORE ADDING (.cursor/skills/specialty-doktor-araclari/SKILL.md) — who sees each, and who must not:
 *   au-body-size              BASE: every role, the allied professions included (the audit's core set: "every role";
 *                             the dietitian is the one who asks it daily). NOT for a patient under 18: the patient
 *                             gate keeps it off a child's file whatever the role, paediatrics included.
 *   au-mental-health-screen   every doctor role that treats adults, and the psychologist (the audit's core set).
 *                             NOT paediatrics, NOT paediatric surgery, NOT the other allied professions.
 *   au-oncology-grading       medical oncology and radiation oncology. NOT general practice, NOT haematology, NOT
 *                             any other role: nobody else was named for it by the audit.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/** Whose K10 group the band is: said in every band's own words, because other groupings are in use. */
const ABS = 'by the grouping of the Australian Bureau of Statistics'

/** The roles the tools are given to, as ../ayarlar.ts works them out from the country's own role list. */
export type AuAracRolleri = { yetiskinHekimleriVePsikolog: readonly string[]; onkoloji: readonly string[] }

/** The tools only Australia has, in the order the grid shows them. */
export function auEkAraclar(roller: AuAracRolleri): readonly PaketAraci[] {
  return [
    {
      anahtar: 'au-body-size',
      roller: null,
      metin: {
        ad: m('Body mass index and waist measurement (adults)'),
        aciklama: m('Body mass index from weight and height: weight in kilograms divided by the square of height in metres, written to one decimal place, with the class the Australian Institute of Health and Welfare prints for adults. Once the patient\'s sex is chosen, a waist measurement is held against the two limits printed for that sex. The index does not necessarily reflect how body fat is distributed; the waist limits depend on sex and ethnicity and may be less accurate in pregnancy.'),
        alanlar: { agirlik: m('Weight'), boy: m('Height'), cinsiyet: m('Sex (optional; needed for the waist measurement)'), bel: m('Waist measurement (optional)') },
        secenekler: { cinsiyet: { erkek: m('Male'), kadin: m('Female') } },
        sayilar: { bmi: m('Body mass index'), bel: m('Waist measurement') },
        bantlar: {
          zayif: m('Underweight (less than 18.5)'),
          normal: m('Normal weight range (18.5 to less than 25)'),
          fazla: m('Overweight (25 to less than 30)'),
          obez: m('Obese (30 or more)'),
        },
        uyarilar: {
          bel_artmis_erkek: m('Waist of 94 cm or more: increased risk of chronic disease (the limit printed for Caucasian men)'),
          bel_cok_artmis_erkek: m('Waist of 102 cm or more: substantially increased risk of chronic disease (the limit printed for Caucasian men)'),
          bel_artmis_kadin: m('Waist of 80 cm or more: increased risk of chronic disease (the limit printed for Caucasian and Asian women)'),
          bel_cok_artmis_kadin: m('Waist of 88 cm or more: substantially increased risk of chronic disease (the limit printed for Caucasian and Asian women)'),
        },
        not: m('A measure, not a diagnosis: assessment and advice are the clinician\'s.'),
        hastaKapisi: m('This tool is for adults aged 18 and over.'),
      },
      // the source says the index is for people aged 18 or older (./tanimlar.ts)
      hasta: { enAzYas: 18 },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Australian Institute of Health and Welfare',
        kaynak: 'https://www.aihw.gov.au/copyright (read 2026-10-10): material on the site is released under a Creative Commons BY 4.0 licence',
        bildirim: m('Based on Australian Institute of Health and Welfare material.'),
      },
    },
    {
      anahtar: 'au-mental-health-screen',
      roller: roller.yetiskinHekimleriVePsikolog,
      metin: {
        ad: m('K10 psychological distress scale: total score'),
        aciklama: m('Enter the answer to each of the ten items of the Kessler Psychological Distress Scale (K10) from the form the patient completed: each answer scores from 1 (none of the time) to 5 (all of the time), and the total runs from 10 to 50. The items are not worded here: read them from the K10 form. The group shown is the one the Australian Bureau of Statistics uses in its health surveys; other groupings are in use in primary care.'),
        // the ten items are numbered fields: the screen shows "Item 1" … "Item 10"
        alanlar: {},
        sayilar: { toplam: m('Total score') },
        bantlar: {
          dusuk: m(`Low (10 to 15), ${ABS}`),
          orta: m(`Moderate (16 to 21), ${ABS}`),
          yuksek: m(`High (22 to 29), ${ABS}`),
          cok_yuksek: m(`Very high (30 to 50), ${ABS}`),
        },
        not: m('A score, not a diagnosis: assessment and treatment are the clinician\'s.'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'Ronald C. Kessler, PhD',
        kaynak: 'https://rckessler.scholars.harvard.edu/k10-and-k6-scales (read 2026-10-10): "Use of the K6 and K10 is free and does not require any formal permission or approval."',
        bildirim: m('K10: Copyright © Ronald C. Kessler, PhD. All rights reserved. Kessler RC, Barker PR, et al. Screening for serious mental illness in the general population. Arch Gen Psychiatry 2003;60(2):184-189.'),
      },
    },
    {
      anahtar: 'au-oncology-grading',
      roller: roller.onkoloji,
      metin: {
        ad: m('ECOG performance status: record the grade'),
        aciklama: m('Record the grade of the ECOG Performance Status Scale (0 to 5) that you assessed. The tool works nothing out and does not word the grades: read them from the scale.'),
        alanlar: { derece: m('Grade') },
        secenekler: { derece: { g0: m('0'), g1: m('1'), g2: m('2'), g3: m('3'), g4: m('4'), g5: m('5') } },
        bantlar: {
          g0: m('ECOG performance status 0'), g1: m('ECOG performance status 1'), g2: m('ECOG performance status 2'),
          g3: m('ECOG performance status 3'), g4: m('ECOG performance status 4'), g5: m('ECOG performance status 5'),
        },
        not: m('A record of the grade you assessed: the assessment is the doctor\'s.'),
      },
      lisans: {
        durum: 'serbest',
        hakSahibi: 'ECOG-ACRIN Cancer Research Group',
        kaynak: 'https://ecog-acrin.org/scale (read 2026-10-10): "The ECOG Performance Status Scale circulates in the public domain and is therefore available for public use."',
        bildirim: m('ECOG Performance Status Scale. Oken MM, Creech RH, Tormey DC, et al. Am J Clin Oncol 1982. Developed by the Eastern Cooperative Oncology Group, now the ECOG-ACRIN Cancer Research Group.'),
      },
    },
  ]
}
