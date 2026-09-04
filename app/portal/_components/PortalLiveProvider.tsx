'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { PortalBundle } from '@/lib/portal/types'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'

type LiveState = {
  loading: boolean
  error: string | null
  data: PortalBundle
  basePath: string
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Portal yüklenemedi')
        if (!cancelled) setData(json as PortalBundle)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Portal yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return <Ctx.Provider value={{ loading, error, data, basePath }}>{children}</Ctx.Provider>
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
