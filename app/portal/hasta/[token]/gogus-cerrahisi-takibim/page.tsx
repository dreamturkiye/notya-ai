'use client'
/** GOGUS-CERRAHISI-EXCEPTIONAL-01 — Sağlığım › Göğüs Cerrahisi takibi. Yalnız GC modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { GogusCerrahiTakibimView } from '../../../_components/GogusCerrahiTakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaGogusCerrahiTakibimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'gogus-cerrahisi-takibim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Göğüs Cerrahisi takibi" subtitle="Bu bölüm göğüs cerrahisi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <GogusCerrahiTakibimView gc={data.gogusCerrahi} basePath={basePath} />
}
