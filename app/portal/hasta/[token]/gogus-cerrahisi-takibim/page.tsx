'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Göğüs Cerrahisi takibi. Yalnız GC modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { GogusCerrahiTakibimView } from '../../../_components/GogusCerrahiTakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaGogusCerrahiTakibimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'gogus-cerrahisi-takibim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Göğüs Cerrahisi takibi" subtitle="Bu bölüm göğüs cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <GogusCerrahiTakibimView gc={data.gogusCerrahi} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/gogus-cerrahisi-takibim" />
    </>
  )
}
