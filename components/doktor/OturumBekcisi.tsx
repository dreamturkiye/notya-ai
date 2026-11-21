'use client'

/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — mounted once by every doctor-application shell (DoktorChrome for
 * /dashboard/doktor + /doktor-tools, the muayene page, KlinikNav, OzelBranslarBaslik, KlinikKabuk):
 *   - starts the session keep-alive (refresh before expiry, re-check on wake / online / focus);
 *   - checks the session on mount: a session that cannot be renewed → the login page with ?next=;
 *   - when a screen deferred that redirect (a recording is running) shows a fixed "Giriş yap" banner instead.
 * Renders nothing while the session is fine.
 */
import React, { useEffect, useState } from 'react'
import { jetonCoz, oturumuCanliTut, OTURUM_BITTI_OLAYI } from '@/lib/doktor/clientAuth'
import { oturumSuresiDoldu, OTURUM_DOLDU_OLAYI } from '@/lib/doktor/oturumFetch'
import OturumUyarisi from './OturumUyarisi'

export default function OturumBekcisi() {
  const [doldu, setDoldu] = useState(false)
  useEffect(() => {
    oturumuCanliTut()
    const dolduysa = () => setDoldu(true)
    const arkaPlanBitti = () => oturumSuresiDoldu()
    window.addEventListener(OTURUM_DOLDU_OLAYI, dolduysa)
    window.addEventListener(OTURUM_BITTI_OLAYI, arkaPlanBitti)
    let iptal = false
    void jetonCoz().then((c) => { if (!iptal && c.durum === 'bitti') oturumSuresiDoldu() })
    return () => {
      iptal = true
      window.removeEventListener(OTURUM_DOLDU_OLAYI, dolduysa)
      window.removeEventListener(OTURUM_BITTI_OLAYI, arkaPlanBitti)
    }
  }, [])
  return doldu ? <OturumUyarisi sabit /> : null
}
