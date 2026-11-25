'use client'

import { useEffect, useState } from 'react'
import { PortalShell } from '../../_components/PortalShell'
import { LiveGate, PortalLiveProvider, usePortalLive } from '../../_components/PortalLiveProvider'
import { portalFetch } from '@/lib/portal/portalFetch'
import { GunlukProvider } from '../../_components/saglikEvi/GunlukProvider'
import { RandevuAcikSaglayici } from '../../_components/RandevuAcikBaglami'

/** Nav extras follow the registry modules attached to this token's bundle (lib/portal/moduller.ts). */
function ModulluShell({ token, children }: { token: string; children: React.ReactNode }) {
  const { data, loading } = usePortalLive()
  const [randevuAcik, setRandevuAcik] = useState(false)
  useEffect(() => {
    if (loading) return
    portalFetch(`/api/portal/hasta/${encodeURIComponent(token)}/randevu`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setRandevuAcik(!!j?.acik))
      .catch(() => undefined)
  }, [token, loading])
  const nav = data.portal?.nav || []
  return (
    <PortalShell
      basePath={`/portal/hasta/${token}`}
      ekNav={nav}
      // NOTYA-RANDEVU-V2: 'Randevu' joins the nav only while the doctor's 'Hasta Portalı Randevu' is ON —
      // PORTAL-TABAN-ONCE: right after the home (lib/portal/navSirasi.ts), and Bugün's "Randevu al" reads the same state.
      randevuAcik={randevuAcik}
      hastaAdi={loading ? null : data.hasta?.adSoyad}
    >
      {/* HASTA-PORTALI-GUNLUK: the daily health home state, loaded lazily by the pages that use it. */}
      <LiveGate><RandevuAcikSaglayici value={randevuAcik}><GunlukProvider>{children}</GunlukProvider></RandevuAcikSaglayici></LiveGate>
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
