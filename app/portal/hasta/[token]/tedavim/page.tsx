'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Sağlığım › Tedavim. Yalnız onkoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TedavimView } from '../../../_components/TedavimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaTedavimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'tedavim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tedavim" subtitle="Bu bölüm onkoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <TedavimView onko={data.onko} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/tedavim" />
    </>
  )
}
