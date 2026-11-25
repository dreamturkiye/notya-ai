'use client'

import { useEffect, useState } from 'react'
import { MessagesView } from '../../../_components/MessagesView'
import { usePortalLive } from '../../../_components/PortalLiveProvider'

export default function HastaMessagesPage() {
  const { data, token, setData } = usePortalLive()
  // PORTAL-TABAN-ONCE: Bugün's "Doktoruma yaz" links here with ?yaz=1 — read after mount (no server/client mismatch).
  const [yaz, setYaz] = useState(false)
  useEffect(() => { setYaz(new URLSearchParams(window.location.search).get('yaz') === '1') }, [])
  return (
    <MessagesView
      data={data}
      token={token}
      yaz={yaz}
      onMessagesUpdated={(messages) =>
        setData((prev) => ({
          ...prev,
          messages,
          summary: {
            ...prev.summary,
            bekleyenMesaj: messages.filter((m) => !m.okundu).length,
          },
        }))
      }
    />
  )
}
