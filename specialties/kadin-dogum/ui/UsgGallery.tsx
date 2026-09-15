'use client'

import type { CSSProperties } from 'react'
import { galleryKey, type UsgStudy } from '../protocols/usg'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function UsgGallery({ studies }: { studies: UsgStudy[] }) {
  return (
    <section style={box} data-tab="UsgGallery">
      <h2 style={{ margin: 0, fontSize: 16 }}>USG galeri</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>Core blob handle — ikinci bir store yok. 3D/4D non-diagnostic. Silinmez.</p>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {studies.map((s) => (
          <li key={s.id}>
            {galleryKey(s)} · {s.modality}
            {s.non_diagnostic ? ' · non-diagnostic' : ''}
            {s.kvkk_fetal_image_consent ? '' : ' · KVKK consent missing'}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UsgGallery
