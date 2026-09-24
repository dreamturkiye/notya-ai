'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'estetik-ameliyatim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ameliyat bakımım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Ameliyat bakımım" subtitle="Pansuman ve kontrol tarihleri. Kesi, implant ve tanı yoktur." acil="Nefes darlığı, kontrolsüz kanama veya tek taraflı bacak şişliğinde 112." basePath={basePath} ritim={['1. gün pansuman', '7. gün dikiş kontrolü', '14. gün yara bakımı', '42. gün geç izlem']} />
}
