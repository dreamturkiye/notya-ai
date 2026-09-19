'use client'
/** RADYOLOJI-EXCEPTIONAL-01 — Sağlığım › Tetkiklerim. Yalnız radyoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TetkiklerimView } from '../../../_components/TetkiklerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaTetkiklerimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'tetkiklerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tetkiklerim" subtitle="Bu bölüm radyoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <TetkiklerimView radyo={data.radyo} basePath={basePath} />
}
