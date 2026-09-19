'use client'
/** KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Damar Cerrahisi takibi. */
import Link from 'next/link'
import { DamarCerrahisiTakibiView } from '../../../_components/DamarCerrahisiTakibiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaDamarCerrahisiTakibiPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'damar-cerrahisi-takibi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Damar Cerrahisi takibi" subtitle="Bu bölüm damar cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <DamarCerrahisiTakibiView damar={data.damarCerrahisi} basePath={basePath} />
}
