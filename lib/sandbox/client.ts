'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function useSandboxToken(): string {
  const params = useSearchParams()
  return params.get('token') || ''
}

export function sandboxFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('x-sandbox-token', token)

  const url = path.includes('?') ? `${path}&token=${encodeURIComponent(token)}` : `${path}?token=${encodeURIComponent(token)}`

  return fetch(url, { ...options, headers })
}

export async function playBase64Audio(base64: string | null | undefined): Promise<void> {
  if (!base64) return
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.playsInline = true
  await new Promise<void>((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.play().catch(() => resolve())
  })
}

export const SANDBOX_THEME = {
  bg: '#080F1A',
  panel: '#0A1525',
  card: '#1A2B40',
  accent: '#0F9B8E',
  accentAlt: '#006699',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.08)',
}

export const SCORE_SECTIONS = [
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'hpi', label: 'HPI (Öykü)' },
  { key: 'differential_diagnosis', label: 'Differential Diagnosis' },
  { key: 'treatment_suggestions', label: 'Treatment Suggestions' },
] as const
