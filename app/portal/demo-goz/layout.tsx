import { SAGLIGIM_DEMO_GOZ } from '@/lib/portal/demoData'
import { PortalShell } from '../_components/PortalShell'

/** GOZ-PORTAL — synthetic Göz Hastalıkları demo (no PHI); nav extras from the fixture's registry modules. */
export default function DemoGozLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell basePath="/portal/demo-goz" ekNav={SAGLIGIM_DEMO_GOZ.portal?.nav || []}>{children}</PortalShell>
}
