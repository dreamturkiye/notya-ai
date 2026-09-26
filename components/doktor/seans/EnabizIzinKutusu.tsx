'use client'

/** Hasta e-Nabız çıktısını istemiyorsa işaret. Islak imza muayenehanede; Notya yalnız işareti tutar. */
import React, { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

export default function EnabizIzinKutusu({ patientId }: { patientId: string }) {
  const [istemiyor, setIstiyor] = useState(false)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const r = await fetch(`/api/doktor/seans-paketi?hastaId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (j.kaydedilebilir === false) return
        setIstiyor(Boolean(j.istemiyor))
        setHazir(true)
      } catch { /* kolon yoksa kutu durur */ }
    })()
  }, [patientId])

  if (!hazir) return null

  const degis = async (v: boolean) => {
    setIstiyor(v)
    const t = await ensureDoctorAccessToken()
    await fetch('/api/doktor/seans-paketi', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ islem: 'izin', hastaId: patientId, istemiyor: v }) })
  }

  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '14px 16px', fontFamily: CHROME_FONT.sans, fontSize: 14, color: CHROME_RENK.ink }}>
      <input type="checkbox" checked={istemiyor} onChange={(e) => void degis(e.target.checked)} />
      <span>e-Nabız’a gönderilmesini istemiyor</span>
    </label>
  )
}
