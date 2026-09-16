'use client'

import type { ColpoImage } from '../schema'
import { kutu } from './clinic-styles'

export function KolposkopiGaleri({
  images,
  urls = {},
}: {
  images: ColpoImage[]
  urls?: Record<string, string>
}) {
  return (
    <section style={kutu} data-kd="kolposkopi">
      <h2 style={{ margin: 0, fontSize: 16 }}>Kolposkopi arşivi</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        Görüntüler mevcut Görüntüleme kaydına bağlıdır; ayrı depo yok.
      </p>
      {images.length === 0 ? (
        <p style={{ fontSize: 13, color: '#8FA0B5' }}>
          Kolposkopi görüntüsü yok.{' '}
          <span style={{ color: '#FDE68A' }}>Kolposkopi görüntüsü ekle</span>
          {' — Görüntüleme sekmesinden yükleyin (bölge/not: kolposkopi).'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          {images.map((img) => (
            <li key={img.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {urls[img.coreImageId] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[img.coreImageId]} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
              )}
              <div style={{ fontSize: 13, color: '#C9D4E3' }}>
                {img.capturedAt}
                {img.kvkk_consent ? '' : ' · KVKK onamı işaretlenmedi'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default KolposkopiGaleri
