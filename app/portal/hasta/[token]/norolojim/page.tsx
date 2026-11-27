'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Sağlığım › Nörolojimm. Yalnız nöroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { NorolojimView } from '../../../_components/NorolojimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function HastaNorolojimPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'norolojim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Nörolojimm" subtitle="Bu bölüm nöroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  return (
    <>
      <NorolojimView noro={data.noro} basePath={basePath} />
      {/* BRANS-PAKETI Phase 2 — the branş signature modules under the base page (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} yol="/norolojim" />
    </>
  )
}
