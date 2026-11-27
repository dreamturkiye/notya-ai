'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Çocuğumun Cerrahisi. */
import Link from 'next/link'
import { CocugumunCerrahisiView } from '../../../_components/CocugumunCerrahisiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaCocugumunCerrahisiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'cocugumun-cerrahisi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Çocuğumun Cerrahisi" subtitle="Bu bölüm çocuk cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <CocugumunCerrahisiView cc={data.cc} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/cocugumun-cerrahisi" />
    </>
  )
}
