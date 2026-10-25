'use client'

/**
 * AU-LAUNCH-01g — one shared, lightweight availability check for the live assistant. Every entry point (sidebar, phone menu,
 * home quick-access tile) draws only when `GET /api/ulke/asistan-canli` answers `{ hazir: true }`. FAIL CLOSED: anything else
 * (not ready, error, offline, no session) is "unavailable", and until the answer is known nothing is drawn (no flash).
 * The result is cached per tab (module + sessionStorage) so the call is made once per session.
 */
import { useEffect, useState } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'

const ANAHTAR = 'notya-asistan-hazir'
let bilinen: boolean | null = null
let bekleyen: Promise<boolean> | null = null

/** Pure: only an explicit `{ hazir: true }` counts as available. */
export function hazirMi(j: unknown): boolean {
  return Boolean(j) && typeof j === 'object' && (j as { hazir?: unknown }).hazir === true
}

function oku(): boolean | null {
  if (bilinen !== null) return bilinen
  try {
    const v = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ANAHTAR) : null
    if (v === '1') return (bilinen = true)
    if (v === '0') return (bilinen = false)
  } catch { /* no storage: ask again */ }
  return null
}

function yaz(v: boolean) {
  bilinen = v
  try { sessionStorage.setItem(ANAHTAR, v ? '1' : '0') } catch { /* cache only */ }
}

export async function asistanHazirSor(): Promise<boolean> {
  const onbellek = oku()
  if (onbellek !== null) return onbellek
  if (!bekleyen) {
    bekleyen = (async () => {
      try {
        const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
        const jeton = data.session?.access_token
        if (!jeton) return false // not signed in yet: unavailable, and not cached so the next mount asks again
        const r = await fetch(ulkeYolu('/api/ulke/asistan-canli'), { headers: { Authorization: `Bearer ${jeton}` }, cache: 'no-store' })
        const ok = r.ok && hazirMi(await r.json().catch(() => null))
        yaz(ok)
        return ok
      } catch { return false } // transient failure: hidden, not cached
      finally { bekleyen = null }
    })()
  }
  return bekleyen
}

/** `true` = show the entries; `false` and `null` (still unknown) = draw nothing. */
export function useAsistanHazir(etkin = true): boolean {
  const [hazir, setHazir] = useState<boolean>(() => (etkin ? oku() === true : false))
  useEffect(() => {
    if (!etkin) { setHazir(false); return }
    let iptal = false
    void asistanHazirSor().then((v) => { if (!iptal) setHazir(v) })
    return () => { iptal = true }
  }, [etkin])
  return etkin && hazir
}

/** Test helper. */
export function asistanHazirSifirla() { bilinen = null; bekleyen = null; try { sessionStorage.removeItem(ANAHTAR) } catch { /* */ } }
