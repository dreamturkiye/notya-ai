/**
 * UNITED KINGDOM — medicines, a prescription note, the routine immunisation schedule, and notifiable diseases.
 * Each row was taken from a page or workbook opened on 14 October 2026. No dose is calculated. Nothing is sent.
 *
 * SWITCHED ON WITHOUT A CLINICIAN'S SIGN-OFF. Listed in ./onaysiz-araclar.json.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, kontrolListesi, metin, sayi, secim } from '@/lib/ulke/araclar/yardimci'
import { GB_ILACLAR, GB_ILAC_KAYIT, gbIlacAnahtari, gbIlacBul, gbIlacCumlesi } from './referans/ilaclar'

const D = 'en-GB'
const m = (metin: string) => ({ [D]: metin })

const ILAC_ANAHTARLARI = GB_ILACLAR.map((r) => gbIlacAnahtari(r.rank))
const ILAC_CUMLELERI = Object.fromEntries(GB_ILACLAR.map((r) => [gbIlacAnahtari(r.rank), m(gbIlacCumlesi(r))]))

const ILAC_KAYNAK = `NHS Business Services Authority, Prescription Cost Analysis – England ${GB_ILAC_KAYIT.year}, national summary tables. Workbook ${GB_ILAC_KAYIT.sourceUrl}. Portal ${GB_ILAC_KAYIT.portalUrl}. Retrieved ${GB_ILAC_KAYIT.retrieved}. ${GB_ILAC_KAYIT.licence}.`

function ilacSonucu(anahtar: unknown, uyarilar: readonly string[]) {
  const satir = gbIlacBul(anahtar)
  if (!satir) return BOS_SONUC
  return {
    tamam: true,
    sayilar: [{ anahtar: 'sira', deger: satir.rank, ondalik: 0, enCok: GB_ILACLAR.length }],
    bant: gbIlacAnahtari(satir.rank),
    uyarilar,
    tarihler: [],
  }
}

const ILAC_LISANS = {
  durum: 'serbest' as const,
  hakSahibi: 'Crown copyright (NHS Business Services Authority)',
  kaynak: `The dataset page states the Open Government Licence 3.0. Opened 2026-10-14: ${GB_ILAC_KAYIT.portalUrl}. The workbook is ${GB_ILAC_KAYIT.sourceUrl}.`,
  bildirim: m('Source: NHS Business Services Authority, Prescription Cost Analysis – England 2025/26, national summary tables (chemical substances and the single highest-volume presentation of each). Open Government Licence v3.0. Chapters 1 to 15 only. Appliances are not listed. No dose and no controlled-drug schedule are in this table.'),
}

// ───────────────────────── medicines: a closed list of 250 ─────────────────────────

export const GB_ILAC_LISTESI: AracTanimi = {
  anahtar: 'gb-medicine-list',
  tur: 'liste',
  alanlar: [secim('kimyasal', ILAC_ANAHTARLARI)],
  cikti: { sayilar: ['sira'], bantlar: ILAC_ANAHTARLARI, uyarilar: ['takvim_yok'], tarihler: [] },
  kaynak: ILAC_KAYNAK,
  hesapla: (g) => ilacSonucu(g.kimyasal, ['takvim_yok']),
}

const ILAC_LISTESI: PaketAraci = {
  anahtar: 'gb-medicine-list',
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('Medicines dispensed most often in England'),
    aciklama: m('The 250 chemical substances with the most items dispensed in the community in England in 2025/26, chapters 1 to 15 of the BNF classification. Choosing one shows that row: the highest-volume presentation, its unit of measure, and NHS reimbursement. It is a closed list. A medicine that is not on it cannot be recorded here.'),
    alanlar: { kimyasal: m('Chemical substance') },
    secenekler: { kimyasal: ILAC_CUMLELERI },
    sayilar: { sira: m('Rank by items dispensed') },
    bantlar: ILAC_CUMLELERI,
    uyarilar: { takvim_yok: m('This table states no controlled-drug schedule and no dose.') },
    not: m('Community dispensing in England, submitted to the NHS Business Services Authority. Not a prescribing decision, and not the full list of medicines.'),
  },
  lisans: ILAC_LISANS,
}

// ───────────────────────── prescription note: the same list, plus words the doctor writes ─────────────────────────

export const GB_RECETE_NOTU: AracTanimi = {
  anahtar: 'gb-prescription-note',
  tur: 'liste',
  alanlar: [
    secim('kimyasal', ILAC_ANAHTARLARI),
    sayi('miktar', 0.01, 9999, { istege: true }),
    metin('yon'),
  ],
  cikti: { sayilar: ['sira'], bantlar: ILAC_ANAHTARLARI, uyarilar: ['takvim_yok', 'iletilmedi'], tarihler: [] },
  kaynak: ILAC_KAYNAK,
  hesapla: (g) => ilacSonucu(g.kimyasal, ['takvim_yok', 'iletilmedi']),
}

const RECETE_NOTU: PaketAraci = {
  anahtar: 'gb-prescription-note',
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('Prescription note (not sent)'),
    aciklama: m('A note of one chemical from the same England 2025/26 list, plus a quantity and directions you type yourself. The quantity is not a dose the tool suggests. The note is not sent anywhere.'),
    alanlar: {
      kimyasal: m('Chemical substance'),
      miktar: m('Quantity you are writing'),
      yon: m('Directions you are writing'),
    },
    secenekler: { kimyasal: ILAC_CUMLELERI },
    sayilar: { sira: m('Rank by items dispensed') },
    bantlar: ILAC_CUMLELERI,
    uyarilar: {
      takvim_yok: m('This table states no controlled-drug schedule and no dose.'),
      iletilmedi: m('This note is not sent to the Electronic Prescription Service.'),
    },
    not: m('Not an FP10, not a controlled-drug writing rule, and not a nomination of a dispenser. The prescription form and the controlled-drug rules are still for the prescriber to follow outside this note.'),
  },
  lisans: ILAC_LISANS,
}

// ───────────────────────── routine immunisation: one tick per row of the routine table ─────────────────────────

const ASI_SAYFASI = 'https://www.gov.uk/government/publications/the-complete-routine-immunisation-schedule/complete-routine-immunisation-schedule-from-1-july-2026'

/** Age, diseases and a non-proprietary description. Trade names from that page are not copied. Cohort words are inside the label; the tool does not choose a cohort. */
const ASILAR: readonly { anahtar: string; etiket: string }[] = [
  { anahtar: 'w8_hex', etiket: '8 weeks: diphtheria, tetanus, pertussis, polio, Hib and hepatitis B (6-in-1). Thigh.' },
  { anahtar: 'w8_menb', etiket: '8 weeks: meningococcal group B. Thigh.' },
  { anahtar: 'w8_rota', etiket: '8 weeks: rotavirus, by mouth. The page says this dose is given only after the severe combined immunodeficiency screening result.' },
  { anahtar: 'w12_hex', etiket: '12 weeks: diphtheria, tetanus, pertussis, polio, Hib and hepatitis B (6-in-1). Thigh.' },
  { anahtar: 'w12_menb', etiket: '12 weeks: meningococcal group B. Thigh.' },
  { anahtar: 'w12_rota', etiket: '12 weeks: rotavirus, by mouth.' },
  { anahtar: 'w16_hex', etiket: '16 weeks: diphtheria, tetanus, pertussis, polio, Hib and hepatitis B (6-in-1). Thigh.' },
  { anahtar: 'w16_pcv', etiket: '16 weeks: pneumococcal conjugate vaccine (13 serotypes). Thigh.' },
  { anahtar: 'y1', etiket: '1 year, on or after the first birthday: pneumococcal conjugate vaccine, meningococcal group B, and measles, mumps, rubella and varicella. Upper arm or thigh.' },
  { anahtar: 'm18', etiket: '18 months. Born on or after 1 July 2024: the 6-in-1, and measles, mumps, rubella and varicella. Born on or before 30 June 2024: no appointment at this age. This tick does not choose the cohort.' },
  { anahtar: 'y3', etiket: '3 years 4 months. Born on or after 1 January 2025: diphtheria, tetanus, pertussis and polio. Born on or before 31 December 2024: that vaccine, and measles, mumps, rubella and varicella. Upper arm. This tick does not choose the cohort.' },
  { anahtar: 'hpv', etiket: '12 to 13 years: human papillomavirus. Upper arm.' },
  { anahtar: 'y14_td', etiket: '14 years, school year 9: tetanus, diphtheria and polio. Upper arm.' },
  { anahtar: 'y14_men', etiket: '14 years, school year 9: meningococcal groups A, C, W and Y. Upper arm.' },
  { anahtar: 'y65_pneu', etiket: '65 years: pneumococcal polysaccharide vaccine (23 serotypes), or pneumococcal conjugate vaccine (20 serotypes) once the polysaccharide stock is exhausted. Upper arm. The tick does not choose the product.' },
  { anahtar: 'y65_flu', etiket: '65 years and older: inactivated influenza vaccine, each autumn from September. Upper arm.' },
  { anahtar: 'shingles_65', etiket: 'Turning 65 on or after 1 September, from 1 September 2023: shingles vaccine. Upper arm.' },
  { anahtar: 'shingles_70', etiket: '70 to 79 years, and severely immunosuppressed adults over 18: shingles vaccine. Upper arm.' },
  { anahtar: 'rsv_75', etiket: '75 years, and every adult resident in a care home for older adults: respiratory syncytial virus vaccine. Upper arm.' },
  { anahtar: 'child_flu', etiket: 'The eligible child age group in the annual flu letter: live attenuated influenza vaccine, or inactivated influenza vaccine where the live vaccine is contraindicated. The page says the live vaccine contains porcine gelatine.' },
]

