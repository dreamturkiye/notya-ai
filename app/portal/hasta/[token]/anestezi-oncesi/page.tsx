'use client'
/** ANESTEZI-EXCEPTIONAL-01 — Sağlığım › Anestezi Öncesi. Yalnız anestezi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AnesteziOncesiView } from '../../../_components/AnesteziOncesiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAnesteziOncesiPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'anestezi-oncesi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Anestezi Öncesi" subtitle="Bu bölüm anestezi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <AnesteziOncesiView anestezi={data.anestezi} basePath={basePath} />
}
