/**
 * NOTYA-OZET-CIFT-01 — Özet sekmesi: Genel Özet + Son muayene özeti kartları.
 * Ayşe şeridinin ÜSTÜNDE gösterilir; her onayda sunucu günceller.
 */
'use client'

import React from 'react'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
  padding: '16px 18px',
  position: 'relative',
  overflow: 'hidden',
}

function Kart({
  baslik,
  alt,
  metin,
  bos,
}: {
  baslik: string
  alt: string
  metin: string
  bos: string
}) {
  return (
    <div style={panel}>
      <div style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${CHROME_RENK.pine}, transparent)` }} />
      <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 500, color: '#2e251d', letterSpacing: '-0.01em' }}>{baslik}</div>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 3, marginBottom: 10 }}>{alt}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: CHROME_RENK.ink, whiteSpace: 'pre-wrap' }}>
        {metin.trim() ? metin : <span style={{ color: CHROME_RENK.muted }}>{bos}</span>}
      </div>
    </div>
  )
}

export default function HastaKlinikOzetler({
  genelOzet,
  sonMuayeneOzeti,
  guncelleniyor = false,
}: {
  genelOzet: string
  sonMuayeneOzeti: string
  guncelleniyor?: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
      {guncelleniyor && (
        <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>Özetler güncelleniyor…</div>
      )}
      <Kart
        baslik="Genel Özet"
        alt="Doğuşundan itibaren dosyadaki klinik verilerin özeti · her onaylı muayeneden sonra yenilenir"
        metin={genelOzet}
        bos="Henüz genel özet yok. İlk onaylı muayeneden sonra burada oluşur."
      />
      <Kart
        baslik="Son muayene özeti"
        alt="Yalnız en son onaylı muayenenin kısa özeti · her onayda yenilenir"
        metin={sonMuayeneOzeti}
        bos="Henüz son muayene özeti yok. İlk onaylı muayeneden sonra burada oluşur."
      />
    </div>
  )
}
