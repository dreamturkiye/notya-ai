'use client'

import { useEffect, useState } from 'react'
import { PortalShell } from '../../_components/PortalShell'
import { LiveGate, PortalLiveProvider, usePortalLive } from '../../_components/PortalLiveProvider'
import { portalFetch } from '@/lib/portal/portalFetch'
import { GunlukProvider } from '../../_components/saglikEvi/GunlukProvider'
import { RandevuAcikSaglayici } from '../../_components/RandevuAcikBaglami'
import type { PortalMarka } from '@/lib/portal/marka'

/** Nav extras follow the registry modules attached to this token's bundle (lib/portal/moduller.ts). */
function ModulluShell({ token, marka, children }: { token: string; marka: PortalMarka | null; children: React.ReactNode }) {
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
      onSekizAlti={!loading && data.hasta?.onSekizAlti === true}
      marka={marka}
    >
      {/* HASTA-PORTALI-GUNLUK: the daily health home state, loaded lazily by the pages that use it. */}
      <LiveGate><RandevuAcikSaglayici value={randevuAcik}><GunlukProvider>{children}</GunlukProvider></RandevuAcikSaglayici></LiveGate>
    </PortalShell>
  )
}

/** HASTA-ALANI-MARKA: `marka` is resolved on the server (layout.tsx) — the doctor's identity on every state of the page. */
export function HastaShell({ token, marka = null, children }: { token: string; marka?: PortalMarka | null; children: React.ReactNode }) {
  return (
    <PortalLiveProvider token={token} marka={marka}>
      <ModulluShell token={token} marka={marka}>{children}</ModulluShell>
    </PortalLiveProvider>
  )
}
