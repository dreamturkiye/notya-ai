'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Sağlığım › Sindirimim. Yalnız gastroenteroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { SindirimimView } from '../../../_components/SindirimimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaSindirimimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'sindirimim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sindirimim" subtitle="Bu bölüm gastroenteroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <SindirimimView gastro={data.gastro} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/sindirimim" />
    </>
  )
}
