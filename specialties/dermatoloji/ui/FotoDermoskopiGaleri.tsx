'use client'

import type { CSSProperties } from 'react'
import type { PhotoAsset } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function FotoDermoskopiGaleri({
  photos,
  urls = {},
}: {
  photos: PhotoAsset[]
  urls?: Record<string, string>
}) {
  return (
    <section style={box} data-tab="FotoDermoskopiGaleri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Foto / dermoskopi serisi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>coreImageId only — ikinci store yok. Silinmez.</p>
      {photos.length === 0 && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Görüntüleme kaydı yok.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {photos.map((p) => (
          <li key={p.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8 }}>
            {urls[p.coreImageId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[p.coreImageId]} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <code style={{ fontSize: 11, color: '#C4B5FD' }}>{p.coreImageId}</code>
            )}
            <div style={{ fontSize: 12, marginTop: 6 }}>{p.kind}</div>
            <div style={{ fontSize: 11, color: '#8FA0B5' }}>{p.region} · {p.capturedAt}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FotoDermoskopiGaleri
