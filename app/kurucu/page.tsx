/**
 * KURUCU-KONSOL-01 (Kaan, 2026-11-07) — /kurucu: the founder console, read-only. Not linked anywhere, never indexed.
 *
 * This build keeps its session in the browser (Bearer token), not in a cookie, so the server cannot see who is asking
 * when it sends the page shell. The shell therefore carries NO data at all; everything comes from GET /api/kurucu/ozet,
 * which checks the founder allowlist on the server and answers 404 to anyone else — and the screen then shows the
 * standard "not found" page. See lib/kurucu/erisim.ts.
 */
import type { Metadata } from 'next'
import KurucuKonsolu from '@/components/kurucu/KurucuKonsolu'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic'
export const viewport = doktorViewport
export const metadata: Metadata = { title: 'Notya', robots: { index: false, follow: false, nocache: true } }

export default function KurucuSayfasi() {
  return <KurucuKonsolu />
}
