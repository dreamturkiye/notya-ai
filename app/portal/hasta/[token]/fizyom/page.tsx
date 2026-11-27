'use client'
import { fizyoRitim } from '@/specialties/fizyoterapi/engines/portal-fizyo'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function Page() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'fizyom')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Egzersizim" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Egzersizim" subtitle="Seans ve ev programı tarihleri. Tanı yoktur." acil={plan?.acil || "Eyer uyuşukluğu veya göğüs ağrısı: 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : fizyoRitim() }>
      {/* BRANS-PAKETI — branş signature modules under the base content (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} />
    </KlinikHatirlatmaView>
  )
}
