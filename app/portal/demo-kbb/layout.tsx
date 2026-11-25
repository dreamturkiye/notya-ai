import type { Metadata } from 'next'
import { SAGLIGIM_DEMO_KBB } from '@/lib/portal/demoData'
import { PortalShell } from '../_components/PortalShell'
import { markaCoz } from '@/lib/portal/marka'
import { DemoOturumKapisi } from '@/components/demo/DemoOturumKapisi'

/** NOTYA-LANDING-2026-10: demo is internal — signed-in Notya users only, never indexed. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** KBB-EXCEPTIONAL-01 — synthetic Kulaklarım demo (no PHI). */
export default function DemoKbbLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoOturumKapisi>
      <PortalShell marka={markaCoz({ hekimAdi: SAGLIGIM_DEMO_KBB.hekim.ad, brans: SAGLIGIM_DEMO_KBB.hekim.brans, klinikAdi: SAGLIGIM_DEMO_KBB.hekim.klinik })} basePath="/portal/demo-kbb" ekNav={SAGLIGIM_DEMO_KBB.portal?.nav || []} hastaAdi={SAGLIGIM_DEMO_KBB.hasta.adSoyad}>{children}</PortalShell>
    </DemoOturumKapisi>
  )
}
