/**
 * NOTYA-UZ-BRANSLAR-01 — Uzbekistan: what each of the 40 roles is CALLED, in the three forms an account can read
 * (Uzbek in Latin script, Uzbek in Cyrillic script, Russian).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW. These names were written by a machine from general knowledge of how
 * specialties and professions are named in Uzbekistan. No Uzbek or Russian speaker and no clinician has read them,
 * and they were not checked against the official list of medical specialties of Uzbekistan
 * (docs/COUNTRY-PACK-CHECKLIST.md C1, E4, E11). They must be read and corrected before a real doctor sees them.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * NOT A TRANSLATION of the Turkish product's labels: each name is the one the specialty usually goes by in Uzbek and
 * in Russian (for example trauma and orthopaedics are one specialty here, and so are obstetrics and gynaecology).
 * The Cyrillic form is written by hand, name by name; it is not converted at run time.
 *
 * The KEYS are the product's internal identifiers, the same 40 as ./asistanAdlari.ts (the single list of roles).
 * A key is never shown: a screen shows the name from here, in the account's form.
 *
 * Three kinds of role (the `taraf` of ./asistanAdlari.ts): a doctor specialty (30), a clinic doctor (5) and a clinic
 * allied profession (5). Doctor roles are named as the specialty; allied roles are named as the profession.
 */
import { UZ_ASISTAN_ADLARI, type AsistanTarafi } from './asistanAdlari'

export type UzAdDili = 'uz-Latn' | 'uz-Cyrl' | 'ru'
export type UcBicim = Readonly<Record<UzAdDili, string>>

/** The 40 role keys, in the owner's order. One source: the owner's list. */
export const UZ_ROLLER: readonly string[] = UZ_ASISTAN_ADLARI.map((a) => a.bransAnahtari)

const ad = (latin: string, kirill: string, ruscha: string): UcBicim => ({ 'uz-Latn': latin, 'uz-Cyrl': kirill, ru: ruscha })

