/**
 * NOTYA-UZ-BRANSLAR-01 · NOTYA-ULKE-UYGULA-UZ — Uzbekistan: what each role is CALLED, in the three forms an account
 * can read (Uzbek in Latin script, Uzbek in Cyrillic script, Russian).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. No Uzbek or Russian speaker and no clinician has read these names
 * (docs/COUNTRY-PACK-CHECKLIST.md C1, E4, E11). They must be read and corrected before a real doctor sees them.
 *
 * THE UZBEK LATIN NAME of a role the audit of 2026-10-10 renamed, split or added is the specialty's name EXACTLY AS
 * THE NOMENCLATURE WRITES IT (order No. 6 of 12.05.2021, registration No. 3303; ./rolListesi.ts → `resmiAd`, read
 * on 2026-10-10). A role the audit kept has the name it had, which for three of them is shorter or longer than the
 * order's ("(LOR)", "Nefrologiya", "Onkologiya": ./rolListesi.ts says where). An allied profession is named as the
 * profession, not as the field.
 * THE RUSSIAN NAMES ARE UNOFFICIAL, EVERY ONE: the order is published in Uzbek only, so no official Russian name of a
 * specialty exists to copy (./rolListesi.ts → UZ_RUSCHA_ADLAR_RESMIY). Each is the name the specialty usually goes
 * by in Russian, written by a machine.
 * THE CYRILLIC FORM is written in this file, name by name; it is not converted at run time. For the names the audit
 * changed it is what the pack's rule gives for the Latin name (scripts/uz-kiril.mjs), with one loan word spelled by
 * hand («физкультураси»: the rule cannot know its «ь»); ./roller.test.ts holds them to that.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOT A TRANSLATION of the Turkish product's labels: each name is the one the specialty goes by here (for example
 * trauma and orthopaedics are one specialty, and so are obstetrics and gynaecology).
 *
 * TWO PAIRS OF ROLES NOW CARRY THE SAME NAME, one on the doctor side and one on the clinic side: "Plastik xirurgiya"
 * (plastik-cerrahi and estetik-cerrahi) and "Dermatovenerologiya" (dermatoloji and klinik-dermatoloji). The order has
 * one specialty for each pair and no word "estetik"; the audit renamed the clinic roles and kept them. The role
 * question shows them under different group headings; inside one group no two roles share a name.
 *
 * The KEYS are the product's internal identifiers, the list of ./rolListesi.ts (the single list of roles). A key is
 * never shown: a screen shows the name from here, in the account's form.
 *
 * Three kinds of role: a doctor specialty (37), a clinic doctor (3) and a clinic allied profession (2).
 */
import type { RolTanimi } from '@/lib/ulke/arayuz/tipler'
import type { AsistanTarafi } from './asistanAdlari'
import { UZ_ROL_ANAHTARLARI, UZ_ROL_SATIRLARI } from './rolListesi'

export type UzAdDili = 'uz-Latn' | 'uz-Cyrl' | 'ru'
export type UcBicim = Readonly<Record<UzAdDili, string>>

/** The role keys, in the order they are offered. One source: ./rolListesi.ts. */
export const UZ_ROLLER: readonly string[] = UZ_ROL_ANAHTARLARI

const ad = (latin: string, kirill: string, ruscha: string): UcBicim => ({ 'uz-Latn': latin, 'uz-Cyrl': kirill, ru: ruscha })

