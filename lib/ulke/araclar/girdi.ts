/**
 * NOTYA-ULKE-ARACLAR-01 — WHAT WAS TYPED → WHAT A TOOL'S ARITHMETIC TAKES. Pure, and the same on both sides: the
 * tool's screen reads the form with it, and the server reads the same form again before it keeps a result
 * (lib/ulke/araclar/kayit.ts) — so a kept result is always the kit's own arithmetic, never a number a browser sent.
 */
import { alanAraligi, kanonigeCevir, type BirimOrtami } from './birimler'
import type { AracAlani, AracGirdisi } from './tipler'
import { kosullariUygula, METIN_UZUNLUGU } from './yardimci'

/** What is typed, as it is typed: a field's text, an option key, a tick. */
export type HamGirdi = Readonly<Record<string, string | boolean>>

/** Only what a form of these fields can hold: a text of bounded length or a tick, under a key the tool has. */
export function hamiSuz(alanlar: readonly AracAlani[], ham: unknown): HamGirdi {
  const cikti: Record<string, string | boolean> = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return cikti
  for (const a of alanlar) {
    if (!Object.prototype.hasOwnProperty.call(ham, a.anahtar)) continue
    const v = (ham as Record<string, unknown>)[a.anahtar]
    if (a.tur === 'isaret') { if (v === true) cikti[a.anahtar] = true; continue }
    if (typeof v === 'string' && v.length <= METIN_UZUNLUGU * 2) cikti[a.anahtar] = v
  }
  return cikti
}

/** What was typed → what the tool's arithmetic takes. A number out of its range, or not a number, is "nothing". */
export function girdiyiCoz(alanlar: readonly AracAlani[], ham: HamGirdi, o: BirimOrtami): AracGirdisi {
  const g: Record<string, number | string | boolean | null> = {}
  for (const a of alanlar) {
    const v = ham[a.anahtar]
    if (a.tur === 'isaret') { g[a.anahtar] = v === true; continue }
    if (a.tur === 'secim') { g[a.anahtar] = typeof v === 'string' && (a.secenekler ?? []).includes(v) ? v : null; continue }
    if (a.tur === 'tarih') { g[a.anahtar] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; continue }
    if (a.tur === 'metin') { const t = typeof v === 'string' ? v.trim().slice(0, METIN_UZUNLUGU) : ''; g[a.anahtar] = t || null; continue }
    const metin = typeof v === 'string' ? v.trim().replace(',', '.') : ''
    const n = metin === '' ? NaN : Number(metin)
    const aralik = alanAraligi(a, o)
    if (!Number.isFinite(n) || (a.tam && !Number.isInteger(n)) || (aralik && (n < aralik.enAz || n > aralik.enCok))) { g[a.anahtar] = null; continue }
    g[a.anahtar] = kanonigeCevir(a, n, o)
  }
  // A field whose condition does not hold is not there: whatever was typed into it earlier is not read.
  return kosullariUygula(alanlar, g)
}

/** For the summary: a number is repeated as the doctor typed it (their unit), not in the unit the arithmetic used. */
export function hamdanGosterilen(alanlar: readonly AracAlani[], ham: HamGirdi, g: AracGirdisi): AracGirdisi {
  const cikti: Record<string, number | string | boolean | null> = { ...g }
  for (const a of alanlar) if ((a.tur === 'sayi' || a.tur === 'puan') && g[a.anahtar] !== null) { const v = ham[a.anahtar]; cikti[a.anahtar] = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : null }
  return cikti
}
