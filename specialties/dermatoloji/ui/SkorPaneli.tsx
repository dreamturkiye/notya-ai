'use client'

import type { CSSProperties, ReactNode } from 'react'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function SkorPaneli({
  pasi,
  easi,
  dlqi,
  emptyAction,
}: {
  pasi?: number
  easi?: number
  dlqi?: number
  emptyAction?: ReactNode
}) {
  const empty = pasi == null && easi == null && dlqi == null
  return (
    <section style={box} data-tab="SkorPaneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>Skor paneli</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        PASI / EASI / DLQI bu bölümde tutulur — çekirdek hasta kartına yazılmaz.
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 13, margin: 0 }}>
        <div><dt>PASI</dt><dd>{pasi ?? '—'}</dd></div>
        <div><dt>EASI</dt><dd>{easi ?? '—'}</dd></div>
        <div><dt>DLQI</dt><dd>{dlqi ?? '—'}</dd></div>
      </dl>
      {empty && (
        <p style={{ fontSize: 12.5, color: '#8FA0B5', marginBottom: emptyAction ? 8 : 0 }}>
          Henüz skor yok. PASI / EASI / DLQI değerini muayene notuna işleyebilir veya görüntüleme ekleyebilirsiniz.
        </p>
      )}
      {empty && emptyAction}
    </section>
  )
}

export default SkorPaneli
