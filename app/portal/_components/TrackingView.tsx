'use client'

import type { PortalBundle } from '@/lib/portal/types'
import { yasamsalBulguSatirlari } from '@/lib/clinical/yasamsalBulgular'
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

function trDeger(n: number, maxFrac = 1): string {
  return n.toLocaleString('tr-TR', {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: Number.isInteger(n) ? 0 : Math.min(1, maxFrac),
  })
}

export function TrackingView({ data }: { data: PortalBundle }) {
  const t = data.tracking
  const empty = !t.tansiyon.length && !t.kilo.length && !t.nabiz.length && !t.spo2.length

  const lastBp = t.tansiyon.length ? t.tansiyon[t.tansiyon.length - 1] : null
  const lastKilo = t.kilo.length ? t.kilo[t.kilo.length - 1].deger : null
  const lastNabiz = t.nabiz.length ? t.nabiz[t.nabiz.length - 1].deger : null
  const lastSpo2 = t.spo2.length ? t.spo2[t.spo2.length - 1].deger : null

  const sonOzet =
    t.sonVitalOzet ||
    yasamsalBulguSatirlari({
      tansiyon: lastBp ? `${lastBp.sistolik}/${lastBp.diastolik}` : null,
      nabiz: lastNabiz,
      spo2: lastSpo2,
      kilo: lastKilo,
    })
      .map((l) => `${l.label}: ${l.value}`)
      .join(' · ')

  return (
    <div className="sg-fade">
      <SectionHeader
        title="Sağlığımı takip et"
        subtitle="Yaşamsal bulgular: tansiyon, nabız, SpO₂ ve kilo trendleri."
      />
      {sonOzet ? (
        <p
          className="sg-main-pad"
          style={{
            margin: '0 0 16px',
            paddingLeft: 20,
            paddingRight: 20,
            color: 'var(--sg-muted)',
            fontSize: 14,
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          {sonOzet}
        </p>
      ) : null}
      {empty ? (
        <EmptyState
          title="Henüz takip verisi yok"
          body="Son muayenede yaşamsal bulgular paylaşıldığında trendler burada oluşur."
        />
      ) : (
        <div className="sg-track-grid">
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Tansiyon</div>
            <Sparkline values={t.tansiyon.map((x) => x.sistolik)} color="var(--sg-accent)" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son:{' '}
              {lastBp ? `${lastBp.sistolik}/${lastBp.diastolik} mmHg` : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Kilo</div>
            <Sparkline values={t.kilo.map((x) => x.deger)} color="#3d7a6a" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {lastKilo != null ? `${trDeger(lastKilo, 1)} kg` : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Nabız</div>
            <Sparkline values={t.nabiz.map((x) => x.deger)} color="#2f6b5d" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {lastNabiz != null ? `${trDeger(lastNabiz, 0)}/dk` : '—'}
            </div>
          </SoftPanel>
          <SoftPanel>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>SpO₂</div>
            <Sparkline values={t.spo2.map((x) => x.deger)} color="#1a5c4e" />
            <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
              Son: {lastSpo2 != null ? `%${trDeger(lastSpo2, 0)}` : '—'}
            </div>
          </SoftPanel>
        </div>
      )}
    </div>
  )
}
