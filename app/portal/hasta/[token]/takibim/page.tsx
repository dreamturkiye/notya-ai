'use client'
/** DAH-EXCEPTIONAL-01 — Sağlığım › Takibim. Yalnız dahiliye modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TakibimView } from '../../../_components/TakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaTakibimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'dahiliye')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Takibim" subtitle="Bu bölüm dahiliye takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <TakibimView kronik={data.kronik} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/takibim" />
    </>
  )
}
