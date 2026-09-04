'use client'

import { MessagesView } from '../../../_components/MessagesView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaMessagesPage() {
  const { data, token, setData } = usePortalLive()
  return (
    <MessagesView
      data={data}
      token={token}
      onMessagesUpdated={(messages) =>
        setData({
          ...data,
          messages,
          summary: {
            ...data.summary,
            bekleyenMesaj: messages.filter((m) => !m.okundu).length,
          },
        })
      }
    />
  )
}
