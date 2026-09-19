'use client'
/** GASTROENTEROLOJI-EXCEPTIONAL-01 — Sağlığım › Sindirimim. Yalnız gastroenteroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { SindirimimView } from '../../../_components/SindirimimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaSindirimimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'sindirimim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Sindirimim" subtitle="Bu bölüm gastroenteroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <SindirimimView gastro={data.gastro} basePath={basePath} />
}
