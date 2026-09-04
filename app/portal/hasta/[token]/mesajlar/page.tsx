'use client'

import { MessagesView } from '../../../_components/MessagesView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaMessagesPage() {
  const { data } = usePortalLive()
  return <MessagesView data={data} />
}
