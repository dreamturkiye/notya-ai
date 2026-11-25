/**
 * NOTYA-YENI-GORUNUM-01 design tokens (cream / pine, Fraunces + Source Sans 3) — the values only.
 *
 * NOTYA-ULKE-01: split out of lib/doktor/chromeTheme.ts so that a country pack can use the look without pulling in
 * the Turkish greeting helpers that file also carries. chromeTheme.ts re-exports everything here: existing imports
 * are unchanged and there is still one source for every value.
 */
import type { Viewport } from 'next'

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

/**
 * UYARI-RENKLERI (Kaan, 2026-11-25: "have the real high readings show with a different color than the missed aşı per se")
 * — ONE semantic palette for alerts, shared by the doctor app and Sağlığım (app/portal/saglik-evi.css mirrors these values;
 * lib/saglikEvi/uyariRenkleri.test.ts pins the two together and checks WCAG AA).
 *
 *  Clinical readings (a measured value crossed a threshold) — warm, rising urgency:
 *    acil           strong red         (patient is told to call 112)
 *    hekime_bildir  coral / orange-red (doctor notified)
 *    dikkat         amber              (keep measuring)
 *  Adherence lapses (missed dose, missed / late aşı, missed measurement, "işaretlenmedi") — a calm, clearly different
 *  slate-indigo family, drawn with an outline / dashed icon, NEVER red.
 *
 *  Per tone: `ana` = text and icons (≥ 4.5:1 on paper), `vurgu` = fills, bars, borders, dots (≥ 3:1 on paper),
 *  `zemin` = soft background behind a card or chip (ana stays ≥ 4.5:1 on it). Colour is never alone: every use carries an
 *  icon + a word ("Acil", "Doktora bildirildi", "Dikkat", "Atlandı / İşaretlenmedi").
 */
export const UYARI_RENK = {
  acil: { ana: '#a3201a', vurgu: '#c8281f', zemin: '#fdecea' },
  hekime_bildir: { ana: '#a8461c', vurgu: '#d9622b', zemin: '#fdf0e8' },
  dikkat: { ana: '#7d5800', vurgu: '#b07d0a', zemin: '#fbf3dc' },
  uyum: { ana: '#4a5274', vurgu: '#6e7699', zemin: '#eef0f6' },
} as const
export type UyariTonu = keyof typeof UYARI_RENK

export const CHROME_FONT = {
  serif: `'Fraunces', Georgia, serif`,
  sans: `'Source Sans 3', system-ui, sans-serif`,
} as const

/** Installed-app status bar matches the cream chrome. Full object: a nested Next viewport export replaces the root one. */
export const doktorViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4eee3',
  viewportFit: 'cover',
}

/** Google Fonts <link> href — same weights the Grok concept used. */
export const CHROME_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,480;0,9..144,560;1,9..144,480;1,9..144,560&family=Source+Sans+3:wght@400;500;600;700&display=swap"

/** Real, re-hosted asset — was on a throwaway image host in the original concept. */
export const CHROME_BG_IMAGE = '/doktor-chrome/plant.jpg'
