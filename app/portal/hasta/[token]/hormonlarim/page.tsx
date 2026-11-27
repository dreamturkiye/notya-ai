'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Sağlığım › Hormonlarım. Yalnız endokrinoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { HormonlarimView } from '../../../_components/HormonlarimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaHormonlarimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'hormonlarim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Hormonlarım" subtitle="Bu bölüm endokrinoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <HormonlarimView endo={data.endo} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/hormonlarim" />
    </>
  )
}
