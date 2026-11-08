/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Uzbekistan: the specialty clinical tools of every role — published scores and
 * calculators (./olcekler1.ts, ./olcekler2.ts, ./olcekler3.ts; international sources, XALQARO), the consent discussion record and the
 * specialty conclusion (./onamRapor.ts). Specialty-only: each tool names at most three roles. Switched on without an
 * Uzbek clinician's sign-off (owner's order 2026-11-08); listed in ../onay.ts. MACHINE-WRITTEN, AWAITS REVIEW.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { anahtarOf, paketOf, tanimOf, type UzmanlikSatiri } from './motor'
import { UZ_OLCEKLER_1 } from './olcekler1'
import { UZ_OLCEKLER_2 } from './olcekler2'
import { UZ_OLCEKLER_3 } from './olcekler3'
import { UZ_ONAM_RAPOR_ANAHTARLARI, UZ_ONAM_RAPOR_TANIMLAR, uzOnamRaporAraclari } from './onamRapor'

export const UZ_UZMANLIK_SATIRLARI: readonly UzmanlikSatiri[] = [...UZ_OLCEKLER_1, ...UZ_OLCEKLER_2, ...UZ_OLCEKLER_3]
export const UZ_UZMANLIK_TANIMLAR: readonly AracTanimi[] = [...UZ_UZMANLIK_SATIRLARI.map(tanimOf), ...UZ_ONAM_RAPOR_TANIMLAR]
export const uzUzmanlikAraclari = (): readonly PaketAraci[] => [...UZ_UZMANLIK_SATIRLARI.map(paketOf), ...uzOnamRaporAraclari()]
export const UZ_UZMANLIK_ANAHTARLARI: readonly string[] = [...UZ_UZMANLIK_SATIRLARI.map(anahtarOf), ...UZ_ONAM_RAPOR_ANAHTARLARI]
