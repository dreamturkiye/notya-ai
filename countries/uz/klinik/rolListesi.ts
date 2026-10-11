/**
 * NOTYA-ULKE-UYGULA-UZ — Uzbekistan: THE COUNTRY'S OWN LIST OF ROLES, after the audit of 2026-10-10 was applied.
 *
 * The decisions are those of docs/araclar-denetim/uz-kararlar.json and UZ.md, Part 3 (branch araclar-denetim/uz).
 * They rest on ONE document, opened again on 2026-10-10 for this file:
 *
 *   "Tibbiy faoliyat amalga oshiriladigan tibbiy ixtisosliklar turlari nomenklaturasini tasdiqlash toʻgʻrisida",
 *   order of the Minister of Health No. 6 of 12 May 2021, registered by the Ministry of Justice on 12.05.2021 under
 *   No. 3303 (annex 1 in the wording of order No. 27 of 22.07.2023, registration No. 3303-1).
 *   https://lex.uz/uz/docs/-5422572 — read 2026-10-10.
 *
 * `resmiAd` is the specialty's name EXACTLY AS THE ORDER WRITES IT, in Uzbek Latin; `yer` is where it stands there.
 * The page shows the Uzbek text only (its Russian switch shows the same Uzbek names), so THERE IS NO OFFICIAL RUSSIAN
 * NAME: every Russian role name of the pack is machine-written and unofficial (`UZ_RUSCHA_ADLAR_RESMIY`, below;
 * ./rolAdlari.ts says so at its top). The Cyrillic form is not printed by the order either: it is written in the pack.
 * Nobody of Uzbekistan — no clinician, no lawyer, no native reader — has read this file.
 *
 * WHAT CHANGED AGAINST THE FORTY SHARED ROLES (countries/rol-eslemesi.json → ulkeyeOzel.uz says the same, as data):
 *
 *   RENAMED (the key stays)     aile-hekimligi → "Oilaviy shifokorlik"; dahiliye → "Terapiya"; genel-cerrahi →
 *                               "Xirurgiya"; radyoloji → "Tibbiy radiologiya"; fizik-tedavi → "Reabilitologiya
 *                               (davolash fizkulturasi, kurortologiya, fizioterapiya)"; and on the clinic side
 *                               estetik-cerrahi → "Plastik xirurgiya", medikal-estetik → "Tibbiy kosmetologiya",
 *                               klinik-dermatoloji → "Dermatovenerologiya".
 *   SPLIT                       cardiovascular surgery is two specialties in the order and no joint one:
 *                               kalp-damar-cerrahisi is now "Kardioxirurgiya" (the key stays, so an account and a
 *                               note stored under it stay readable), and damar-cerrahisi, "Qon tomirlar
 *                               xirurgiyasi", is new and behaves like it.
 *   ADDED                       alerji-immunoloji, reproduktoloji, cocuk-norolojisi, narkoloji: each recognised by
 *                               the order and absent before. Each says which shared role it BEHAVES LIKE (`gibi`):
 *                               its notes are written with that role's template and its intake form asks that
 *                               role's questions, under its own name. WHICH role each behaves like was chosen by a
 *                               machine from where the order places the specialty and what its note records; a
 *                               local clinician confirms it.
 *   MOVED TO THE DOCTOR SIDE    in the order dietology and surdology are doctors' specialties, not allied
 *                               professions. The kind of a shared role cannot change under its own key
 *                               (the role table holds the kind), so each is a NEW doctor role that behaves like
 *                               the allied role it replaces: diyetoloji (like diyetisyen), surdoloji (like odyoloji).
 *   REMOVED                     sac-ekimi, longevity, ergoterapi: not in the order. "Removed" means "not a
 *                               recognised specialty in the order read", not that a clinic may not offer the
 *                               service; under which licensed specialty it may, and what it may call it, is a
 *                               lawyer's question. And diyetisyen and odyoloji, replaced as said above.
 *   NOT DECIDED (left as it was) fizyoterapi: whether a non-doctor rehabilitation profession is recognised, and under
 *                               which name, was not found. A local clinician and a lawyer.
 *   OUT OF SCOPE                dentistry ("Stomatologiya", section IV of the order, a whole direction) and
 *                               traditional medicine ("Xalq tabobati", section VIII): each needs a note template,
 *                               an intake set and tools of its own, and whether the product wants the field at all
 *                               is the owner's decision. Neither is here.
 *
 * A KEY IS NEVER SHOWN. The keys are the product's internal identifiers, in the style the pack started with; the
 * seven new ones follow it. A stored account that still holds a removed key: ./eskiRoller.ts.
 *
 * Plain data: this file imports types only, so the pack's data file (../index.ts) stays light.
 */
import type { RolTarafi } from '@/lib/ulke/arayuz/tipler'

