'use client'

/**
 * The patient portal's appointments (Türkiye: "Sağlığım" › Randevu) as presentational pieces: the notice panels, the
 * row of choice chips, and the card of one appointment. Every country's patient page draws THROUGH these. No word is
 * written here: every string arrives as a prop. Needs `sagligim.css`.
 */
import type { ReactNode } from 'react'
import { SectionHeader, SoftPanel } from './ui'

export function PortalRandevuBasligi({ baslik, altBaslik, bilgi, hata }: { baslik: string; altBaslik: string; bilgi?: string | null; hata?: string | null }) {
  return (
    <>
      <SectionHeader title={baslik} subtitle={altBaslik} />
      {bilgi ? <SoftPanel style={{ marginBottom: 12, borderColor: 'var(--sg-ok)' }}>{bilgi}</SoftPanel> : null}
      {hata ? <SoftPanel style={{ marginBottom: 12, color: 'var(--sg-danger)' }}>{hata}</SoftPanel> : null}
    </>
  )
}

/** A row of chips: one or several can be on. */
export function PortalSecimSirasi({ etiket, secenekler, secili, onSec, kapali }: {
  etiket: string
  secenekler: Array<{ key: string; label: string; baslik?: string }>
  secili: string[]
  onSec: (key: string) => void
  kapali?: boolean
}) {
  return (
    <div className="sg-filter-row" role="group" aria-label={etiket}>
      {secenekler.map((o) => (
        <button key={o.key} type="button" title={o.baslik} disabled={kapali} className={`sg-chip-btn${secili.includes(o.key) ? ' is-active' : ''}`} onClick={() => onSec(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** One appointment: when, what state, and (optionally) the things the patient can do with it. */
export function PortalRandevuKarti({ zaman, etiket, vurgu, eylemler, not }: {
  zaman: string
  etiket?: string
  vurgu?: 'oneri' | 'iptal' | null
  eylemler?: ReactNode
  not?: string | null
}) {
  return (
    <SoftPanel style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <b>{zaman}</b>
        {etiket ? <span style={{ color: vurgu === 'oneri' ? 'var(--sg-sun-ink)' : vurgu === 'iptal' ? 'var(--sg-muted)' : 'var(--sg-accent-ink)', fontSize: 13, fontWeight: 600 }}>{etiket}</span> : null}
      </div>
      {eylemler ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{eylemler}</div> : null}
      {not ? <p style={{ color: 'var(--sg-muted)', fontSize: 13, margin: '8px 0 0' }}>{not}</p> : null}
    </SoftPanel>
  )
}

/** One line that says one thing, on the paper (loading, nothing to show, the link does not work). */
export function PortalDurumGorunumu({ baslik, govde, hata }: { baslik?: string; govde: string; hata?: boolean }) {
  return (
    <div className="sg-fade" style={{ padding: '48px 8px', textAlign: 'center' }} role={hata ? 'alert' : 'status'}>
      {baslik ? <h1 className="sg-display" style={{ fontSize: 24 }}>{baslik}</h1> : null}
      <p style={{ color: hata ? 'var(--sg-danger)' : 'var(--sg-muted)' }}>{govde}</p>
    </div>
  )
}
