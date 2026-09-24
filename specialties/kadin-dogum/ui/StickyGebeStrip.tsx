'use client'

import type { CSSProperties } from 'react'
import { KD_RISK_CLASS, kdLabel } from './labels'
import { kutu, btn } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

export type StickyGebeStripProps = {
  mod: 'gebe' | 'lohusa'
  haftaMetin: string
  tdt: string
  risk: string
  rh: string
  sonrakiRandevu: string
  tehlikeOzeti: string
  onTehlikeKopyala: () => void
  onBugunkuIzlem: () => void
  dobyrBadge?: string
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
  color: CHROME_RENK.ink,
}

export function StickyGebeStrip(p: StickyGebeStripProps) {
  return (
    <div style={strip} data-kd="sticky-strip">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={chip}><b>Hafta</b> · {p.haftaMetin}</span>
          <span style={chip}><b>TDT</b> · {p.tdt}</span>
          <span style={chip}><b>Risk</b> · {kdLabel(KD_RISK_CLASS, p.risk)}</span>
          <span style={chip}><b>Rh</b> · {p.rh}</span>
          <span style={chip}><b>Sonraki randevu</b> · {p.sonrakiRandevu}</span>
          {p.dobyrBadge && (
            <span style={{ ...chip, background: 'rgba(34,197,94,0.18)', color: '#86EFAC' }} data-kd="dobyr-badge">
              DÖBYR uyum {p.dobyrBadge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={btn(true)} onClick={p.onBugunkuIzlem} data-kd="cta-bugunku">
            {p.mod === 'lohusa' ? 'Bugünkü lohusa izlemi' : 'Bugünkü izlem'}
          </button>
          <button type="button" style={btn()} onClick={p.onTehlikeKopyala} title={p.tehlikeOzeti} data-kd="tehlike-kopyala">
            Tehlike işaretleri
          </button>
        </div>
      </div>
    </div>
  )
}

export default StickyGebeStrip
