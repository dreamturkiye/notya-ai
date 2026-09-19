'use client'
/** GOGUS-EXCEPTIONAL-01 — Sağlığım › Akciğerlerim. Yalnız göğüs modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AkcigerlerimView } from '../../../_components/AkcigerlerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAkcigerlerimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'akcigerlerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Akciğerlerim" subtitle="Bu bölüm göğüs hastalıkları takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <AkcigerlerimView akciger={data.akciger} basePath={basePath} />
}
