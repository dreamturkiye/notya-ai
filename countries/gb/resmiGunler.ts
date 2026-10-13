/**
 * Bank holidays, by nation, from https://www.gov.uk/bank-holidays (read 2026-10-13) and the
 * Banking and Financial Dealings Act 1971. A weekend bank holiday is taken on the next weekday.
 * Christmas and Boxing Day, and Scotland's 1 and 2 January, follow the substitute days on that page.
 * The 2026 World Cup bank holiday is on the Scotland list only.
 * A lawyer and a clinician have not signed this list.
 */
import { gunEkle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { aralikta, iso, ninciHaftaGunu, paskalya, sonHaftaGunu, sonrakiPazartesi, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

function noel(yil: number): ResmiGun[] {
  const noelGunu = iso(yil, 12, 25)
  const boks = iso(yil, 12, 26)
  const h = haftaGunu(noelGunu)
  if (h === 6) return [{ tarih: gunEkle(noelGunu, 2), ad: 'Christmas Day' }, { tarih: gunEkle(boks, 2), ad: 'Boxing Day' }]
  if (h === 7) return [{ tarih: boks, ad: 'Boxing Day' }, { tarih: gunEkle(noelGunu, 2), ad: 'Christmas Day' }]
  if (haftaGunu(boks) === 6) return [{ tarih: noelGunu, ad: 'Christmas Day' }, { tarih: gunEkle(boks, 2), ad: 'Boxing Day' }]
  if (haftaGunu(boks) === 7) return [{ tarih: noelGunu, ad: 'Christmas Day' }, { tarih: gunEkle(boks, 1), ad: 'Boxing Day' }]
  return [{ tarih: noelGunu, ad: 'Christmas Day' }, { tarih: boks, ad: 'Boxing Day' }]
}

/** 1 January, and in Scotland 2 January, on the substitute weekdays gov.uk publishes. */
function ocak(yil: number, ikinci: boolean): ResmiGun[] {
  const bir = iso(yil, 1, 1)
  const h = haftaGunu(bir)
  if (!ikinci) return [{ tarih: h === 6 ? gunEkle(bir, 2) : h === 7 ? gunEkle(bir, 1) : bir, ad: "New Year's Day" }]
  if (h === 6) return [{ tarih: gunEkle(bir, 2), ad: "New Year's Day" }, { tarih: gunEkle(bir, 3), ad: '2nd January' }]
  if (h === 7) return [{ tarih: gunEkle(bir, 1), ad: "New Year's Day" }, { tarih: gunEkle(bir, 2), ad: '2nd January' }]
  const iki = iso(yil, 1, 2)
  return [{ tarih: bir, ad: "New Year's Day" }, { tarih: sonrakiPazartesi(iki) === iki ? iki : sonrakiPazartesi(iki), ad: '2nd January' }]
}

function ortak(yil: number, paskalyaPazartesi: boolean, yaz: string): ResmiGun[] {
  const pazar = paskalya(yil)
  const gunler: ResmiGun[] = [
    { tarih: gunEkle(pazar, -2), ad: 'Good Friday' },
    { tarih: ninciHaftaGunu(yil, 5, 1, 1), ad: 'Early May bank holiday' },
    { tarih: sonHaftaGunu(yil, 5, 1), ad: 'Spring bank holiday' },
    { tarih: yaz, ad: 'Summer bank holiday' },
    ...noel(yil),
  ]
  if (paskalyaPazartesi) gunler.push({ tarih: gunEkle(pazar, 1), ad: 'Easter Monday' })
  return gunler
}

function yilGunleri(bolge: string, yil: number): ResmiGun[] {
  if (bolge === 'scotland') {
    const gunler = [...ocak(yil, true), ...ortak(yil, false, ninciHaftaGunu(yil, 8, 1, 1)), { tarih: sonrakiPazartesi(iso(yil, 11, 30)), ad: "St Andrew's Day" }]
    if (yil === 2026) gunler.push({ tarih: '2026-06-15', ad: 'World Cup bank holiday' })
    return gunler
  }
  if (bolge === 'northern-ireland') {
    return [
      ...ocak(yil, false),
      ...ortak(yil, true, sonHaftaGunu(yil, 8, 1)),
      { tarih: sonrakiPazartesi(iso(yil, 3, 17)), ad: "St Patrick's Day" },
      { tarih: sonrakiPazartesi(iso(yil, 7, 12)), ad: 'Battle of the Boyne' },
    ]
  }
  return [...ocak(yil, false), ...ortak(yil, true, sonHaftaGunu(yil, 8, 1))]
}

export const GB_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: [
    { kod: 'england-wales', ad: 'England and Wales' },
    { kod: 'scotland', ad: 'Scotland' },
    { kod: 'northern-ireland', ad: 'Northern Ireland' },
  ],
  varsayilan: 'england-wales',
  gunler: (bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap((yil) => yilGunleri(bolge === 'scotland' || bolge === 'northern-ireland' ? bolge : 'england-wales', yil)), bas, bit),
  kaynak: 'https://www.gov.uk/bank-holidays (read 2026-10-13); Banking and Financial Dealings Act 1971. A weekend bank holiday moves to the next weekday. Scotland 15 June 2026 is the one-off on the Scotland list.',
  inceleme: 'A lawyer and a clinician have not signed this list. Early May is proclaimed year by year; the first Monday of May is what gov.uk shows for 2026-2028.',
}
