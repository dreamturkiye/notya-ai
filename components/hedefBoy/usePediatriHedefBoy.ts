'use client'

import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy'

/** null = still resolving specialty. */
export function usePediatriHedefBoy(): boolean | null {
  const [uygun, setUygun] = useState<boolean | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) {
          if (!iptal) setUygun(false)
          return
        }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        if (!iptal) setUygun(pediatriHedefBoyBransi(j?.data?.specialty))
      } catch {
        if (!iptal) setUygun(false)
      }
    })()
    return () => { iptal = true }
  }, [])
  return uygun
}
