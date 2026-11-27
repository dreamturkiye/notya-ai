'use client'
import { sacimRitim } from '@/specialties/sac-ekimi/engines/portal-sacim'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function Page() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'sacim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Saçım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Saçım" subtitle="Yıkama ve kontrol tarihleri. Greft, tanı ve ilaç yoktur." acil={plan?.acil || "Kızarıklık+ateş veya nefes darlığında 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : sacimRitim() }>
      {/* BRANS-PAKETI — branş signature modules under the base content (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} />
    </KlinikHatirlatmaView>
  )
}
