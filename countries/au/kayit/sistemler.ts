/**
 * Record and prescribing services. `bagli: false`: this product calls none of them.
 * Pages that did not load on 14 October 2026 are not given registration steps.
 */
export type AuKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const AU_KAYIT_SISTEMLERI: readonly AuKayitSistemi[] = [
  {
    anahtar: 'my-health-record',
    ad: 'My Health Record',
    adres: 'https://www.digitalhealth.gov.au/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'The national health record. The provider pages timed out on 14 October 2026. An earlier pass the same day received HTTP 500.',
    kayit: [
      'No registration form, conformance test, or contract was on a page that loaded.',
      'This product has no account and makes no call.',
    ],
  },
  {
    anahtar: 'erx',
    ad: 'eRx',
    adres: 'https://www.erx.com.au/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'An electronic prescription exchange. The homepage returned HTTP 403 on 14 October 2026.',
    kayit: [
      'No registration steps were readable.',
      'This product has no account and makes no call.',
    ],
  },
]
