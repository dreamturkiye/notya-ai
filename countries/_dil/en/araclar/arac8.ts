/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — THE ENGLISH LANGUAGE SET: ROLE TOOLS, eighth part. Four obstetric and gynaecological
 * records (lib/ulke/araclar/tanimlar/kdTaramalar.ts): thyroid in pregnancy, the HPV vaccine record, SMA carrier screening
 * and the PMS / PMDD diary summary. Obstetrics and gynaecology only.
 *
 * MACHINE-WRITTEN. AWAITS CLINICAL REVIEW IN EACH COUNTRY. Written in en-GB spelling. Switched on where a country states
 * `kdTaramalari`, with ITS numbers (`parametreler`), ITS HPV schedule (`tablolar.hpv_takvimi`) and ITS source lines
 * (`degisen.not`) — each country's countries/<code>/kdTaramalar.ts. No line here names a national programme: that is the
 * country's. No dose anywhere: the levothyroxine note is the clinician's own words.
 *
 * THE DIARY IS ORIGINAL: the Daily Record of Severity of Problems (DRSP, Endicott 2006) was not used because a licence for
 * commercial software could not be confirmed (the form read carries "© pending, Jean Endicott, Ph.D. and Wilma Harrison,
 * M.D." and no terms of use). The eleven domains are this product's own wording, each mapped to a DSM-5-TR criterion group
 * (B1–B4, C1–C7); no criterion text is reproduced.
 */
import type { HamArac } from './yardimci'

const KD = ['obstetrics-gynaecology'] as const
type S = Readonly<Record<string, string>>

const DURUM: S = { yok: 'No known thyroid disease', hipotiroidi: 'Hypothyroidism on levothyroxine', hipertiroidi: 'Hyperthyroidism / Graves\' disease', antikor_pozitif: 'Euthyroid, TPO or Tg antibody positive' }
export const EN_PMDD_ALAN: S = {
  b1: 'B1 sudden mood swings, tearful or sensitive', b2: 'B2 irritable, angry or arguing', b3: 'B3 low, hopeless or self-critical', b4: 'B4 tense, anxious or on edge',
  c1: 'C1 less interest in usual activities', c2: 'C2 hard to concentrate', c3: 'C3 tired or low in energy', c4: 'C4 appetite change, overeating or cravings',
  c5: 'C5 sleeping too much or too little', c6: 'C6 overwhelmed or out of control', c7: 'C7 physical (breast tenderness, bloating, aches, feeling of weight gain)',
}
const KRITER: S = {
  kriter_a: 'A — in most cycles, 5 or more symptoms in the final week before menses, improving within a few days of onset, minimal or absent in the week after',
  kriter_b: 'B — at least one is a mood symptom (swings, irritability, low mood, anxiety)',
  kriter_c: 'C — further symptoms reach 5 in total',
  kriter_d: 'D — clinically significant distress or interference with work, school, social life or relationships',
  kriter_e: 'E — not merely a worsening of another disorder (major depression, panic disorder, a personality disorder…)',
  kriter_f: 'F — confirmed by prospective daily ratings over at least two symptomatic cycles (otherwise "provisional")',
  kriter_g: 'G — not due to a substance, a medicine or another medical condition (for example hyperthyroidism)',
}
const YONETIM: S = {
  yonetim_ssri_surekli: 'SSRI, continuous (medicine and dose: yours)', yonetim_ssri_luteal: 'SSRI, luteal phase only (medicine and dose: yours)',
  yonetim_kombine_oral_kontraseptif: 'Combined oral contraceptive (preparation: yours; check eligibility)', yonetim_bilissel_davranisci_terapi: 'Cognitive behavioural therapy (referral)',
  yonetim_gnrh_agonist_addback: 'Severe symptoms: GnRH agonist with add-back (specialist decision)',
}
const diaryAlanlari = (): S => {
  const out: Record<string, string> = {}
  for (const c of [1, 2]) {
    out[`d${c}_adet`] = `Cycle ${c}: first day of the period`
    for (const [k, v] of Object.entries(EN_PMDD_ALAN)) { out[`d${c}_${k}_once`] = `Cycle ${c} · ${v} — highest in the 7 days before the period`; out[`d${c}_${k}_sonra`] = `Cycle ${c} · ${v} — highest in the 7 days after bleeding stopped` }
  }
  return out
}

export const EN_ARACLAR_8: readonly HamArac[] = [
  {
    anahtar: 'gebelik-tiroid', roller: KD,
    ad: 'Thyroid in pregnancy: TSH and free T4 by trimester',
    aciklama: 'TSH and free T4 of a pregnant woman against the right range: the laboratory\'s own pregnancy or trimester range first, otherwise this country\'s stated fallback. The booking-visit prompt, follow-up points for the recorded thyroid status, and your own levothyroxine note (no dose is suggested).',
    alanlar: {
      tarih: 'Date of the sample', gebelik_haftasi: 'Completed weeks of pregnancy on that day', tsh: 'TSH (mIU/L)',
      lab_tsh_alt: 'Laboratory pregnancy / trimester TSH range: lower limit', lab_tsh_ust: 'Laboratory pregnancy / trimester TSH range: upper limit',
      gd_tsh_alt: 'Laboratory NON-pregnant TSH range: lower limit', gd_tsh_ust: 'Laboratory NON-pregnant TSH range: upper limit',
      ft4: 'Free T4 (in the laboratory\'s unit)', lab_ft4_alt: 'Laboratory trimester free T4 range: lower limit', lab_ft4_ust: 'Laboratory trimester free T4 range: upper limit',
      tiroid_durumu: 'Thyroid status in this pregnancy', lt4_notu: 'Levothyroxine adjustment: your own note (no dose is suggested)',
    },
    secenekler: { tiroid_durumu: DURUM },
    sayilar: { tsh_alt: 'TSH range used: lower limit (mIU/L)', tsh_ust: 'TSH range used: upper limit (mIU/L)', hedef_ust: 'Treatment target: TSH below (mIU/L)' },
    bantlar: { tsh_aralikta: 'TSH within the range used', tsh_yuksek: 'TSH above the range used', tsh_dusuk: 'TSH below the range used', tsh_aralik_yok: 'No range: enter the laboratory\'s pregnancy / trimester range (no fallback for this week)' },
    uyarilar: {
      tarama_istemi: 'Booking visit: no TSH recorded yet. See the screening position under the result.',
      ft4_yuksek: 'Free T4 above the laboratory\'s trimester range.', ft4_dusuk: 'Free T4 below the laboratory\'s trimester range.',
      ft4_aralik_yok: 'Free T4 is flagged only against a method- and trimester-specific laboratory range; enter it.',
      hedef_ustu: 'On levothyroxine: TSH above the treatment target of the source.',
      kaynak_laboratuvar: 'Range: the laboratory\'s own pregnancy / trimester range.', kaynak_yedek_duzeltilmis: 'Range: first-trimester fallback applied to the laboratory\'s non-pregnant range.',
      kaynak_yedek_gebelik_disi: 'Range: the non-pregnant range, as the source allows for this trimester.', kaynak_yedek_sabit: 'Range: the source\'s fixed upper limit for when no other range is available.',
      takip_hipotiroidi: 'Treated hypothyroidism: TSH at the source\'s interval (dates below), and a postpartum check.',
      takip_hipertiroidi: 'Hyperthyroidism: free T4 / total T4 and TSH at the source\'s interval.',
      takip_antikor: 'Antibody positive, euthyroid: TSH at the source\'s interval through mid-pregnancy.',
      trab_pencere: 'TSH-receptor antibody windows: early pregnancy after ablative treatment; weeks 18–22 if raised or on antithyroid drugs; weeks 30–34 if raised at 18–22 or on antithyroid drugs in the third trimester.',
      lt4_hekim_notu: 'The levothyroxine adjustment is yours: no amount is suggested here.',
    },
    tarihler: { tarih: 'Sample', sonraki_tsh: 'Next TSH', tsh_ek: 'TSH near week 30', trab_1: 'TRAb window (first)', trab_2: 'TRAb window (second)', sonraki_tft: 'Next thyroid function test' },
    not: 'Sources: American Thyroid Association 2017 guideline on thyroid disease in pregnancy and the postpartum (Thyroid 2017;27:315-389): Recommendations 2, 11, 26, 33, 37, 48a, 52, 96–97. A decision-support tool: diagnosis, medicines and doses are the doctor\'s.',
  },
  {
    anahtar: 'hpv-asi-kaydi', roller: KD,
    ad: 'HPV vaccine record',
    aciklama: 'The doses given (type and dates) and the schedule by age at the first dose and immune status, exactly as this country\'s source states it. The last cervical screen is kept beside it.',
    alanlar: {
      ilk_doz_yasi: 'Age at the first dose (years)', immun: 'Immune status', asi_tipi: 'Vaccine type',
      doz1_tarihi: 'Dose 1: date', doz2_tarihi: 'Dose 2: date', doz3_tarihi: 'Dose 3: date',
      son_serviks_tarihi: 'Last cervical screening test: date', son_serviks_sonucu: 'Last cervical screening test: result',
    },
    secenekler: { immun: { normal: 'Not immunocompromised', baskilanmis: 'Immunocompromised (including HIV)' }, asi_tipi: { '2v': 'Bivalent (2vHPV)', '4v': 'Quadrivalent (4vHPV)', '9v': 'Nonavalent (9vHPV)', bilinmiyor: 'Not known' } },
    sayilar: { gereken_doz: 'Doses the schedule needs', yapilan_doz: 'Doses recorded' },
    bantlar: { tamamlandi: 'Course complete for this schedule', devam: 'Course not complete', kural_yok: 'No row of the schedule for this age and status: the course is your decision' },
    uyarilar: {
      kisa_aralik_ek_doz: 'Two doses closer together than the source allows: a further dose is needed.', aralik_erken: 'A dose was given earlier than the shortest interval the source states.',
      sira_hatali: 'Dose numbers do not follow the dates: check the record.', aralik_belirtilmemis: 'The source states no interval for the next dose.',
    },
    tarihler: { sonraki_en_erken: 'Next dose: earliest', sonraki_en_gec: 'Next dose: latest', son_serviks: 'Last cervical screen' },
    not: 'A decision-support tool: the course is the doctor\'s.',
  },
  {
    anahtar: 'sma-tasiyicilik', roller: KD,
    ad: 'SMA carrier screening (prenatal record)',
    aciklama: 'Whether screening for spinal muscular atrophy carrier status was offered, declined or done; the laboratory\'s result and the SMN1 copy number exactly as reported; the prompt to test the partner after a carrier result; the referral to genetic counselling.',
    alanlar: {
      durum: 'Screening', tarih: 'Date', sonuc: 'Laboratory result (as reported)', smn1_kopya: 'SMN1 copy number (as written on the report, e.g. 1, 2, ≥3, 2+0)',
      es_durumu: 'Partner\'s test', es_sonucu: 'Partner\'s result (as reported)', es_smn1_kopya: 'Partner\'s SMN1 copy number (as written)', genetik_danisma: 'Genetic counselling',
    },
    secenekler: {
      durum: { teklif_edilmedi: 'Not offered', teklif_edildi: 'Offered', reddetti: 'Declined', yapildi: 'Done' },
      sonuc: { tasiyici: 'Carrier (laboratory report)', tasiyici_degil: 'Not a carrier (laboratory report)', belirsiz: 'Unclear / not interpretable' },
      es_durumu: { istenmedi: 'Not requested', istendi: 'Requested', yapildi: 'Done' },
      es_sonucu: { tasiyici: 'Carrier (laboratory report)', tasiyici_degil: 'Not a carrier (laboratory report)', belirsiz: 'Unclear / not interpretable' },
      genetik_danisma: { yonlendirildi: 'Referred', yonlendirilmedi: 'Not referred' },
    },
    bantlar: { teklif_edilmedi: 'Not offered', teklif_edildi: 'Offered', reddetti: 'Declined', yapildi_tasiyici: 'Done: carrier', yapildi_tasiyici_degil: 'Done: not a carrier', yapildi_belirsiz: 'Done: unclear result' },
    uyarilar: {
      es_testi_istemi: 'Carrier result: offer testing of the reproductive partner.', genetik_danisma_istemi: 'Refer for genetic counselling (reproductive options, prenatal diagnosis).',
      cift_tasiyici: 'Both partners reported as carriers.', kopya_yorumlanmaz: 'The copy number is kept as written and is not interpreted here: the laboratory\'s report decides carrier status.',
    },
    tarihler: { tarih: 'Screening' },
    not: 'A record and a prompt, not a result: carrier status is the laboratory\'s. A decision-support tool.',
  },
  {
    anahtar: 'pmdd-gunluk-ozeti', roller: KD,
    ad: 'PMS / PMDD: two-cycle diary summary and DSM-5-TR checklist',
    aciklama: 'From the patient\'s daily diary over two cycles, the highest rating (0 none … 5 severe) of each of eleven symptom domains in the 7 days before the period and the 7 days after bleeding stopped; the diary pattern per cycle; the DSM-5-TR criteria as your checklist; management options as ticks, no dose.',
    alanlar: { ...diaryAlanlari(), ...KRITER, ...YONETIM },
    sayilar: { dongu1_karsilayan: 'Cycle 1: domains with the pattern', dongu2_karsilayan: 'Cycle 2: domains with the pattern', oruntu_dongu: 'Cycles with the diary pattern' },
    bantlar: { tum_kriterler: 'Every criterion ticked', gecici: 'Every criterion except F ticked: "provisional"', eksik: 'Criteria still open' },
    uyarilar: {
      iki_dongu_oruntu: 'Two cycles show the diary pattern (5 or more domains, at least one mood domain, minimal after menses): supports criterion F.',
      tek_dongu: 'Fewer than two cycles show the diary pattern.',
      tani_hekimde: 'The diary\'s own reading: "marked" (mood domains) = 4–5, "present" = 2 or more, "minimal or absent" = 0–1 — a design choice of this diary, not a validated cut-off. The diagnosis is yours.',
    },
    tarihler: { d1_adet: 'Cycle 1: period', d2_adet: 'Cycle 2: period' },
    not: 'Structure: American Psychiatric Association, DSM-5-TR (2022), premenstrual dysphoric disorder. Management options: ACOG Clinical Practice Guideline No. 7 (2023), labelled international. An original diary: the DRSP was not used (commercial licence not confirmed).',
  },
]
