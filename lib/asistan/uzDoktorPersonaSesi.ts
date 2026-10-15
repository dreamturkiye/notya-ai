/**
 * NOTYA-UZ-DOKTOR-PERSONA-SES-01 (release/uz ONLY) — INFERRED DATA, NOT OWNER-AUTHORED. Flag for
 * Kaan/Dr. Gökhan review; nothing here is a locked-in creative decision.
 *
 * `countries/uz/klinik/asistanAdlari.ts` (UZ_ASISTAN_ADLARI) is the owner's (Kaan, 2026-10-08/09)
 * SINGLE SOURCE for the 30 Doktor assistant names — but its own header says plainly it is scoped to
 * NAMES only ("THE SINGLE SOURCE of the 40 names the owner gave ... no other file of the pack or of
 * the kit repeats one"). It carries no `gender` and no `voiceId`, two fields `BransAsistanPersonasi`
 * (lib/asistan/bransAsistanPersonasi.ts) requires to drive the Doktor "Ayşe'ye Danış" panel (display
 * + TTS). Writing those fields into the owner's canonical names file would blur provenance between
 * what he actually wrote and what we mechanically inferred — so they live here instead, in a file of
 * their own, never merged back into asistanAdlari.ts.
 *
 * GENDER — mechanically inferred by Claude from standard, unambiguous Uzbek given-name conventions,
 * one read per name against the 30 Doktor entries in asistanAdlari.ts as it stands today:
 *   male:   Jasur, Bekzod, Alisher, Sardor, Otabek, Jamshid, Sherzod, Farrux, Temur, Nodir, Bobur,
 *           Ulugbek, Akmal, Javohir, Sanjar, Laziz
 *   female: Nilufar, Madina, Sevara, Dilnoza, Gulnoza, Aziza, Shahnoza, Kamola, Mohira, Nigora,
 *           Malika, Barno, Zulfiya, Saodat
 * The owner never asked for a gender — this is a default pending his/Dr. Gökhan's review and
 * override, not a final decision. If a future name is added to asistanAdlari.ts without a matching
 * entry below, `uzDoktorPersonaSesi()` returns null and the caller must fall through rather than
 * guess (see bransAsistanPersonasi.ts).
 *
 * VOICE — also not a new creative choice: reuses real, already-provisioned TR ElevenLabs voice ids
 * from `TR_VOICES` (lib/asistan/elevenVoices.ts), cycled round-robin per gender the SAME way
 * `lib/asistan/specialistsCatalog.ts` shares one voice across several same-gender TR personas (its
 * own `F`/`M` arrays + `nextF()`/`nextM()`). No new ElevenLabs voice is selected or invented here —
 * voices are shared across multiple same-gender personas by design, in both files.
 *
 * Keyed by `bransAnahtari` — the same canonical specialty key `uzAsistanAdi()` and
 * `bransAsistanPersonasiBul()` use — so no caller needs to touch this file directly.
 */
import { TR_VOICES } from '@/lib/asistan/elevenVoices'
import { UZ_ASISTAN_ADLARI } from '@/countries/uz/klinik/asistanAdlari'

export interface UzDoktorPersonaSesi {
  gender: 'female' | 'male'
  voiceId: string
}

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
  TR_VOICES.gulrizElif,
  TR_VOICES.gunnurDilek,
  TR_VOICES.pinarZeynep,
  TR_VOICES.tugbaSelin,
  TR_VOICES.asli,
  TR_VOICES.leyla,
  TR_VOICES.ece,
  TR_VOICES.ayseHanim,
] as const

const M_POOL = [
  TR_VOICES.abdulkadir,
  TR_VOICES.ertanHaluk,
  TR_VOICES.gokhan,
  TR_VOICES.serhat,
  TR_VOICES.bahadir,
  TR_VOICES.eyup,
  TR_VOICES.halil,
] as const

let _fi = 0
let _mi = 0
function nextF(): string {
  const v = F_POOL[_fi % F_POOL.length]
  _fi++
  return v.voiceId
}
function nextM(): string {
  const v = M_POOL[_mi % M_POOL.length]
  _mi++
  return v.voiceId
}

/**
 * Built once at module load, walking UZ_ASISTAN_ADLARI's Doktor entries in file order (NOT
 * alphabetical by key) so the round-robin assignment is stable/deterministic across reloads.
 */
const UZ_DOKTOR_PERSONA_SESI: ReadonlyMap<string, UzDoktorPersonaSesi> = new Map(
  UZ_ASISTAN_ADLARI.filter((a) => a.taraf === 'doktor').map((a) => {
    const gender = UZ_DOKTOR_GENDER[a.bransAnahtari]
    // Should never happen while the 30-entry gender table above tracks asistanAdlari.ts 1:1 — guarded
    // by uzDoktorPersonaSesi.test.ts. If it ever does, fall through to pediatri's flagship TR voice
    // rather than guessing a gender (see bransAsistanPersonasi.ts fallback).
    const resolvedGender = gender ?? 'female'
    return [a.bransAnahtari, { gender: resolvedGender, voiceId: resolvedGender === 'female' ? nextF() : nextM() }]
  })
)

/** The inferred gender/voice for a UZ Doktor specialty key, or null if this specialty isn't covered. */
export function uzDoktorPersonaSesi(bransAnahtari: string): UzDoktorPersonaSesi | null {
  return UZ_DOKTOR_PERSONA_SESI.get(bransAnahtari) ?? null
}
