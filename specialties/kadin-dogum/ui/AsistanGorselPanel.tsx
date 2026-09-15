'use client'

import type { CSSProperties } from 'react'
import type { VisionRead } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function AsistanGorselPanel({ reads }: { reads: VisionRead[] }) {
  return (
    <section style={box} data-tab="AsistanGorselPanel">
      <h2 style={{ margin: 0, fontSize: 16 }}>Asistan görsel panel</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>Draft → uzman onay. Asistan finalize edemez.</p>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {reads.map((r) => (
          <li key={r.id}>{r.task} · {r.status} · {r.drafted_by}</li>
        ))}
      </ul>
    </section>
  )
}

export default AsistanGorselPanel
