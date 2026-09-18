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
  /** DERM-EXCEPTIONAL-01 — acil kırmızı bayrak satırları (`engines/acil.ts` → acilBandMetni) */
  acilBant?: string[]
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

const acilSatiri: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 8,
  padding: '6px 10px',
  borderRadius: 8,
  background: 'rgba(248,113,113,0.16)',
  border: '1px solid rgba(248,113,113,0.5)',
  color: '#FECACA',
  fontSize: 12.5,
  fontWeight: 700,
}

export function StickyDermStrip(p: StickyDermStripProps) {
  const acil = p.acilBant || []
  return (
    <div style={strip} data-derm="sticky-strip">
      {acil.length > 0 && (
        <div style={acilSatiri} data-derm="sticky-acil">
          <span>Kırmızı bayrak:</span>
          {acil.map((s) => <span key={s}>{s}</span>)}
          <span style={{ fontWeight: 500 }}>· Eylem listesi aşağıdaki bantta. Tedavi hekim kararı.</span>
        </div>
      )}
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
