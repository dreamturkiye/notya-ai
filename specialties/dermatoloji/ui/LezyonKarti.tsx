'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { Lesion } from '../schema'
import { DERM_MORPHOLOGY, bolgeEtiketi, dermLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function LezyonKarti({ lesions, emptyAction }: { lesions: Lesion[]; emptyAction?: ReactNode }) {
  return (
    <section style={box} data-tab="LezyonKarti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Lezyon kartı</h2>
      {lesions.length === 0 && (
        <div>
          <p style={{ fontSize: 13, color: '#8FA0B5' }}>
            Henüz lezyon yok — lezyonlar mevcut görüntüleme kayıtlarından türetilir. Yeni fotoğraf eklemek için görüntülemeyi açın.
          </p>
          {emptyAction}
        </div>
      )}
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        {lesions.map((l) => (
          <li key={l.id}>
            {bolgeEtiketi(l.region)} · {dermLabel(DERM_MORPHOLOGY, l.morphology)}
            {l.body_map_node ? ` · işaret ${l.body_map_node}` : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default LezyonKarti
