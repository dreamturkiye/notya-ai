/**
 * NOTYA-ULKE-01 — Turkish text of the core surfaces. Turkish is the source: every other language is written against
 * the same keys (lib/ulke/tipler.ts → YuzeyAnahtarlari).
 */
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'

/** Same sentence a wrong password gets (app/giris/authHataMesaji.ts) — a refused account must not learn why. */
export const TR_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'E-posta veya şifre hatalı.',
}
