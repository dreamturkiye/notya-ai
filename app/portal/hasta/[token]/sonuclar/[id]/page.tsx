'use client'

import { ResultDetailView } from '../../../../_components/ResultsView'
import { usePortalLive } from '../../../../_components/PortalLiveProvider'

export default function HastaResultDetailPage({ params }: { params: { id: string } }) {
  const { data, basePath } = usePortalLive()
  const result = data.results.find((r) => r.id === params.id) || null
  return <ResultDetailView basePath={basePath} result={result} />
}
