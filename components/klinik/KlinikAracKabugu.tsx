'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import KlinikNav from '@/components/klinik/KlinikNav'
import { klinikAraciDalaUygun } from '@/lib/klinik/klinikAraclari'
import { klinikMevzuatOzet } from '@/lib/klinik/klinikMevzuat'
import type { AracVurgu } from '@/lib/doktor/aracUi'

export default function KlinikAracKabugu({
  route, baslik, aciklama, etiket, vurgu, children,
}: {
  route: string
  baslik: string
  aciklama: string
  etiket: string
  vurgu: AracVurgu
  children: React.ReactNode
}) {
  const router = useRouter()
  const [izin, setIzin] = useState<boolean | null>(null)
  const [mevzuat, setMevzuat] = useState('')
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const raw = localStorage.getItem('auth-token')
        const t = raw ? (JSON.parse(raw).access_token || '') : ''
        if (!t) { if (!iptal) { setIzin(false); router.replace('/giris') } return }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        const tip = String(j?.data?.profession_type || '')
        const ok = Boolean(j?.data?.klinik_erisim) || ((tip === 'klinik-uzman' || tip === 'saglik-uzmani') && klinikAraciDalaUygun(route, j?.data?.specialty))
        if (!iptal) {
          setIzin(ok)
          setMevzuat(klinikMevzuatOzet(j?.data?.specialty))
          if (!ok) router.replace('/klinik-tools')
        }
      } catch { if (!iptal) { setIzin(false); router.replace('/klinik-tools') } }
    })()
    return () => { iptal = true }
  }, [router, route])

  return (
    <div style={{ minHeight: '100vh', background: '#f4eee3', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <KlinikNav clinicName="Notya Klinik" />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px 64px' }}>
        {!izin ? (
          <div style={{ color: '#8b7d70' }}>{izin === null ? 'Yükleniyor…' : `Bu araç yalnızca ${etiket} için.`}</div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: vurgu.baslik, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Klinik Araçlar · {etiket}</div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 560, color: '#3b2e24', margin: 0 }}>{baslik}</h1>
            <p style={{ margin: '8px 0 12px', fontSize: 15, color: '#8b7d70', maxWidth: 680 }}>{aciklama}</p>
            {mevzuat ? <p style={{ margin: '0 0 20px', fontSize: 12, color: '#8b7d70', maxWidth: 720, lineHeight: 1.45 }}>{mevzuat}</p> : null}
            {children}
          </>
        )}
      </div>
    </div>
  )
}
