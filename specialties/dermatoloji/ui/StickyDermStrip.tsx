'use client'

import type { CSSProperties } from 'react'
import { kutu, btn } from './clinic-styles'
import { DERM_UNIT, dermLabel } from './labels'

export type StickyDermStripProps = {
  fitzpatrick: string
  unit: string
  skorOzet: string
  gopChip: string
  yamaChip: string
  fototerapiChip: string
  sonrakiFoto: string
  tbseCue: string
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

const chip: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12.5,
  color: '#EDF1F7',
}

export function StickyDermStrip(p: StickyDermStripProps) {
  return (
    <div style={strip} data-derm="sticky-strip">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={chip}><b>Fitzpatrick</b> · {p.fitzpatrick || '—'}</span>
          <span style={chip}><b>Ünite</b> · {dermLabel(DERM_UNIT, p.unit)}</span>
          <span style={chip}><b>Skor</b> · {p.skorOzet}</span>
          <span style={chip}><b>GÖP</b> · {p.gopChip}</span>
          <span style={chip}>{p.yamaChip}</span>
          <span style={chip}>{p.fototerapiChip}</span>
          <span style={chip}><b>Foto</b> · {p.sonrakiFoto}</span>
          <span style={chip}><b>TBSE</b> · {p.tbseCue}</span>
        </div>
        <button type="button" style={btn(true)} onClick={p.onBugunkuMuayene} data-derm="cta-bugunku">
          Bugünkü muayene
        </button>
      </div>
    </div>
  )
}

export default StickyDermStrip
