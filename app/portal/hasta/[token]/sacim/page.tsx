'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'sacim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Saçım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Saçım" subtitle="Yıkama ve kontrol tarihleri. Greft, tanı ve ilaç yoktur." acil="Kızarıklık+ateş veya nefes darlığında 112." basePath={basePath} ritim={['1. gün ilk pansuman', '3. gün nazik yıkama', '10. gün kabuk kontrolü', '14. gün kontrol']} />
}
