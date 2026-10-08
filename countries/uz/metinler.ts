/**
 * NOTYA-ULKE-01 — Uzbekistan: text of the core surfaces, per switched-on language (Uzbek in Latin script, Russian).
 * Written against the same keys as the Turkish source (lib/ulke/tipler.ts → YuzeyAnahtarlari); never copied from it.
 *
 * MACHINE-WRITTEN. A native speaker must read every line before the country goes public (checklist E11).
 * Uzbek Latin uses U+02BB (ʻ) in oʻ / gʻ and U+02BC (ʼ) for the tutuq belgisi.
 * Uzbek in Cyrillic script is declared in the pack but not switched on: no catalogue exists for it yet.
 */
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'

export const UZ_LATN_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'Elektron pochta yoki parol notoʻgʻri.',
}

export const UZ_RU_HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'Неверный адрес электронной почты или пароль.',
}
