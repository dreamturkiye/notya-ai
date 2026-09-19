/** ANESTEZI-EXCEPTIONAL-01 — Sağlığım › Anestezi Öncesi. Yalnız anestezi modülü bu token'a bağlandıysa. */
import { getPortalBundle } from '../_lib'
import { portalModulAktif } from '@/lib/portal/moduller'
import { AnesteziOncesiView } from '../../../_components/AnesteziOncesiView'
import { SectionHeader, SoftPanel } from '../../../_components/ui'

export default async function AnesteziOncesiPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getPortalBundle(token)
  const basePath = `/portal/hasta/${token}`
  if (!portalModulAktif(data, 'anestezi-oncesi')) {
    return (
      <div className="sg-fade">
        <SectionHeader title="Anestezi Öncesi" subtitle="Bu bölüm anestezi takibinizde açılır." />
        <SoftPanel className="sg-goz-panel">Bu alanda henüz paylaşılmış bir anestezi öncesi takip yok.</SoftPanel>
      </div>
    )
  }
  return <AnesteziOncesiView anestezi={data.anestezi} basePath={basePath} />
}