export const UZ_ROL_ADLARI: Readonly<Record<string, UcBicim>> = {
  // ── doctor specialties (30)
  'acil-tip': ad('Shoshilinch tibbiy yordam', 'Шошилинч тиббий ёрдам', 'Скорая и неотложная помощь'),
  'aile-hekimligi': ad('Oilaviy tibbiyot', 'Оилавий тиббиёт', 'Семейная медицина'),
  anestezi: ad('Anesteziologiya va reanimatologiya', 'Анестезиология ва реаниматология', 'Анестезиология и реаниматология'),
  'beyin-cerrahisi': ad('Neyroxirurgiya', 'Нейрохирургия', 'Нейрохирургия'),
  'cocuk-cerrahisi': ad('Bolalar xirurgiyasi', 'Болалар хирургияси', 'Детская хирургия'),
  dahiliye: ad('Terapiya (ichki kasalliklar)', 'Терапия (ички касалликлар)', 'Терапия (внутренние болезни)'),
  dermatoloji: ad('Dermatovenerologiya', 'Дерматовенерология', 'Дерматовенерология'),
  endokrinoloji: ad('Endokrinologiya', 'Эндокринология', 'Эндокринология'),
  'enfeksiyon-hastaliklari': ad('Yuqumli kasalliklar', 'Юқумли касалликлар', 'Инфекционные болезни'),
  gastroenteroloji: ad('Gastroenterologiya', 'Гастроэнтерология', 'Гастроэнтерология'),
  'genel-cerrahi': ad('Umumiy xirurgiya', 'Умумий хирургия', 'Общая хирургия'),
  'gogus-cerrahisi': ad('Torakal xirurgiya', 'Торакал хирургия', 'Торакальная хирургия'),
  'gogus-hastaliklari': ad('Pulmonologiya', 'Пульмонология', 'Пульмонология'),
  'goz-hastaliklari': ad('Oftalmologiya', 'Офтальмология', 'Офтальмология'),
  'kadin-hastaliklari-dogum': ad('Akusherlik va ginekologiya', 'Акушерлик ва гинекология', 'Акушерство и гинекология'),
  'kalp-damar-cerrahisi': ad('Yurak-qon tomir xirurgiyasi', 'Юрак-қон томир хирургияси', 'Сердечно-сосудистая хирургия'),
  kardiyoloji: ad('Kardiologiya', 'Кардиология', 'Кардиология'),
  'kulak-burun-bogaz': ad('Otorinolaringologiya (LOR)', 'Оториноларингология (ЛОР)', 'Оториноларингология (ЛОР)'),
  nefroloji: ad('Nefrologiya', 'Нефрология', 'Нефрология'),
  noroloji: ad('Nevrologiya', 'Неврология', 'Неврология'),
  onkoloji: ad('Onkologiya', 'Онкология', 'Онкология'),
  ortopedi: ad('Travmatologiya va ortopediya', 'Травматология ва ортопедия', 'Травматология и ортопедия'),
  pediatri: ad('Pediatriya', 'Педиатрия', 'Педиатрия'),
  'plastik-cerrahi': ad('Plastik xirurgiya', 'Пластик хирургия', 'Пластическая хирургия'),
  psikiyatri: ad('Psixiatriya', 'Психиатрия', 'Психиатрия'),
  radyoloji: ad('Radiologiya (nur tashxisi)', 'Радиология (нур ташхиси)', 'Лучевая диагностика (радиология)'),
  romatoloji: ad('Revmatologiya', 'Ревматология', 'Ревматология'),
  uroloji: ad('Urologiya', 'Урология', 'Урология'),
  'spor-hekimligi': ad('Sport tibbiyoti', 'Спорт тиббиёти', 'Спортивная медицина'),
  'fizik-tedavi': ad('Tibbiy reabilitatsiya va fizioterapiya', 'Тиббий реабилитация ва физиотерапия', 'Медицинская реабилитация и физиотерапия'),
  // ── clinic doctors (5)
  'sac-ekimi': ad('Soch koʻchirib oʻtkazish', 'Соч кўчириб ўтказиш', 'Трансплантация волос'),
  'estetik-cerrahi': ad('Estetik xirurgiya', 'Эстетик хирургия', 'Эстетическая хирургия'),
  'medikal-estetik': ad('Kosmetologiya (estetik tibbiyot)', 'Косметология (эстетик тиббиёт)', 'Косметология (эстетическая медицина)'),
  'klinik-dermatoloji': ad('Dermatologiya (klinika)', 'Дерматология (клиника)', 'Дерматология (клиника)'),
  longevity: ad('Profilaktik va yoshga qarshi tibbiyot', 'Профилактик ва ёшга қарши тиббиёт', 'Превентивная и антивозрастная медицина'),
  // ── clinic allied professions (5)
  fizyoterapi: ad('Jismoniy reabilitatsiya mutaxassisi', 'Жисмоний реабилитация мутахассиси', 'Специалист по физической реабилитации'),
  'klinik-psikolog': ad('Klinik psixolog', 'Клиник психолог', 'Клинический психолог'),
  diyetisyen: ad('Diyetolog', 'Диетолог', 'Диетолог'),
  ergoterapi: ad('Ergoterapevt', 'Эрготерапевт', 'Эрготерапевт'),
  odyoloji: ad('Audiolog', 'Аудиолог', 'Аудиолог'),
}

const TARAFLAR: ReadonlyMap<string, AsistanTarafi> = new Map(UZ_ASISTAN_ADLARI.map((a) => [a.bransAnahtari, a.taraf]))

/** true = one of the 40 roles. Anything else — another country's key, a made-up one, an empty value — is not a role. */
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
  roller: UZ_ASISTAN_ADLARI.filter((a) => a.taraf === taraf).map((a) => a.bransAnahtari),
}))
