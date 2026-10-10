/**
 * NOTYA-ULKE-DENETIM-01b — HOW A DAY AND A TIME OF DAY ARE TYPED in a country build. Pure and client-safe: the
 * pack's pattern and clock come in as arguments, nothing is read from the browser.
 *
 * WHY. A browser's own date and time fields (`type="date"`, `type="time"`, `type="datetime-local"`) are drawn in
 * the order and clock of the BROWSER's language, not the country's: on screens that look identical, the same
 * keystrokes gave 7 March in one browser and 3 July in another. The kit therefore draws its own fields
 * (components/ulke/girdi/): one small labelled field per part, in the order of the pack's own date pattern
 * (`bicim.tarihDeseni`), and the pack's own clock (`uygulama.saatBicimi`). This file is the reading half.
 *
 * NOTHING IS GUESSED. A day is a real day of the calendar with a four-digit year, or it is not a day: 31 February,
 * a two-digit year and a half-typed date are all "not a day". A time on a 12-hour clock needs its half of the day
 * said out loud; 12 before noon is midnight (00) and 12 after noon is noon (12).
 *
 * WHAT IS STORED DOES NOT CHANGE: a day is 'YYYY-MM-DD' and a time of day is 24-hour 'HH:MM', exactly what the
 * browser's own fields handed over before.
 */
import { gunGecerli } from '../uygulama/zaman'

/** What a field of the kit hands its screen in place of a value while what is typed is not a day / not a time. */
export const GIRDI_GECERSIZ = 'gecersiz'

/**
 * 'bos' nothing typed · 'yarim' typed in part, may still become a value · 'gecersiz' cannot be a value ·
 * 'tamam' a value.
 */
export type GirdiDurumu = 'bos' | 'yarim' | 'gecersiz' | 'tamam'

/** What a field hands its screen: '' for nothing, the value, or GIRDI_GECERSIZ. Never a half-read value. */
export const girdiDegeri = (o: { durum: GirdiDurumu; deger: string }): string => (o.durum === 'tamam' ? o.deger : o.durum === 'bos' ? '' : GIRDI_GECERSIZ)

const rakam = (ham: string, azami: number): string => ham.replace(/\D/g, '').slice(0, azami)
const iki = (n: number | string): string => String(n).padStart(2, '0')

// ───────────────────────── a day ─────────────────────────

export type TarihParcasi = 'DD' | 'MM' | 'YYYY'
export type TarihParcalari = Readonly<Record<TarihParcasi, string>>
export const BOS_TARIH: TarihParcalari = { DD: '', MM: '', YYYY: '' }
export const PARCA_UZUNLUGU: Readonly<Record<TarihParcasi, number>> = { DD: 2, MM: 2, YYYY: 4 }

/** The order of the parts and the mark between them, read from the pack's pattern: 'MM/DD/YYYY' → MM, DD, YYYY and '/'. */
export function tarihDuzeni(tarihDeseni: string): { sira: readonly TarihParcasi[]; ayrac: string } {
  const sira = (tarihDeseni.match(/DD|MM|YYYY/g) ?? []) as TarihParcasi[]
  const ayrac = tarihDeseni.replace(/DD|MM|YYYY/g, '')[0] ?? ''
  if (sira.length !== 3 || new Set(sira).size !== 3 || !ayrac) throw new Error(`[ulke/zamanGirdisi] "${tarihDeseni}" is not a date pattern: DD, MM and YYYY once each with one separator`)
  return { sira, ayrac }
}

/** Digits only, cut to the part's length: what a part's field holds whatever is typed or pasted into it. */
export const tarihParcasiYaz = (parca: TarihParcasi, ham: string): string => rakam(ham, PARCA_UZUNLUGU[parca])

/** A stored day → the three parts as they are shown. Anything that is not a real day → three empty parts. */
export function gundenParcalar(gun: unknown): TarihParcalari {
  if (!gunGecerli(gun)) return BOS_TARIH
  const [YYYY, MM, DD] = (gun as string).split('-')
  return { DD, MM, YYYY }
}

