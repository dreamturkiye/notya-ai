/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: small helpers the tool texts are written with, and the few lines many tools
 * share. No tool is defined here.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { AracMetni } from '@/lib/ulke/araclar/tipler'

export type Uc = Readonly<Record<'uz-Latn' | 'uz-Cyrl' | 'ru', string>>
/** One text in the three forms: Uzbek Latin, Uzbek Cyrillic, Russian. */
export const u = (latin: string, kirill: string, ruscha: string): Uc => ({ 'uz-Latn': latin, 'uz-Cyrl': kirill, ru: ruscha })
/** A text that reads the same in every form: a digit, a Roman numeral, an international abbreviation. */
export const ayni = (metin: string): Uc => u(metin, metin, metin)
/** Options whose names are their own keys (levels 1 to 5, classes I to V). */
export const kendiAdi = (anahtarlar: readonly string[]): Record<string, Uc> => Object.fromEntries(anahtarlar.map((k) => [k, ayni(k)]))

// ── the line under a result: what the tool is not ──
export const KARAR = u('Qarorga yordam beruvchi vosita: tashxis va davolash qarori shifokorniki.', 'Қарорга ёрдам берувчи восита: ташхис ва даволаш қарори шифокорники.', 'Инструмент поддержки решения: диагноз и лечение определяет врач.')
export const DOZASIZ = u('Qarorga yordam beruvchi vosita: tashxis, dori va doza shifokorniki.', 'Қарорга ёрдам берувчи восита: ташхис, дори ва доза шифокорники.', 'Инструмент поддержки решения: диагноз, препараты и дозы определяет врач.')

// ── labels many lists share ──
export const BELGILANGAN_BANDLAR = u('Belgilangan bandlar', 'Белгиланган бандлар', 'Отмечено пунктов')
export const BELGILANGAN_BELGILAR = u('Belgilangan belgilar', 'Белгиланган белгилар', 'Отмечено признаков')
export const KEYINGI_NAZORAT_SANASI = u('Keyingi nazorat sanasi (ixtiyoriy)', 'Кейинги назорат санаси (ихтиёрий)', 'Дата следующего контроля (необязательно)')
export const KEYINGI_NAZORAT = u('Keyingi nazorat', 'Кейинги назорат', 'Следующий контроль')

/** "Follow-up task: …" — a list's own item, repeated as something to come back to. */
export const vazifa = (latin: string, kirill: string, ruscha: string): Uc => u(`Kuzatuv vazifasi: ${latin}`, `Кузатув вазифаси: ${kirill}`, `Задача для контроля: ${ruscha}`)

export type Metin = AracMetni