export const GB_ASI_ANAHTARLARI = ASILAR.map((a) => a.anahtar)

export const GB_ASI_TAKVIMI: AracTanimi = kontrolListesi({
  anahtar: 'gb-immunisation-schedule',
  maddeler: GB_ASI_ANAHTARLARI,
  uyarilar: ['kayit'],
  uyari: () => ['kayit'],
  kaynak: `UK Health Security Agency. Complete routine immunisation schedule from 1 September 2026. GOV.UK, updated 24 September 2026, opened 14 October 2026. ${ASI_SAYFASI}`,
})

const ASI_TAKVIMI: PaketAraci = {
  anahtar: 'gb-immunisation-schedule',
  roller: null,
  metin: {
    ad: m('Routine immunisation schedule (record)'),
    aciklama: m('Tick a routine row from the UK Health Security Agency schedule that starts on 1 September 2026. One tick is a dose you are recording. The tool does not work out a catch-up, and it does not choose a product.'),
    alanlar: Object.fromEntries(ASILAR.map((a) => [a.anahtar, m(a.etiket)])),
    sayilar: { isaretli: m('Routine rows ticked') },
    uyarilar: { kayit: m('A tick records a dose given. It is not an appointment and it is not a catch-up calculation.') },
    not: m('Selective offers on the same page are not ticks here: hepatitis B at birth, BCG, vaccines in pregnancy, and extra vaccines for some medical conditions. Trade names are not shown. Green Book chapters are not copied.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Crown copyright (UK Health Security Agency)',
    kaynak: `The schedule page was opened 2026-10-14 (${ASI_SAYFASI}). GOV.UK pages are available under the Open Government Licence v3.0 except where the page says otherwise. That page says third-party copyright needs permission from the holders: trade names are omitted here. For the lawyer: whether the age, disease and site rows, without trade names, are covered.`,
    bildirim: m('Source: UK Health Security Agency, "Complete routine immunisation schedule from 1 September 2026" (GOV.UK, updated 24 September 2026). Open Government Licence v3.0, except third-party copyright as that page states. Trade names are not shown.'),
  },
}

// ───────────────────────── notifiable diseases, England ─────────────────────────

type Bildirim = { anahtar: string; etiket: string; sinif: 'acil' | 'rutin' | 'kosullu' }

const BILDIRIM_SAYFASI = 'https://www.gov.uk/guidance/notifiable-diseases-and-causative-organisms-how-to-report'

/** The page's own marks. A row that is not a single word "routine" or "urgent" is conditional. */
const HASTALIKLAR: readonly Bildirim[] = [
  { anahtar: 'encephalitis', sinif: 'rutin', etiket: 'Acute encephalitis — routine written report' },
  { anahtar: 'afp', sinif: 'acil', etiket: 'Acute flaccid paralysis or myelitis — urgent telephone report' },
  { anahtar: 'hepatitis', sinif: 'acil', etiket: 'Acute infectious hepatitis (A, B or C) — urgent telephone report' },
  { anahtar: 'meningitis', sinif: 'acil', etiket: 'Acute meningitis — urgent telephone report' },
  { anahtar: 'polio', sinif: 'acil', etiket: 'Acute poliomyelitis — urgent telephone report' },
  { anahtar: 'anthrax', sinif: 'acil', etiket: 'Anthrax — urgent telephone report' },
  { anahtar: 'botulism', sinif: 'acil', etiket: 'Botulism — urgent telephone report' },
  { anahtar: 'brucellosis', sinif: 'kosullu', etiket: 'Brucellosis — routine written report, urgent if acquired in the United Kingdom' },
  { anahtar: 'chickenpox', sinif: 'rutin', etiket: 'Chickenpox — routine written report' },
  { anahtar: 'cholera', sinif: 'acil', etiket: 'Cholera — urgent telephone report' },
  { anahtar: 'congenital_syphilis', sinif: 'rutin', etiket: 'Congenital syphilis — routine written report' },
  { anahtar: 'covid', sinif: 'rutin', etiket: 'COVID-19 — routine written report' },
  { anahtar: 'cjd', sinif: 'rutin', etiket: 'Creutzfeldt-Jakob disease — routine written report' },
  { anahtar: 'gonococcal', sinif: 'rutin', etiket: 'Disseminated gonococcal infection — routine written report' },
  { anahtar: 'diphtheria', sinif: 'acil', etiket: 'Diphtheria — urgent telephone report' },
  { anahtar: 'enteric_fever', sinif: 'acil', etiket: 'Enteric fever — urgent telephone report' },
  { anahtar: 'food_poisoning', sinif: 'kosullu', etiket: 'Food poisoning — routine written report, urgent if a cluster or an outbreak' },
  { anahtar: 'hus', sinif: 'acil', etiket: 'Haemolytic uraemic syndrome — urgent telephone report' },
  { anahtar: 'hantavirus', sinif: 'acil', etiket: 'Hantavirus disease — urgent telephone report' },
  { anahtar: 'bloody_diarrhoea', sinif: 'acil', etiket: 'Infectious bloody diarrhoea — urgent telephone report' },
  { anahtar: 'zoonotic_flu', sinif: 'acil', etiket: 'Influenza of zoonotic origin — urgent telephone report' },
  { anahtar: 'igas', sinif: 'acil', etiket: 'Invasive group A streptococcal disease — urgent telephone report' },
  { anahtar: 'legionnaires', sinif: 'acil', etiket: 'Legionnaires\' disease — urgent telephone report' },
  { anahtar: 'leprosy', sinif: 'rutin', etiket: 'Leprosy — routine written report' },
  { anahtar: 'malaria', sinif: 'kosullu', etiket: 'Malaria — routine written report, urgent if acquired in the United Kingdom' },
  { anahtar: 'measles', sinif: 'acil', etiket: 'Measles — urgent telephone report' },
  { anahtar: 'meningococcal', sinif: 'acil', etiket: 'Meningococcal septicaemia — urgent telephone report' },
  { anahtar: 'mers', sinif: 'acil', etiket: 'Middle East respiratory syndrome — urgent telephone report' },
  { anahtar: 'mpox', sinif: 'acil', etiket: 'Mpox — urgent telephone report' },
  { anahtar: 'mumps', sinif: 'rutin', etiket: 'Mumps — routine written report' },
  { anahtar: 'neonatal_herpes', sinif: 'rutin', etiket: 'Neonatal herpes — routine written report' },
  { anahtar: 'plague', sinif: 'acil', etiket: 'Plague — urgent telephone report' },
  { anahtar: 'rabies', sinif: 'acil', etiket: 'Rabies — urgent telephone report' },
  { anahtar: 'rubella', sinif: 'rutin', etiket: 'Rubella — routine written report' },
  { anahtar: 'sars', sinif: 'acil', etiket: 'Severe acute respiratory syndrome — urgent telephone report' },
  { anahtar: 'scarlet_fever', sinif: 'rutin', etiket: 'Scarlet fever — routine written report' },
  { anahtar: 'smallpox', sinif: 'acil', etiket: 'Smallpox — urgent telephone report' },
  { anahtar: 'tetanus', sinif: 'kosullu', etiket: 'Tetanus — routine written report, urgent if linked to injecting-drug use' },
  { anahtar: 'tuberculosis', sinif: 'kosullu', etiket: 'Tuberculosis — routine written report, urgent if the person is a healthcare worker, a cluster is suspected, or the organism is multidrug resistant' },
  { anahtar: 'typhus', sinif: 'rutin', etiket: 'Typhus — routine written report' },
  { anahtar: 'vhf', sinif: 'acil', etiket: 'Viral haemorrhagic fever — urgent telephone report' },
  { anahtar: 'whooping_cough', sinif: 'kosullu', etiket: 'Whooping cough — urgent telephone report in the acute phase, routine written report if diagnosed later' },
  { anahtar: 'yellow_fever', sinif: 'kosullu', etiket: 'Yellow fever — routine written report, urgent if acquired in the United Kingdom' },
]

const hastalik = (sinif: Bildirim['sinif']) => new Set(HASTALIKLAR.filter((h) => h.sinif === sinif).map((h) => h.anahtar))
const ACIL = hastalik('acil')
const KOSULLU = hastalik('kosullu')

export const GB_HASTALIK_ANAHTARLARI = HASTALIKLAR.map((h) => h.anahtar)

export const GB_BILDIRIM: AracTanimi = kontrolListesi({
  anahtar: 'gb-notifiable-diseases',
  maddeler: GB_HASTALIK_ANAHTARLARI,
  bantlar: ['acil', 'kosullu', 'rutin'],
  bant: (secili) => (secili.some((k) => ACIL.has(k)) ? 'acil' : secili.some((k) => KOSULLU.has(k)) ? 'kosullu' : 'rutin'),
  uyarilar: ['yirmi_dort_saat', 'kosulu_oku'],
  uyari: (secili) => [...(secili.some((k) => ACIL.has(k)) ? ['yirmi_dort_saat'] : []), ...(secili.some((k) => KOSULLU.has(k)) ? ['kosulu_oku'] : [])],
  kaynak: `UK Health Security Agency. Notifiable diseases and causative organisms: how to report. GOV.UK, published 12 September 2024, last updated 19 May 2026, opened 14 October 2026. ${BILDIRIM_SAYFASI}`,
})

const BILDIRIM: PaketAraci = {
  anahtar: 'gb-notifiable-diseases',
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('Notifiable diseases (England)'),
    aciklama: m('The diseases a registered medical practitioner in England must report, as the UK Health Security Agency page lists them. Urgent rows are telephoned within 24 hours. Every case is also reported on the online service within 3 days. This list does not send the report.'),
    alanlar: Object.fromEntries(HASTALIKLAR.map((h) => [h.anahtar, m(h.etiket)])),
    sayilar: { isaretli: m('Diseases ticked') },
    bantlar: {
      acil: m('At least one ticked disease is marked urgent: telephone the local health protection team within 24 hours'),
      kosullu: m('At least one ticked disease is not a single routine or urgent mark, and none of the ticked diseases is marked urgent on its own: read that row'),
      rutin: m('Every ticked disease is marked routine: report on the online service within 3 days'),
    },
    uyarilar: {
      yirmi_dort_saat: m('Telephone the local UK Health Security Agency health protection team within 24 hours. Do not wait for laboratory confirmation.'),
      kosulu_oku: m('A ticked row is routine in some cases and urgent in others. The words on that row are the page\'s own condition.'),
    },
    not: m('England. The page names the Public Health (Control of Disease) Act 1984 and the Health Protection (Notification) Regulations 2010 and 2025. Causative organisms that are notifiable from laboratories are a separate list and are not ticks here.'),
  },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Crown copyright (UK Health Security Agency)',
    kaynak: `The notification page was opened 2026-10-14 (${BILDIRIM_SAYFASI}). GOV.UK pages are available under the Open Government Licence v3.0 except where the page says otherwise. The tool copies the disease names and the urgent or routine mark. It copies no form.`,
    bildirim: m('Source: UK Health Security Agency, "Notifiable diseases and causative organisms: how to report" (GOV.UK, last updated 19 May 2026). Open Government Licence v3.0 unless that page states otherwise.'),
  },
}

