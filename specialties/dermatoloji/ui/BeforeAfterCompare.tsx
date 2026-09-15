'use client'

import type { CSSProperties } from 'react'
import type { BeforeAfterPair } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function BeforeAfterCompare({ pairs }: { pairs: BeforeAfterPair[] }) {
  return (
    <section style={box} data-tab="BeforeAfterCompare">
      <h2 style={{ margin: 0, fontSize: 16 }}>Before / after</h2>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {pairs.map((p) => (
          <li key={p.id}>
            {p.beforePhotoId} → {p.afterPhotoId} · {p.intervalDays} gün
            {p.regionMatch ? '' : ' · region mismatch'}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default BeforeAfterCompare
