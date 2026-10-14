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
import { AU_ASI_TAKVIMI_MADDELERI } from './tanimlar'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/** Whose K10 group the band is: said in every band's own words, because other groupings are in use. */
const ABS = 'by the grouping of the Australian Bureau of Statistics'

/** The roles the tools are given to, as ../ayarlar.ts works them out from the country's own role list. */
export type AuAracRolleri = { yetiskinHekimleriVePsikolog: readonly string[]; onkoloji: readonly string[] }

/**
 * THE CONSULTATION TILE (feature `konsultasyon`; the mechanism is the kit's, `lib/ulke/araclar/katalog.ts` →
 * `konsultasyonlar`, a screen with no arithmetic). Switched on by NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13: the
 * audit of 2026-10-10 left the feature off only because its consent sentence was never drafted
 * (docs/araclar-denetim/AU.md, "Still unverified, and why"); the owner asked for a sensible draft and the feature
 * on now, with the sentence itself flagged for a lawyer (../klinik/index.ts → `konsultasyonRizasi`). A base tool,
 * every role, like "My templates" and the patient's page: no clinical content, so no licence question.
 */
export const AU_KONSULTASYON_ARACI: PaketAraci = {
  anahtar: 'konsultasyonlar',
  roller: null,
  metin: {
    ad: m('Consultations'),
    aciklama: m('Ask a colleague of your own choosing — by their consultation code — for an opinion on a patient\'s care, and answer a colleague who asks you. You choose what to share; nothing is shared until you tick the consent sentence.'),
    alanlar: {},
    not: m('A written opinion between two doctors: diagnosis and treatment of this patient remain yours.'),
  },
}

/** One row of the National Immunisation Program schedule: its tick label, and the vaccines it names (./tanimlar.ts). */
const AU_ASI_SATIRLARI: Readonly<Record<(typeof AU_ASI_TAKVIMI_MADDELERI)[number], { etiket: string; icerik: string }>> = {
  dogum: { etiket: 'Birth', icerik: 'Hepatitis B (within 7 days of birth, ideally within 24 hours).' },
  hafta6: { etiket: '6 weeks', icerik: 'Diphtheria/tetanus/pertussis/hepatitis B/polio/Hib; pneumococcal (PCV20); rotavirus (dose 1); meningococcal B for Aboriginal and Torres Strait Islander children (others per the Handbook).' },
  ay4: { etiket: '4 months', icerik: 'Diphtheria/tetanus/pertussis/hepatitis B/polio/Hib; pneumococcal; rotavirus (dose 2); meningococcal B for Aboriginal and Torres Strait Islander and medically at-risk children.' },
  ay6: { etiket: '6 months', icerik: 'Diphtheria/tetanus/pertussis/hepatitis B/polio/Hib; pneumococcal for Aboriginal and Torres Strait Islander children and specified risk conditions; annual influenza from this age.' },
  ay12: { etiket: '12 months', icerik: 'Meningococcal ACWY; pneumococcal; measles/mumps/rubella; meningococcal B for Aboriginal and Torres Strait Islander children (others per the Handbook).' },
  ay18: { etiket: '18 months', icerik: 'Diphtheria/tetanus/pertussis; measles/mumps/rubella/varicella; Hib.' },
  yas4: { etiket: '4 years (school entry)', icerik: 'Diphtheria/tetanus/pertussis/polio; annual influenza if applicable.' },
  yil7: { etiket: 'School Year 7', icerik: 'Diphtheria/tetanus/pertussis booster; human papillomavirus (HPV).' },
  yil10: { etiket: 'School Year 10', icerik: 'Meningococcal ACWY booster.' },
  gebelik: { etiket: 'Pregnancy (each pregnancy)', icerik: 'Influenza (any trimester); pertussis booster (20–32 weeks, up to delivery); RSV (from 28 weeks).' },
  yas65: { etiket: '65 years and over', icerik: 'Pneumococcal; annual influenza; herpes zoster (2 doses); COVID-19 (annually).' },
  yas75: { etiket: '75 years and over', icerik: 'RSV; COVID-19 (2 doses annually).' },
}

/**
 * THE NATIONAL IMMUNISATION PROGRAM SCHEDULE, as a record. CORE (every doctor role): switched on by the owner's
 * instruction of 2026-10-13 (NOTYA-ARACLAR-DENETIM-02) — the arithmetic and its source are ./tanimlar.ts. A tick
 * records that the milestone's visit happened; the date beside it is optional and the doctor's own.
 */
export const AU_ASI_TAKVIMI_ARACI: PaketAraci = {
  anahtar: 'au-immunisation-schedule',
  roller: null,
  metin: {
    ad: m('National Immunisation Program schedule'),
    aciklama: m('A record of the National Immunisation Program (NIP) schedule’s milestones, from birth to the recommended vaccines of later life. Tick a milestone once it is done and, if you wish, the date. This is a record, not a reminder: it works out no catch-up schedule and no eligibility, and it does not name which brand or exact risk-based addition was given — read those from the schedule itself.'),
    alanlar: Object.fromEntries(AU_ASI_TAKVIMI_MADDELERI.flatMap((k) => [[k, m(`${AU_ASI_SATIRLARI[k].etiket} — ${AU_ASI_SATIRLARI[k].icerik}`)], [`${k}_tarih`, m(`Date given (${AU_ASI_SATIRLARI[k].etiket.toLowerCase()})`)]])),
    // One label per milestone's date, for the RESULT line once it is kept (./tanimlar.ts `tarihler`) — distinct from
    // `alanlar` above, which labels the typed field itself (lib/ulke/araclar/tipler.ts, `AracMetni.tarihler`).
    tarihler: Object.fromEntries(AU_ASI_TAKVIMI_MADDELERI.map((k) => [`${k}_tarih`, m(`Date given (${AU_ASI_SATIRLARI[k].etiket.toLowerCase()})`)])),
    sayilar: { isaretli: m('Milestones recorded') },
    not: m('A record of the national schedule’s milestones, kept by this product; it is not a reminder service and sends nothing to the patient. Source: Australian Government Department of Health, Disability and Ageing, National Immunisation Program Schedule.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Australian Government Department of Health, Disability and Ageing',
    kaynak: 'https://www.health.nsw.gov.au/schedule (read 2026-10-13): NSW Health’s published rendering of the Australian Government’s National Immunisation Program Schedule, current as at 1 October 2026; the Department’s own PDF refused this session’s automated reader (robots-disallowed).',
    bildirim: m('Content: Australian Government Department of Health, Disability and Ageing, National Immunisation Program Schedule, as published by NSW Health, current as at 1 October 2026.'),
  },
}

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
