'use client'
/** KBB-EXCEPTIONAL-01 — Sağlığım › Kulaklarım. Yalnız KBB modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { KulaklarimView } from '../../../_components/KulaklarimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaKulaklarimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'kulaklarim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Kulaklarım" subtitle="Bu bölüm kulak burun boğaz takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KulaklarimView kulak={data.kulak} basePath={basePath} />
}
