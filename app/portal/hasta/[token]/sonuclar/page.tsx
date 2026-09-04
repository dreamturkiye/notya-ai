'use client'

import { ResultsListView } from '../../../_components/ResultsView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaResultsPage() {
  const { data, basePath } = usePortalLive()
  return <ResultsListView basePath={basePath} data={data} />
}
