'use client'
/** NOTYA-ASI-ONAM-01 — Sağlığım › Aşı Onamı (Pediatri only). */
import Link from 'next/link'
import { AsiOnamView } from '../../../_components/AsiOnamView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAsiOnamPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'asi-onam')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Aşı Onamı" subtitle="Bu bölüm bulunamadı." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <AsiOnamView token={token} basePath={basePath} />
}
