'use client'
/** ORTOPEDI-EXCEPTIONAL-01 — Sağlığım › Eklemlerim. Yalnız ortopedi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { EklemlerimView } from '../../../_components/EklemlerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaEklemlerimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'eklemlerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Eklemlerim" subtitle="Bu bölüm ortopedi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <EklemlerimView eklem={data.eklem} basePath={basePath} />
}