export const UZ_ROL_ADLARI: Readonly<Record<string, UcBicim>> = {
  // ── doctor specialties (37)
  'acil-tip': ad('Shoshilinch tibbiy yordam', 'Шошилинч тиббий ёрдам', 'Скорая и неотложная помощь'),
  'aile-hekimligi': ad('Oilaviy shifokorlik', 'Оилавий шифокорлик', 'Семейная медицина'),
  anestezi: ad('Anesteziologiya va reanimatologiya', 'Анестезиология ва реаниматология', 'Анестезиология и реаниматология'),
  'beyin-cerrahisi': ad('Neyroxirurgiya', 'Нейрохирургия', 'Нейрохирургия'),
  'cocuk-cerrahisi': ad('Bolalar xirurgiyasi', 'Болалар хирургияси', 'Детская хирургия'),
  dahiliye: ad('Terapiya', 'Терапия', 'Терапия'),
  dermatoloji: ad('Dermatovenerologiya', 'Дерматовенерология', 'Дерматовенерология'),
  endokrinoloji: ad('Endokrinologiya', 'Эндокринология', 'Эндокринология'),
  'enfeksiyon-hastaliklari': ad('Yuqumli kasalliklar', 'Юқумли касалликлар', 'Инфекционные болезни'),
  gastroenteroloji: ad('Gastroenterologiya', 'Гастроэнтерология', 'Гастроэнтерология'),
  'genel-cerrahi': ad('Xirurgiya', 'Хирургия', 'Хирургия'),
  'gogus-cerrahisi': ad('Torakal xirurgiya', 'Торакал хирургия', 'Торакальная хирургия'),
  'gogus-hastaliklari': ad('Pulmonologiya', 'Пульмонология', 'Пульмонология'),
  'goz-hastaliklari': ad('Oftalmologiya', 'Офтальмология', 'Офтальмология'),
  'kadin-hastaliklari-dogum': ad('Akusherlik va ginekologiya', 'Акушерлик ва гинекология', 'Акушерство и гинекология'),
  // the split: the old key carries the first of the two specialties of the order
  'kalp-damar-cerrahisi': ad('Kardioxirurgiya', 'Кардиохирургия', 'Кардиохирургия'),
  'damar-cerrahisi': ad('Qon tomirlar xirurgiyasi', 'Қон томирлар хирургияси', 'Сосудистая хирургия'),
  kardiyoloji: ad('Kardiologiya', 'Кардиология', 'Кардиология'),
  'kulak-burun-bogaz': ad('Otorinolaringologiya (LOR)', 'Оториноларингология (ЛОР)', 'Оториноларингология (ЛОР)'),
  nefroloji: ad('Nefrologiya', 'Нефрология', 'Нефрология'),
  noroloji: ad('Nevrologiya', 'Неврология', 'Неврология'),
  onkoloji: ad('Onkologiya', 'Онкология', 'Онкология'),
  ortopedi: ad('Travmatologiya va ortopediya', 'Травматология ва ортопедия', 'Травматология и ортопедия'),
  pediatri: ad('Pediatriya', 'Педиатрия', 'Педиатрия'),
  'plastik-cerrahi': ad('Plastik xirurgiya', 'Пластик хирургия', 'Пластическая хирургия'),
  psikiyatri: ad('Psixiatriya', 'Психиатрия', 'Психиатрия'),
  radyoloji: ad('Tibbiy radiologiya', 'Тиббий радиология', 'Медицинская радиология'),
  romatoloji: ad('Revmatologiya', 'Ревматология', 'Ревматология'),
  uroloji: ad('Urologiya', 'Урология', 'Урология'),
  'spor-hekimligi': ad('Sport tibbiyoti', 'Спорт тиббиёти', 'Спортивная медицина'),
  'fizik-tedavi': ad('Reabilitologiya (davolash fizkulturasi, kurortologiya, fizioterapiya)', 'Реабилитология (даволаш физкультураси, курортология, физиотерапия)', 'Реабилитология (лечебная физкультура, курортология, физиотерапия)'),
  // added by the audit of 2026-10-10: recognised by the order, absent before
  'alerji-immunoloji': ad('Allergologiya va klinik immunologiya', 'Аллергология ва клиник иммунология', 'Аллергология и клиническая иммунология'),
  reproduktoloji: ad('Reproduktologiya', 'Репродуктология', 'Репродуктология'),
  'cocuk-norolojisi': ad('Bolalar nevrologiyasi', 'Болалар неврологияси', 'Детская неврология'),
  narkoloji: ad('Narkologiya', 'Наркология', 'Наркология'),
  // moved to the doctor side: doctors' specialties in the order
  diyetoloji: ad('Diyetologiya', 'Диетология', 'Диетология'),
  surdoloji: ad('Surdologiya', 'Сурдология', 'Сурдология'),
  // ── clinic doctors (3)
  'estetik-cerrahi': ad('Plastik xirurgiya', 'Пластик хирургия', 'Пластическая хирургия'),
  'medikal-estetik': ad('Tibbiy kosmetologiya', 'Тиббий косметология', 'Медицинская косметология'),
  'klinik-dermatoloji': ad('Dermatovenerologiya', 'Дерматовенерология', 'Дерматовенерология'),
  // ── clinic allied professions (2)
  fizyoterapi: ad('Jismoniy reabilitatsiya mutaxassisi', 'Жисмоний реабилитация мутахассиси', 'Специалист по физической реабилитации'),
  'klinik-psikolog': ad('Klinik psixolog', 'Клиник психолог', 'Клинический психолог'),
}

const TARAFLAR: ReadonlyMap<string, AsistanTarafi> = new Map(UZ_ROL_SATIRLARI.map((x) => [x.anahtar, x.taraf]))

/** true = one of the pack's roles. Anything else — another country's key, a made-up one, an empty value — is not a role. */
export const uzRolMu = (ham: unknown): ham is string => typeof ham === 'string' && TARAFLAR.has(ham) && ham in UZ_ROL_ADLARI

export const uzAdDili = (ham: unknown): UzAdDili => (ham === 'uz-Cyrl' || ham === 'ru' ? ham : 'uz-Latn')

/** The name of a role in the account's form. null for anything that is not a role: there is no name to fall back to. */
export function uzRolAdi(rol: unknown, dil: unknown): string | null {
  return uzRolMu(rol) ? UZ_ROL_ADLARI[rol][uzAdDili(dil)] : null
}

/** Which of the three kinds a role is. null = not a role. */
export const uzRolTarafi = (rol: unknown): AsistanTarafi | null => (uzRolMu(rol) ? TARAFLAR.get(rol) ?? null : null)

/** The roles as the picker shows them: three groups, the owner's order inside each. */
export const UZ_ROL_GRUPLARI: readonly { taraf: AsistanTarafi; roller: readonly string[] }[] = (['doktor', 'klinik-hekim', 'klinik-muttefik'] as const).map((taraf) => ({
  taraf,
  roller: UZ_ROL_SATIRLARI.filter((x) => x.taraf === taraf).map((x) => x.anahtar),
}))

/**
 * NOTYA-ULKE-SABLON-01 — the same roles in the shape the shared screens read (lib/ulke/arayuz): key, kind, the name
 * in each of the three forms and — for a role only Uzbekistan has — the shared role it behaves like (`gibi`: the
 * kit then finds its note template and its intake questions there). Built from the two lists; nothing is written twice.
 */
export const UZ_ROL_TANIMLARI: readonly RolTanimi[] = UZ_ROL_SATIRLARI.filter((x) => x.anahtar in UZ_ROL_ADLARI).map((x) => ({ anahtar: x.anahtar, taraf: x.taraf, ad: UZ_ROL_ADLARI[x.anahtar], ...(x.gibi ? { gibi: x.gibi } : {}) }))
