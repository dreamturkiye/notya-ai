'use client'
/** NEFROLOJI-EXCEPTIONAL-01 — Sağlığım › Böbreklerim. Yalnız nefroloji modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { BobreklerimView } from '../../../_components/BobreklerimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaBobreklerimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'bobreklerim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Böbreklerim" subtitle="Bu bölüm nefroloji takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <BobreklerimView nef={data.nef} basePath={basePath} />
}
