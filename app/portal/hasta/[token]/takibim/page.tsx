'use client'
/** DAH-EXCEPTIONAL-01 — Sağlığım › Takibim. Yalnız dahiliye modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TakibimView } from '../../../_components/TakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaTakibimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'dahiliye')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Takibim" subtitle="Bu bölüm dahiliye takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <TakibimView kronik={data.kronik} basePath={basePath} />
}
