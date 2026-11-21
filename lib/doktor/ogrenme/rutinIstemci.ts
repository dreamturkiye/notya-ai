'use client'

import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { RutinPaket } from './rutinTuret'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

export function useRutinPaket(): RutinPaket | null {
  const [paket, setPaket] = useState<RutinPaket | null>(null)
  useEffect(() => {
    let iptal = false
    void (async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) return
        const r = await doktorFetch('/api/doktor/rutin', { cache: 'no-store' })
        const j = await r.json()
        if (!iptal && j?.paket) setPaket(j.paket)
      } catch { /* rutin yoksa önerme yok */ }
    })()
    return () => { iptal = true }
  }, [])
  return paket
}
