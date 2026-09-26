'use client'

/** Bugün · paket. Fısıltı kartından ayrı. */
import React, { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

export default function PaketSayacSeridi() {
  const [metin, setMetin] = useState('')
  const [aciklar, setAciklar] = useState<{ seansId: string; hasta: string }[]>([])
  const [acik, setAcik] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const r = await fetch('/api/doktor/seans-paketi/bugun', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (!j.goster) return
        setMetin(String(j.metin || ''))
        setAciklar(Array.isArray(j.aciklar) ? j.aciklar : [])
      } catch { /* sayaç kritik değil */ }
    })()
  }, [])

  if (!metin) return null
  return (
    <div style={{ fontFamily: CHROME_FONT.sans, marginBottom: 14 }}>
      <button type="button" onClick={() => setAcik((v) => !v)} style={{ background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 14, padding: '12px 16px', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: CHROME_RENK.muted }}>BUGÜN · PAKET</div>
        <div style={{ fontSize: 16, fontWeight: 650, color: CHROME_RENK.ink, marginTop: 4 }}>{metin}</div>
      </button>
      {acik && (
        <div style={{ marginTop: 8, background: '#fff', borderRadius: 12, border: `1px solid ${CHROME_RENK.border}`, padding: '8px 14px' }}>
          {aciklar.length === 0 && <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Açık seans yok.</div>}
          {aciklar.map((a) => <div key={a.seansId} style={{ fontSize: 14, padding: '6px 0' }}>{a.hasta}</div>)}
        </div>
      )}
    </div>
  )
}
