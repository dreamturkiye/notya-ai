'use client'
/** KARDIO-EXCEPTIONAL-01 — Sağlığım › Kalbim. Yalnız kardiyoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { KalbimView } from '../../../_components/KalbimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaKalbimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'kalbim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Kalbim" subtitle="Bu bölüm kardiyoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <KalbimView kalp={data.kalp} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/kalbim" />
    </>
  )
}
