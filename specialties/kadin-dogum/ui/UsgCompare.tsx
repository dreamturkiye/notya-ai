'use client'

import type { CSSProperties } from 'react'
import type { UsgSeriesPayload } from '../schema'
import { detailedAndGrowthPair } from '../imaging/usg-series'
import { KD_GA_LOCK, KD_USG_KIND, kdLabel } from './labels'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

function studyCaption(study: UsgSeriesPayload['studies'][number] | null | undefined) {
  if (!study) return 'Kayıt yok'
  return `${kdLabel(KD_USG_KIND, study.kind)} · ${study.gaWeeksDays.weeks}+${study.gaWeeksDays.days}`
}

export function UsgCompare({
  series,
  urls = {},
}: {
  series: UsgSeriesPayload
  urls?: Record<string, string>
}) {
  const pair = detailedAndGrowthPair(series)
  const cells = [
    { label: '18–22 ayrıntılı', study: pair.detailed },
    { label: 'Büyüme', study: pair.growth },
  ]
  return (
    <section style={box} data-tab="UsgCompare">
      <h2 style={{ margin: 0, fontSize: 16 }}>USG karşılaştır</h2>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted }}>
        Gebelik yaşı kilidi: {kdLabel(KD_GA_LOCK, series.datingMethod)}. Görüntüler mevcut görüntüleme kaydına bağlıdır.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {cells.map((c) => (
          <div key={c.label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{c.label}</div>
            <div style={{ fontSize: 13 }}>{studyCaption(c.study)}</div>
            {c.study && urls[c.study.coreImageId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[c.study.coreImageId]} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', marginTop: 8 }} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export default UsgCompare
