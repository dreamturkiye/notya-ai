'use client'

import { HistoryView } from '../../../_components/HistoryView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaHistoryPage() {
  const { data } = usePortalLive()
  return <HistoryView data={data} />
}
