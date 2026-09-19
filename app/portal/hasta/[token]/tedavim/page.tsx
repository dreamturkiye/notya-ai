'use client'
/** ONKOLOJI-EXCEPTIONAL-01 — Sağlığım › Tedavim. Yalnız onkoloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { TedavimView } from '../../../_components/TedavimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaTedavimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'tedavim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Tedavim" subtitle="Bu bölüm onkoloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <TedavimView onko={data.onko} basePath={basePath} />
}
