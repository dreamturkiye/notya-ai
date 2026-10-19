'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { AracTanim } from '@/lib/klinik/ozelAracCalistir'
import { OZEL_TUVAL } from '@/lib/klinik/ozelTuvalKaydi'
import { STUDYO_KOPYA } from '@/lib/klinik/ozelStudyoKopya'
import { TuvalAlanlari } from '@/components/klinik/TuvalAlanlari'
import { OZEL_STUDYO } from '@/lib/klinik/ozelStudyoKaydi'

export default function OzelStudyo({ tanim }: { tanim: AracTanim }) {
  const hasta = useSearchParams().get('patientId') || ''
  const [girdi, setGirdi] = useState<Record<string, string>>({})
  const [kayit, setKayit] = useState('')
  const bugun = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const sonuc = useMemo(() => tanim.calistir(girdi, bugun), [tanim, girdi, bugun])
  const hazir = !('hata' in sonuc)
  const Tuval = OZEL_TUVAL[tanim.slug]
  const Cerceve = OZEL_STUDYO[tanim.slug]

  useEffect(() => {
    if (!hasta) return
    let iptal = false
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      const r = await fetch(`/api/ozel-brans/plan?patientId=${encodeURIComponent(hasta)}`, { headers: { Authorization: `Bearer ${t}` } })
      if (!r.ok) return
      const j = await r.json().catch(() => ({}))
      const satir = (j.planlar || []).find((p: { arac?: string }) => p.arac === tanim.route)
      if (!iptal && satir?.girdi && typeof satir.girdi === 'object') setGirdi(satir.girdi)
    })()
    return () => { iptal = true }
  }, [hasta, tanim.route])

  function yaz(id: string, deger: string) {
    setGirdi((o) => ({ ...o, [id]: deger }))
    setKayit('')
  }

  async function kaydet() {
    if (!hazir) return
    if (!hasta) { setKayit('Hasta seçilmedi. Dosyadan aracı açın.'); return }
    const t = await ensureDoctorAccessToken()
    if (!t) { setKayit('Oturum yok.'); return }
    const r = await fetch('/api/ozel-brans/plan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: hasta, route: tanim.route, girdi }),
    })
    const j = await r.json().catch(() => ({}))
    setKayit(r.ok ? 'Hasta dosyasına yazıldı.' : (j.error || 'Kayıt yazılamadı.'))
  }

  return (
    <Cerceve route={tanim.route}>
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: '#8b7d70' }}>{STUDYO_KOPYA[tanim.slug]}</p>
      {'hata' in sonuc ? (
        <>
          <TuvalAlanlari tanim={tanim} girdi={girdi} yaz={yaz} />
          <p style={{ color: '#a45b3e', margin: 0 }}>{sonuc.hata}</p>
        </>
      ) : (
        <Tuval tanim={tanim} sonuc={sonuc} bugun={bugun} girdi={girdi} yaz={yaz} />
      )}
      <button type="button" onClick={kaydet} disabled={!hazir} style={{ justifySelf: 'start', padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 700, cursor: hazir ? 'pointer' : 'default' }}>
        Hasta dosyasına yaz
      </button>
      {kayit && <p style={{ margin: 0, fontSize: 13, color: '#3b2e24' }}>{kayit}</p>}
    </div>
    </Cerceve>
  )
}
