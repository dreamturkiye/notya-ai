'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Sağlığım › Anestezi Öncesi. Yalnız anestezi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AnesteziOncesiView } from '../../../_components/AnesteziOncesiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaAnesteziOncesiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'anestezi-oncesi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Anestezi Öncesi" subtitle="Bu bölüm anestezi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <AnesteziOncesiView anestezi={data.anestezi} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/anestezi-oncesi" />
    </>
  )
}
