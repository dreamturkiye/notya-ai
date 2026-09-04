'use client'

import type { PortalBundle } from '@/lib/portal/types'
import { EmptyState, SectionHeader, SoftPanel } from './ui'

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div style={{ height: 56, color: 'var(--sg-muted)', fontSize: 13 }}>Yeterli veri yok</div>
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 280
  const h = 56
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 8) - 4
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  )
}

export function TrackingView({ data }: { data: PortalBundle }) {
  const t = data.tracking
  const empty = !t.tansiyon.length && !t.kilo.length && !t.nabiz.length && !t.spo2.length

  return (
    <div className="sg-fade">
      <SectionHeader title="Sağlığımı takip et" subtitle="Tansiyon, kilo, nabız ve SpO2 trendleri." />
      {t.sonVitalOzet ? (
        <p style={{ margin: '0 0 16px', color: 'var(--sg-muted)', fontSize: 14 }}>{t.sonVitalOzet}</p>
      ) : null}
      {empty ? (
        <EmptyState
          title="Henüz takip verisi yok"
          body="Son muayene vitalleri paylaşıldığında trendler burada oluşur."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Tansiyon</div>
            <Sparkline values={t.tansiyon.map((x) => x.sistolik)} color="var(--sg-accent)" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son:{' '}
              {t.tansiyon.length
                ? `${t.tansiyon[t.tansiyon.length - 1].sistolik}/${t.tansiyon[t.tansiyon.length - 1].diastolik}`
                : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Kilo (kg)</div>
            <Sparkline values={t.kilo.map((x) => x.deger)} color="#3d7a6a" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {t.kilo.length ? t.kilo[t.kilo.length - 1].deger : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Nabız</div>
            <Sparkline values={t.nabiz.map((x) => x.deger)} color="#2f6b5d" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {t.nabiz.length ? t.nabiz[t.nabiz.length - 1].deger : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>SpO2 (%)</div>
            <Sparkline values={t.spo2.map((x) => x.deger)} color="#1a5c4e" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {t.spo2.length ? t.spo2[t.spo2.length - 1].deger : '—'}
            </div>
          </SoftPanel>
        </div>
      )}
    </div>
  )
}
