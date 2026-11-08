/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Australia: the specialty clinical tools, every role. Each file holds the rows
 * of a group of specialties (./motor.ts explains a row). Specialty-only: each row names at most three roles.
 * Switched on without an Australian clinician's sign-off (owner's order 2026-11-08); listed in ../onaysizAciklar.ts.
 * AU assistant: untouched (no assistant code or prompt is read or changed here).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { anahtarOf, paketOf, tanimOf, type UzmanlikSatiri } from './motor'
import { KALP_DAMAR } from './kalpDamar'
import { ACIL_NORO } from './acilNoro'
import { DAHILIYE } from './dahiliye'
import { CERRAHI } from './cerrahi'
import { RUHSAL_MUTTEFIK } from './ruhsalMuttefik'
import { AU_ONAM_ANAHTARLARI, AU_ONAM_TANIMLAR, auOnamAraclari } from './onam'
import { AU_RAPOR_ANAHTARLARI, AU_RAPOR_TANIMLAR, auRaporAraclari } from './rapor'

export const AU_UZMANLIK_SATIRLARI: readonly UzmanlikSatiri[] = [...KALP_DAMAR, ...ACIL_NORO, ...DAHILIYE, ...CERRAHI, ...RUHSAL_MUTTEFIK]

/** The scores and calculators (./motor.ts rows), then the per-role consent discussion record (./onam.ts) and specialty report (./rapor.ts). */
export const AU_UZMANLIK_TANIMLAR: readonly AracTanimi[] = [...AU_UZMANLIK_SATIRLARI.map(tanimOf), ...AU_ONAM_TANIMLAR, ...AU_RAPOR_TANIMLAR]
export const auUzmanlikAraclari = (): readonly PaketAraci[] => [...AU_UZMANLIK_SATIRLARI.map(paketOf), ...auOnamAraclari(), ...auRaporAraclari()]
export const AU_UZMANLIK_ANAHTARLARI: readonly string[] = [...AU_UZMANLIK_SATIRLARI.map(anahtarOf), ...AU_ONAM_ANAHTARLARI, ...AU_RAPOR_ANAHTARLARI]
