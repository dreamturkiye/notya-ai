/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: A STORED ROLE KEY THAT IS NO ROLE ANY MORE, and the role nearest to it.
 *
 * The audit of 2026-10-10 took five keys off the role list (./rolListesi.ts). An account, a visit or a note stored
 * before that day may still hold one. This file says, for each, which role of today is NEAREST:
 *
 *   diyetisyen   → diyetoloji        the same work under the order's own name, now on the doctor side
 *   odyoloji     → surdoloji         the same, for hearing
 *   ergoterapi   → fizyoterapi       the one allied rehabilitation profession left; their notes share three fields
 *   sac-ekimi    → estetik-cerrahi   a surgical procedure of a clinic doctor; "Plastik xirurgiya" on the clinic side
 *   longevity    → aile-hekimligi    preventive care; their notes share the family history and the way of life
 *
 * The first two are the audit's own decision. THE LAST THREE WERE CHOSEN BY A MACHINE and are a proposal: "not in the
 * nomenclature" does not say which licensed specialty such a clinic works under, which is a lawyer's question.
 *
 * THE SPLIT NEEDS NO ENTRY. Cardiovascular surgery became two roles and its key, kalp-damar-cerrahisi, stayed as the
 * first of them ("Kardioxirurgiya"): an account stored under it loads as before, under the new name, and a vascular
 * surgeon changes the role in the settings.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT THE KIT DOES WITH THIS TODAY: NOTHING, AND THE PACK CANNOT MAKE IT. The kit reads an account's role in one
 * place (lib/ulke/uygulama/rol.ts → hekimRolunuOku) and answers "no role" for any key that is not on the pack's
 * list; it asks the pack nothing. So, until the kit calls a pack for a key it does not know:
 *   - AN ACCOUNT that holds one of the five keys STILL LOADS: it signs in, keeps its patients, visits and notes, is
 *     taken to the role question once and chooses again (./roller.test.ts walks exactly this). Nothing is guessed.
 *   - A NOTE written under one of the five keys keeps its four sections and stays approved; its role fields are in
 *     the database and are NOT DRAWN, because the kit draws role fields only for a template that is a role today
 *     (lib/ulke/arayuz/notSablonu.ts → sablonMu).
 * Two ways to close both, each the owner's decision and neither this job's: the kit reads `UZ_ESKI_ROLLER` when it
 * meets an unknown key (one function in lib/ulke/uygulama/rol.ts and one in lib/ulke/arayuz/notSablonu.ts); or the
 * five keys are rewritten once in Uzbekistan's own database (`hekim_rolu.rol`, and `sablon` on visits and notes).
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Pure data and one pure function. Nothing imports this file but its test: it is the record the kit will read.
 */
import { UZ_ROL_ANAHTARLARI } from './rolListesi'

/** A key that was a role of the pack until 2026-10-10 → the role of today nearest to it. */
export const UZ_ESKI_ROLLER: Readonly<Record<string, string>> = {
  diyetisyen: 'diyetoloji',
  odyoloji: 'surdoloji',
  ergoterapi: 'fizyoterapi',
  'sac-ekimi': 'estetik-cerrahi',
  longevity: 'aile-hekimligi',
}

const sahip = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k)

/**
 * The role of today for a stored key: the key itself where it is a role; the nearest role where it is one of the
 * five that were taken out; otherwise null — a key nobody ever had is never turned into a role.
 */
export function uzBugunkuRol(saklanan: unknown): string | null {
  if (typeof saklanan !== 'string' || !saklanan) return null
  if (UZ_ROL_ANAHTARLARI.includes(saklanan)) return saklanan
  return sahip(UZ_ESKI_ROLLER, saklanan) ? UZ_ESKI_ROLLER[saklanan] : null
}
