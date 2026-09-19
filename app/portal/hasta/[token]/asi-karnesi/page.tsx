'use client'
/** ASI-KARNESI-01 — Sağlığım › Aşı Karnesi. EVRENSEL modül (branş kapısı yok): yalnız bu token'a aşı kaydı bağlandıysa. */
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
  return <AsiKarnesiView karne={data.asiKarnesi} basePath={basePath} pdfUrl={`/api/portal/hasta/${encodeURIComponent(token)}/asi-karnesi/pdf`} />
}
