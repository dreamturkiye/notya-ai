'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { PortalBundle } from '@/lib/portal/types'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'

type LiveState = {
  loading: boolean
  error: string | null
  data: PortalBundle
  basePath: string
  token: string
  refresh: () => Promise<void>
  setData: (data: PortalBundle) => void
}

const Ctx = createContext<LiveState | null>(null)

export function usePortalLive() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortalLive must be used under PortalLiveProvider')
  return v
}

export function PortalLiveProvider({
  token,
  children,
}: {
  token: string
  children: React.ReactNode
}) {
  const basePath = `/portal/hasta/${token}`
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PortalBundle>(emptyPortalBundle())

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}`)
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Portal yüklenemedi')
    setData(json as PortalBundle)
  }, [token])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await refresh()
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Portal yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  return (
    <Ctx.Provider value={{ loading, error, data, basePath, token, refresh, setData }}>{children}</Ctx.Provider>
  )
}

export function LiveGate({ children }: { children: React.ReactNode }) {
  const { loading, error } = usePortalLive()
  if (loading) {
    return (
      <div className="sg-fade" style={{ padding: '48px 8px', color: 'var(--sg-muted)', textAlign: 'center' }}>
        Sağlık alanınız yükleniyor…
      </div>
    )
  }
  if (error) {
    return (
      <div className="sg-fade" style={{ padding: '48px 8px', textAlign: 'center' }}>
        <h1 className="sg-display" style={{ fontSize: 24 }}>
          Bağlantı açılamadı
        </h1>
        <p style={{ color: 'var(--sg-muted)' }}>{error}</p>
      </div>
    )
  }
  return <>{children}</>
}
