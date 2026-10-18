'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'isitmem-odyoloji')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="İşitme takibim" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return <KlinikHatirlatmaView satirlar={plan?.satirlar} title="İşitme takibim" subtitle="Kontrol tarihi. dB yorumu ve tanı yoktur." acil={plan?.acil || "Ani işitme kaybı: KBB / 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : ['Kontrol tarihi uzmanın kaydıyladır', 'dB yorumu ve cihaz raporu yoktur'] } />
}
