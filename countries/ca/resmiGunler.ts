/**
 * Federal general holidays under the Canada Labour Code, plus a province or territory selector.
 * Federal days: https://laws-lois.justice.gc.ca/eng/acts/L-2/section-193.html (s. 166 and s. 193, read 2026-10-13).
 * When New Year's Day, Canada Day, the National Day for Truth and Reconciliation, Remembrance Day,
 * Christmas Day or Boxing Day falls on a Saturday or a Sunday, s. 193(2) allows the working day
 * immediately before OR after. This calendar uses the Friday before a Saturday and the Monday
 * after a Sunday, and if that stacks two holidays on one date the later one moves to the next weekday.
 * Provincial days below are a draft for a local clinician. Civic holidays that are not statutory are omitted.
 */
import { gunEkle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { aralikta, iso, ninciHaftaGunu, oncekiCumaSonrakiPazartesi, paskalya, yillar } from '@/lib/ulke/tatiller/hesap'
import type { ResmiGun, ResmiGunKaynagi } from '@/lib/ulke/tatiller/tipler'

function gozle(tarih: string, ad: string, dolu: Set<string>): ResmiGun {
  let gun = oncekiCumaSonrakiPazartesi(tarih)
  while (dolu.has(gun)) gun = haftaGunu(gun) === 5 ? gunEkle(gun, 3) : gunEkle(gun, 1)
  dolu.add(gun)
  return { tarih: gun, ad }
}

/** Monday on or before 24 May (the Monday preceding 25 May). */
function victoria(yil: number): string {
  const gun = iso(yil, 5, 24)
  const h = haftaGunu(gun)
  return h === 1 ? gun : gunEkle(gun, -(h - 1))
}

function federal(yil: number): ResmiGun[] {
  const dolu = new Set<string>()
  const pazar = paskalya(yil)
  const sabit = (ay: number, g: number, ad: string) => gozle(iso(yil, ay, g), ad, dolu)
  const liste = [
    sabit(1, 1, "New Year's Day"),
    { tarih: gunEkle(pazar, -2), ad: 'Good Friday' },
    { tarih: victoria(yil), ad: 'Victoria Day' },
    sabit(7, 1, 'Canada Day'),
    { tarih: ninciHaftaGunu(yil, 9, 1, 1), ad: 'Labour Day' },
    sabit(9, 30, 'National Day for Truth and Reconciliation'),
    { tarih: ninciHaftaGunu(yil, 10, 1, 2), ad: 'Thanksgiving' },
    sabit(11, 11, 'Remembrance Day'),
    sabit(12, 25, 'Christmas Day'),
    sabit(12, 26, 'Boxing Day'),
  ]
  // 1 January of the next year can fall on a Saturday and be taken on 31 December of this year.
  const devir = gozle(iso(yil + 1, 1, 1), "New Year's Day", dolu)
  if (devir.tarih.startsWith(String(yil))) liste.push(devir)
  return liste.filter((g) => g.tarih.startsWith(String(yil)))
}

const AILE: Record<string, string> = {
  ab: 'Family Day',
  bc: 'Family Day',
  mb: 'Louis Riel Day',
  ns: 'Heritage Day',
  on: 'Family Day',
  pe: 'Islander Day',
  sk: 'Family Day',
}

function eyalet(bolge: string, yil: number): ResmiGun[] {
  const ad = AILE[bolge]
  const ekstra: ResmiGun[] = ad ? [{ tarih: ninciHaftaGunu(yil, 2, 1, 3), ad, inceleme: true }] : []
  if (bolge === 'nb') ekstra.push({ tarih: ninciHaftaGunu(yil, 8, 1, 1), ad: 'New Brunswick Day', inceleme: true })
  if (bolge === 'qc') ekstra.push({ tarih: haftaGunu(iso(yil, 6, 24)) >= 6 ? (haftaGunu(iso(yil, 6, 24)) === 6 ? gunEkle(iso(yil, 6, 24), 2) : gunEkle(iso(yil, 6, 24), 1)) : iso(yil, 6, 24), ad: 'Saint-Jean-Baptiste', inceleme: true })
  return ekstra
}

const BOLGELER = [
  { kod: 'federal', ad: 'Federal' },
  { kod: 'ab', ad: 'Alberta' },
  { kod: 'bc', ad: 'British Columbia' },
  { kod: 'mb', ad: 'Manitoba' },
  { kod: 'nb', ad: 'New Brunswick' },
  { kod: 'nl', ad: 'Newfoundland and Labrador' },
  { kod: 'ns', ad: 'Nova Scotia' },
  { kod: 'nt', ad: 'Northwest Territories' },
  { kod: 'nu', ad: 'Nunavut' },
  { kod: 'on', ad: 'Ontario' },
  { kod: 'pe', ad: 'Prince Edward Island' },
  { kod: 'qc', ad: 'Quebec' },
  { kod: 'sk', ad: 'Saskatchewan' },
  { kod: 'yt', ad: 'Yukon' },
] as const

export const CA_RESMI_GUNLER: ResmiGunKaynagi = {
  bolgeler: BOLGELER,
  varsayilan: 'federal',
  gunler: (bolge, bas, bit) => aralikta(yillar(bas, bit).flatMap((yil) => [...federal(yil), ...eyalet(bolge, yil)]), bas, bit),
  kaynak: 'Canada Labour Code, R.S.C. 1985, c. L-2, general holidays and s. 193(2), https://laws-lois.justice.gc.ca/eng/acts/L-2/section-193.html (read 2026-10-13). Weekend observance here is Friday for a Saturday and Monday for a Sunday.',
  inceleme: 'Provincial and territorial days are a draft (Family Day and the days like it, New Brunswick Day, Saint-Jean-Baptiste). Newfoundland and Labrador, the territories and Yukon add nothing beyond the federal list in this draft. A local clinician confirms the province.',
}
