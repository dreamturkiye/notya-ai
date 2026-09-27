'use client'

import { useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { tarzCipiMetni } from '@/lib/doktor/ogrenme/selam'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

export type TarzKurali = { slug: string; deger: string }

export default function SizinTarzinizChip({ kurallar }: { kurallar: TarzKurali[] }) {
  const [acik, setAcik] = useState(false)
  const [liste, setListe] = useState(kurallar)
  if (!liste.length) return null

  const kapat = async (slug: string) => {
    try {
      const t = await ensureDoctorAccessToken()
      await fetch('/api/doktor/hafiza', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kapat: slug }),
      })
      setListe((l) => l.filter((k) => k.slug !== slug))
    } catch { /* kapatma sessiz */ }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: CHROME_FONT.sans }}>
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        style={{
          border: `1px solid ${CHROME_RENK.border}`,
          background: '#E4F3F1',
          color: CHROME_RENK.pine,
          borderRadius: 999,
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {tarzCipiMetni(liste.length)}
      </button>
      {acik && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 20,
            minWidth: 280,
            maxWidth: 360,
            background: '#fff',
            border: `1px solid ${CHROME_RENK.border}`,
            borderRadius: 12,
            padding: 12,
            boxShadow: '0 10px 24px rgba(58,44,34,0.12)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 8 }}>Bu notta uygulanan kurallar</div>
          {liste.map((k) => (
            <div key={k.slug} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1, fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.4 }}>{k.deger}</div>
              <button type="button" onClick={() => void kapat(k.slug)} style={{ border: `1px solid ${CHROME_RENK.border}`, background: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Kapat
              </button>
            </div>
          ))}
          <a href="/dashboard/doktor/ayarlar/ayse-hafizasi" style={{ fontSize: 12, color: CHROME_RENK.pine, fontWeight: 600 }}>Tüm hafıza ›</a>
        </div>
      )}
    </div>
  )
}
