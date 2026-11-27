'use client'
import { planRitim } from '@/specialties/longevity/engines/portal-long'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'
import { BransPaketiView } from '@/components/doktor/portal/bransPaketi/BransPaketiView'

export default function Page() {
  const { data, basePath, token } = usePortalLive()
  if (!portalModulAktif(data, 'longevitim')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Planım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Bugün</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return (
    <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Planım" subtitle="Sonraki seans tarihi. Protokol içeriği ve doz yoktur." acil={plan?.acil || "IV reaksiyon: 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : planRitim() }>
      {/* BRANS-PAKETI — branş signature modules under the base content (Taban önce). */}
      <BransPaketiView token={token && token !== 'onizleme' ? token : undefined} basePath={basePath} />
    </KlinikHatirlatmaView>
  )
}
