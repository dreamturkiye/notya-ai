/**
 * UNITED STATES — a record of the 2025 child and adolescent immunization age table.
 * The age grid was read on 14 October 2026. Catch-up intervals, the medical-indication
 * table, contraindications, and the adult schedule were not loaded. A tick records a
 * dose. It does not choose a product and it does not calculate a catch-up.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-US'
const m = (metin: string): BicimliMetin => ({ [D]: metin })

export const US_ASI_SAYFASI = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html'
const CDC = 'Centers for Disease Control and Prevention'
const MALZEME = 'https://www.cdc.gov/other/agencymaterials.html'

const ASILAR: readonly { anahtar: string; etiket: string }[] = [
  { anahtar: 'birth_hepb', etiket: 'Birth: hepatitis B, dose 1.' },
  { anahtar: 'birth_rsv_mab', etiket: 'Birth: RSV monoclonal antibody, 1 dose depending on maternal RSV vaccination status. The table says see the notes.' },
  { anahtar: 'm2_rota', etiket: '2 months: rotavirus, dose 1. The table says one product is a 2-dose series and another is a 3-dose series. This tick does not choose the product.' },
  { anahtar: 'm2_dtap', etiket: '2 months: diphtheria, tetanus, and acellular pertussis, dose 1.' },
  { anahtar: 'm2_hib', etiket: '2 months: Hib, dose 1.' },
  { anahtar: 'm2_pcv', etiket: '2 months: pneumococcal conjugate, 15 or 20 serotypes, dose 1. This tick does not choose the product.' },
  { anahtar: 'm2_ipv', etiket: '2 months: inactivated poliovirus, dose 1.' },
  { anahtar: 'm4_rota', etiket: '4 months: rotavirus, dose 2.' },
  { anahtar: 'm4_dtap', etiket: '4 months: diphtheria, tetanus, and acellular pertussis, dose 2.' },
  { anahtar: 'm4_hib', etiket: '4 months: Hib, dose 2.' },
  { anahtar: 'm4_pcv', etiket: '4 months: pneumococcal conjugate, dose 2.' },
  { anahtar: 'm4_ipv', etiket: '4 months: inactivated poliovirus, dose 2.' },
  { anahtar: 'm6_dtap', etiket: '6 months: diphtheria, tetanus, and acellular pertussis, dose 3.' },
  { anahtar: 'm6_pcv', etiket: '6 months: pneumococcal conjugate, dose 3.' },
  { anahtar: 'm6_rota', etiket: '6 months: rotavirus. The table says see the notes and does not state a dose number on that cell.' },
  { anahtar: 'hepb_3', etiket: 'Hepatitis B, dose 3, in the span the table marks from 6 months through 18 months. This tick does not pick the month.' },
  { anahtar: 'ipv_3', etiket: 'Inactivated poliovirus, dose 3, in the span the table marks from 6 months through 18 months. This tick does not pick the month.' },
  { anahtar: 'flu', etiket: 'Influenza. Inactivated: from 6 months, 1 or 2 doses annually, then 1 dose annually from age 7. Live attenuated: from age 2, 1 or 2 doses annually, then 1 dose annually. This tick does not choose the product.' },
  { anahtar: 'covid', etiket: 'COVID-19 from 6 months. The table says see the notes. This tick does not choose a product.' },
  { anahtar: 'hib_boost', etiket: '12 through 15 months: Hib, dose 3 or 4. The table says see the notes.' },
  { anahtar: 'pcv_4', etiket: '12 through 15 months: pneumococcal conjugate, dose 4.' },
  { anahtar: 'mmr_1', etiket: '12 through 15 months: measles, mumps, and rubella, dose 1.' },
  { anahtar: 'var_1', etiket: '12 through 15 months: varicella, dose 1.' },
  { anahtar: 'hepa', etiket: 'From 12 months: hepatitis A, a 2-dose series. The table says see the notes.' },
  { anahtar: 'rsv_mab_later', etiket: '8 through 19 months: RSV monoclonal antibody, 1 dose. The table says see the notes.' },
  { anahtar: 'dtap_5', etiket: '4 through 6 years: diphtheria, tetanus, and acellular pertussis, dose 5.' },
  { anahtar: 'ipv_4', etiket: '4 through 6 years: inactivated poliovirus, dose 4.' },
  { anahtar: 'mmr_2', etiket: '4 through 6 years: measles, mumps, and rubella, dose 2.' },
  { anahtar: 'var_2', etiket: '4 through 6 years: varicella, dose 2.' },
  { anahtar: 'tdap', etiket: '11 through 12 years: tetanus, diphtheria, and acellular pertussis, 1 dose.' },
  { anahtar: 'hpv', etiket: '11 through 12 years: human papillomavirus. The table says see the notes and does not state a dose count on that cell.' },
  { anahtar: 'men_1', etiket: '11 through 12 years: meningococcal groups A, C, W, and Y, dose 1.' },
  { anahtar: 'men_2', etiket: '16 years: meningococcal groups A, C, W, and Y, dose 2.' },
  { anahtar: 'menb', etiket: 'Meningococcal B. At 11 through 12 years the table says see the notes and does not state a dose count on that cell.' },
]

export const US_ASI_ANAHTARLARI = ASILAR.map((a) => a.anahtar)

export const US_ASI: AracTanimi = kontrolListesi({
  anahtar: 'us-immunization-schedule',
  maddeler: US_ASI_ANAHTARLARI,
  uyarilar: ['kayit', 'notlar'],
  uyari: () => ['kayit', 'notlar'],
  kaynak: `${CDC}. Child and Adolescent Immunization Schedule by Age, recommendations for ages 18 years or younger, United States, 2025. Addendum updated July 2, 2025. Page updated July 2, 2025. Opened 14 October 2026. ${US_ASI_SAYFASI}`,
})

export function usAsiAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'us-immunization-schedule',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Child and adolescent immunization record'),
      aciklama: m('Tick a row from the 2025 child and adolescent age table. One tick is a dose you are recording. The tool does not work out a catch-up, and it does not choose a product.'),
      alanlar: Object.fromEntries(ASILAR.map((a) => [a.anahtar, m(a.etiket)])),
      sayilar: { isaretli: m('Rows ticked') },
      uyarilar: {
        kayit: m('A tick records a dose given. It is not an appointment and it is not a catch-up calculation.'),
        notlar: m('The page says the table must be read with its notes. Those notes, the catch-up table, and the medical-indication table are not loaded here.'),
      },
      not: m('Ages 19 and older are not on this record: that schedule page was not opened. Dengue, mpox, and RSV vaccine in pregnancy are on the child and adolescent page as special rows and are not ticks here. Product names on the page are not shown. Diagnosis and treatment are the doctor\'s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: CDC,
      kaynak: `Schedule page read 2026-10-14 (${US_ASI_SAYFASI}). Agency materials page read 2026-10-10 (${MALZEME}): most information on CDC sites may be used without permission; credit the agency; the use must not imply endorsement; say the material is available from the agency at no charge. The addendum is named in the page title and its own text was not a separate section of the page read.`,
      bildirim: m('Source: Centers for Disease Control and Prevention, "Child and Adolescent Immunization Schedule by Age" (United States, 2025; page updated July 2, 2025), available on the CDC website at no charge. Use of this material does not imply endorsement of this product by CDC, ATSDR, HHS or the United States Government.'),
    },
  }
}
