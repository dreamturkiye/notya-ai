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

export const CHROME_RENK = {
  cream: '#f4eee3',
  paper: '#faf6ee',
  ink: '#3b2e24',
  muted: '#8b7d70',
  pine: '#2f4334',
  nav: '#2c3326',
  gold: '#d4c196',
  warn: '#a45b3e',
  border: 'rgba(58,44,34,0.08)',
  borderSoft: 'rgba(58,44,34,0.045)',
} as const

export const CHROME_FONT = {
  serif: `'Fraunces', Georgia, serif`,
  sans: `'Source Sans 3', system-ui, sans-serif`,
} as const

/** Google Fonts <link> href — same weights the Grok concept used. */
export const CHROME_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,480;0,9..144,560;1,9..144,480;1,9..144,560&family=Source+Sans+3:wght@400;500;600;700&display=swap"

/** Real, re-hosted asset — was on a throwaway image host in the original concept. */
export const CHROME_BG_IMAGE = '/doktor-chrome/plant.jpg'

/** TRT-aware time-of-day greeting — used on Ana Sayfa's kicker. */
export function gunKickerTRT(d: Date = new Date()): string {
  const saat = Number(
    d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).slice(0, 2)
  )
  if (saat < 6) return 'İyi geceler'
  if (saat < 11) return 'Günaydın'
  if (saat < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

/** Live TRT clock string, e.g. "14:32". */
export function saatTRT(d: Date = new Date()): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
}
