/**
 * Federal holidays for a Monday-to-Friday office, 5 U.S.C. § 6103.
 * Observed dates checked against the Office of Personnel Management's schedule
 * (https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays), read 2026-10-13:
 * a Saturday is taken on the Friday before it, a Sunday on the Monday after it.
 * Inauguration Day is not in 2026, 2027 or 2028.
 * State holidays are not in this list. A lawyer and a clinician in the United States have not signed it.
 */
import { aralikta, iso, ninciHaftaGunu, oncekiCumaSonrakiPazartesi, sonHaftaGunu, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

function yilGunleri(yil: number): ResmiGun[] {
  const gun = (tarih: string, ad: string): ResmiGun => ({ tarih, ad })
  const sabit = (ay: number, g: number, ad: string) => gun(oncekiCumaSonrakiPazartesi(iso(yil, ay, g)), ad)
  return [
    gun(oncekiCumaSonrakiPazartesi(iso(yil, 1, 1)), "New Year's Day"),
    // 1 January of the next year falls on a Saturday: most offices take Friday 31 December of this year.
    gun(oncekiCumaSonrakiPazartesi(iso(yil + 1, 1, 1)), "New Year's Day"),
    gun(ninciHaftaGunu(yil, 1, 1, 3), 'Birthday of Martin Luther King, Jr.'),
    gun(ninciHaftaGunu(yil, 2, 1, 3), "Washington's Birthday"),
    gun(sonHaftaGunu(yil, 5, 1), 'Memorial Day'),
    sabit(6, 19, 'Juneteenth National Independence Day'),
    sabit(7, 4, 'Independence Day'),
    gun(ninciHaftaGunu(yil, 9, 1, 1), 'Labor Day'),
    gun(ninciHaftaGunu(yil, 10, 1, 2), 'Columbus Day'),
    sabit(11, 11, 'Veterans Day'),
    gun(ninciHaftaGunu(yil, 11, 4, 4), 'Thanksgiving Day'),
    sabit(12, 25, 'Christmas Day'),
  ].filter((g) => g.tarih.startsWith(String(yil)))
}

export const US_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: [{ kod: 'federal', ad: 'Federal' }],
  varsayilan: 'federal',
  gunler: (_bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap(yilGunleri), bas, bit),
  kaynak: '5 U.S.C. § 6103; OPM federal holidays, https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays (read 2026-10-13). Saturday to the Friday before, Sunday to the Monday after.',
  inceleme: 'Federal list only. State and local holidays are not included. A lawyer and a clinician have not signed this list.',
}
