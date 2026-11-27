'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Yaram. Yalnız plastik modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { YaramView } from '../../../_components/YaramView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaYaramPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'yaram')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Yaram" subtitle="Bu bölüm plastik cerrahi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <YaramView plastik={data.plastik} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/yaram" />
    </>
  )
}