/** The document every `resmiAd` below was read in, and the day it was read. */
export const UZ_NOMENKLATURA = {
  ad: 'Tibbiy faoliyat amalga oshiriladigan tibbiy ixtisosliklar turlari nomenklaturasini tasdiqlash toʻgʻrisida',
  buyruq: 'Order of the Minister of Health No. 6 of 12.05.2021; registered by the Ministry of Justice on 12.05.2021, No. 3303',
  adres: 'https://lex.uz/uz/docs/-5422572',
  okundu: '2026-10-10',
} as const

/**
 * NO RUSSIAN NAME OF A ROLE IS OFFICIAL: the order is published in Uzbek only. Every Russian name in ./rolAdlari.ts
 * is machine-written; a test holds this to `false` until somebody names an official Russian text.
 */
export const UZ_RUSCHA_ADLAR_RESMIY = false as const

/** What the audit decided for the role. `keep` = unchanged; `unverified` = no decision could be made, left as it was. */
export type UzRolKarari = 'keep' | 'rename' | 'split' | 'add' | 'moved' | 'unverified'

export type UzRolSatiri = {
  /** Internal key, never shown. */
  anahtar: string
  taraf: RolTarafi
  /** The shared role this one behaves like (note template, intake questions): only a role Uzbekistan alone has. */
  gibi?: string
  /** The specialty's name exactly as the order writes it (Uzbek Latin); null = not found in the order. */
  resmiAd: string | null
  /** Where it stands in the order's annex 1; null with `resmiAd`. */
  yer: string | null
  karar: UzRolKarari
}

const r = (anahtar: string, taraf: RolTarafi, karar: UzRolKarari, resmiAd: string | null, yer: string | null, gibi?: string): UzRolSatiri => ({ anahtar, taraf, karar, resmiAd, yer, ...(gibi ? { gibi } : {}) })
const TERAPIYA = 'row 3, an additional specialty under "Terapiya"'
const XIRURGIYA = 'row 21, an additional specialty under "Xirurgiya"'

