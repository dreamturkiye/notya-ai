'use client'

import type { ImageSeries, PhotoAsset } from '../schema'
import { kutu } from './clinic-styles'
import { bolgeEtiketi } from './labels'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export function SeriesTimepoints({
  series,
  photos,
  urls = {},
}: {
  series: ImageSeries[]
  photos: PhotoAsset[]
  urls?: Record<string, string>
}) {
  return (
    <section style={kutu} data-derm="series-timepoints">
      <h2 style={{ margin: 0, fontSize: 16 }}>Seri zaman noktaları</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        İzotretinoin ay-0 / ay-3 ve tedavi yanıtı aynı seride tutulur. Pikseller görüntülemede kalır.
      </p>
      {series.length === 0 && <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Henüz seri yok — aynı lezyona iki zaman noktası ekleyin.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {series.map((s) => {
          const lesionPhoto = photos.find((p) => p.lesionId === s.lesionId)
          return (
            <li key={s.id}>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 6 }}>{bolgeEtiketi(lesionPhoto?.region)}</div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {s.timepoints.map((t) => {
                  const id = t.photoIds[0]
                  const photo = photos.find((p) => p.id === id || p.coreImageId === id)
                  const src = photo ? urls[photo.coreImageId] : urls[id]
                  const etiket = t.label === 'month-0' ? 'Ay 0' : t.label === 'month-3' ? 'Ay 3' : t.label === 'month-6' ? 'Ay 6' : t.label
                  return (
                    <div key={`${s.id}-${t.label}`} style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 11, marginBottom: 4 }}>{etiket} · {t.at}</div>
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 120, height: 90, borderRadius: 8, background: 'rgba(255,255,255,0.06)', fontSize: 11, color: CHROME_RENK.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Önizleme yok</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default SeriesTimepoints
