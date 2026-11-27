'use client'
/** BEYIN-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Beyin Cerrahisi takibi. Yalnız beyin-cerrahisi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { BeyinTakibiView } from '../../../_components/BeyinTakibiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaBeyinTakibiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'beyin-takibi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Beyin Cerrahisi takibi" subtitle="Bu bölüm beyin cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <BeyinTakibiView beyin={data.beyin} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/beyin-takibi" />
    </>
  )
}
