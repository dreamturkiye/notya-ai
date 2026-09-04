'use client'

import { HomeHero } from '../../_components/HomeHero'
import { usePortalLive } from '../../_components/PortalLiveProvider'

export default function HastaHomePage() {
  const { data, basePath } = usePortalLive()
  return <HomeHero basePath={basePath} data={data} />
}
