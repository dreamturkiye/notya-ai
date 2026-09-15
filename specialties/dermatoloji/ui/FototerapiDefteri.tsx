'use client'

import type { CSSProperties } from 'react'
import type { PhotoSession } from '../engines/phototherapy-log'
import { cumulativeJ } from '../engines/phototherapy-log'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function FototerapiDefteri({ sessions }: { sessions: PhotoSession[] }) {
  return (
    <section style={box} data-tab="FototerapiDefteri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Fototerapi defteri</h2>
      <p style={{ fontSize: 13 }}>Kümülatif {cumulativeJ(sessions)} J/cm² · solaryum yok</p>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {sessions.map((s) => (
          <li key={`${s.date}-${s.device}`}>{s.date} · {s.device} · {s.j_cm2}</li>
        ))}
      </ul>
    </section>
  )
}

export default FototerapiDefteri
