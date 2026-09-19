'use client'
/** FIZIK-TEDAVI-EXCEPTIONAL-01 — Sağlığım › FTR'm. Yalnız fizik-tedavi modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { FtrmView } from '../../../_components/FtrmView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaFtrmPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'ftrm')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="FTR'm" subtitle="Bu bölüm fizik tedavi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <FtrmView ftr={data.ftr} basePath={basePath} />
}