/** The three parts as typed → the day ('YYYY-MM-DD') or why there is none. */
export function tarihOku(p: TarihParcalari): { durum: GirdiDurumu; deger: string } {
  const yok = (durum: GirdiDurumu) => ({ durum, deger: '' })
  if (!p.DD && !p.MM && !p.YYYY) return yok('bos')
  if ([p.DD, p.MM, p.YYYY].some((x) => /\D/.test(x)) || p.DD.length > 2 || p.MM.length > 2 || p.YYYY.length > 4) return yok('gecersiz')
  const g = p.DD === '' ? null : Number(p.DD)
  const a = p.MM === '' ? null : Number(p.MM)
  // What can no longer become a day is said at once: a month 13, a day 32, a day or month 00.
  if ((g !== null && (g > 31 || (g === 0 && p.DD.length === 2))) || (a !== null && (a > 12 || (a === 0 && p.MM.length === 2)))) return yok('gecersiz')
  if (g === null || a === null || p.YYYY.length < 4 || g === 0 || a === 0) return yok('yarim')
  const deger = `${p.YYYY}-${iki(a)}-${iki(g)}`
  return gunGecerli(deger) ? { durum: 'tamam', deger } : yok('gecersiz')
}

// ───────────────────────── a time of day ─────────────────────────

export type SaatBicimi = 24 | 12
/** The half of the day on a 12-hour clock: 'oo' before noon, 'os' after noon, '' not chosen. Never read on a 24-hour clock. */
export type GunYarisi = '' | 'oo' | 'os'
export type SaatParcalari = Readonly<{ saat: string; dakika: string; yari: GunYarisi }>
export const BOS_SAAT: SaatParcalari = { saat: '', dakika: '', yari: '' }

export const saatParcasiYaz = (ham: string): string => rakam(ham, 2)

/** A stored time of day ('HH:MM', 24-hour) → the parts as the pack's clock shows them. Anything else → empty parts. */
export function saattenParcalar(saat: unknown, bicim: SaatBicimi): SaatParcalari {
  const m = typeof saat === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(saat.trim()) : null
  if (!m) return BOS_SAAT
  const s = Number(m[1])
  if (s > 23 || Number(m[2]) > 59) return BOS_SAAT
  if (bicim === 24) return { saat: iki(s), dakika: m[2], yari: '' }
  return { saat: String(s % 12 || 12), dakika: m[2], yari: s < 12 ? 'oo' : 'os' }
}

/** The parts as typed → the time of day ('HH:MM', 24-hour) or why there is none. The minute is always two digits. */
export function saatOku(p: SaatParcalari, bicim: SaatBicimi): { durum: GirdiDurumu; deger: string } {
  const yok = (durum: GirdiDurumu) => ({ durum, deger: '' })
  if (!p.saat && !p.dakika && (bicim === 24 || !p.yari)) return yok('bos')
  if (/\D/.test(p.saat) || /\D/.test(p.dakika) || p.saat.length > 2 || p.dakika.length > 2) return yok('gecersiz')
  const s = p.saat === '' ? null : Number(p.saat)
  const d = p.dakika === '' ? null : Number(p.dakika)
  if (d !== null && d > 59) return yok('gecersiz')
  if (s !== null && (bicim === 24 ? s > 23 : s > 12 || (s === 0 && p.saat.length === 2))) return yok('gecersiz')
  if (s === null || d === null || p.dakika.length < 2) return yok('yarim')
  if (bicim === 24) return { durum: 'tamam', deger: `${iki(s)}:${p.dakika}` }
  // A 12-hour clock has no hour 0, and says nothing without its half of the day.
  if (s === 0 || !p.yari) return yok('yarim')
  return { durum: 'tamam', deger: `${iki((s % 12) + (p.yari === 'os' ? 12 : 0))}:${p.dakika}` }
}
