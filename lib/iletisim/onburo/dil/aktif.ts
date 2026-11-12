/**
 * WHATSAPP-ONBURO-01 — the language pack of THIS build. Türkiye (main) = Turkish. A country build replaces this one file
 * with a re-export of its own pack (countries/active/onBuro); the engine imports the pack from here and nowhere else.
 */
import { TR_ON_BURO } from './tr'
import type { OnBuroDili } from './tipler'

export const AKTIF_ON_BURO: OnBuroDili = TR_ON_BURO
/** Time zone of the practice calendar in this build (lib/randevu/v2/zaman.ts). */
export const ON_BURO_SAAT_DILIMI = 'Europe/Istanbul'
