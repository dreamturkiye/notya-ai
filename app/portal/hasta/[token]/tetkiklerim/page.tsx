'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Sağlığım › Tetkiklerim. Yalnız radyoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TetkiklerimView } from '../../../_components/TetkiklerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaTetkiklerimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'tetkiklerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tetkiklerim" subtitle="Bu bölüm radyoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <TetkiklerimView radyo={data.radyo} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/tetkiklerim" />
    </>
  )
}
