'use client'
/** ROMATOLOJI-EXCEPTIONAL-01 — Sağlığım › Romatizmam. */
import Link from 'next/link'
import { RomatizmamView } from '../../../_components/RomatizmamView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaRomatizmamPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'romatizmam')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Romatizmam" subtitle="Bu bölüm romatoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <RomatizmamView roma={data.roma} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/romatizmam" />
    </>
  )
}
