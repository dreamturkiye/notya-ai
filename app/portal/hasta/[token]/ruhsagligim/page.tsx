'use client'
/** PSIK-EXCEPTIONAL-01 — Sağlığım › Ruh Sağlığım. Yalnız psikiyatri modülü bu token'a bağlandıysa. */
import Link from 'next/link'
import { RuhSagligimView } from '../../../_components/RuhSagligimView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaRuhSagligimPage() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'psikiyatri')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ruh Sağlığım" subtitle="Bu bölüm psikiyatri takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <RuhSagligimView psik={data.psik} basePath={basePath} />
}
