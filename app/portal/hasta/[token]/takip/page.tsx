'use client'

import { TrackingView } from '../../../_components/TrackingView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaTrackingPage() {
  const { data } = usePortalLive()
  return <TrackingView data={data} />
}
