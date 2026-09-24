'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { gopIsotretinoin, acitretinPregnancyBanYears, type GopInput, type GopSex } from '../engines/gop-isotretinoin'
import { btn, giris, etiketS } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const box: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(248,113,113,0.35)',
  borderRadius: 12,
  padding: 16,
}

export function GopBlok({
  pack,
  today,
  sex = 'unknown',
  acitretinBan,
  onKaydet,
}: {
  pack: Omit<GopInput, 'today_iso' | 'sex'> | null
  today: string
  sex?: GopSex
  acitretinBan?: boolean
  onKaydet?: (p: Omit<GopInput, 'today_iso' | 'sex'>) => void
}) {
  const input: GopInput = pack
    ? { ...pack, today_iso: today, sex }
    : {
        two_contraception: false,
        hcg_iso: null,
        hcg_negative: false,
        cycle_day: null,
        rx_days: 30,
        start_iso: today,
        today_iso: today,
        sex,
      }
  const result = gopIsotretinoin(input)
  const maleNa = sex === 'male'
  const [f, setF] = useState({
    two_contraception: input.two_contraception,
    hcg_iso: input.hcg_iso || '',
    hcg_negative: input.hcg_negative,
    cycle_day: input.cycle_day != null ? String(input.cycle_day) : '',
    rx_days: String(input.rx_days || 30),
    start_iso: input.start_iso || today,
  })
  const boxStyle: CSSProperties = {
    ...box,
    border: maleNa || result.allowed ? '1px solid rgba(255,255,255,0.09)' : box.border,
  }
  return (
    <section style={boxStyle} data-tab="GopBlok" data-gop={result.allowed ? 'ok' : 'blocked'} data-sex={sex}>
      <h2 style={{ margin: 0, fontSize: 16 }}>GÖP izotretinoin</h2>
      {maleNa && (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
          Gebelik önleme maddeleri (çift kontrasepsiyon, negatif β-hCG, siklus 2–3. gün) erkek hasta için geçerli değildir.
        </p>
      )}
      {acitretinBan && (
        <p style={{ fontSize: 13, color: '#FBBF24' }}>
          Asitretin: gebelik yasağı {acitretinPregnancyBanYears()} yıl (izotretinoinden uzun).
        </p>
      )}
      {result.allowed ? (
        <p style={{ fontSize: 13, color: '#22C55E' }}>
          {maleNa ? 'Gebelik GÖP kapısı bu hasta için uygulanmaz. Reçete süresi kuralı ayrıca izlenir.' : 'Paket tam — yine de uzman kararı gerekir.'}
        </p>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: CHROME_RENK.warn, marginBottom: 6 }}>Paket eksik — reçete bloke.</p>
          <ul style={{ fontSize: 13, paddingLeft: 18, color: CHROME_RENK.warn }}>
            {result.blocks.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}
      {onKaydet && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onKaydet({
              two_contraception: f.two_contraception,
              hcg_iso: f.hcg_iso || null,
              hcg_negative: f.hcg_negative,
              cycle_day: f.cycle_day === '' ? null : Number(f.cycle_day),
              rx_days: Number(f.rx_days) || 30,
              start_iso: f.start_iso || today,
            })
          }}
          style={{ display: 'grid', gap: 8, marginTop: 10 }}
        >
          {!maleNa && (
            <>
              <label style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={f.two_contraception} onChange={(e) => setF((p) => ({ ...p, two_contraception: e.target.checked }))} />
                Çift kontrasepsiyon
              </label>
              <label><span style={etiketS}>β-hCG tarihi</span><input type="date" style={giris} value={f.hcg_iso} onChange={(e) => setF((p) => ({ ...p, hcg_iso: e.target.value }))} /></label>
              <label style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={f.hcg_negative} onChange={(e) => setF((p) => ({ ...p, hcg_negative: e.target.checked }))} />
                Negatif β-hCG
              </label>
              <label><span style={etiketS}>Siklus günü</span><input style={giris} value={f.cycle_day} onChange={(e) => setF((p) => ({ ...p, cycle_day: e.target.value }))} /></label>
            </>
          )}
          <label><span style={etiketS}>Reçete günü (≤30)</span><input style={giris} value={f.rx_days} onChange={(e) => setF((p) => ({ ...p, rx_days: e.target.value }))} /></label>
          <label><span style={etiketS}>Başlangıç</span><input type="date" style={giris} value={f.start_iso} onChange={(e) => setF((p) => ({ ...p, start_iso: e.target.value }))} /></label>
          <button type="submit" style={btn(true)}>GÖP kaydet</button>
        </form>
      )}
    </section>
  )
}

export default GopBlok
