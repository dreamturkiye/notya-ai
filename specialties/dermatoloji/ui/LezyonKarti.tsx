'use client'

import type { CSSProperties } from 'react'
import type { Lesion } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function LezyonKarti({ lesions }: { lesions: Lesion[] }) {
  return (
    <section style={box} data-tab="LezyonKarti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Lezyon kartı</h2>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {lesions.map((l) => (
          <li key={l.id}>{l.id} · {l.region} · {l.morphology}</li>
        ))}
      </ul>
    </section>
  )
}

export default LezyonKarti
