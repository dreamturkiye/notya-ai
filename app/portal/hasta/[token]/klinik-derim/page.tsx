'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'klinik-derim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Bakımım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Bakımım" subtitle="Seans ve bakım tarihleri. Tanı, skor ve fluence yoktur." acil="Kabarcık, görme kaybı veya nefes darlığında 112." basePath={basePath} ritim={['Lazer aralığı 14–90 gün (hekim)', 'Akne bakım 2 / 6 / 12. hafta']} />
}
