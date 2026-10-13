/**
 * NOTYA-ULKE-OZEL-01 — A ROLE ONLY ONE COUNTRY HAS, AND THE ROLE IT BEHAVES LIKE. Pure and client-safe.
 *
 * A pack's role list is its own. A role that only this country has (a specialty the others do not recognise, one
 * half of a specialty the country splits, two specialties it merges) need not come with a note template and a set
 * of intake questions of its own: it may say which role it BEHAVES LIKE (`RolTanimi.gibi`). Then
 *
 *   - its notes are written with THAT role's template, and its intake form asks THAT role's questions,
 *   - under its own name, its own key in the account and on every row, and its own place in the tools area;
 *   - and the day the country supplies a template or a question set under the role's own key, its own is used.
 *
 * ONE RULE, asked wherever the kit looks up a role's content in a record of the pack (`rolAlanlari` of the note
 * templates, `roller` of the intake form): the role's own entry if the record has one, otherwise the entry of the
 * role it behaves like, otherwise none. Nothing else is inherited: not tools (each tool names its roles), not the
 * kind of the role, not what a clinic may share with it.
 *
 * The role a role behaves like need NOT be on the pack's list any more (a specialty that was split is gone as a
 * role; its template lives on as the two halves' content). It is never a chain: a role behaves like a role that has
 * the content itself (the pack check refuses anything else).
 */
import type { RolTanimi } from './tipler'

/**
 * The longest key a role may have: the database keeps an account's role as text of the form "words-joined-by-hyphens"
 * and at most this long (migration 134, `hekim_rolu.rol`). NO DATABASE CHANGE IS NEEDED FOR A NEW ROLE: the check is
 * on the form of the key, never on a list of roles.
 */
export const ROL_ANAHTARI_AZAMI = 60

const sahip = (o: unknown, k: string): boolean => typeof o === 'object' && o !== null && Object.prototype.hasOwnProperty.call(o, k)

/** The role `rol` behaves like, or null: it stands on its own (or is no role of the pack). */
export function rolunGibisi(roller: readonly Pick<RolTanimi, 'anahtar' | 'gibi'>[], rol: unknown): string | null {
  if (typeof rol !== 'string') return null
  const gibi = roller.find((r) => r.anahtar === rol)?.gibi
  return typeof gibi === 'string' && gibi.length > 0 && gibi !== rol ? gibi : null
}

/**
 * THE KEY UNDER WHICH A ROLE'S CONTENT IS FOUND in a record of the pack: the role's own key where the record has an
 * entry for it, otherwise the key of the role it behaves like where the record has THAT, otherwise null.
 */
export function icerikAnahtari(roller: readonly Pick<RolTanimi, 'anahtar' | 'gibi'>[], rol: unknown, kayit: unknown): string | null {
  if (typeof rol !== 'string' || !rol) return null
  if (sahip(kayit, rol)) return rol
  const gibi = rolunGibisi(roller, rol)
  return gibi && sahip(kayit, gibi) ? gibi : null
}

/** Every key some role of the pack behaves like: content under one of these is in use even where the key is no role. */
export const gibiAnahtarlari = (roller: readonly Pick<RolTanimi, 'anahtar' | 'gibi'>[]): string[] => [...new Set(roller.map((r) => rolunGibisi(roller, r.anahtar)).filter((x): x is string => x !== null))]
