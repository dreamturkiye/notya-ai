'use client'
/** UROLOJI-EXCEPTIONAL-01 — Sağlığım › Ürolojimm. Yalnız üroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { UrolojimView } from '../../../_components/UrolojimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaUrolojimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'urolojim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ürolojimm" subtitle="Bu bölüm üroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <UrolojimView uro={data.uro} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/urolojim" />
    </>
  )
}
