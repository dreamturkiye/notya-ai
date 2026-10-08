/**
 * NOTYA-UZ-BRANSLAR-01 — Uzbekistan: WHO the assistant is for an account's role, as the screens show it.
 *
 * ONE SOURCE. The names are the owner's list in ./asistanAdlari.ts and nowhere else; this file copies none of them.
 *
 *   uz-Latn   exactly as the owner wrote it.
 *   uz-Cyrl   MACHINE-DERIVED from the Latin form by rule (../yozuv.ts → uzKirillga). Awaits a native reader.
 *   ru        MACHINE-DERIVED from that Cyrillic form (../yozuv.ts → uzRuschaYozuvga). Awaits a native reader.
 *
 * The derived forms are not corrected by hand anywhere: the owner's spelling is authoritative, and so is whatever
 * the rule makes of it until a native reader decides otherwise (docs/OPEN-COMMITMENTS.md, NOTYA-UZ-BRANSLAR-01).
 * The title is kept as given — "Dr.", or the profession's title for an allied role — and converted with the name.
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
import { uzAdDili } from './rolAdlari'

export type AsistanKimligi = {
  /** Full name with its title, in the form asked for. */
  tamAd: string
  /** Given name, in the same form. */
  kisaAd: string
  /** true = this form was derived by rule from the owner's Latin spelling and has not been read by a native reader. */
  makineTuretimi: boolean
}

export function uzAsistanKimligi(rol: unknown, dil: unknown): AsistanKimligi | null {
  const a = typeof rol === 'string' ? uzAsistanAdi(rol) : null
  if (!a) return null
  const d = uzAdDili(dil)
  if (d === 'uz-Latn') return { tamAd: a.tamAd, kisaAd: a.kisaAd, makineTuretimi: false }
  const kirill = { tamAd: uzKirillga(a.tamAd), kisaAd: uzKirillga(a.kisaAd) }
  if (d === 'uz-Cyrl') return { ...kirill, makineTuretimi: true }
  return { tamAd: uzRuschaYozuvga(kirill.tamAd), kisaAd: uzRuschaYozuvga(kirill.kisaAd), makineTuretimi: true }
}
