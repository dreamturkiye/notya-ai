'use client'
/** GENEL-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Ameliyatım. Yalnız genel-cerrahi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AmeliyatimView } from '../../../_components/AmeliyatimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAmeliyatimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'ameliyatim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ameliyatım" subtitle="Bu bölüm genel cerrahi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <AmeliyatimView gc={data.gc} basePath={basePath} />
}
