'use client'
/** NOTYA-DAH-WOW W4.1 — Araçlar › Dahiliye kohort paneli. Specialty-gated (specialty-doktor-araclari). */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoktorNav from '@/components/doktor/DoktorNav'
import { toolsShell } from '@/lib/doktor/toolsUi'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari'
import { KohortPanel } from '@/specialties/dahiliye/ui/DahiliyeWow4'

export default function DahiliyeKohortPage() {
  const router = useRouter()
  const [izin, setIzin] = useState<boolean | null>(null)

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) {
          if (!iptal) { setIzin(false); router.replace('/doktor-tools') }
          return
        }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        const ok = doktorAraciBransaUygun('/doktor-tools/dahiliye-kohort', j?.data?.specialty)
        if (!iptal) {
          setIzin(ok)
          if (!ok) router.replace('/doktor-tools')
        }
      } catch {
        if (!iptal) { setIzin(false); router.replace('/doktor-tools') }
      }
    })()
    return () => { iptal = true }
  }, [router])

  if (!izin) {
    return (
      <div style={toolsShell}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', color: '#8FA0B5' }}>
          {izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca dahiliye için.'}
        </div>
      </div>
    )
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EDF1F7', margin: '0 0 12px' }}>Dahiliye kohort paneli</h1>
        <KohortPanel />
      </div>
    </div>
  )
}
