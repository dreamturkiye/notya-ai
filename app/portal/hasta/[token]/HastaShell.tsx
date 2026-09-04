'use client'

import { PortalShell } from '../../_components/PortalShell'
import { LiveGate, PortalLiveProvider } from '../../_components/PortalLiveProvider'

export function HastaShell({ token, children }: { token: string; children: React.ReactNode }) {
  return (
    <PortalLiveProvider token={token}>
      <PortalShell basePath={`/portal/hasta/${token}`}>
        <LiveGate>{children}</LiveGate>
      </PortalShell>
    </PortalLiveProvider>
  )
}
