'use client'

/**
 * AU-QUICK-01 — is there diagnosis-code data on the server? FAIL CLOSED (the opposite of the assistant check): the
 * Quick access tile is drawn only on an explicit `{ hazir: true }`; an error, offline or no session draws nothing.
 * A positive answer is kept for the tab; a negative one is asked again on the next visit.
 */
import { useEffect, useState } from 'react'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { ulkeYolu } from '@/lib/ulke/yol'
import { ulkePaketi } from '@/lib/ulke/ulke'

/** Pure: only an explicit `{ hazir: true }` counts. */
export const taniHazirMi = (j: unknown): boolean => Boolean(j) && typeof j === 'object' && (j as { hazir?: unknown }).hazir === true

export function useTaniHazir(): boolean {
  const etkin = Boolean(ulkePaketi().uzanti?.taniKodlari)
  const [hazir, setHazir] = useState(false)
  useEffect(() => {
    if (!etkin) return
    let iptal = false
    void (async () => {
      try {
        const { data } = (await ulkeIstemciSupabase()?.auth.getSession()) ?? { data: { session: null } }
        const jeton = data.session?.access_token
        if (!jeton) return
        const r = await fetch(ulkeYolu('/api/ulke/tani-kodlari'), { headers: { Authorization: `Bearer ${jeton}` }, cache: 'no-store' })
        if (!r.ok) return
        const ok = taniHazirMi(await r.json().catch(() => null))
        if (!iptal) setHazir(ok)
      } catch { /* fail closed: no tile */ }
    })()
    return () => { iptal = true }
  }, [etkin])
  return etkin && hazir
}
