/**
 * AKKS panel (/akks-panel#k=<token>) — pseudonymous clinician panel for the internal clinical quality standard: blind Prof.
 * answers, blind third-reviewer grading, gold-item review. The shell carries no data; /api/akks/panel checks the token.
 * Never indexed (robots + metadata).
 */
import type { Metadata } from 'next'
import AkksPanelSayfasi from '@/components/akks/AkksPanelSayfasi'
import { doktorViewport } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic'
export const viewport = doktorViewport
export const metadata: Metadata = { title: 'Notya', robots: { index: false, follow: false, nocache: true } }

export default function AkksPanelPage() {
  return <AkksPanelSayfasi />
}
