/**
 * Record and prescribing services, only where a page was opened on 14 October 2026.
 * `bagli: false`: this product calls none of them.
 */
export type CaKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const CA_KAYIT_SISTEMLERI: readonly CaKayitSistemi[] = [
  {
    anahtar: 'prescribeit',
    ad: 'PrescribeIT',
    adres: 'https://www.prescribeit.ca/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'The homepage presents it as the country\'s electronic prescription service and points to a standards working group for the national prescribing standard.',
    kayit: [
      'The homepage says access to the national prescribing standard is by joining the ePrescribing Standards Working Group.',
      'It does not state a production contract, a conformance test, or the fields of a registration form.',
      'Provincial record systems were not opened on 14 October 2026, so they are not listed.',
      'This product has not joined and makes no call.',
    ],
  },
]
