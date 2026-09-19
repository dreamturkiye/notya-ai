'use client'
/** COCUK-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Çocuğumun Cerrahisi. */
import Link from 'next/link'
import { CocugumunCerrahisiView } from '../../../_components/CocugumunCerrahisiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaCocugumunCerrahisiPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'cocugumun-cerrahisi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Çocuğumun Cerrahisi" subtitle="Bu bölüm çocuk cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <CocugumunCerrahisiView cc={data.cc} basePath={basePath} />
}
