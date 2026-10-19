/**
 * NOTYA-UZ-DOKTOR-PERSONA-SES-01 (release/uz ONLY) — INFERRED DATA, NOT OWNER-AUTHORED. Flag for
 * Kaan/Dr. Gökhan review; nothing here is a locked-in creative decision.
 *
 * `./asistanAdlari.ts` (UZ_ASISTAN_ADLARI) is the owner's (Kaan, 2026-10-08/09) SINGLE SOURCE for the 30 Doktor
 * assistant names — but its own header says plainly it is scoped to NAMES only ("THE SINGLE SOURCE of the 40
 * names the owner gave ... no other file of the pack or of the kit repeats one"). It carries no `gender` and no
 * `voiceId`, the two fields `AsistanPersonaSesleri` (lib/ulke/tipler.ts) needs to drive the Doktor "Ayşe'ye
 * Danış" panel (display + any future TTS). Writing those fields into the owner's canonical names file would
 * blur provenance between what he actually wrote and what we mechanically inferred — so they live here instead,
 * in a file of their own, never merged back into asistanAdlari.ts.
 *
 * NOTYA-ASISTAN-PERSONA-SES-01 (2026-10-18) — MOVED HERE FROM lib/asistan/uzDoktorPersonaSesi.ts, which used to
 * import `./asistanAdlari` directly: a D1 wall violation (core code outside countries/ reaching one country's
 * files directly instead of through countries/active) that failed the UZ Vercel build
 * (BUILD_UTILS_SPAWN_1, scripts/ulke-derle.mjs). The DATA below is unchanged — only where it lives changed, so
 * that `lib/asistan/uzDoktorPersonaSesi.ts` can read it through `countries/active` like every other country's
 * data, instead of reaching into countries/uz/ directly. It still speaks only through the country's own pack
 * (countries/uz/index.ts → UZ_PAKETI.asistanSesleri), never imported by core on its own.
 *
 * GENDER — mechanically inferred by Claude from standard, unambiguous Uzbek given-name conventions, one read
 * per name against the 30 Doktor entries in asistanAdlari.ts as it stands today:
 *   male:   Jasur, Bekzod, Alisher, Sardor, Otabek, Jamshid, Sherzod, Farrux, Temur, Nodir, Bobur,
 *           Ulugbek, Akmal, Javohir, Sanjar, Laziz
 *   female: Nilufar, Madina, Sevara, Dilnoza, Gulnoza, Aziza, Shahnoza, Kamola, Mohira, Nigora,
 *           Malika, Barno, Zulfiya, Saodat
 * The owner never asked for a gender — this is a default pending his/Dr. Gökhan's review and override, not a
 * final decision. If a future name is added to asistanAdlari.ts without a matching entry below, the branş has
 * no entry in `UZ_ASISTAN_SESLERI.bransaGore` and the caller must fall through rather than guess (see
 * lib/asistan/bransAsistanPersonasi.ts).
 *
 * VOICE — also not a new creative choice: reuses real, already-provisioned TR ElevenLabs voice ids that already
 * exist in `TR_VOICES` (lib/asistan/elevenVoices.ts), cycled round-robin per gender the SAME way
 * `lib/asistan/specialistsCatalog.ts` shares one voice across several same-gender TR personas (its own `F`/`M`
 * arrays + `nextF()`/`nextM()`). No new ElevenLabs voice is selected or invented here — voices are shared
 * across multiple same-gender personas by design, in both files. (A REAL Uzbek-accented ElevenLabs voice pair
 * is a separate, later addition — NOTYA-ULKE-ASISTAN-ISIM-05 — on `UZ_PAKETI.asistanSesleri.cift`, not here.)
 *
 * THE IDS BELOW ARE COPIED AS LITERAL STRINGS, `TR_VOICES` IS NOT IMPORTED. This file sits on the country pack's
 * own entry point (countries/uz/index.ts), which every Uzbekistan request loads — unlike the TR-only call site
 * that read this data before NOTYA-ASISTAN-PERSONA-SES-01. `TR_VOICES`' own `label` fields and comments are
 * Turkish text (names, "İstanbul", …), by and for the Turkish persona catalogue; importing that module from
 * here would pull Turkish text into the Uzbekistan build's reachable import graph and fail
 * lib/ulke/ulkeDuvarlari.test.ts's "a uz build pulls Turkish text in through these files" check — confirmed by
 * hand (reverting this file's import to `TR_VOICES` reproduces that failure). The opaque id strings are not
 * Turkish text and carry no such risk; `asistanSesi.test.ts` cross-checks them against the real catalogue by
 * reading lib/asistan/elevenVoices.ts as TEXT (no import), the same technique already used by
 * ./asistanAdlari.test.ts (`turkUnvanlari()`) to compare against a TR file without importing it.
 *
 * Keyed by `bransAnahtari` — the same canonical specialty key `uzAsistanAdi()` and `bransAsistanPersonasiBul()`
 * use — so no caller needs to touch this file directly; they go through `countries/active`.
 */
import type { AsistanPersonaSesleri, AsistanSesKimligi } from '@/lib/ulke/tipler'
import { UZ_ASISTAN_ADLARI } from './asistanAdlari'

/**
 * Literal copies of TR_VOICES[key].voiceId (lib/asistan/elevenVoices.ts) — never imported from here, see file
 * header. Comment names the TR_VOICES key each id was copied from, for audit; asistanSesi.test.ts checks both
 * stay equal by reading that file as text.
 */
