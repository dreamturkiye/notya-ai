'use client'
/** AILE-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › Sağlık Paketim. Yalnız aile hekimliği modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { SaglikPaketimView } from '../../../_components/SaglikPaketimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaSaglikPaketimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'saglik-paketim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sağlık Paketim" subtitle="Bu bölüm aile hekimliği takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <SaglikPaketimView aile={data.aile} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/saglik-paketim" />
    </>
  )
}
