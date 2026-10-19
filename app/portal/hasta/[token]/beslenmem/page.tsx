'use client'
import { beslenRitim } from '@/specialties/diyetisyen/engines/portal-beslen'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'beslenmem')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Beslenmem" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Beslenmem" subtitle="Kontrol tarihi. Kalori yorumu ve tanı yoktur." acil={plan?.acil || "Ağır alerji veya bilinç değişikliği: 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : beslenRitim() } />
}
