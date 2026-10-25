'use client'

/**
 * AU-LAUNCH-01g — one shared, lightweight availability check for the live assistant. Every entry point (sidebar, phone menu,
 * home quick-access tile) hide only when `GET /api/ulke/asistan-canli` clearly answers `{ hazir: false }`. Kaan 2026-10-25: the assistant is ON. FAIL OPEN: the entries show
 * unless the server clearly answers `{ hazir: false }`; an error, offline or missing session never hides them.
 * A positive result is cached per tab (module + sessionStorage); a negative one is never cached, so it can not stick.
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
  } catch { /* no storage: ask again */ }
  return null
}

/** Only a positive answer is remembered: a "no" (not signed in yet, a blip on a phone, an old deployment) is asked again. */
function yaz(v: boolean) {
  if (!v) return
  bilinen = true
  try { sessionStorage.setItem(ANAHTAR, '1') } catch { /* cache only */ }
}

export async function asistanHazirSor(): Promise<boolean> {
  const onbellek = oku()
  if (onbellek !== null) return onbellek
  if (!bekleyen) {
    bekleyen = (async () => {
      try {
        const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
        const jeton = data.session?.access_token
        if (!jeton) return true // can not ask yet (phone, token not ready): keep the entry, the page itself says what is wrong
        const r = await fetch(ulkeYolu('/api/ulke/asistan-canli'), { headers: { Authorization: `Bearer ${jeton}` }, cache: 'no-store' })
        if (!r.ok) return true // an error is not a "no": keep the entry
        const ok = hazirMi(await r.json().catch(() => null))
        yaz(ok)
        return ok // only a clear { hazir: false } hides the entries
      } catch { return true } // transient failure: keep the entry
      finally { bekleyen = null }
    })()
  }
  return bekleyen
}

/** `true` = show the entries; `false` and `null` (still unknown) = draw nothing. */
export function useAsistanHazir(etkin = true): boolean {
  const [hazir, setHazir] = useState<boolean>(() => etkin)
  useEffect(() => {
    if (!etkin) { setHazir(false); return }
    let iptal = false
    const sor = () => { void asistanHazirSor().then((v) => { if (!iptal) setHazir(v) }) }
    sor()
    // A phone that was asleep or offline: ask again when the tab comes back, until the answer is yes.
    const gorunur = () => { if (document.visibilityState === 'visible') sor() }
    document.addEventListener('visibilitychange', gorunur)
    return () => { iptal = true; document.removeEventListener('visibilitychange', gorunur) }
  }, [etkin])
  return etkin && hazir
}

/** Test helper. */
export function asistanHazirSifirla() { bilinen = null; bekleyen = null; try { sessionStorage.removeItem(ANAHTAR) } catch { /* */ } }
