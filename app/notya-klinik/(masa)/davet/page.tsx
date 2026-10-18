'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { NOTYA_KLINIK_AD } from '@/lib/specialties/klinikDikey'
import { MasaSahne } from '@/components/klinik/katman/KlinikKabuk'
import { Button } from '@/components/doktor-landing/button'

function DavetFormu() {
  const token = useSearchParams().get('t') || ''
  const [mesaj, setMesaj] = useState('')

  async function kabul() {
    const erisim = await ensureDoctorAccessToken()
    if (!erisim) { setMesaj('Önce hekim olarak giriş yapın.'); return }
    const res = await fetch('/api/klinik/davet', {
      method: 'POST',
      headers: { Authorization: `Bearer ${erisim}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    setMesaj(res.ok ? 'Koltuk bağlandı.' : (json.error || 'Davet kabul edilemedi.'))
  }

  return (
    <MasaSahne kas={NOTYA_KLINIK_AD} baslik="Davet" italik="bir koltuk." govde="Kabul edince bu hekim hesabı Notya Klinik’te bir koltuğa oturur. Muayene ekranı aynı kalır.">
      {!token && <p className="font-outfit text-sm text-warn">Davet bağlantısı eksik.</p>}
      {token && (
        <button type="button" className="inline-flex h-12 items-center rounded-full bg-pine px-6 font-outfit text-sm font-medium text-cream" onClick={kabul}>
          Daveti kabul et
        </button>
      )}
      {mesaj && <p className="mt-4 font-outfit text-sm text-ink-2">{mesaj}</p>}
      <div className="mt-4">
        <Button href="/giris/doktor" variant="outline" size="lg">Hekim girişi</Button>
      </div>
    </MasaSahne>
  )
}

export default function KlinikDavet() {
  return (
    <Suspense fallback={<MasaSahne kas={NOTYA_KLINIK_AD} baslik="Davet" italik="açılıyor." govde="Notya Klinik daveti hazırlanıyor." />}>
      <DavetFormu />
    </Suspense>
  )
}
