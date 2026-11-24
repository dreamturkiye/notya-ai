/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — /kurucu/el-notu: the founder's El Notu quality dashboard. Like the founder console,
 * the shell carries NO data; everything comes from GET /api/kurucu/el-notu-kalite, which checks the founder allowlist on
 * the server and answers 404 to anyone else (then the standard "not found" page). Never indexed, linked only from /kurucu.
 */
import type { Metadata } from 'next'
import ElNotuKalitePaneli from '@/components/kurucu/ElNotuKalitePaneli'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic'
export const viewport = doktorViewport
export const metadata: Metadata = { title: 'Notya', robots: { index: false, follow: false, nocache: true } }

export default function ElNotuKaliteSayfasi() {
  return <ElNotuKalitePaneli />
}
