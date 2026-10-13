/**
 * National public holidays under the Fair Work NES, plus King's Birthday by state or territory.
 * NES days: 1 January, 26 January, Good Friday, Easter Monday, 25 April, 25 December, 26 December,
 * and the King's birthday on the day that state or territory observes
 * (https://www.fairwork.gov.au/tools-and-resources/fact-sheets/minimum-workplace-entitlements/public-holidays).
 * 2026 dates checked against https://www.fairwork.gov.au/employment-conditions/public-holidays/2026-public-holidays
 * (read 2026-10-13). Anzac Day on a weekend has an extra Monday in the ACT, New South Wales and
 * Western Australia that year, and not in the other states. Australia Day on a weekend moves to
 * the following Monday. Other state days (labour day, show days) are omitted: the dates differ
 * and several are still proclaimed. A lawyer and a clinician have not signed this list.
 */
import { gunEkle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { aralikta, iso, ninciHaftaGunu, paskalya, sonHaftaGunu, sonrakiPazartesi, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

const KRAL_HAZIRAN = new Set(['act', 'nsw', 'nt', 'sa', 'tas', 'vic'])

function haftaSonu(tarih: string, ad: string, ekstraPazartesi: boolean): ResmiGun[] {
  const h = haftaGunu(tarih)
  if (h < 6) return [{ tarih, ad }]
  const pazartesi = sonrakiPazartesi(tarih)
  return ekstraPazartesi ? [{ tarih, ad }, { tarih: pazartesi, ad, inceleme: true }] : [{ tarih, ad }]
}

function noel(yil: number): ResmiGun[] {
  const noelGunu = iso(yil, 12, 25)
  const boks = iso(yil, 12, 26)
  const gunler = [...haftaSonu(noelGunu, 'Christmas Day', false), ...haftaSonu(boks, 'Boxing Day', false)]
  if (haftaGunu(boks) === 6) gunler.push({ tarih: gunEkle(boks, 2), ad: 'Boxing Day', inceleme: true })
  if (haftaGunu(noelGunu) === 7) gunler.push({ tarih: gunEkle(noelGunu, 2), ad: 'Christmas Day', inceleme: true })
  if (haftaGunu(noelGunu) === 6) gunler.push({ tarih: gunEkle(noelGunu, 2), ad: 'Christmas Day', inceleme: true }, { tarih: gunEkle(boks, 2), ad: 'Boxing Day', inceleme: true })
  return gunler
}

function yilGunleri(bolge: string, yil: number): ResmiGun[] {
  const pazar = paskalya(yil)
  const anzacEk = bolge === 'national' || bolge === 'act' || bolge === 'nsw' || bolge === 'wa'
  const gunler: ResmiGun[] = [
    ...haftaSonu(iso(yil, 1, 1), "New Year's Day", true),
    ...haftaSonu(sonrakiPazartesi(iso(yil, 1, 26)) === iso(yil, 1, 26) ? iso(yil, 1, 26) : sonrakiPazartesi(iso(yil, 1, 26)), 'Australia Day', false),
    { tarih: gunEkle(pazar, -2), ad: 'Good Friday' },
    { tarih: gunEkle(pazar, 1), ad: 'Easter Monday' },
    ...haftaSonu(iso(yil, 4, 25), 'Anzac Day', anzacEk),
    ...noel(yil),
  ]
  if (KRAL_HAZIRAN.has(bolge)) gunler.push({ tarih: ninciHaftaGunu(yil, 6, 1, 2), ad: "King's Birthday" })
  if (bolge === 'wa') gunler.push({ tarih: sonHaftaGunu(yil, 9, 1), ad: "King's Birthday" })
  if (bolge === 'qld') gunler.push({ tarih: ninciHaftaGunu(yil, 10, 1, 1), ad: "King's Birthday" })
  return gunler
}

export const AU_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: [
    { kod: 'national', ad: 'National' },
    { kod: 'act', ad: 'Australian Capital Territory' },
    { kod: 'nsw', ad: 'New South Wales' },
    { kod: 'nt', ad: 'Northern Territory' },
    { kod: 'qld', ad: 'Queensland' },
    { kod: 'sa', ad: 'South Australia' },
    { kod: 'tas', ad: 'Tasmania' },
    { kod: 'vic', ad: 'Victoria' },
    { kod: 'wa', ad: 'Western Australia' },
  ],
  varsayilan: 'national',
  gunler: (bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap((yil) => yilGunleri(bolge, yil)), bas, bit),
  kaynak: 'Fair Work Act NES public holidays; Fair Work Ombudsman 2026 public holidays, https://www.fairwork.gov.au/employment-conditions/public-holidays/2026-public-holidays (read 2026-10-13). King\'s Birthday: second Monday in June (ACT, NSW, NT, SA, TAS, VIC), last Monday in September (WA), first Monday in October (QLD).',
  inceleme: 'Labour days, show days and part-day Christmas Eve are omitted. The extra Monday for a weekend Anzac Day follows the 2026 Fair Work split (ACT, NSW, WA, and the national default) and should be confirmed for later years. Weekend Christmas and Boxing Day extra Mondays are marked for review. A lawyer and a clinician have not signed this list.',
}
