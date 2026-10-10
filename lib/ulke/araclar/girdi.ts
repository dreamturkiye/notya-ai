/**
 * NOTYA-ULKE-ARACLAR-01 — WHAT WAS TYPED → WHAT A TOOL'S ARITHMETIC TAKES. Pure, and the same on both sides: the
 * tool's screen reads the form with it, and the server reads the same form again before it keeps a result
 * (lib/ulke/araclar/kayit.ts) — so a kept result is always the kit's own arithmetic, never a number a browser sent.
 *
 * A NUMBER IS READ BY THE COUNTRY'S OWN RULES (NOTYA-ULKE-DENETIM-01a): the pack's decimal and thousands marks, through
 * the kit's one parser (lib/ulke/arayuz/sayiOkuma.ts → sayiCozKuralla). A text that can be read two ways is "nothing": the
 * tool shows no result, the server keeps none, and the field asks for the number to be typed again. This file used to
 * turn the first comma into a point, which made "1,500" into 1.5 in every country that groups thousands with a comma.
 *
 * A NUMBER WITHOUT ITS UNIT IS NOT A VALUE (NOTYA-ULKE-OZEL-01). Where the pack accepts more than one unit for a
 * laboratory value, the unit chosen beside the field travels in the form under the field's key plus ".birim". Until a
 * unit of the pack's list is chosen, a typed number is "nothing" AND counts as a field that could not be read — so
 * the tool shows no result and the server keeps none, also where the field is optional.
 */
import { sayiCozKuralla } from '../arayuz/sayiOkuma'
import { alanAraligi, birimAnahtari, birimSecilirMi, kanonigeCevir, seciliBirim, type BirimOrtami } from './birimler'
import type { AracAlani, AracGirdisi } from './tipler'
import { alanVarMi, kosullariUygula, METIN_UZUNLUGU } from './yardimci'

/** What is typed, as it is typed: a field's text, an option key, a tick. */
export type HamGirdi = Readonly<Record<string, string | boolean>>

/** Only what a form of these fields can hold: a text of bounded length or a tick, under a key the tool has — and, for a laboratory field, the unit chosen for it. */
export function hamiSuz(alanlar: readonly AracAlani[], ham: unknown): HamGirdi {
  const cikti: Record<string, string | boolean> = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return cikti
  for (const a of alanlar) {
    // The chosen unit of a laboratory field: a short code. Whether it is one the pack accepts is decided where it is read.
    if (a.lab) { const b = Object.prototype.hasOwnProperty.call(ham, birimAnahtari(a.anahtar)) ? (ham as Record<string, unknown>)[birimAnahtari(a.anahtar)] : undefined; if (typeof b === 'string' && b.length > 0 && b.length <= 24) cikti[birimAnahtari(a.anahtar)] = b }
    if (!Object.prototype.hasOwnProperty.call(ham, a.anahtar)) continue
    const v = (ham as Record<string, unknown>)[a.anahtar]
    if (a.tur === 'isaret') { if (v === true) cikti[a.anahtar] = true; continue }
    if (typeof v === 'string' && v.length <= METIN_UZUNLUGU * 2) cikti[a.anahtar] = v
  }
  return cikti
}

