'use client'

import type { CSSProperties } from 'react'
import type { NstStudyPayload } from '../schema'
import { nstAction } from '../imaging/nst-ctg'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function NstStrip({ nst }: { nst: NstStudyPayload }) {
  return (
    <section style={box} data-tab="NstStrip">
      <h2 style={{ margin: 0, fontSize: 16 }}>NST şerit</h2>
      <p style={{ fontSize: 13 }}>
        Cat {nst.category} · {nst.durationMin} dk · {nst.coreTraceId}
      </p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>{nstAction(nst.category).join(' · ')}</p>
    </section>
  )
}

export default NstStrip
