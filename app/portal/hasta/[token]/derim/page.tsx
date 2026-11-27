'use client'
/** DERM-PORTAL — Sağlığım › Derim. Yalnız dermatoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { DerimView } from '../../../_components/DerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaDerimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'dermatoloji')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Derim" subtitle="Bu bölüm dermatoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <DerimView deri={data.deri} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — dermatoloji signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/derim" />
    </>
  )
}
