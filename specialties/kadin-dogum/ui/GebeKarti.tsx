'use client'

import type { CSSProperties } from 'react'
import type { KadinDogumPayload } from '../schema'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export function GebeKarti({ payload }: { payload: KadinDogumPayload }) {
  const score = payload.obstetric_score
  return (
    <section style={box} data-tab="GebeKarti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Gebe kartı</h2>
      <p style={{ color: '#8FA0B5', fontSize: 13 }}>
        Episode {payload.episode_id} · {payload.episode_status} · risk {payload.risk_class}
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
        <dt>SAT (payload)</dt><dd>{payload.sat ?? '—'}</dd>
        <dt>EDD Naegele</dt><dd>{payload.edd_naegele ?? '—'}</dd>
        <dt>EDD CRL</dt><dd>{payload.edd_crl ?? '—'}</dd>
        <dt>GA kilit</dt><dd>{payload.ga_locked}</dd>
        <dt>G/P/A/Y/D/E</dt>
        <dd>{score.G}/{score.P}/{score.A}/{score.Y}/{score.D}/{score.E}</dd>
        <dt>Rh / IDC</dt><dd>{payload.rh} / {payload.idc_history}</dd>
        <dt>Çoğul</dt><dd>{payload.plurality}{payload.chorionicity ? ` · ${payload.chorionicity}` : ''}</dd>
      </dl>
    </section>
  )
}

export default GebeKarti
