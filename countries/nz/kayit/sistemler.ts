/**
 * Record and prescribing services, only where a page was opened on 14 October 2026.
 * `bagli: false`: this product calls none of them.
 */
export type NzKayitSistemi = {
  anahtar: string
  ad: string
  adres: string
  bagli: false
  okundu: string
  neIcin: string
  kayit: readonly string[]
}

export const NZ_KAYIT_SISTEMLERI: readonly NzKayitSistemi[] = [
  {
    anahtar: 'nzeps',
    ad: 'New Zealand ePrescription Service',
    adres: 'https://www.tewhatuora.govt.nz/health-services-and-programmes/digital-health/emedicines-and-the-new-zealand-e-prescription-service',
    bagli: false,
    okundu: '2026-10-14',
    neIcin: 'A messaging channel: the prescriber generates a prescription, it goes to the service broker, and a community pharmacy downloads it. The page names clinical systems that already use the service.',
    kayit: [
      'The page does not state a registration form, a conformance test, or a contract for a new product.',
      'The NHI, Hira, and the Health Identity APIs were not opened on 14 October 2026, so they are not listed.',
      'This product makes no call.',
    ],
  },
]
