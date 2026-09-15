'use client'

import type { CSSProperties } from 'react'
import type { BeforeAfterPair, PhotoAsset } from '../schema'
import { bolgeEtiketi } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

function thumb(id: string, photos: PhotoAsset[], urls: Record<string, string>) {
  const photo = photos.find((p) => p.id === id || p.coreImageId === id)
  const src = photo ? urls[photo.coreImageId] : urls[id]
  return src
}

export function BeforeAfterCompare({
  pairs,
  photos = [],
  urls = {},
}: {
  pairs: BeforeAfterPair[]
  photos?: PhotoAsset[]
  urls?: Record<string, string>
}) {
  return (
    <section style={box} data-tab="BeforeAfterCompare">
      <h2 style={{ margin: 0, fontSize: 16 }}>Önce / sonra</h2>
      {pairs.length === 0 && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Aynı bölgede iki zaman noktası yok.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {pairs.map((p) => {
          const beforeSrc = thumb(p.beforePhotoId, photos, urls)
          const afterSrc = thumb(p.afterPhotoId, photos, urls)
          const before = photos.find((ph) => ph.id === p.beforePhotoId || ph.coreImageId === p.beforePhotoId)
          return (
            <li key={p.id}>
              <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 6 }}>
                {bolgeEtiketi(before?.region)} · {p.intervalDays} gün
                {p.regionMatch ? '' : ' · bölgeler uyuşmuyor'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11 }}>Önce</div>
                  {beforeSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={beforeSrc} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
                  ) : <div style={{ fontSize: 12, color: '#8FA0B5' }}>Önizleme yok</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11 }}>Sonra</div>
                  {afterSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={afterSrc} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
                  ) : <div style={{ fontSize: 12, color: '#8FA0B5' }}>Önizleme yok</div>}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default BeforeAfterCompare
