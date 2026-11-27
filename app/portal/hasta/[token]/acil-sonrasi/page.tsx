'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Sağlığım › Acil sonrası takip. Yalnız acil-tip modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AcilSonrasiView } from '../../../_components/AcilSonrasiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaAcilSonrasiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'acil-sonrasi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Acil sonrası takip" subtitle="Bu bölüm acil servis sonrası takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <AcilSonrasiView acilSonrasi={data.acilSonrasi} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/acil-sonrasi" />
    </>
  )
}