/** What was typed → what the tool's arithmetic takes. A number out of its range, not a number, or not readable without guessing is "nothing". */
export function girdiyiCoz(alanlar: readonly AracAlani[], ham: HamGirdi, o: BirimOrtami): AracGirdisi {
  const g: Record<string, number | string | boolean | null> = {}
  for (const a of alanlar) {
    const v = ham[a.anahtar]
    if (a.tur === 'isaret') { g[a.anahtar] = v === true; continue }
    if (a.tur === 'secim') { g[a.anahtar] = typeof v === 'string' && (a.secenekler ?? []).includes(v) ? v : null; continue }
    if (a.tur === 'tarih') { g[a.anahtar] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; continue }
    if (a.tur === 'metin') { const t = typeof v === 'string' ? v.trim().slice(0, METIN_UZUNLUGU) : ''; g[a.anahtar] = t || null; continue }
    const okuma = sayiCozKuralla(v, o.sayi)
    const n = okuma.tamam ? okuma.sayi : NaN
    // The unit the doctor chose, where the pack accepts several for this quantity; otherwise the pack's one unit.
    const secilen = ham[birimAnahtari(a.anahtar)]
    // A NUMBER WITHOUT ITS UNIT IS NOT A VALUE: nothing is assumed for the doctor.
    if (birimSecilirMi(a, o) && seciliBirim(a, o, secilen) === null) { g[a.anahtar] = null; continue }
    const aralik = alanAraligi(a, o, secilen)
    if (!Number.isFinite(n) || (a.tam && !Number.isInteger(n)) || (aralik && (n < aralik.enAz || n > aralik.enCok))) { g[a.anahtar] = null; continue }
    g[a.anahtar] = kanonigeCevir(a, n, o, secilen)
  }
  // A field whose condition does not hold is not there: whatever was typed into it earlier is not read.
  return kosullariUygula(alanlar, g)
}

/**
 * THE FIELDS THAT HOLD SOMETHING THAT COULD NOT BE READ: a number field with a text that is not a number written this
 * country's way, a date field with something that is not a day. While there is one, A TOOL SHOWS NO RESULT AND THE
 * SERVER KEEPS NONE — also where the field is optional: a day limit the doctor typed and the tool could not read must
 * never be worked with as "no limit". Only fields that are there for this input count (`g` is what `girdiyiCoz` gave).
 */
export function okunamayanAlanlar(alanlar: readonly AracAlani[], ham: HamGirdi, g: AracGirdisi, o: BirimOrtami): string[] {
  const cikti: string[] = []
  for (const a of alanlar) {
    if (!alanVarMi(a, g)) continue
    const v = ham[a.anahtar]
    if (typeof v !== 'string' || v.trim() === '') continue
    if (a.tur === 'sayi' && !sayiCozKuralla(v, o.sayi).tamam) cikti.push(a.anahtar)
    // typed, and no unit of the pack's list chosen for it: not read — never worked with as "left empty"
    else if (a.tur === 'sayi' && birimSecilirMi(a, o) && seciliBirim(a, o, ham[birimAnahtari(a.anahtar)]) === null) cikti.push(a.anahtar)
    if (a.tur === 'tarih' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) cikti.push(a.anahtar)
  }
  return cikti
}

/** The fields whose typed number waits for its unit: the screen says so beside each. A subset of `okunamayanAlanlar`. */
export function birimiSecilmeyenler(alanlar: readonly AracAlani[], ham: HamGirdi, g: AracGirdisi, o: BirimOrtami): string[] {
  return alanlar.filter((a) => alanVarMi(a, g) && a.tur === 'sayi' && birimSecilirMi(a, o) && typeof ham[a.anahtar] === 'string' && (ham[a.anahtar] as string).trim() !== '' && seciliBirim(a, o, ham[birimAnahtari(a.anahtar)]) === null).map((a) => a.anahtar)
}

/** For the summary: a number is repeated as the doctor typed it (their unit), not in the unit the arithmetic used. */
export function hamdanGosterilen(alanlar: readonly AracAlani[], ham: HamGirdi, g: AracGirdisi, o: BirimOrtami): AracGirdisi {
  const cikti: Record<string, number | string | boolean | null> = { ...g }
  for (const a of alanlar) if ((a.tur === 'sayi' || a.tur === 'puan') && g[a.anahtar] !== null) {
    const okuma = sayiCozKuralla(ham[a.anahtar], o.sayi); cikti[a.anahtar] = okuma.tamam ? okuma.sayi : null
    // The unit the doctor CHOSE is kept beside the number, so a kept result is read back in the unit it was typed in.
    if (birimSecilirMi(a, o)) { const b = seciliBirim(a, o, ham[birimAnahtari(a.anahtar)]); if (b) cikti[birimAnahtari(a.anahtar)] = b }
  }
  return cikti
}
