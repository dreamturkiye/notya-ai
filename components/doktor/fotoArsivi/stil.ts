import type { CSSProperties } from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

export const R = CHROME_RENK

export const dugme: CSSProperties = {
  minHeight: 40, padding: '8px 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: R.border, background: '#fff', color: R.ink,
  fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
}
export const birincil: CSSProperties = { ...dugme, background: R.pine, color: '#fff', borderColor: R.pine, fontWeight: 600 }
export const tehlike: CSSProperties = { ...dugme, color: R.warn, borderColor: 'rgba(164,91,62,0.4)' }
export const girdi: CSSProperties = {
  minHeight: 40, padding: '8px 10px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(58,44,34,0.18)', background: '#fff', color: R.ink,
  fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
}
export const kart: CSSProperties = { background: '#fff', borderWidth: 1, borderStyle: 'solid', borderColor: R.border, borderRadius: 12, padding: 12 }
export const baslikKucuk: CSSProperties = { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: R.muted, margin: '0 0 6px' }

export const rozet = (renk: string = R.pine, zemin: string = 'rgba(47,67,52,0.1)'): CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11.5, color: renk, background: zemin, lineHeight: 1.5,
})
