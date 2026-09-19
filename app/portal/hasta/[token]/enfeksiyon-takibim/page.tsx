'use client'
/** ENFEKSIYON-EXCEPTIONAL-01 — Sağlığım › Enfeksiyon Takibim. Yalnız enfeksiyon modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { EnfeksiyonTakibimView } from '../../../_components/EnfeksiyonTakibimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaEnfeksiyonTakibimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'enfeksiyon-takibim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Enfeksiyon Takibim" subtitle="Bu bölüm enfeksiyon hastalıkları takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <EnfeksiyonTakibimView enfeksiyon={data.enfeksiyon} basePath={basePath} />
}
