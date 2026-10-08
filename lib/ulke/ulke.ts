/**
 * NOTYA-ULKE-01 (Kaan, 2026-10-08) — the questions core code may ask about the country it is running for.
 *
 *   aktifUlke()        which country does this deployment serve?
 *   ulkePaketi()       that country's pack (formats, currency, features, tools, text)
 *   ozellikAcik(x)     is feature x on here?   → false for anything the pack does not list
 *   aracUlkedeGecerli  is this /doktor-tools route valid here?
 *
 * Fail closed, always: an unlisted feature, tool, language or text is OFF / an error. Nothing falls back to another
 * country. Core code must not compare country codes itself — ask the pack (scripts/ulke-duvarlari.mjs enforces it).
 */
import { AKTIF_PAKET } from '@/countries/active'
import type { DilKodu, Ozellik, UlkeKodu, UlkePaketi } from './tipler'

export function aktifUlke(): UlkeKodu {
  return AKTIF_PAKET.kod
}

export function ulkePaketi(): UlkePaketi {
  return AKTIF_PAKET
}

/** Off for anything not listed in the active pack. */
export function ozellikAcik(ozellik: Ozellik): boolean {
  return AKTIF_PAKET.ozellikler[ozellik] === true
}

/**
 * A tool is valid here only when the tool itself names this country AND the pack lists its route (two locks, one per
 * side of the wall), and the Araçlar feature is on at all.
 */
export function aracUlkedeGecerli(route: string, aracUlkeleri: readonly UlkeKodu[] | null | undefined): boolean {
  if (!ozellikAcik('doktorAraclari')) return false
  if (!aracUlkeleri || !aracUlkeleri.includes(AKTIF_PAKET.kod)) return false
  return AKTIF_PAKET.araclar.includes(route)
}

/** The requested language when this country has it switched on; otherwise the country's own default. Never another country's. */
export function dilSec(ham: string | null | undefined): DilKodu {
  const istenen = String(ham ?? '').trim()
  return (AKTIF_PAKET.acikDiller as readonly string[]).includes(istenen) ? (istenen as DilKodu) : AKTIF_PAKET.varsayilanDil
}
