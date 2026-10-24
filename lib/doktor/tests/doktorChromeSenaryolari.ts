/**
 * AU-LOOK-PARITY-01 — scenarios for the Türkiye doctor chrome markup pin (lib/doktor/doktorChrome.test.ts).
 * The chrome renders on the server with its initial state (doctor role, no inbox access, menu closed).
 */
export const CHROME_SENARYOLARI = [
  { ad: 'ana-sayfa', yol: '/dashboard/doktor' },
  { ad: 'hastalar', yol: '/dashboard/doktor/hastalar' },
  { ad: 'randevular-genis', yol: '/dashboard/doktor/randevular' },
  { ad: 'asistan-sayfasi', yol: '/asistan' },
] as const
