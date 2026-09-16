'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { btn, giris, etiketS } from './clinic-styles'

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export type SkorKayit = {
  pasi?: number
  easi?: number
  dlqi?: number
  uas7?: number
  salt?: number
}

export function SkorPaneli({
  pasi,
  easi,
  dlqi,
  uas7,
  salt,
  showUas7,
  showSalt,
  emptyAction,
  onKaydet,
}: {
  pasi?: number
  easi?: number
  dlqi?: number
  uas7?: number
  salt?: number
  showUas7?: boolean
  showSalt?: boolean
  emptyAction?: ReactNode
  onKaydet?: (s: SkorKayit) => void
}) {
  const empty = pasi == null && easi == null && dlqi == null && uas7 == null && salt == null
  const [f, setF] = useState({ pasi: '', easi: '', dlqi: '', uas7: '', salt: '' })
  return (
    <section style={box} data-tab="SkorPaneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>Skor paneli</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        PASI / EASI / DLQI bu bölümde tutulur — çekirdek hasta kartına yazılmaz.
      </p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 13, margin: 0 }}>
        <div><dt>PASI</dt><dd>{pasi ?? '—'}</dd></div>
        <div><dt>EASI</dt><dd>{easi ?? '—'}</dd></div>
        <div><dt>DLQI</dt><dd>{dlqi ?? '—'}</dd></div>
        {showUas7 && <div><dt>UAS7</dt><dd>{uas7 ?? '—'}</dd></div>}
        {showSalt && <div><dt>SALT</dt><dd>{salt ?? '—'}</dd></div>}
      </dl>
      {empty && (
        <p style={{ fontSize: 12.5, color: '#8FA0B5', marginBottom: emptyAction || onKaydet ? 8 : 0 }}>
          Henüz skor yok. PASI / EASI / DLQI değerini kaydedin.
        </p>
      )}
      {empty && emptyAction}
      {onKaydet && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onKaydet({
              ...(f.pasi !== '' ? { pasi: Number(f.pasi) } : {}),
              ...(f.easi !== '' ? { easi: Number(f.easi) } : {}),
              ...(f.dlqi !== '' ? { dlqi: Number(f.dlqi) } : {}),
              ...(f.uas7 !== '' ? { uas7: Number(f.uas7) } : {}),
              ...(f.salt !== '' ? { salt: Number(f.salt) } : {}),
            })
            setF({ pasi: '', easi: '', dlqi: '', uas7: '', salt: '' })
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}
        >
          <label><span style={etiketS}>PASI</span><input style={giris} value={f.pasi} onChange={(e) => setF((p) => ({ ...p, pasi: e.target.value }))} /></label>
          <label><span style={etiketS}>EASI</span><input style={giris} value={f.easi} onChange={(e) => setF((p) => ({ ...p, easi: e.target.value }))} /></label>
          <label><span style={etiketS}>DLQI (0–30)</span><input style={giris} value={f.dlqi} onChange={(e) => setF((p) => ({ ...p, dlqi: e.target.value }))} /></label>
          {showUas7 && <label><span style={etiketS}>UAS7</span><input style={giris} value={f.uas7} onChange={(e) => setF((p) => ({ ...p, uas7: e.target.value }))} /></label>}
          {showSalt && <label><span style={etiketS}>SALT</span><input style={giris} value={f.salt} onChange={(e) => setF((p) => ({ ...p, salt: e.target.value }))} /></label>}
          <div style={{ alignSelf: 'end' }}><button type="submit" style={btn(true)}>Skor kaydet</button></div>
        </form>
      )}
    </section>
  )
}

export default SkorPaneli
