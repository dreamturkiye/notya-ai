'use client'
/**
 * NOTYA-LANDING-2026-10 — demo yüzleri (/portal/demo*, /konsultan/demo) yalnız oturum açmış Notya
 * kullanıcısına. Anonim ziyaretçi /giris'e gider. Dashboard'un kullandığı kalıp: tarayıcıdaki
 * oturumdan erişim jetonu (ensureDoctorAccessToken) + /api/users/me doğrulaması. Doğrulanana kadar
 * hiçbir şey çizilmez.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

export const DEMO_GIRIS = '/giris'

export function DemoOturumKapisi({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [acik, setAcik] = useState(false)

  useEffect(() => {
    let iptal = false
    const kontrol = async () => {
      const token = await ensureDoctorAccessToken()
      if (!token) {
        router.replace(DEMO_GIRIS)
        return
      }
      try {
        const res = await fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
        if (iptal) return
        if (!res.ok) {
          router.replace(DEMO_GIRIS)
          return
        }
        setAcik(true)
      } catch {
        if (!iptal) router.replace(DEMO_GIRIS)
      }
    }
    kontrol()
    return () => {
      iptal = true
    }
  }, [router])

  if (!acik) return null
  return <>{children}</>
}
