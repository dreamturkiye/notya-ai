'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'estetik-bakimim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Bakımım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  return <KlinikHatirlatmaView title="Bakımım" subtitle="İşlem sonrası bakım tarihleri. Ünite, ürün ve tanı yoktur." acil="Görme kaybı veya livedo: 112." basePath={basePath} ritim={['1. gün erken kontrol', '14. gün botoks etki kontrolü', '28. gün dolgu oturma']} />
}
