'use client'

import type { CSSProperties } from 'react'
import type { NstStudyPayload } from '../schema'
import { KD_NST_CATEGORY, kdLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

const NST_AKSIYON_TR: Record<NstStudyPayload['category'], string> = {
  I: 'Aralıklı veya rutin izleme devam',
  II: 'Tekrarlayın, resüsitatif önlemler, uzman değerlendirmesi',
  III: 'Doğumu hızlandırma yolu — kategori III, acil',
}

export function NstStrip({ nst }: { nst: NstStudyPayload }) {
  return (
    <section style={box} data-tab="NstStrip">
      <h2 style={{ margin: 0, fontSize: 16 }}>NST şerit</h2>
      <p style={{ fontSize: 13 }}>
        {kdLabel(KD_NST_CATEGORY, nst.category)} · {nst.durationMin} dk
      </p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>{NST_AKSIYON_TR[nst.category]}</p>
    </section>
  )
}

export default NstStrip
