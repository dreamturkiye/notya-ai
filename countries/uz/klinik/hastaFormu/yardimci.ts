/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: small helpers for writing the intake form's questions in the three forms of
 * the application (Uzbek in Latin script, Uzbek in Cyrillic script, Russian). No question is defined here; only the
 * shapes the question files are written with, and a few answers and detail labels that many questions share.
 *
 * Sharing a LABEL between roles is not a leak: a label is a piece of text ("Which ones? Write briefly."). A QUESTION
 * belongs to the one set that lists it, and every question key is unique in the whole pack (the kit's check).
 */
import type { FormIncelemesi, Olcu, Secenek, Soru } from '@/lib/ulke/intake/tipler'

export type Uc = Readonly<Record<'uz-Latn' | 'uz-Cyrl' | 'ru', string>>
/** One text in the three forms: Uzbek Latin, Uzbek Cyrillic (written by hand, not converted), Russian. */
export const u = (latin: string, kirill: string, ruscha: string): Uc => ({ 'uz-Latn': latin, 'uz-Cyrl': kirill, ru: ruscha })

/** Every set of this pack today: written by a machine, read by no local clinician. */
export const MAKINE: FormIncelemesi = { makineYazimi: true, klinisyen: null }

/** An option of a choice. */
export const s = (anahtar: string, latin: string, kirill: string, ruscha: string): Secenek => ({ anahtar, ad: u(latin, kirill, ruscha) })
/** "None of these" — stands alone in a multiple choice. */
export const YOQ = (): Secenek => ({ anahtar: 'yoq', ad: u('Bularning hech biri yoʻq', 'Буларнинг ҳеч бири йўқ', 'Ничего из перечисленного'), tek: true })
/** Yes / no / I do not know, as a single choice. */
export const HA_YOQ_BILMAYMAN = (): Secenek[] => [s('ha', 'Ha', 'Ҳа', 'Да'), s('yoq', 'Yoʻq', 'Йўқ', 'Нет'), s('bilmayman', 'Bilmayman', 'Билмайман', 'Не знаю')]

type Ek = { zorunlu?: boolean; kime?: 'yetiskin' | 'cocuk'; cinsiyet?: 'female' | 'male'; yardim?: Uc; veliMetni?: Uc }
export const tek = (anahtar: string, metin: Uc, secenekler: Secenek[], ek: Ek = {}): Soru => ({ anahtar, tur: 'tek-secim', metin, secenekler, ...ek })
export const cok = (anahtar: string, metin: Uc, secenekler: Secenek[], ek: Ek = {}): Soru => ({ anahtar, tur: 'cok-secim', metin, secenekler, ...ek })
export const kisa = (anahtar: string, metin: Uc, ek: Ek = {}): Soru => ({ anahtar, tur: 'kisa-metin', metin, ...ek })
export const uzun = (anahtar: string, metin: Uc, ek: Ek = {}): Soru => ({ anahtar, tur: 'uzun-metin', metin, ...ek })
/** Yes / no; `ayrinti` is the label of the line asked after "yes". */
export const eh = (anahtar: string, metin: Uc, ayrinti?: Uc, ek: Ek = {}): Soru => ({ anahtar, tur: 'evet-hayir', metin, ...(ayrinti ? { ayrinti } : {}), ...ek })
export const gun = (anahtar: string, metin: Uc, ek: Ek = {}): Soru => ({ anahtar, tur: 'tarih', metin, ...ek })
/** A measure in the PACK's unit (height, weight, temperature): the unit is never written into the question. */
export const olcu = (anahtar: string, metin: Uc, o: Olcu, ek: Ek = {}): Soru => ({ anahtar, tur: 'sayi', olcu: o, metin, ...ek })
/** A number with a unit of the question's own. */
export const son = (anahtar: string, metin: Uc, birim: Uc, enAz: number, enCok: number, ek: Ek = {}): Soru => ({ anahtar, tur: 'sayi', metin, birim, enAz, enCok, ...ek })

// ── labels of the detail line after "yes", shared by many questions ──
export const QAYSI = u('Qaysilari? Qisqacha yozing.', 'Қайсилари? Қисқача ёзинг.', 'Какие именно? Напишите коротко.')
export const QANDAY = u('Qanday? Qisqacha yozing.', 'Қандай? Қисқача ёзинг.', 'Что именно? Напишите коротко.')
export const QACHON = u('Qachon va nima sababdan?', 'Қачон ва нима сабабдан?', 'Когда и по какой причине?')
export const QACHON_NATIJA = u('Qaysi tekshiruv, qachon va natijasi (bilganingizcha)', 'Қайси текширув, қачон ва натижаси (билганингизча)', 'Какое обследование, когда и с каким результатом (насколько вам известно)')
export const KIMDA = u('Kimda va qanday kasallik?', 'Кимда ва қандай касаллик?', 'У кого и какое заболевание?')
export const DORI_NOMI = u('Dorining nomi (bilganingizcha)', 'Дорининг номи (билганингизча)', 'Название лекарства (если знаете)')
export const KORSATKICH = u('Odatda qanday koʻrsatkichlar boʻladi?', 'Одатда қандай кўрсаткичлар бўлади?', 'Какие показатели бывают обычно?')

// ── units of a question's own ──
export const BALL = u('ball', 'балл', 'балл')
export const MARTA = u('marta', 'марта', 'раз')
export const HAFTA = u('hafta', 'ҳафта', 'нед.')
export const SOAT = u('soat', 'соат', 'ч')
export const GRAMM = u('gramm', 'грамм', 'граммов')
export const STAKAN = u('stakan', 'стакан', 'стаканов')
