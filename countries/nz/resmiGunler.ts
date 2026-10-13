/**
 * National public holidays and regional anniversary days.
 * Mondayisation and the national list: Employment New Zealand,
 * https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates
 * (read 2026-10-13), under the Holidays Act 2003 until the Employment Leave Act starts in August 2028.
 * Matariki dates: Te Kahui o Matariki Public Holiday Act 2022, schedule
 * (https://www.legislation.govt.nz). 2026, 2027 and 2028 are 10 July 2026, 25 June 2027 and 14 July 2028.
 * Canterbury Show Day is omitted: the observance rule is not a single weekday formula.
 * A lawyer and a clinician have not signed this list.
 */
import { gunEkle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { aralikta, iso, ninciHaftaGunu, paskalya, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

const MATARIKI: Record<number, string> = { 2026: '2026-07-10', 2027: '2027-06-25', 2028: '2028-07-14' }

function pazartesiye(tarih: string): string {
  const h = haftaGunu(tarih)
  if (h === 6) return gunEkle(tarih, 2)
  if (h === 7) return gunEkle(tarih, 1)
  return tarih
}

/** The two-day pair (New Year, Christmas): both weekend days land on the next Monday and Tuesday. */
function cift(bas: string, ad1: string, ad2: string): ResmiGun[] {
  const h = haftaGunu(bas)
  const ikinci = gunEkle(bas, 1)
  if (h === 6) return [{ tarih: gunEkle(bas, 2), ad: ad1 }, { tarih: gunEkle(bas, 3), ad: ad2 }]
  if (h === 7) return [{ tarih: gunEkle(bas, 1), ad: ad1 }, { tarih: gunEkle(bas, 2), ad: ad2 }]
  if (haftaGunu(ikinci) === 6) return [{ tarih: bas, ad: ad1 }, { tarih: gunEkle(ikinci, 2), ad: ad2 }]
  if (haftaGunu(ikinci) === 7) return [{ tarih: bas, ad: ad1 }, { tarih: gunEkle(ikinci, 1), ad: ad2 }]
  return [{ tarih: bas, ad: ad1 }, { tarih: ikinci, ad: ad2 }]
}

function enYakinPazartesi(tarih: string): string {
  const h = haftaGunu(tarih)
  if (h === 1) return tarih
  const geri = h - 1
  const ileri = h === 7 ? 1 : 8 - h
  return geri <= ileri ? gunEkle(tarih, -geri) : gunEkle(tarih, ileri)
}

function yildonumu(bolge: string, yil: number, isci: string, pazar: string): ResmiGun | null {
  if (bolge === 'auckland') return { tarih: enYakinPazartesi(iso(yil, 1, 29)), ad: 'Auckland Anniversary' }
  if (bolge === 'wellington') return { tarih: enYakinPazartesi(iso(yil, 1, 22)), ad: 'Wellington Anniversary' }
  if (bolge === 'nelson') return { tarih: enYakinPazartesi(iso(yil, 2, 1)), ad: 'Nelson Anniversary' }
  if (bolge === 'taranaki') return { tarih: ninciHaftaGunu(yil, 3, 1, 2), ad: 'Taranaki Anniversary' }
  if (bolge === 'otago') return { tarih: enYakinPazartesi(iso(yil, 3, 23)), ad: 'Otago Anniversary' }
  if (bolge === 'southland') return { tarih: gunEkle(pazar, 2), ad: 'Southland Anniversary' }
  if (bolge === 'hawkes-bay') return { tarih: gunEkle(isci, -3), ad: "Hawke's Bay Anniversary" }
  if (bolge === 'marlborough') return { tarih: gunEkle(isci, 7), ad: 'Marlborough Anniversary' }
  if (bolge === 'south-canterbury') return { tarih: ninciHaftaGunu(yil, 9, 1, 4), ad: 'South Canterbury Anniversary', inceleme: true }
  if (bolge === 'westland') return { tarih: enYakinPazartesi(iso(yil, 12, 1)), ad: 'Westland Anniversary' }
  if (bolge === 'chatham') return { tarih: enYakinPazartesi(iso(yil, 11, 30)), ad: 'Chatham Islands Anniversary' }
  return null
}

function yilGunleri(bolge: string, yil: number): ResmiGun[] {
  const pazar = paskalya(yil)
  const isci = ninciHaftaGunu(yil, 10, 1, 4)
  const matariki = MATARIKI[yil]
  const gunler: ResmiGun[] = [
    ...cift(iso(yil, 1, 1), "New Year's Day", 'Day after New Year\'s Day'),
    { tarih: pazartesiye(iso(yil, 2, 6)), ad: 'Waitangi Day' },
    { tarih: gunEkle(pazar, -2), ad: 'Good Friday' },
    { tarih: gunEkle(pazar, 1), ad: 'Easter Monday' },
    { tarih: pazartesiye(iso(yil, 4, 25)), ad: 'Anzac Day' },
    { tarih: ninciHaftaGunu(yil, 6, 1, 1), ad: "King's Birthday" },
    { tarih: isci, ad: 'Labour Day' },
    ...cift(iso(yil, 12, 25), 'Christmas Day', 'Boxing Day'),
  ]
  if (matariki) gunler.push({ tarih: matariki, ad: 'Matariki' })
  const yerel = yildonumu(bolge, yil, isci, pazar)
  if (yerel) gunler.push(yerel)
  return gunler
}

export const NZ_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: [
    { kod: 'national', ad: 'National' },
    { kod: 'auckland', ad: 'Auckland' },
    { kod: 'wellington', ad: 'Wellington' },
    { kod: 'taranaki', ad: 'Taranaki' },
    { kod: 'nelson', ad: 'Nelson' },
    { kod: 'hawkes-bay', ad: "Hawke's Bay" },
    { kod: 'marlborough', ad: 'Marlborough' },
    { kod: 'westland', ad: 'Westland' },
    { kod: 'otago', ad: 'Otago' },
    { kod: 'southland', ad: 'Southland' },
    { kod: 'south-canterbury', ad: 'South Canterbury' },
    { kod: 'chatham', ad: 'Chatham Islands' },
  ],
  varsayilan: 'national',
  gunler: (bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap((yil) => yilGunleri(bolge, yil)), bas, bit),
  kaynak: 'Employment New Zealand public holidays and anniversary dates (read 2026-10-13), https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates . Holidays Act 2003 mondayisation. Matariki: Te Kahui o Matariki Public Holiday Act 2022 schedule, https://www.legislation.govt.nz .',
  inceleme: 'The national default includes no anniversary day. Canterbury Show Day is omitted. South Canterbury (fourth Monday in September) is marked for a local check. Mondayisation here is the observed weekday for someone who does not work the weekend. A lawyer and a clinician have not signed this list.',
}
