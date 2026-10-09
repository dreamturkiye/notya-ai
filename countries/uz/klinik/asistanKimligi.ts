/**
 * NOTYA-UZ-BRANSLAR-01 · NOTYA-UZ-FIYAT-UNVAN-01 — Uzbekistan: WHO the assistant is for an account's role, as the
 * screens show it.
 *
 * ONE SOURCE. The names are the owner's list in ./asistanAdlari.ts and nowhere else; this file copies none of them.
 * The titles of doctors are the catalogue ./asistanUnvanlari.ts and nowhere else.
 *
 *   THE NAME (given name, family name)
 *     uz-Latn   exactly as the owner wrote it.
 *     uz-Cyrl   MACHINE-DERIVED from the Latin form by rule (../yozuv.ts → uzKirillga). Awaits a native reader.
 *     ru        MACHINE-DERIVED from that Cyrillic form (../yozuv.ts → uzRuschaYozuvga). Awaits a native reader.
 *   THE TITLE, by the Turkish product's convention for the same role (the owner, 2026-10-09; ./asistanAdlari.ts)
 *     'prof-dr', 'dr'   the catalogue's word for the form asked for (machine-written, awaits a native reader).
 *     'meslek'          the profession's own title, the owner's word, converted with the name by the same rule.
 *
 *   tamAd            title + given name + family name     "Prof. Dr. <given> <family>" · «Проф. д-р <имя> <фамилия>»
 *   unvanliKisaAd    short title + given name             "Prof. <given>" · «Проф. <имя>»
 *   kisaAd           given name
 * (No name is written in this comment on purpose: ./roller.test.ts fails any file but the list that repeats one.)
 *
 * The derived forms are not corrected by hand anywhere: the owner's spelling is authoritative, and so is whatever
 * the rule makes of it until a native reader decides otherwise (docs/OPEN-COMMITMENTS.md, NOTYA-UZ-BRANSLAR-01).
 *
 * NO BIOGRAPHY. Nothing here, and nothing on a screen, says how long the assistant has practised, where, or with
 * what degree: the background text is the owner's to decide with a local clinician. A screen shows the name and one
 * neutral line of the catalogue ("your senior colleague") with the name of the role.
 *
 * NO FALLBACK TO ANOTHER ROLE. A key without an entry — an unknown key, no role chosen, the general template — has
 * no assistant: `null`, and the screen shows the neutral "Notya assistant". Never another role's name, never a
 * persona of another country.
 */
import { uzKirillga, uzRuschaYozuvga } from '../yozuv'
import { uzAsistanAdi } from './asistanAdlari'
import { UZ_ASISTAN_UNVANLARI } from './asistanUnvanlari'
import { uzAdDili, type UzAdDili } from './rolAdlari'

export type AsistanKimligi = {
  /** Full name with its title, in the form asked for. */
  tamAd: string
  /** Given name, in the same form. */
  kisaAd: string
  /** Given name with the short title, in the same form: how the landing page names the assistant. */
  unvanliKisaAd: string
  /** true = the name in this form was derived by rule from the owner's Latin spelling and has not been read by a native reader. */
  makineTuretimi: boolean
}

/** A word of the owner's list (a name, a profession's title) in the form asked for. */
function yaz(latin: string, d: UzAdDili): string {
  if (d === 'uz-Latn') return latin
  const kirill = uzKirillga(latin)
  return d === 'uz-Cyrl' ? kirill : uzRuschaYozuvga(kirill)
}

export function uzAsistanKimligi(rol: unknown, dil: unknown): AsistanKimligi | null {
  const a = typeof rol === 'string' ? uzAsistanAdi(rol) : null
  if (!a) return null
  const d = uzAdDili(dil)
  const kisaAd = yaz(a.kisaAd, d)
  const soyad = yaz(a.soyad, d)
  // A profession's title has one form, before the full name and before the given name alike.
  const unvan = a.unvan === 'meslek' ? { tam: yaz(a.meslekUnvani ?? '', d), kisa: yaz(a.meslekUnvani ?? '', d) } : UZ_ASISTAN_UNVANLARI[d][a.unvan]
  const birlestir = (...parcalar: string[]) => parcalar.filter(Boolean).join(' ')
  return { tamAd: birlestir(unvan.tam, kisaAd, soyad), kisaAd, unvanliKisaAd: birlestir(unvan.kisa, kisaAd), makineTuretimi: d !== 'uz-Latn' }
}
