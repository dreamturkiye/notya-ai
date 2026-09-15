'use client'

import type { CSSProperties } from 'react'
import type { UsgStudyPayload } from '../schema'
import { KD_GA_LOCK, KD_USG_KIND, kdLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function UsgGallery({
  studies,
  urls = {},
}: {
  studies: UsgStudyPayload[]
  urls?: Record<string, string>
}) {
  return (
    <section style={box} data-tab="UsgGallery">
      <h2 style={{ margin: 0, fontSize: 16 }}>USG galeri</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        Görüntüler mevcut görüntüleme kaydına bağlıdır; ayrı bir arşiv yok. 3D/4D tanısal değildir ve silinmez.
      </p>
      {studies.length === 0 && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Bu gebelikte USG kaydı yok.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
        {studies.map((s) => (
          <li key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {urls[s.coreImageId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[s.coreImageId]} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#8FA0B5', textAlign: 'center', padding: 6 }}>
                Görüntü yok
              </div>
            )}
            <div style={{ fontSize: 13 }}>
              {kdLabel(KD_USG_KIND, s.kind)} · {s.gaWeeksDays.weeks}+{s.gaWeeksDays.days} · {kdLabel(KD_GA_LOCK, s.datingMethod)}
              {s.nonDiagnostic ? ' · tanısal değil' : ''}
              {s.kvkk_fetal_image_consent ? '' : ' · KVKK fetal görüntü onamı yok'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UsgGallery
