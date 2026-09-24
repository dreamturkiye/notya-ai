'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'fizyom')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Egzersizim" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Egzersizim" subtitle="Seans ve ev programı tarihleri. Tanı yoktur." acil="Eyer uyuşukluğu veya göğüs ağrısı: 112." basePath={basePath} ritim={['Seans tarihi uzmanın kaydıyladır', 'Ev programı reçete değildir']} />
}
