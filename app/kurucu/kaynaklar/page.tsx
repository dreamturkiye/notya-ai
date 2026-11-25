/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — /kurucu/kaynaklar: founder review queue of the protocol library's monthly edition
 * check. The shell carries NO data; everything comes from GET /api/kurucu/kaynaklar (founder allowlist on the server, 404 to
 * anyone else). Never indexed, linked only from /kurucu.
 */
import type { Metadata } from 'next'
import KaynakIncelemePaneli from '@/components/kurucu/KaynakIncelemePaneli'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic'
export const viewport = doktorViewport
export const metadata: Metadata = { title: 'Notya', robots: { index: false, follow: false, nocache: true } }

export default function KaynakIncelemeSayfasi() {
  return <KaynakIncelemePaneli />
}
