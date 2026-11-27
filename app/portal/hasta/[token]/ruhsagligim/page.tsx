'use client'
/** PSIK-EXCEPTIONAL-01 — Sağlığım › Ruh Sağlığım. Yalnız psikiyatri modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { RuhSagligimView } from '../../../_components/RuhSagligimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaRuhSagligimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'psikiyatri')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ruh Sağlığım" subtitle="Bu bölüm psikiyatri takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <RuhSagligimView psik={data.psik} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/ruhsagligim" />
    </>
  )
}
