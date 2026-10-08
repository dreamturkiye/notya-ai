import { saatDizesi, selamla, yerelSaat } from '@/lib/doktor/selam'
/**
 * NOTYA-YENI-GORUNUM-01 (Kaan, 2026-09-22) — shared design tokens for the new doktor chrome.
 * Direction: warm, soft, human — away from the dark-navy admin-panel look. Palette and type
 * pairing kept from the Grok concept Kaan approved (cream/pine/gold, Fraunces + Source Sans 3);
 * everything else (data, nav items, auth) is real, wired to the actual app.
 *
 * Plain TS constants, not a CSS file — matches how the rest of the doktor UI is built (inline
 * style objects), so this drops into existing components without introducing a second styling
 * system.
 */

export { CHROME_RENK, CHROME_FONT, doktorViewport, CHROME_FONT_HREF, CHROME_BG_IMAGE } from './chromeRenk'

/** NOTYA-SELAM-SAAT-01: time-of-day greeting in the doctor's local tz (kicker on Ana Sayfa); TRT only as fallback. */
export function gunKickerTRT(d: Date = new Date(), tz?: string): string {
  return selamla(yerelSaat(d, tz))
}
/** Live clock string in the doctor's local tz (TRT fallback), e.g. "14:32". */
export function saatTRT(d: Date = new Date(), tz?: string): string {
  return saatDizesi(d, tz)
}
