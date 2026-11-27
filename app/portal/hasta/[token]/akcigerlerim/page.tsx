'use client'
/** GOGUS-EXCEPTIONAL-01 — Sağlığım › Akciğerlerim. Yalnız göğüs modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AkcigerlerimView } from '../../../_components/AkcigerlerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaAkcigerlerimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'akcigerlerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Akciğerlerim" subtitle="Bu bölüm göğüs hastalıkları takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <AkcigerlerimView akciger={data.akciger} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/akcigerlerim" />
    </>
  )
}
