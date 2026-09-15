'use client'

import type { CSSProperties } from 'react'
import type { EvaluatedWindow } from '../engines/test-windows'
import { KD_WINDOW_STATUS, kdLabel } from './labels'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

const color: Record<EvaluatedWindow['status'], string> = {
  done: '#22C55E',
  open: '#F59E0B',
  overdue: '#EF4444',
  not_yet: '#475569',
}

export function TaramaPencereleri({ windows }: { windows: EvaluatedWindow[] }) {
  return (
    <section style={box} data-tab="TaramaPencereleri">
      <h2 style={{ margin: 0, fontSize: 16 }}>Tarama pencereleri</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>SUT ikili/üçlü yasal; NIPT klinik öneri, cepte.</p>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: 13 }}>
        {windows.map((w) => (
          <li key={w.id} style={{ color: color[w.status], marginBottom: 6 }}>
            {w.label} · {w.open}–{w.close} · {kdLabel(KD_WINDOW_STATUS, w.status)}
            {w.non_diagnostic ? ' · tanısal değil' : ''}
            {w.sut_code ? ` · ${w.sut_code}` : ''}
            {w.out_of_pocket ? ' · cepte' : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TaramaPencereleri
