'use client'
/** ACIL-TIP-EXCEPTIONAL-01 — Sağlığım › Acil sonrası takip. Yalnız acil-tip modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { AcilSonrasiView } from '../../../_components/AcilSonrasiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAcilSonrasiPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'acil-sonrasi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Acil sonrası takip" subtitle="Bu bölüm acil servis sonrası takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <AcilSonrasiView acilSonrasi={data.acilSonrasi} basePath={basePath} />
}
