'use client'
/** PLASTIK-CERRAHI-EXCEPTIONAL-01 — Sağlığım › Yaram. Yalnız plastik modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { YaramView } from '../../../_components/YaramView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaYaramPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'yaram')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Yaram" subtitle="Bu bölüm plastik cerrahi takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <YaramView plastik={data.plastik} basePath={basePath} />
}
