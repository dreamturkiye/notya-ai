/**
 * AYSE-OGRENME-V3f — runs work AFTER the answer has gone out (Vercel's waitUntil), the same pattern as Türkiye's
 * learning (lib/doktor/ogrenme/arkaPlandaOgren.ts): no latency on the doctor's request, and nothing that fails here
 * can reach the doctor. Outside Vercel (tests, a local run) the promise simply runs on its own.
 */
export function arkaPlandaSurdur(p: Promise<unknown>): void {
  // Never an unhandled rejection: the log line names the KIND of error only (its message may hold note text).
  const guvenli = p.catch((e) => { console.error(`[ulke/ogrenme] arka plan: ${e instanceof Error ? e.name : typeof e}`) })
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(guvenli)
  } catch { /* not on Vercel: the promise runs by itself */ }
}
