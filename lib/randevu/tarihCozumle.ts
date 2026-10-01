/**
 * NOTYA-TAKVIM-TZ-01 (Kaan, 2026-09-29) — relative dates in the DOCTOR's timezone.
 *
 * Live: doctor in US Eastern, Tue 29 Sep 19:35 local, asked "Bugün hiçbir randevumuz var mı?" and
 * Ayşe answered for "30 Eylül 2026 Çarşamba". The server (Vercel, UTC) resolved "bugün" with
 * bugunTRT() — Europe/Istanbul was already on the 30th. Every "bugün / yarın / dün / öbür gün /
 * cuma / haftaya" now resolves in the IANA timezone the client sends (`saatDilimi`), falling
 * back to the `notya_tz` cookie, then Europe/Istanbul. Pure module: no next/headers, no DB.
 */
import { VARSAYILAN_SAAT_DILIMI, saatDilimiGecerliMi } from '@/lib/doktor/selam'

export function saatDilimiSec(...adaylar: Array<string | null | undefined>): string {
  for (const a of adaylar) if (saatDilimiGecerliMi(a)) return a
  return VARSAYILAN_SAAT_DILIMI
}

/** Calendar day (YYYY-MM-DD) of `simdi` in `tz`. */
export function bugunTz(tz: string, simdi: Date = new Date()): string {
  const dilim = saatDilimiSec(tz)
  return new Intl.DateTimeFormat('en-CA', { timeZone: dilim, year: 'numeric', month: '2-digit', day: '2-digit' }).format(simdi)
}

/** `offsetGun` days from today in `tz` (1 = tomorrow, -1 = yesterday). */
export function gunKaydirTz(offsetGun: number, tz: string, simdi: Date = new Date()): string {
  return isoGunKaydir(bugunTz(tz, simdi), offsetGun)
}

export function isoGunKaydir(iso: string, offsetGun: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + offsetGun)).toISOString().slice(0, 10)
}

/** 0 = Monday … 6 = Sunday for a YYYY-MM-DD (calendar arithmetic, tz-free). */
export function haftaGunuIndeksi(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay() + 6) % 7
}

/** UTC offset (minutes) of `tz` at instant `d`. */
function tzOffsetDakika(d: Date, tz: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d)
  const al = (t: string) => Number(p.find((x) => x.type === t)?.value || 0)
  const yerel = Date.UTC(al('year'), al('month') - 1, al('day'), al('hour') % 24, al('minute'), al('second'))
  return Math.round((yerel - d.getTime()) / 60000)
}

/** Start and end instants (ISO) of calendar day `iso` in `tz`. DST-safe (offset re-read at the guess). */
export function gunSinirlariUtc(iso: string, tz: string): { bas: string; bit: string } {
  const dilim = saatDilimiSec(tz)
  const [y, m, d] = iso.split('-').map(Number)
  const yerelBas = Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0)
  const yerelBit = Date.UTC(y, (m || 1) - 1, d || 1, 23, 59, 59)
  const bas = new Date(yerelBas - tzOffsetDakika(new Date(yerelBas), dilim) * 60000)
  const bit = new Date(yerelBit - tzOffsetDakika(new Date(yerelBit), dilim) * 60000)
  return { bas: bas.toISOString(), bit: bit.toISOString() }
}

/**
 * NOTYA-RANDEVU-AYSE-01: wall time (`iso` day + "HH:MM") in `tz` → the instant (ISO). The offset is re-read at
 * the first guess, so a slot on a DST-change day lands on the right side of the change.
 */
export function yerelAnI(iso: string, saat: string, tz: string): string {
  const dilim = saatDilimiSec(tz)
  const [y, m, d] = iso.split('-').map(Number)
  const [sa, dk] = saat.split(':').map(Number)
  const yerel = Date.UTC(y, (m || 1) - 1, d || 1, sa || 0, dk || 0, 0)
  const tahmin = yerel - tzOffsetDakika(new Date(yerel), dilim) * 60000
  return new Date(yerel - tzOffsetDakika(new Date(tahmin), dilim) * 60000).toISOString()
}

/** "14:30" in `tz` for an ISO instant. */
export function isoSaatTz(iso: string, tz: string): string {
  try {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: saatDilimiSec(tz) })
  } catch {
    return '?'
  }
}

