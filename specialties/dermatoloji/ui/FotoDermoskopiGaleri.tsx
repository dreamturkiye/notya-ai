'use client'

import type { CSSProperties } from 'react'
import type { PhotoAsset } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function FotoDermoskopiGaleri({ photos }: { photos: PhotoAsset[] }) {
  return (
    <section style={box} data-tab="FotoDermoskopiGaleri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Foto / dermoskopi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>coreImageId only — ikinci store yok. Silinmez.</p>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {photos.map((p) => (
          <li key={p.id}>{p.kind} · {p.coreImageId} · {p.region}</li>
        ))}
      </ul>
    </section>
  )
}

export default FotoDermoskopiGaleri
