'use client'
import { odyoRitim } from '@/specialties/odyoloji/engines/portal-odyo'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function Page() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'isitmem-odyoloji')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="İşitme takibim" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="İşitme takibim" subtitle="Kontrol tarihi. dB yorumu ve tanı yoktur." acil={plan?.acil || "Ani işitme kaybı: KBB / 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : odyoRitim() }>
      {/* BRANS-PAKETI — branş signature modules under the base content (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} />
    </KlinikHatirlatmaView>
  )
}
