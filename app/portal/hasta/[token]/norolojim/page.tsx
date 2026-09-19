'use client'
/** NOROLOJI-EXCEPTIONAL-01 — Sağlığım › Nörolojimm. Yalnız nöroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { NorolojimView } from '../../../_components/NorolojimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaNorolojimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'norolojim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Nörolojimm" subtitle="Bu bölüm nöroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <NorolojimView noro={data.noro} basePath={basePath} />
}
