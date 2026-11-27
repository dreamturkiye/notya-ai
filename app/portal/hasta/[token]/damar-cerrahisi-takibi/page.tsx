'use client'
/** KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Damar Cerrahisi takibi. */
import Link from 'next/link'
import { DamarCerrahisiTakibiView } from '../../../_components/DamarCerrahisiTakibiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaDamarCerrahisiTakibiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'damar-cerrahisi-takibi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Damar Cerrahisi takibi" subtitle="Bu bölüm damar cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <DamarCerrahisiTakibiView damar={data.damarCerrahisi} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/damar-cerrahisi-takibi" />
    </>
  )
}
