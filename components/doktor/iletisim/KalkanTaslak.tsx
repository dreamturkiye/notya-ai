'use client'

/** NOTYA-KALKAN-01 — hasta kartındaki aynı taslak satırı. Onayla dışında kart değişmez. Sekreter 403 alınca satır görünmez. */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK

export default function KalkanTaslak({ patientId }: { patientId: string }) {
  const [satir, setSatir] = useState<{ id: string; metin: string; emin: boolean } | null>(null)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const token = await ensureDoctorAccessToken()
      if (!token) return
      const r = await fetch(`/api/doktor/fisilti/kalkan?hastaId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      const ilk = Array.isArray(j.taslaklar) ? j.taslaklar[0] : null
      setSatir(ilk ? { id: String(ilk.id), metin: String(ilk.metin || ''), emin: Boolean(ilk.emin) } : null)
    } catch { /* kapalıysa kart durur */ }
  }, [patientId])

  useEffect(() => { void yukle() }, [yukle])

  const onayla = async () => {
    if (!satir) return
    setHata('')
    const token = await ensureDoctorAccessToken()
    if (!token) return
    const r = await fetch('/api/doktor/fisilti/kalkan', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ islem: 'onayla', taslakId: satir.id }) })
    if (!r.ok) { const j = await r.json().catch(() => ({})); setHata(j.error || 'Kaydedilemedi.'); return }
    setSatir(null)
  }

  if (!satir) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${R.border}`, borderRadius: 16, padding: '16px 18px' }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 16, whiteSpace: 'pre-wrap', color: R.ink, lineHeight: 1.45 }}>{satir.metin}</div>
      {satir.emin && <button type="button" onClick={() => void onayla()} style={{ marginTop: 10, minHeight: 40, borderRadius: 12, border: 'none', background: R.pine, color: R.paper, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}>Onayla</button>}
      {hata && <div style={{ marginTop: 8, color: R.warn, fontSize: 13 }}>{hata}</div>}
    </div>
  )
}
