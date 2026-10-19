/**
 * NOTYA-UZ-DOKTOR-PERSONA-SES-01 — thin reader for Uzbekistan's Doktor gender/voice data. The data itself
 * (inferred, pending owner review) lives in the country pack: countries/uz/klinik/asistanSesi.ts, reached via
 * countries/active, never imported here directly.
 *
 * NOTYA-ASISTAN-PERSONA-SES-01 (2026-10-18) — FIXED D1 WALL VIOLATION. This file used to `import { UZ_ASISTAN_ADLARI }
 * from '@/countries/uz/klinik/asistanAdlari'` directly — core code (lib/asistan/) outside countries/ reaching one
 * specific country's files without going through countries/active (scripts/ulke-duvarlari.mjs, rule D1). That
 * failed the UZ Vercel build (BUILD_UTILS_SPAWN_1, scripts/ulke-derle.mjs). Now it reads `AKTIF_PAKET.asistanSesleri`
 * (lib/ulke/tipler.ts, `UlkePaketi.asistanSesleri`) — the one door every country's data comes through — and returns
 * null for any country/branş that has none, exactly as before: never a fallback to another country's or branş's data.
 */
import { AKTIF_PAKET } from '@/countries/active'

export interface UzDoktorPersonaSesi {
  gender: 'female' | 'male'
  voiceId: string
}

/** The inferred gender/voice for a Doktor specialty key in the active country build, or null if none is set. */
export function uzDoktorPersonaSesi(bransAnahtari: string): UzDoktorPersonaSesi | null {
  const girdi = AKTIF_PAKET.asistanSesleri?.bransaGore?.[bransAnahtari]
  if (!girdi || !girdi.voiceId) return null
  return { gender: girdi.gender, voiceId: girdi.voiceId }
}
