'use client'
/** ASI-KARNESI-01 — Sağlığım › Aşı Karnesi. EVRENSEL: pediatride her zaman; diğer branşlarda aşı kaydı varsa. */
import Link from 'next/link'
import { AsiKarnesiView } from '../../../_components/AsiKarnesiView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { SectionHeader } from '../../../_components/ui'
import { portalModulAktif } from '@/lib/portal/moduller'

export default function HastaAsiKarnesiPage() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'asi-karnesi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Aşı Karnesi" subtitle="Doktorunuz aşı kaydı girdiğinde bu bölüm açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  const pdfUrl = data.asiKarnesi
    ? `/api/portal/hasta/${encodeURIComponent(token)}/asi-karnesi/pdf`
    : null
  return <AsiKarnesiView karne={data.asiKarnesi} basePath={basePath} pdfUrl={pdfUrl} />
}