const HAFTA_GUNU: Array<[RegExp, number]> = [
  [/\bpazartesi\b|\bmonday\b/, 0],
  [/\bsali\b|\btuesday\b/, 1],
  [/\bcarsamba\b|\bwednesday\b/, 2],
  [/\bpersembe\b|\bthursday\b/, 3],
  [/\bcuma\b(?!\s*tesi)|\bfriday\b/, 4],
  [/\bcumartesi\b|\bsaturday\b/, 5],
  [/\bpazar\b(?!\s*tesi)|\bsunday\b/, 6],
]

const AY: Record<string, number> = {
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6, temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
}

/** True when the (normalized, ASCII-folded) text carries any date expression this resolver understands. */
export const TARIH_IFADESI = /\b(bugun|yarin|dun|obur gun|oburgun|ertesi gun|haftaya|gelecek hafta|onumuzdeki hafta|bu hafta|today|tomorrow|yesterday|pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar|20\d{2}-\d{2}-\d{2}|\d{1,2} (ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik))\b/

/**
 * Resolve a relative/absolute date from NORMALIZED text (trAramaNormalize output: lowercase, ASCII).
 * Null when the text names no day. Single day only — "bu hafta" resolves to today (range lookups are
 * an open item, docs/OPEN-COMMITMENTS.md 2026-09-29).
 */
export function goreliTarihCoz(n: string, tz: string, simdi: Date = new Date()): string | null {
  const t = ` ${String(n || '').trim()} `
  const bugun = bugunTz(tz, simdi)
  const iso = t.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) return iso[1]
  const gunAy = t.match(/\b(\d{1,2}) (ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)(?: (20\d{2}))?\b/)
  if (gunAy) {
    const yil = gunAy[3] ? Number(gunAy[3]) : Number(bugun.slice(0, 4))
    return `${yil}-${String(AY[gunAy[2]]).padStart(2, '0')}-${gunAy[1].padStart(2, '0')}`
  }
  const haftaya = /\b(haftaya|gelecek hafta|onumuzdeki hafta|next week)\b/.test(t)
  for (const [re, hedef] of HAFTA_GUNU) {
    if (!re.test(t)) continue
    const bugunIdx = haftaGunuIndeksi(bugun)
    let fark = (hedef - bugunIdx + 7) % 7
    if (haftaya && bugunIdx + fark < 7) fark += 7
    return isoGunKaydir(bugun, fark)
  }
  if (/\b(obur gun|oburgun|day after tomorrow)\b/.test(t)) return isoGunKaydir(bugun, 2)
  if (/\b(yarin|ertesi gun|tomorrow)\b/.test(t)) return isoGunKaydir(bugun, 1)
  if (/\bdun\b|\byesterday\b/.test(t)) return isoGunKaydir(bugun, -1)
  if (haftaya) return isoGunKaydir(bugun, 7)
  if (/\b(bugun|bu hafta|today)\b/.test(t)) return bugun
  return null
}

/**
 * NOTYA-AYSE-100 T1: "bu hafta / haftaya / gelecek hafta" WITHOUT a weekday is a week, not one day. Monday–Sunday
 * (Turkish week) in the doctor's timezone; `haftaya` = next week. Null when the text names a single day.
 */
export function haftaAraligiCoz(n: string, tz: string, simdi: Date = new Date()): { bas: string; bit: string } | null {
  const t = ` ${String(n || '').trim()} `
  if (HAFTA_GUNU.some(([re]) => re.test(t))) return null
  if (/\b(20\d{2}-\d{2}-\d{2})\b/.test(t) || /\b\d{1,2} (ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)\b/.test(t)) return null
  const haftaya = /\b(haftaya|gelecek hafta|onumuzdeki hafta|next week)\b/.test(t)
  const buHafta = /\b(bu hafta|this week)\b/.test(t)
  if (!haftaya && !buHafta) return null
  const bugun = bugunTz(tz, simdi)
  const pazartesi = isoGunKaydir(bugun, -haftaGunuIndeksi(bugun) + (haftaya ? 7 : 0))
  return { bas: pazartesi, bit: isoGunKaydir(pazartesi, 6) }
}

const TR_AYLAR = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik']

/** "30 Eylül 2026 Çarşamba takviminde …" (a stored calendar answer, normalized) → 2026-09-30. */
export function cevaptakiTarih(n: string): string | null {
  const m = String(n || '').match(/\b(\d{1,2}) (ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik) (20\d{2})\b/)
  if (!m) return null
  return `${m[3]}-${String(TR_AYLAR.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}