// ───────────────────────── Electronic Prescription Service: a link, no call ─────────────────────────

export const GB_EPS_ADRESI = 'https://digital.nhs.uk/services/electronic-prescription-service'

const EPS: PaketAraci = {
  anahtar: 'gb-eps-link',
  roller: [], sinif: 'hekimler',
  metin: {
    ad: m('Electronic Prescription Service (link)'),
    aciklama: m('Opens the NHS England page about the Electronic Prescription Service. This product does not send a prescription and does not sign in to that service.'),
    alanlar: {},
    not: m('The page says the service sends a prescription to a dispenser the patient has nominated, and that it is not itself a clinical prescribing system. Nothing from the patient file is sent.'),
    baglanti: m('Open the Electronic Prescription Service page'),
  },
  baglanti: { adres: GB_EPS_ADRESI },
  lisans: {
    durum: 'serbest',
    hakSahibi: 'Crown copyright (NHS England)',
    kaynak: 'A link only. The page was opened 2026-10-14: https://digital.nhs.uk/services/electronic-prescription-service. No call is made to the service.',
    bildirim: m('The Electronic Prescription Service is an NHS England service. This tile only links to its page.'),
  },
}

export const GB_TIBBI_TANIMLARI: readonly AracTanimi[] = [GB_ILAC_LISTESI, GB_RECETE_NOTU, GB_ASI_TAKVIMI, GB_BILDIRIM]
export const GB_TIBBI_ARACLARI: readonly PaketAraci[] = [ILAC_LISTESI, RECETE_NOTU, ASI_TAKVIMI, BILDIRIM, EPS]
