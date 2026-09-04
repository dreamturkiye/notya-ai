'use client'

import { MedicationsView } from '../../../_components/MedicationsView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaMedsPage() {
  const { data } = usePortalLive()
  return <MedicationsView data={data} />
}
