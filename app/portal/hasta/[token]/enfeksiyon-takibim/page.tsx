'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Sağlığım › Enfeksiyon Takibim. Yalnız enfeksiyon modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { EnfeksiyonTakibimView } from '../../../_components/EnfeksiyonTakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaEnfeksiyonTakibimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'enfeksiyon-takibim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Enfeksiyon Takibim" subtitle="Bu bölüm enfeksiyon hastalıkları takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <EnfeksiyonTakibimView enfeksiyon={data.enfeksiyon} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/enfeksiyon-takibim" />
    </>
  )
}
