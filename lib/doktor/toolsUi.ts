/** Shared helpers for doktor-tools pages (warm cream theme + patients API). */

import type { CSSProperties } from 'react'
import { ensureDoctorAccessToken, getDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

export type HastaOption = {
  id: string
  ad: string
  soyad: string
  label: string
  tcKimlikNo?: string
}

export function getAccessToken(): string {
  if (typeof window === 'undefined') return ''
  // NOTYA-AUTH-01: kick a refresh in the background so an expired session heals itself for the
  // next call; prefer getAccessTokenAsync() in async handlers, which waits for that refresh.
  void ensureDoctorAccessToken()
  return getDoctorAccessToken()
}

/** Refreshes an expired session before returning the token. Use in async handlers. */
export async function getAccessTokenAsync(): Promise<string> {
  if (typeof window === 'undefined') return ''
  return (await ensureDoctorAccessToken()) || ''
}

export function normalizeHastalar(payload: unknown): HastaOption[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { patients?: unknown }).patients)
      ? (payload as { patients: unknown[] }).patients
      : []

  return raw.map((item, idx) => {
    const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const id = String(p.id || idx)
    const masked = String(p.masked_name || p.name || '')
    const ad = String(
      p.ad || p.first_name || p.adi || (masked ? masked.split(/\s+/)[0] : '') || 'Hasta'
    )
    const soyad = String(
      p.soyad ||
        p.last_name ||
        p.soyadi ||
        (masked.includes(' ') ? masked.split(/\s+/).slice(1).join(' ') : '') ||
        ''
    )
    const tcKimlikNo = String(p.tcKimlikNo || p.tc_kimlik || p.masked_tc || '')
    const ozet = String(p.ozet || '').replace(/\s+/g, ' ').trim()
    const baseName = masked || `${ad} ${soyad}`.trim() || `Hasta ${idx + 1}`
    const withTc = tcKimlikNo && !masked ? `${baseName} (${tcKimlikNo})` : baseName
    const label = ozet ? `${withTc} — ${ozet.slice(0, 72)}` : withTc
    return { id, ad, soyad, label, tcKimlikNo: tcKimlikNo || undefined }
  })
}

export const toolsShell: CSSProperties = {
  minHeight: '100dvh',
  background: 'transparent',
  color: CHROME_RENK.ink,
  fontFamily: CHROME_FONT.sans,
}

export const toolsCard: CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
}

export const toolsInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1.5px solid ${CHROME_RENK.border}`,
  background: '#FFFFFF',
  color: CHROME_RENK.ink,
  fontSize: 14,
  outline: 'none',
}

export const toolsLabel: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: CHROME_RENK.muted,
  marginBottom: 8,
  fontWeight: 600,
}

export const toolsPrimaryBtn = (disabled?: boolean): CSSProperties => ({
  width: '100%',
  padding: '13px 16px',
  borderRadius: 12,
  border: 'none',
  background: disabled ? '#D8D0BE' : CHROME_RENK.pine,
  color: disabled ? '#8B8877' : '#FAF8F4',
  fontWeight: 700,
  fontSize: 14,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

export const toolsErrorBox: CSSProperties = {
  marginTop: 12,
  padding: '12px 14px',
  borderRadius: 12,
  background: '#FBEAE3',
  border: `1px solid ${CHROME_RENK.warn}55`,
  color: '#7A3D28',
  fontSize: 13,
  lineHeight: 1.45,
}
