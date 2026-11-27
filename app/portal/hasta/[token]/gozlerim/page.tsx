'use client'
/** GOZ-PORTAL — Sağlığım › Gözlerim. Yalnız göz modülü bu token'a bağlandıysa (lib/portal/moduller.ts). */
import Link from 'next/link'
import { GozlerimView } from '../../../_components/GozlerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaGozlerimPage() {
  const { data, token, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'gozlerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Gözlerim" subtitle="Bu bölüm göz hastalıkları takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <GozlerimView goz={data.goz} basePath={basePath} token={token} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/gozlerim" />
    </>
  )
}
