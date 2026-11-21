'use client'

import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

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
        const r = await doktorFetch('/api/users/me', {})
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
