'use client'

import type { CSSProperties } from 'react'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function SkorPaneli({ pasi, easi, dlqi }: { pasi?: number; easi?: number; dlqi?: number }) {
  return (
    <section style={box} data-tab="SkorPaneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>Skor paneli</h2>
      <p style={{ fontSize: 13 }}>PASI {pasi ?? '—'} · EASI {easi ?? '—'} · DLQI {dlqi ?? '—'}</p>
    </section>
  )
}

export default SkorPaneli
