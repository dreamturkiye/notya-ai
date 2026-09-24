'use client'

import type { CSSProperties } from 'react'
import type { PhotoAsset } from '../schema'
import { DERM_PHOTO_KIND, bolgeEtiketi, dermLabel } from './labels'
import { genitalOrChildBlocked } from '../imaging/consent-kvkk'
import { belgeAnalizHref, belgelerTabHref, goruntulemeCaptureHref } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function FotoDermoskopiGaleri({
  photos,
  urls = {},
  patientId,
  fitzpatrick,
}: {
  photos: PhotoAsset[]
  urls?: Record<string, string>
  patientId?: string
  fitzpatrick?: string
}) {
  return (
    <section style={box} data-tab="FotoDermoskopiGaleri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Foto / dermoskopi serisi</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Görüntüler mevcut görüntüleme kaydına bağlıdır; ayrı bir arşiv yok. Kayıtlar silinmez.
      </p>
      {patientId && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <a href={goruntulemeCaptureHref(patientId, 'derm')} style={{ fontSize: 12, color: '#2DD4BF' }}>Klinik foto ekle</a>
          <a href={goruntulemeCaptureHref(patientId, 'dermatoskopi')} style={{ fontSize: 12, color: '#2DD4BF' }}>Dermoskopi ekle</a>
        </div>
      )}
      {photos.length === 0 && <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>Görüntüleme kaydı yok.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {photos.map((p) => {
          const kilit = genitalOrChildBlocked(p)
          return (
            <li key={p.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8 }}>
              {kilit ? (
                <div style={{ height: 110, borderRadius: 8, background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: CHROME_RENK.warn, textAlign: 'center', padding: 8 }}>
                  Genital onam yok — görüntü kilitli
                </div>
              ) : urls[p.coreImageId] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[p.coreImageId]} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ height: 110, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: CHROME_RENK.muted }}>
                  Önizleme yok
                </div>
              )}
              <div style={{ fontSize: 12, marginTop: 6 }}>{dermLabel(DERM_PHOTO_KIND, p.kind)}</div>
              <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>{bolgeEtiketi(p.region)} · {p.capturedAt}</div>
              {patientId && !kilit && (
                <a
                  href={p.documentId
                    ? belgeAnalizHref(patientId, p.documentId, p.kind.startsWith('dermoskopi') ? 'dermatoskopi' : 'derm', fitzpatrick)
                    : belgelerTabHref(patientId, p.kind.startsWith('dermoskopi') ? 'dermatoskopi' : 'derm')}
                  style={{ fontSize: 11, color: '#2DD4BF' }}
                >
                  Asistana raporla
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default FotoDermoskopiGaleri
