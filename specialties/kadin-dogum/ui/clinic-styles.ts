import type { CSSProperties } from 'react'

export const kutu: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12,
  padding: 16,
}

export const giris: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#EDF1F7',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  width: '100%',
}

export const etiketS: CSSProperties = {
  fontSize: 11.5,
  color: '#8FA0B5',
  marginBottom: 4,
  display: 'block',
}

export const btn = (birincil = false): CSSProperties => ({
  background: birincil ? '#0F9B8E' : 'rgba(255,255,255,0.08)',
  border: 'none',
  color: birincil ? 'white' : '#EDF1F7',
  borderRadius: 8,
  padding: '9px 14px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
})

export const DURUM_RENK = { tamamlandi: '#22C55E', zamani: '#F59E0B', gecikmis: '#EF4444', ileride: '#475569' } as const
export const DURUM_ETIKET = { tamamlandi: 'Yapıldı', zamani: 'Zamanı', gecikmis: 'Gecikmiş', ileride: 'İleride' } as const
