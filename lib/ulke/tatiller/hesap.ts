/**
 * Date rules the country lists share: Easter, the n-th weekday, and weekend observance.
 * No country and no calendar date is named here.
 */
import { gunEkle, haftaGunu } from '../uygulama/zaman'

export function iso(yil: number, ay: number, gun: number): string {
  return `${String(yil).padStart(4, '0')}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`
}

/** Easter Sunday in the Gregorian calendar (Anonymous / Meeus). */
export function paskalya(yil: number): string {
  const a = yil % 19
  const b = Math.floor(yil / 100)
  const c = yil % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const ay = Math.floor((h + l - 7 * m + 114) / 31)
  const gun = ((h + l - 7 * m + 114) % 31) + 1
  return iso(yil, ay, gun)
}

/** The n-th ISO weekday of a month. 1 = Monday … 7 = Sunday. n starts at 1. */
export function ninciHaftaGunu(yil: number, ay: number, gunIso: number, n: number): string {
  const ilk = iso(yil, ay, 1)
  const kayma = (gunIso - haftaGunu(ilk) + 7) % 7
  return iso(yil, ay, 1 + kayma + (n - 1) * 7)
}

/** The last ISO weekday of a month. 1 = Monday … 7 = Sunday. */
export function sonHaftaGunu(yil: number, ay: number, gunIso: number): string {
  const sonraki = ay === 12 ? iso(yil + 1, 1, 1) : iso(yil, ay + 1, 1)
  const son = gunEkle(sonraki, -1)
  return gunEkle(son, -((haftaGunu(son) - gunIso + 7) % 7))
}

/** Saturday moves to the Friday before it. Sunday moves to the Monday after it. */
export function oncekiCumaSonrakiPazartesi(tarih: string): string {
  const h = haftaGunu(tarih)
  if (h === 6) return gunEkle(tarih, -1)
  if (h === 7) return gunEkle(tarih, 1)
  return tarih
}

/** A Saturday or a Sunday moves to the following Monday. A weekday stays. */
export function sonrakiPazartesi(tarih: string): string {
  const h = haftaGunu(tarih)
  if (h === 6) return gunEkle(tarih, 2)
  if (h === 7) return gunEkle(tarih, 1)
  return tarih
}

export function yillar(bas: string, bit: string): number[] {
  const out: number[] = []
  for (let y = Number(bas.slice(0, 4)); y <= Number(bit.slice(0, 4)); y++) out.push(y)
  return out
}

export function aralikta<T extends { tarih: string; ad: string }>(gunler: readonly T[], bas: string, bit: string): T[] {
  return gunler.filter((g) => g.tarih >= bas && g.tarih <= bit).sort((a, b) => a.tarih.localeCompare(b.tarih) || a.ad.localeCompare(b.ad))
}
