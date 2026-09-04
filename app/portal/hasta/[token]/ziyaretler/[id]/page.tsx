'use client'

import { VisitDetailView } from '../../../../_components/VisitsView'
import { usePortalLive } from '../../../../_components/PortalLiveProvider'

export default function HastaVisitDetailPage({ params }: { params: { id: string } }) {
  const { data, basePath } = usePortalLive()
  const visit = data.visits.find((v) => v.id === params.id) || null
  return <VisitDetailView basePath={basePath} visit={visit} />
}
