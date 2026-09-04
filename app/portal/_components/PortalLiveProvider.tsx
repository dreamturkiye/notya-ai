'use client'

import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { PortalBundle } from '@/lib/portal/types'
import { emptyPortalBundle } from '@/lib/portal/emptyBundle'
import { PinGate } from './PinGate'

type LiveState = {
  loading: boolean
  error: string | null
  data: PortalBundle
  basePath: string
  token: string
  refresh: () => Promise<void>
  setData: Dispatch<SetStateAction<PortalBundle>>
}

const Ctx = createContext<LiveState | null>(null)

export function usePortalLive() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortalLive must be used under PortalLiveProvider')
  return v
}

type UnlockPhase = 'checking' | 'need_pin' | 'unlocked' | 'legacy'

export function PortalLiveProvider({
  token,
  children,
}: {
  token: string
  children: React.ReactNode
}) {
  const basePath = `/portal/hasta/${token}`
  const [unlockPhase, setUnlockPhase] = useState<UnlockPhase>('checking')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PortalBundle>(emptyPortalBundle())

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}`, {
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    if (res.status === 401 && (json as { code?: string }).code === 'pin_required') {
      setUnlockPhase('need_pin')
      throw new Error('PIN_REQUIRED')
    }
    if (res.status === 403 && (json as { code?: string }).code === 'legacy_no_pin') {
      setUnlockPhase('legacy')
      throw new Error(String((json as { error?: string }).error || 'Eski bağlantı'))
    }
    if (!res.ok) throw new Error((json as { error?: string }).error || 'Portal yüklenemedi')
    setData(json as PortalBundle)
  }, [token])

  const checkUnlock = useCallback(async () => {
    const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/unlock`, {
      credentials: 'include',
    })
    if (!res.ok) {
      setUnlockPhase('need_pin')
      return false
    }
    const json = (await res.json()) as {
      unlocked?: boolean
      pinRequired?: boolean
      legacyNoPin?: boolean
    }
    if (json.legacyNoPin) {
      setUnlockPhase('legacy')
      return false
    }
    if (json.pinRequired && !json.unlocked) {
      setUnlockPhase('need_pin')
      return false
    }
    setUnlockPhase('unlocked')
    return true
  }, [token])

  const loadBundle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await refresh()
      setUnlockPhase('unlocked')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Portal yüklenemedi'
      if (msg === 'PIN_REQUIRED') {
        setError(null)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setUnlockPhase('checking')
      setLoading(true)
      setError(null)
      try {
        const ok = await checkUnlock()
        if (cancelled) return
        if (ok) await loadBundle()
        else setLoading(false)
      } catch {
        if (!cancelled) {
          setUnlockPhase('need_pin')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [checkUnlock, loadBundle])

  const onUnlocked = () => {
    setUnlockPhase('unlocked')
    void loadBundle()
  }

  if (unlockPhase === 'checking') {
    return (
      <Ctx.Provider value={{ loading: true, error: null, data, basePath, token, refresh, setData }}>
        <div className="sg-fade" style={{ padding: '48px 8px', color: 'var(--sg-muted)', textAlign: 'center' }}>
          Sağlık alanınız yükleniyor…
        </div>
      </Ctx.Provider>
    )
  }

  if (unlockPhase === 'need_pin' || unlockPhase === 'legacy') {
    return (
      <Ctx.Provider value={{ loading: false, error: null, data, basePath, token, refresh, setData }}>
        {unlockPhase === 'legacy' ? (
          <div className="sg-fade sg-pin-gate">
            <h1 className="sg-display" style={{ fontSize: 24, margin: '0 0 12px' }}>
              Yeni bağlantı gerekli
            </h1>
            <p style={{ color: 'var(--sg-muted)', lineHeight: 1.55, maxWidth: 360, margin: 0 }}>
              Bu eski portal linkinde PIN yok. Güvenlik için doktorunuzdan yeni bir Sağlığım linki ve 6
              haneli PIN isteyin.
            </p>
          </div>
        ) : (
          <PinGate token={token} onUnlocked={onUnlocked} />
        )}
      </Ctx.Provider>
    )
  }

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
