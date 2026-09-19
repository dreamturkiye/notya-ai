'use client'
/** ENDOKRINOLOJI-EXCEPTIONAL-01 — Sağlığım › Hormonlarım. Yalnız endokrinoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { HormonlarimView } from '../../../_components/HormonlarimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaHormonlarimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'hormonlarim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Hormonlarım" subtitle="Bu bölüm endokrinoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <HormonlarimView endo={data.endo} basePath={basePath} />
}
