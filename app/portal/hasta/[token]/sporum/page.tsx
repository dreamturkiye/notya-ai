'use client'
/** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Sağlığım › Sporum. Yalnız spor-hekimligi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { SporumView } from '../../../_components/SporumView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaSporumPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'sporum')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sporum" subtitle="Bu bölüm spor hekimliği takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <SporumView spor={data.spor} basePath={basePath} />
}
