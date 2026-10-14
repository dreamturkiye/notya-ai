/**
 * Record and prescribing services, only where a page was opened on 14 October 2026.
 * `bagli: false`: this product calls none of them.
 * Marketing counts on the DMED homepage are not repeated here.
 */
export type UzKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const UZ_KAYIT_SISTEMLERI: readonly UzKayitSistemi[] = [
  {
    anahtar: 'dmed',
    ad: 'DMED',
    adres: 'https://dmed.uz/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'The homepage calls DMED the single operator of digital health in Uzbekistan, on the basis of Presidential Decree No. 415, and says it digitises state and private clinics and electronic prescriptions.',
    kayit: [
      'The homepage offers developers an API, integrations, and access to data. It does not state a registration form, a conformance test, or a contract.',
      'A product card on the same page describes forming and issuing electronic prescriptions, and names pharmacy-system names. No developer contract for that card was opened.',
      'This product has no account and makes no call.',
    ],
  },
  {
    anahtar: 'mygov',
    ad: 'my.gov.uz',
    adres: 'https://my.gov.uz/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'The page describes itself as the single portal of state services for citizens, entrepreneurs, and organisations.',
    kayit: [
      'The HTML that was saved does not describe an electronic-prescription module and does not state how a third-party product registers.',
      'This product has no account and makes no call.',
    ],
  },
]
