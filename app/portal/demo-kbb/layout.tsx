import { SAGLIGIM_DEMO_KBB } from '@/lib/portal/demoData'
import { PortalShell } from '../_components/PortalShell'

/** KBB-EXCEPTIONAL-01 — synthetic Kulaklarım demo (no PHI). */
export default function DemoKbbLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell basePath="/portal/demo-kbb" ekNav={SAGLIGIM_DEMO_KBB.portal?.nav || []}>{children}</PortalShell>
}
