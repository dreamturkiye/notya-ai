/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — unified "report date + report number" for every
 * patient report that is NOT a live Medula submission.
 *
 * SGK/Medula draft types (is_goremezlik, ilac_kullanim, tibbi_malzeme, tek_hekim_durum,
 * saglik_kurulu) keep their existing, legally-accurate wording — "Rapor No Medula
 * tarafından atanır" (lib/sgk/raporTipleri.ts) — because Notya does not submit to Medula
 * live and must never invent a number Medula alone assigns. This belgeNo is for every
 * OTHER report (muayenehane istirahat belgesi + the 4 new Çocuk Hasta Raporları):
 * a Notya-internal, human-readable, unique document number, not a state registry number.
 */
import { randomBytes } from 'crypto'

/**
 * A bare "YYYY-MM-DD" is a date-only ISO string, which `Date` parses as UTC midnight
 * (ECMA-262). Reading it back with local getters/`toLocaleDateString` then rolls it back
 * a calendar day in every timezone behind UTC — exactly the US timezones this product's
 * founder and Dr. Gökhan work in. Every other date-only parse in this codebase (e.g.
 * `istirahatBitisTarihi`, `cocukHastaRaporlari.ts`) avoids this by appending a local
 * midnight time; this file had not, so it would have printed yesterday's date on every
 * report issued from a US timezone. Fixed here once, used by both functions below.
 */
function yerelTarih(tarihIso?: string | null): Date {
  if (!tarihIso) return new Date()
  const t = String(tarihIso).trim()
  const d = /^\d{4}-\d{2}-\d{2}$/.test(t) ? new Date(`${t}T00:00:00`) : new Date(t)
  return isNaN(d.getTime()) ? new Date() : d
}

/** YYYYMMDD from a date-only or full ISO/tr-TR date string; today when omitted/unparseable. */
export function belgeTarihYYYYMMDD(tarihIso?: string | null): string {
  const d = yerelTarih(tarihIso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/** 4 hex chars — injectable for deterministic tests; crypto-random in production. */
export function raporBelgeNoUret(
  tipKodu: string,
  tarihIso?: string | null,
  rastgeleUret: () => string = () => randomBytes(2).toString('hex').toUpperCase()
): string {
  const kod = String(tipKodu || 'RPR').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'RPR'
  return `NOTYA-${kod}-${belgeTarihYYYYMMDD(tarihIso)}-${rastgeleUret()}`
}

/** tr-TR görünüm tarihi — her raporda aynı biçim. */
export function belgeTarihGorunum(tarihIso?: string | null): string {
  return yerelTarih(tarihIso).toLocaleDateString('tr-TR')
}
