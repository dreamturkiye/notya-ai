import type { Metadata } from 'next'
import { SAGLIGIM_DEMO_KBB } from '@/lib/portal/demoData'
import { PortalShell } from '../_components/PortalShell'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** NOTYA-LANDING-2026-10: demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** KBB-EXCEPTIONAL-01 — synthetic Kulaklarım demo (no PHI). */
export default function DemoKbbLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoOturumKapisi>
      <PortalShell basePath="/portal/demo-kbb" ekNav={SAGLIGIM_DEMO_KBB.portal?.nav || []} hastaAdi={SAGLIGIM_DEMO_KBB.hasta.adSoyad}>{children}</PortalShell>
    </DemoOturumKapisi>
  )
}
