/**
 * AKKS (Kaan, 2026-11-24) — /kurucu/ayse-kalite: the founder's "Ayşe Kalite" dashboard. Like the founder console, the shell
 * carries NO data; everything comes from GET /api/kurucu/ayse-kalite, which checks the founder allowlist on the server and
 * answers 404 to anyone else. Never indexed, linked only from /kurucu.
 */
import type { Metadata } from 'next'
import AyseKalitePaneli from '@/components/kurucu/AyseKalitePaneli'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic'
export const viewport = doktorViewport
export const metadata: Metadata = { title: 'Notya', robots: { index: false, follow: false, nocache: true } }

export default function AyseKaliteSayfasi() {
  return <AyseKalitePaneli />
}
