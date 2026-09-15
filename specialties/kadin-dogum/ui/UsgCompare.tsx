'use client'

import type { CSSProperties } from 'react'
import type { UsgSeriesPayload } from '../schema'
import { detailedAndGrowthPair } from '../imaging/usg-series'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function UsgCompare({ series }: { series: UsgSeriesPayload }) {
  const pair = detailedAndGrowthPair(series)
  return (
    <section style={box} data-tab="UsgCompare">
      <h2 style={{ margin: 0, fontSize: 16 }}>USG karşılaştır</h2>
      <p style={{ fontSize: 13 }}>
        18–22 ayrıntılı: {pair.detailed?.coreImageId ?? '—'} · büyüme: {pair.growth?.coreImageId ?? '—'}
      </p>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>Dating lock {series.datingMethod}. coreImageId only.</p>
    </section>
  )
}

export default UsgCompare
