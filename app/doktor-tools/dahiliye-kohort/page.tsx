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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px', color: '#9BB0C7', fontSize: 16 }}>
          {izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca dahiliye için.'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...toolsShell, background: 'linear-gradient(180deg, #0A1628 0%, #060C18 40%)' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 56px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#14B8A6', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>ARAÇLAR · DAHİLİYE</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#EDF1F7', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>Dahiliye kohort paneli</h1>
          <p style={{ margin: '10px 0 0', fontSize: 16, color: '#9BB0C7', lineHeight: 1.5, maxWidth: 640 }}>
            HbA1c, tansiyon, lipid ve takip gecikmelerini tek bakışta görün; seçtiğiniz hastalara 1-tap hatırlatma gönderin.
          </p>
        </div>
        <KohortPanel />
      </div>
    </div>
  )
}
