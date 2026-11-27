'use client'
import { ameliyatRitim } from '@/specialties/estetik-cerrahi/engines/portal-cerrahi'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function Page() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'estetik-ameliyatim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Ameliyat bakımım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Ameliyat bakımım" subtitle="Pansuman ve kontrol tarihleri. Kesi, implant ve tanı yoktur." acil={plan?.acil || "Nefes darlığı, kontrolsüz kanama veya tek taraflı bacak şişliğinde 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : ameliyatRitim() }>
      {/* BRANS-PAKETI — branş signature modules under the base content (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} />
    </KlinikHatirlatmaView>
  )
}
