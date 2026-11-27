'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Sağlığım › Eklemlerim. Yalnız ortopedi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { EklemlerimView } from '../../../_components/EklemlerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaEklemlerimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'eklemlerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Eklemlerim" subtitle="Bu bölüm ortopedi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <EklemlerimView eklem={data.eklem} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/eklemlerim" />
    </>
  )
}
