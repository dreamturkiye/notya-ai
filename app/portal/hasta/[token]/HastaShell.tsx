'use client'

import { PortalShell } from '../../_components/PortalShell'
import { LiveGate, PortalLiveProvider, usePortalLive } from '../../_components/PortalLiveProvider'

/** Nav extras follow the registry modules attached to this token's bundle (lib/portal/moduller.ts). */
function ModulluShell({ token, children }: { token: string; children: React.ReactNode }) {
  const { data } = usePortalLive()
  return (
    <PortalShell basePath={`/portal/hasta/${token}`} ekNav={data.portal?.nav || []}>
      <LiveGate>{children}</LiveGate>
    </PortalShell>
  )
}

export function HastaShell({ token, children }: { token: string; children: React.ReactNode }) {
  return (
    <PortalLiveProvider token={token}>
      <ModulluShell token={token}>{children}</ModulluShell>
    </PortalLiveProvider>
  )
}
