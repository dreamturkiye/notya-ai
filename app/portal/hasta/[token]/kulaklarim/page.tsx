'use client'
/** KBB-EXCEPTIONAL-01 — Sağlığım › Kulaklarım. Yalnız KBB modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { KulaklarimView } from '../../../_components/KulaklarimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaKulaklarimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'kulaklarim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Kulaklarım" subtitle="Bu bölüm kulak burun boğaz takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <KulaklarimView kulak={data.kulak} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/kulaklarim" />
    </>
  )
}
