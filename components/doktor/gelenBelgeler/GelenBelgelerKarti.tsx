'use client'
/**
 * NOTYA-GELEN-BELGELER — Ana Sayfa card "N yeni belge". Hidden when there is nothing new (and before migration 099,
 * where the API answers 0). Refreshes when a file is dropped anywhere on the dashboard.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { gelenIstek, GELEN_OLAY } from '@/lib/gelenBelgeler/istemci'

const R = CHROME_RENK

/** The card's one line. Pure, exported for the test. */
export const kartMetni = (sayi: number) => `${sayi} yeni belge`

export default function GelenBelgelerKarti({ kartStili }: { kartStili?: React.CSSProperties } = {}) {
  const [sayi, setSayi] = useState(0)
  const yukle = useCallback(async () => {
    try {
      const j = await gelenIstek<{ sayi: number }>('/api/doktor/gelen-belgeler?sayi=1')
      setSayi(Number(j.sayi) || 0)
    } catch { setSayi(0) }
  }, [])
  useEffect(() => {
    void yukle()
    const yenile = () => void yukle()
    window.addEventListener(GELEN_OLAY, yenile)
    return () => window.removeEventListener(GELEN_OLAY, yenile)
  }, [yukle])

  if (sayi <= 0) return null
  return (
    <a
      href="/dashboard/doktor/gelen-belgeler"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: R.ink,
        background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, padding: '16px 20px',
        boxShadow: '0 16px 34px rgba(58,44,34,0.06)', fontFamily: CHROME_FONT.sans, ...kartStili,
      }}
    >
      <span aria-hidden style={{ width: 40, height: 40, borderRadius: 11, background: '#E4F3F1', color: R.pine, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📥</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{kartMetni(sayi)}</span>
        <span style={{ display: 'block', fontSize: 13, color: R.muted }}>Notya okudu, hastayı önerdi — dosyaya eklemek tek dokunuş.</span>
      </span>
      <span style={{ color: R.pine, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>Aç ›</span>
    </a>
  )
}
