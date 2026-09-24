'use client'

import type { CSSProperties } from 'react'
import type { KadinDogumPayload } from '../schema'
import {
  KD_EPISODE_STATUS,
  KD_GA_LOCK,
  KD_IDC,
  KD_PLURALITY,
  KD_RISK_CLASS,
  kdLabel,
} from './labels'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export type GebeKartiLive = {
  D?: number | null
  E?: number | null
  idcKnown?: boolean
  pluralityKnown?: boolean
  riskKnown?: boolean
}

export function GebeKarti({ payload, live }: { payload: KadinDogumPayload; live?: GebeKartiLive }) {
  const score = payload.obstetric_score
  const D = live ? (live.D == null ? '—' : live.D) : score.D
  const E = live ? (live.E == null ? '—' : live.E) : score.E
  return (
    <section style={box} data-tab="GebeKarti">
      <h2 style={{ margin: 0, fontSize: 16 }}>Gebe kartı</h2>
      <p style={{ color: CHROME_RENK.muted, fontSize: 13 }} title={payload.episode_id}>
        {kdLabel(KD_EPISODE_STATUS, payload.episode_status)} · risk {live?.riskKnown === false ? '—' : kdLabel(KD_RISK_CLASS, payload.risk_class)}
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
        <dt>SAT</dt><dd>{payload.sat ?? '—'}</dd>
        <dt>TDT (Naegele)</dt><dd>{payload.edd_naegele ?? '—'}</dd>
        <dt>TDT (CRL)</dt><dd>{payload.edd_crl ?? '—'}</dd>
        <dt>Gebelik yaşı kilidi</dt><dd>{kdLabel(KD_GA_LOCK, payload.ga_locked)}</dd>
        <dt>G/P/A/Y/D/E</dt>
        <dd>{score.G}/{score.P}/{score.A}/{score.Y}/{D}/{E}</dd>
        <dt>Rh / İndirekt Coombs</dt>
        <dd>{payload.rh} / {live?.idcKnown === false ? '—' : kdLabel(KD_IDC, payload.idc_history)}</dd>
        <dt>Çoğul</dt>
        <dd>
          {live?.pluralityKnown === false ? '—' : kdLabel(KD_PLURALITY, payload.plurality)}
          {payload.chorionicity ? ` · ${payload.chorionicity}` : ''}
        </dd>
      </dl>
    </section>
  )
}

export default GebeKarti
