'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import Link from 'next/link'

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
    <section>
      <h1>Klinik daveti</h1>
      <p>Kabul edince bu hekim hesabı kliniğin bir koltuğuna oturur. Muayene ekranı aynı kalır.</p>
      {!token && <p>Davet bağlantısı eksik.</p>}
      {token && <button onClick={kabul}>Daveti kabul et</button>}
      {mesaj && <p>{mesaj}</p>}
      <p><Link href="/giris/doktor">Hekim girişi</Link></p>
    </section>
  )
}

export default function KlinikDavet() {
  return <Suspense fallback={<p>Davet açılıyor.</p>}><DavetFormu /></Suspense>
}
