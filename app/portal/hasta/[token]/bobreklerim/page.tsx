'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Sağlığım › Böbreklerim. Yalnız nefroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { BobreklerimView } from '../../../_components/BobreklerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaBobreklerimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'bobreklerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Böbreklerim" subtitle="Bu bölüm nefroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <BobreklerimView nef={data.nef} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/bobreklerim" />
    </>
  )
}
