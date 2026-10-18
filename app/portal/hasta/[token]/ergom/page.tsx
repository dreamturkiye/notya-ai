'use client'
import { KlinikHatirlatmaView } from '../../../_components/KlinikHatirlatmaView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'
import { portalModulAktif } from '@/lib/portal/moduller'
import { SectionHeader } from '../../../_components/ui'
import Link from 'next/link'

export default function Page() {
  const { data, basePath } = usePortalLive()
  if (!portalModulAktif(data, 'ergom')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Günlük programım" subtitle="Bu bölüm sizin takibinizde açılır." />
        <Link href={basePath} className="sg-back-link" style={{ margin: '0 20px' }}>← Özet</Link>
      </div>
    )
  }
  const plan = data.ozelPlan
  return <KlinikHatirlatmaView satirlar={plan?.satirlar} title="Günlük programım" subtitle="Seans / ev programı. Tanı yoktur." acil={plan?.acil || "Ani güç kaybı: 112."} basePath={basePath} ritim={plan?.satirlar?.length ? undefined : ['GYA seans tarihi uzmanın kaydıyladır', 'Bağımsızlık skoru yoktur'] } />
}
