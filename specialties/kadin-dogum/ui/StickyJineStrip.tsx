'use client'

import type { CSSProperties } from 'react'
import { kutu, btn } from './clinic-styles'
import type { JineStickyChip } from '../engines/jine-ofis-vizit'

export type StickyJineStripProps = {
  chips: JineStickyChip[]
  gebeChip: string | null
  onKlinikMod?: () => void
  onBugunkuMuayene: () => void
}

const strip: CSSProperties = {
  ...kutu,
  position: 'sticky',
  top: 0,
  zIndex: 20,
  background: 'linear-gradient(135deg, rgba(11,22,40,0.97), rgba(15,155,142,0.18))',
  borderColor: 'rgba(15,155,142,0.45)',
  backdropFilter: 'blur(8px)',
}

const chipS: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12.5,
  color: '#EDF1F7',
}

export function StickyJineStrip(p: StickyJineStripProps) {
  return (
    <div style={strip} data-kd="jine-sticky-strip">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {p.chips.map((c) => (
            <span key={c.kod} style={chipS} data-jine-chip={c.kod}>
              <b>{c.etiket}</b> · {c.deger}
            </span>
          ))}
          {p.gebeChip && (
            <button
              type="button"
              onClick={p.onKlinikMod}
              style={{ ...chipS, background: 'rgba(251,191,36,0.18)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.45)', cursor: 'pointer' }}
              data-kd="jine-gebe-chip"
            >
              {p.gebeChip}
            </button>
          )}
        </div>
        <button type="button" style={btn(true)} onClick={p.onBugunkuMuayene} data-kd="cta-bugunku-jine">
          Bugünkü jinekoloji muayenesi
        </button>
      </div>
    </div>
  )
}

export default StickyJineStrip
