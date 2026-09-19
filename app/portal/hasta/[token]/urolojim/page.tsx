'use client'
/** UROLOJI-EXCEPTIONAL-01 — Sağlığım › Ürolojimm. Yalnız üroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { UrolojimView } from '../../../_components/UrolojimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaUrolojimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'urolojim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ürolojimm" subtitle="Bu bölüm üroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <UrolojimView uro={data.uro} basePath={basePath} />
}
