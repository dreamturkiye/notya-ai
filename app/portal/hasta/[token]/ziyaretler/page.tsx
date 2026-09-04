'use client'

import { VisitsListView } from '../../../_components/VisitsView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaVisitsPage() {
  const { data, basePath } = usePortalLive()
  return <VisitsListView basePath={basePath} data={data} />
}
