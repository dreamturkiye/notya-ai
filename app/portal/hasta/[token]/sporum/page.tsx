'use client'
/** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › Sporum. Yalnız spor-hekimligi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { SporumView } from '../../../_components/SporumView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaSporumPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'sporum')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sporum" subtitle="Bu bölüm spor hekimliği takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <SporumView spor={data.spor} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/sporum" />
    </>
  )
}
