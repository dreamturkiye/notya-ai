import { PortalShell } from '../_components/PortalShell'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell basePath="/portal/demo">{children}</PortalShell>
}
