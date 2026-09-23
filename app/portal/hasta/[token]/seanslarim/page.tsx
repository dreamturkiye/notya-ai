'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'seanslarim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Görüşmelerim" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Görüşmelerim" subtitle="Sonraki görüşme tarihi. Tanı ve ilaç yoktur." acil="Krizde 112 veya en yakın acil." basePath={basePath} ritim={['Sonraki görüşme tarihi uzmanın kaydıyladır', 'Ölçek skoru burada yorumlanmaz']} />
}
