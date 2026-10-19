'use client'
import { bakimRitim } from '@/specialties/medikal-estetik/engines/portal-estetik'
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
  const plan = data.ozelPlan
  return <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Bakımım" subtitle="İşlem sonrası bakım tarihleri. Ünite, ürün ve tanı yoktur." acil={plan?.acil || "Görme kaybı veya livedo: 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : bakimRitim() } />
}
