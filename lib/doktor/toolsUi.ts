/** Shared helpers for doktor-tools pages (dark theme + patients API). */

import type { CSSProperties } from 'react'
import { ensureDoctorAccessToken, getDoctorAccessToken } from '@/lib/doktor/clientAuth'

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
    const baseName = masked || `${ad} ${soyad}`.trim() || `Hasta ${idx + 1}`
    const label = tcKimlikNo && !masked ? `${baseName} (${tcKimlikNo})` : baseName
    return { id, ad, soyad, label, tcKimlikNo: tcKimlikNo || undefined }
  })
}

export const toolsShell: CSSProperties = {
  minHeight: '100dvh',
  background: '#060C18',
  color: '#F8FAFC',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

export const toolsCard: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: 18,
}

export const toolsInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.14)',
  background: '#0A1628',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
}

export const toolsLabel: CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#CBD5E1',
  marginBottom: 8,
  fontWeight: 600,
}

export const toolsPrimaryBtn = (disabled?: boolean): CSSProperties => ({
  width: '100%',
  padding: '13px 16px',
  borderRadius: 12,
  border: 'none',
  background: disabled ? '#334155' : '#0F9B8E',
  color: disabled ? '#94A3B8' : '#041016',
  fontWeight: 700,
  fontSize: 14,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

export const toolsErrorBox: CSSProperties = {
  marginTop: 12,
  padding: '12px 14px',
  borderRadius: 12,
  background: '#7F1D1D',
  border: '1px solid #FCA5A5',
  color: '#FEE2E2',
  fontSize: 13,
  lineHeight: 1.45,
}