/** The roles, in the order they are offered: doctor specialties, clinic doctors, clinic allied professions. */
export const UZ_ROL_SATIRLARI: readonly UzRolSatiri[] = [
  // ── doctor specialties (37)
  r('acil-tip', 'doktor', 'keep', 'Shoshilinch tibbiy yordam', 'row 23'),
  r('aile-hekimligi', 'doktor', 'rename', 'Oilaviy shifokorlik', 'row 1, the bachelor-level specialty of "Davolash ishi"'),
  r('anestezi', 'doktor', 'keep', 'Anesteziologiya va reanimatologiya', 'row 2'),
  r('beyin-cerrahisi', 'doktor', 'keep', 'Neyroxirurgiya', 'row 13'),
  r('cocuk-cerrahisi', 'doktor', 'keep', 'Bolalar xirurgiyasi', 'row 28'),
  r('dahiliye', 'doktor', 'rename', 'Terapiya', 'row 3'),
  r('dermatoloji', 'doktor', 'keep', 'Dermatovenerologiya', 'row 5'),
  r('endokrinoloji', 'doktor', 'keep', 'Endokrinologiya', 'row 22'),
  r('enfeksiyon-hastaliklari', 'doktor', 'keep', 'Yuqumli kasalliklar', 'row 6'),
  r('gastroenteroloji', 'doktor', 'keep', 'Gastroenterologiya', TERAPIYA),
  r('genel-cerrahi', 'doktor', 'rename', 'Xirurgiya', 'row 21'),
  r('gogus-cerrahisi', 'doktor', 'keep', 'Torakal xirurgiya', XIRURGIYA),
  r('gogus-hastaliklari', 'doktor', 'keep', 'Pulmonologiya', TERAPIYA),
  r('goz-hastaliklari', 'doktor', 'keep', 'Oftalmologiya', 'row 16'),
  r('kadin-hastaliklari-dogum', 'doktor', 'keep', 'Akusherlik va ginekologiya', 'row 1'),
  // THE SPLIT: two specialties in the order, no joint one. The old key carries the first, so nothing stored under it is lost.
  r('kalp-damar-cerrahisi', 'doktor', 'split', 'Kardioxirurgiya', XIRURGIYA),
  r('damar-cerrahisi', 'doktor', 'split', 'Qon tomirlar xirurgiyasi', XIRURGIYA, 'kalp-damar-cerrahisi'),
  r('kardiyoloji', 'doktor', 'keep', 'Kardiologiya', 'row 4'),
  // The pack's name keeps "(LOR)", which the order does not have: the audit lets a label keep it.
  r('kulak-burun-bogaz', 'doktor', 'keep', 'Otorinolaringologiya', 'row 15'),
  // The order writes "Nefrologiya gemodializ bilan"; the Ministry's 2024 list of protocol areas writes "Nefrologiya", as the pack does.
  r('nefroloji', 'doktor', 'keep', 'Nefrologiya gemodializ bilan', TERAPIYA),
  r('noroloji', 'doktor', 'keep', 'Nevrologiya', 'row 7'),
  // The order writes "Umumiy onkologiya"; the Ministry's 2024 list of protocol areas writes "Onkologiya", as the pack does.
  r('onkoloji', 'doktor', 'keep', 'Umumiy onkologiya', 'row 14'),
  r('ortopedi', 'doktor', 'keep', 'Travmatologiya va ortopediya', 'row 18'),
  r('pediatri', 'doktor', 'keep', 'Pediatriya', 'row 25'),
  r('plastik-cerrahi', 'doktor', 'keep', 'Plastik xirurgiya', XIRURGIYA),
  r('psikiyatri', 'doktor', 'keep', 'Psixiatriya', 'row 9'),
  r('radyoloji', 'doktor', 'rename', 'Tibbiy radiologiya', 'row 12'),
  r('romatoloji', 'doktor', 'keep', 'Revmatologiya', TERAPIYA),
  r('uroloji', 'doktor', 'keep', 'Urologiya', 'row 19'),
  r('spor-hekimligi', 'doktor', 'keep', 'Sport tibbiyoti', TERAPIYA),
  r('fizik-tedavi', 'doktor', 'rename', 'Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya)', TERAPIYA),
  // ADDED: recognised by the order, absent before. `gibi` = the shared role whose template and questions it uses.
  r('alerji-immunoloji', 'doktor', 'add', 'Allergologiya va klinik immunologiya', TERAPIYA, 'dahiliye'),
  r('reproduktoloji', 'doktor', 'add', 'Reproduktologiya', 'row 1, an additional specialty under "Akusherlik va ginekologiya"', 'kadin-hastaliklari-dogum'),
  // The order places it under "Pediatriya"; its note records a neurological examination, so it behaves like neurology,
  // and it is one of the roles whose patients are children (./notSablonlari.ts → BOLALAR_ROLLARI).
  r('cocuk-norolojisi', 'doktor', 'add', 'Bolalar nevrologiyasi', 'row 25, an additional specialty under "Pediatriya"', 'noroloji'),
  r('narkoloji', 'doktor', 'add', 'Narkologiya', 'row 11', 'psikiyatri'),
  // MOVED TO THE DOCTOR SIDE: a doctor's specialty in the order. A new key, because a shared role keeps its kind.
  r('diyetoloji', 'doktor', 'moved', 'Diyetologiya', TERAPIYA, 'diyetisyen'),
  r('surdoloji', 'doktor', 'moved', 'Surdologiya', 'row 15, an additional specialty under "Otorinolaringologiya"', 'odyoloji'),
  // ── clinic doctors (3)
  r('estetik-cerrahi', 'klinik-hekim', 'rename', 'Plastik xirurgiya', XIRURGIYA),
  r('medikal-estetik', 'klinik-hekim', 'rename', 'Tibbiy kosmetologiya', 'row 5, an additional specialty under "Dermatovenerologiya"'),
  r('klinik-dermatoloji', 'klinik-hekim', 'rename', 'Dermatovenerologiya', 'row 5'),
  // ── clinic allied professions (2)
  r('fizyoterapi', 'klinik-muttefik', 'unverified', null, null),
  // The order names the field, "Klinik psixologiya" (section VII); the pack names the profession, as for every allied role.
  r('klinik-psikolog', 'klinik-muttefik', 'keep', 'Klinik psixologiya', 'section VII, row 56'),
]

/** The role keys, in the order they are offered. The pack's `uygulama.roller`. */
export const UZ_ROL_ANAHTARLARI: readonly string[] = UZ_ROL_SATIRLARI.map((x) => x.anahtar)

/**
 * THE DOCTOR ROLES, in the pack's order: every role that is not an allied profession (40 of the 42). The list behind
 * "every doctor role" in the tools area (the kit's `sinif: 'hekimler'`; lib/ulke/araclar/paket.ts → hekimRolleri gives
 * the same list, and a test holds the two together).
 */
export const UZ_HEKIM_ROLLERI: readonly string[] = UZ_ROL_SATIRLARI.filter((x) => x.taraf !== 'klinik-muttefik').map((x) => x.anahtar)

/**
 * RECOGNISED BY THE ORDER AND NOT BUILT, each the owner's decision (the audit, section 3.2 and 3.3). Documentation
 * and the report only: nothing reads this list.
 */
export const UZ_KAPSAM_DISI: readonly { resmiAd: string; yer: string; neden: string }[] = [
  { resmiAd: 'Stomatologiya', yer: 'section IV, rows 42 to 52', neden: 'A whole direction of the nomenclature with seven specialties. It needs a note template, an intake set and tools of its own: out of scope of the job that applied the audit, and the owner\'s decision.' },
  { resmiAd: 'Xalq tabobati', yer: 'section VIII, row 58 (and order No. 54 of 27.11.2018, registration No. 3111)', neden: 'A recognised direction with an order of its own. No role of the product is close enough to behave like; whether the product wants this field at all is the owner\'s decision.' },
]
