import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { PortalShell } from '../_components/PortalShell'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell basePath="/portal/demo" ekNav={SAGLIGIM_DEMO.portal?.nav || []}>
      {children}
    </PortalShell>
  )
}
