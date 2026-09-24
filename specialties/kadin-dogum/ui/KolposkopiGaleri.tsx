'use client'

import type { ColpoImage } from '../schema'
import { kutu } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

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
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Görüntüler mevcut Görüntüleme kaydına bağlıdır; ayrı depo yok.
      </p>
      {images.length === 0 ? (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
          Kolposkopi görüntüsü yok.{' '}
          <span style={{ color: '#7A5B1E' }}>Kolposkopi görüntüsü ekle</span>
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
              <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>
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
