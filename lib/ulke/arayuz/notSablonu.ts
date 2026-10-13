/**
 * NOTYA-ULKE-SABLON-01 — the RULES of note templates, for every country. Pure and client-safe: the pack's data comes
 * in as an argument (`NotSablonVerisi`), so the same rule answers the server (which fields the model's answer may
 * keep, lib/ulke/uygulama/notlar.ts), the instruction to the model (the pack's own) and the screen.
 *
 * LEAK RULE. A field belongs to the roles that list it. `sablonAlanlari` is THE decision point: a key that is not on
 * its answer is dropped by the server and not drawn by the screen, whatever the model or a client sends.
 *
 * GUARDIAN WORDING follows the patient's AGE, in every role: below the country's guardian age on the day of the
 * visit the note gets the pack's "who gave the history" field; at or above it, never. An unknown age counts as
 * below it only in a role whose patients are children. The age is a setting of the pack (`uygulama.veliYasi`).
 *
 * A ROLE ONLY ONE COUNTRY HAS (NOTYA-ULKE-OZEL-01) writes with the template of the role it behaves like, unless the
 * pack lists fields under the role's own key (./rolIcerigi.ts → icerikAnahtari). The template's KEY stays the
 * role's own everywhere: on the note, in the instruction to the model, in what is stored.
 */
import { icerikAnahtari } from './rolIcerigi'
import type { NotAlani, NotBolumu, NotSablonVerisi, RolTanimi } from './tipler'

const sahip = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)

export type SablonHastasi = { dogumTarihi?: string | null; muayeneTarihi?: string | null } | null | undefined

/** true = a template a note can be written with: the general one, or a role that has fields of its own. */
export function sablonMu(v: NotSablonVerisi, roller: readonly RolTanimi[], ham: unknown): ham is string {
  return typeof ham === 'string' && (ham === v.genelSablon || (roller.some((r) => r.anahtar === ham) && icerikAnahtari(roller, ham, v.rolAlanlari) !== null))
}

/** The fields of a ROLE's template, in order: its own list, or the list of the role it behaves like. None = []. */
export function rolSablonAlanlari(v: NotSablonVerisi, roller: readonly RolTanimi[], rol: string): readonly string[] {
  const k = roller.some((r) => r.anahtar === rol) ? icerikAnahtari(roller, rol, v.rolAlanlari) : null
  return k === null ? [] : v.rolAlanlari[k]
}

/** Templates, the general one first (the default of an account without a role), then the roles in the pack's order. */
export function sablonlar(v: NotSablonVerisi, roller: readonly RolTanimi[]): readonly string[] {
  return [v.genelSablon, ...roller.map((r) => r.anahtar).filter((r) => icerikAnahtari(roller, r, v.rolAlanlari) !== null)]
}

/** Below `veliYasi` on the day of the visit. An unknown age is not a child — except in a role whose patients are children. */
export function veliYasindaMi(v: NotSablonVerisi, veliYasi: number | null, sablon: string, dogumTarihi: string | null | undefined, muayeneTarihi: string | null | undefined): boolean {
  if (veliYasi === null) return false
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dogumTarihi ?? '')), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(muayeneTarihi ?? ''))
  if (!d || !m) return v.cocukRolleri.includes(sablon)
  let yil = Number(m[1]) - Number(d[1])
  if (Number(m[2]) < Number(d[2]) || (Number(m[2]) === Number(d[2]) && Number(m[3]) < Number(d[3]))) yil -= 1
  return yil < 0 ? v.cocukRolleri.includes(sablon) : yil < veliYasi
}

/**
 * THE DECISION POINT. The field keys a note of `sablon` may carry for this patient, in order: the age field first
 * (below the guardian age only), then the role's own. An unknown template has none.
 */
export function sablonAlanlari(v: NotSablonVerisi, roller: readonly RolTanimi[], veliYasi: number | null, sablon: string, hasta?: SablonHastasi): readonly string[] {
  if (!sablonMu(v, roller, sablon)) return []
  const rolAlanlari = sablon === v.genelSablon ? [] : rolSablonAlanlari(v, roller, sablon)
  return v.veliAlani && hasta && veliYasindaMi(v, veliYasi, sablon, hasta.dogumTarihi, hasta.muayeneTarihi) ? [v.veliAlani.anahtar, ...rolAlanlari] : rolAlanlari
}

/** A field's definition, whichever kind it is. null = no such field. */
export function alanTanimi(v: NotSablonVerisi, anahtar: string): NotAlani | null {
  return sahip(v.alanlar, anahtar) ? v.alanlar[anahtar] : v.veliAlani && v.veliAlani.anahtar === anahtar ? v.veliAlani.tanim : null
}

/** A field's label in a form. null = no such field, or no label in that form: there is nothing to show. */
export function alanAdi(v: NotSablonVerisi, anahtar: string, dil: string): string | null {
  const ad = alanTanimi(v, anahtar)?.ad
  return ad && sahip(ad, dil) ? ad[dil] : null
}

/** A section heading that is this template's own, or null when the template uses the catalogue's shared one. */
export function bolumAdi(v: NotSablonVerisi, roller: readonly RolTanimi[], sablon: string, bolum: NotBolumu, dil: string): string | null {
  const taraf = roller.find((r) => r.anahtar === sablon)?.taraf
  const b = taraf ? v.bolumBasliklari.find((x) => x.taraf === taraf && x.bolum === bolum) : undefined
  return b && sahip(b.ad, dil) ? b.ad[dil] : null
}
