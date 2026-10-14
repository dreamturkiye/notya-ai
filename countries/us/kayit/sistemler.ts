/**
 * Record and prescribing services, only where a page was opened on 14 October 2026.
 * `bagli: false`: this product calls none of them.
 * Surescripts and state prescription-monitoring programs were not opened that day, so they are not listed.
 */
export type UsKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const US_KAYIT_SISTEMLERI: readonly UsKayitSistemi[] = [
  {
    anahtar: 'blue-button',
    ad: 'CMS Blue Button',
    adres: 'https://bluebutton.cms.gov/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'A standards-based API for Medicare Part A, B, and D claims. The homepage says it covers more than 60 million people with Medicare.',
    kayit: [
      'The homepage offers a developer sandbox and says a person with Medicare allows a third-party app to see the data.',
      'The developer documentation URL was not retrieved on 14 October 2026, so the conformance tests, the production contract, and the exact registration fields are not stated here.',
      'This product has no sandbox account and makes no call.',
    ],
  },
  {
    anahtar: 'tefca',
    ad: 'Trusted Exchange Framework and Common Agreement',
    adres: 'https://rce.sequoiaproject.org/tefca/',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'A common agreement for nationwide exchange of electronic health information across health information networks. The page says Common Agreement version 2.1 was released in November 2024.',
    kayit: [
      'The page says applications to be designated a Qualified Health Information Network are accepted on a rolling basis.',
      'The application form itself was not opened, so its fields are not stated here.',
      'This product has not applied and makes no call.',
    ],
  },
]
