'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Ameliyatım. Yalnız genel-cerrahi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AmeliyatimView } from '../../../_components/AmeliyatimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaAmeliyatimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'ameliyatim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ameliyatım" subtitle="Bu bölüm genel cerrahi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <AmeliyatimView gc={data.gc} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/ameliyatim" />
    </>
  )
}