const TR_VOICE_ID = {
  gulrizElif: '7i5J4Bl0THYWdNcoKRl6',
  gunnurDilek: '58oUR7g9xaf9pbxNCyws',
  pinarZeynep: 'TLSC2qq8RlDdm7tETUHz',
  tugbaSelin: 'D6QpOJ61ltQ3whot6iJZ',
  asli: '58oUR7g9xaf9pbxNCyws',
  leyla: 'ir8YO3t6kXwbDO3roXIT',
  ece: '5MSp7yE6sGgawegWrMgt',
  ayseHanim: 'ir8YO3t6kXwbDO3roXIT',
  abdulkadir: 'pGMp7Agf4sG0hyhiiGiw',
  ertanHaluk: 'goDh3UOD7uY8nX9JmLnv',
  gokhan: 'aF3NZfADeIc6RJO5v5Ia',
  serhat: 'vhKOmda0rMxo3o60S4G5',
  bahadir: 'pGMp7Agf4sG0hyhiiGiw',
  eyup: 'YRAJxpPvdBUTgvjBUHlB',
  halil: 'YRAJxpPvdBUTgvjBUHlB',
} as const

/** Inferred gender per the 30 UZ Doktor given names — review pending, see file header. */
const UZ_DOKTOR_GENDER: Readonly<Record<string, 'female' | 'male'>> = {
  'acil-tip': 'male', // Jasur
  'aile-hekimligi': 'female', // Nilufar
  anestezi: 'male', // Bekzod
  'beyin-cerrahisi': 'male', // Alisher
  'cocuk-cerrahisi': 'male', // Sardor
  dahiliye: 'female', // Madina
  dermatoloji: 'female', // Sevara
  endokrinoloji: 'female', // Dilnoza
  'enfeksiyon-hastaliklari': 'male', // Otabek
  gastroenteroloji: 'male', // Jamshid
  'genel-cerrahi': 'male', // Sherzod
  'gogus-cerrahisi': 'male', // Farrux
  'gogus-hastaliklari': 'female', // Gulnoza
  'goz-hastaliklari': 'female', // Aziza
  'kadin-hastaliklari-dogum': 'female', // Shahnoza
  'kalp-damar-cerrahisi': 'male', // Temur
  kardiyoloji: 'female', // Kamola
  'kulak-burun-bogaz': 'male', // Nodir
  nefroloji: 'female', // Mohira
  noroloji: 'male', // Bobur
  onkoloji: 'female', // Nigora
  ortopedi: 'male', // Ulugbek
  pediatri: 'female', // Malika
  'plastik-cerrahi': 'female', // Barno
  psikiyatri: 'female', // Zulfiya
  radyoloji: 'male', // Akmal
  romatoloji: 'female', // Saodat
  uroloji: 'male', // Javohir
  'spor-hekimligi': 'male', // Sanjar
  'fizik-tedavi': 'male', // Laziz
}

/** Same reuse pools `specialistsCatalog.ts` cycles through for TR personas — no new voices chosen. */
const F_POOL = [
  TR_VOICE_ID.gulrizElif,
  TR_VOICE_ID.gunnurDilek,
  TR_VOICE_ID.pinarZeynep,
  TR_VOICE_ID.tugbaSelin,
  TR_VOICE_ID.asli,
  TR_VOICE_ID.leyla,
  TR_VOICE_ID.ece,
  TR_VOICE_ID.ayseHanim,
] as const

const M_POOL = [
  TR_VOICE_ID.abdulkadir,
  TR_VOICE_ID.ertanHaluk,
  TR_VOICE_ID.gokhan,
  TR_VOICE_ID.serhat,
  TR_VOICE_ID.bahadir,
  TR_VOICE_ID.eyup,
  TR_VOICE_ID.halil,
] as const

let _fi = 0
let _mi = 0
function nextF(): string {
  const v = F_POOL[_fi % F_POOL.length]
  _fi++
  return v
}
function nextM(): string {
  const v = M_POOL[_mi % M_POOL.length]
  _mi++
  return v
}

/**
 * Built once at module load, walking UZ_ASISTAN_ADLARI's Doktor entries in file order (NOT alphabetical by
 * key) so the round-robin assignment is stable/deterministic across reloads.
 */
const UZ_DOKTOR_SESLERI: Readonly<Record<string, AsistanSesKimligi>> = Object.fromEntries(
  UZ_ASISTAN_ADLARI.filter((a) => a.taraf === 'doktor').map((a) => {
    const gender = UZ_DOKTOR_GENDER[a.bransAnahtari]
    // Should never happen while the 30-entry gender table above tracks asistanAdlari.ts 1:1 — guarded by
    // asistanSesi.test.ts. If it ever does, fall through to pediatri's flagship TR voice rather than
    // guessing a gender (see lib/asistan/bransAsistanPersonasi.ts fallback).
    const resolvedGender = gender ?? 'female'
    return [a.bransAnahtari, { gender: resolvedGender, voiceId: resolvedGender === 'female' ? nextF() : nextM() }]
  })
)

/** Uzbekistan's assistant gender/voice data — spoken through countries/active, never imported directly. */
export const UZ_ASISTAN_SESLERI: AsistanPersonaSesleri = {
  bransaGore: UZ_DOKTOR_SESLERI,
}
