'use client'

import type { CSSProperties } from 'react'
import type { TotalBodyMap } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function VucutHaritasi({ map }: { map: TotalBodyMap | null }) {
  return (
    <section style={box} data-tab="VucutHaritasi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Vücut haritası</h2>
      {!map && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Harita yok — pinler lezyon id ile gelir.</p>}
      {map && (
        <>
          <p style={{ fontSize: 13, color: '#8FA0B5' }}>
            {map.deviceHint} · takip {map.followUpMonths} ay
          </p>
          <ul style={{ fontSize: 13, paddingLeft: 18 }}>
            {map.nodeIds.map((id) => <li key={id}>{id}</li>)}
          </ul>
        </>
      )}
    </section>
  )
}

export default VucutHaritasi
