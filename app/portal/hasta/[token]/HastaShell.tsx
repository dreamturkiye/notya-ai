'use client'

import { useEffect, useState } from 'react'
import { PortalShell } from '../../_components/PortalShell'
import { LiveGate, PortalLiveProvider, usePortalLive } from '../../_components/PortalLiveProvider'
import type { PortalNavOge } from '@/lib/portal/types'

/** NOTYA-RANDEVU-V2: 'Randevu' joins the nav only while the doctor's 'Hasta Portalı Randevu' is ON. */
const RANDEVU_NAV: PortalNavOge = { key: 'randevu', label: 'Randevu', path: '/randevu' }

/** Nav extras follow the registry modules attached to this token's bundle (lib/portal/moduller.ts). */
function ModulluShell({ token, children }: { token: string; children: React.ReactNode }) {
  const { data, loading } = usePortalLive()
  const [randevuAcik, setRandevuAcik] = useState(false)
  useEffect(() => {
    if (loading) return
    fetch(`/api/portal/hasta/${encodeURIComponent(token)}/randevu`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setRandevuAcik(!!j?.acik))
      .catch(() => undefined)
  }, [token, loading])
  const nav = data.portal?.nav || []
  return (
    <PortalShell
      basePath={`/portal/hasta/${token}`}
      ekNav={randevuAcik ? [RANDEVU_NAV, ...nav] : nav}
      hastaAdi={loading ? null : data.hasta?.adSoyad}
    >
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
