/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — the expired-session notice on the country /login page, per language.
 * Same pattern as ./sifreSifirlaMetinleri.ts (a small dictionary keyed by DilKodu, outside the pack catalogue).
 * No Turkish here (a country build carries none: `tr` falls back to English). English variants share one sentence; Uzbek Cyrillic is the letter-for-letter form of the Latin; Russian is its own.
 */
import type { DilKodu } from '@/lib/ulke/tipler'

export type OturumDolduMetni = { notice: string }

const EN: OturumDolduMetni = { notice: 'Your session has expired. Please sign in again.' }

const METIN: Partial<Record<DilKodu, OturumDolduMetni>> = {
  'uz-Latn': { notice: 'Seansingiz muddati tugadi. Iltimos, qaytadan kiring.' },
  'uz-Cyrl': { notice: 'Сеансингиз муддати тугади. Илтимос, қайтадан киринг.' },
  ru: { notice: 'Срок вашего сеанса истёк. Пожалуйста, войдите снова.' },
  'en-GB': EN,
  'en-US': EN,
  'en-CA': EN,
  'en-AU': EN,
  'en-NZ': EN,
}

export function oturumDolduMetni(dil: DilKodu): OturumDolduMetni {
  return METIN[dil] ?? EN
}
