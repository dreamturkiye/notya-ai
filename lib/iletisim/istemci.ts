'use client'
/**
 * NOTYA-ILETISIM-01 — browser half: API calls, this device's remembered choices, and opening the
 * sender's own WhatsApp / mail in a way iOS Safari does not block.
 *
 * iOS Safari only lets a page open a new window synchronously inside the tap. The send button
 * therefore prepares the message FIRST (when its sheet opens), so the tap on "WhatsApp'ta aç" opens
 * an already-built link with no await in between — the same rule the Hatırlatma tool's
 * about:blank trick worked around (app/doktor-tools/hatirlatma).
 */
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { epostaAcilisMi, kanalMi, type EpostaAcilis, type IletisimKanali } from './tipler'

const ACILIS_ANAHTARI = 'notya.iletisim.epostaAcilis'
const SON_KANAL_ANAHTARI = (patientId: string) => `notya.iletisim.sonKanal.${patientId}`

/** Where emails open on THIS device (a secretary's office PC can differ from the doctor's phone). */
export function cihazEpostaAcilisi(): EpostaAcilis | null {
  try {
    const v = localStorage.getItem(ACILIS_ANAHTARI)
    return epostaAcilisMi(v) ? v : null
  } catch {
    return null
  }
}

export function cihazEpostaAcilisiniKaydet(a: EpostaAcilis): void {
  try { localStorage.setItem(ACILIS_ANAHTARI, a) } catch { /* private mode */ }
}

export function cihazSonKanal(patientId: string): IletisimKanali | null {
  try {
    const v = localStorage.getItem(SON_KANAL_ANAHTARI(patientId))
    return kanalMi(v) ? v : null
  } catch {
    return null
  }
}

export function cihazSonKanaliKaydet(patientId: string, k: IletisimKanali): void {
  try { localStorage.setItem(SON_KANAL_ANAHTARI(patientId), k) } catch { /* private mode */ }
}

/**
 * Opens a prepared link. MUST be called synchronously from the tap handler.
 * mailto: stays in this tab (a new tab would be left blank on desktop); web links open a new tab.
 */
export function baglantiyiAc(link: string): void {
  if (link.startsWith('mailto:')) {
    window.location.href = link
    return
  }
  // No 'noopener' feature: with it window.open always returns null and we could not tell a blocked
  // popup from an opened one. The opener is cut by hand instead.
  const w = window.open(link, '_blank')
  if (w) { try { w.opener = null } catch { /* cross-origin already */ } } else window.location.href = link
}

export class IletisimHatasi extends Error {
  constructor(message: string, public durum: number) { super(message) }
}

/** fetch with the logged-in doctor's / secretary's token; throws IletisimHatasi with the server's plain sentence. */
export async function iletisimIstek<T>(yol: string, init?: { method?: string; govde?: unknown }): Promise<T> {
  const token = await ensureDoctorAccessToken()
  if (!token) throw new IletisimHatasi('Oturum süresi doldu. Lütfen yeniden giriş yapın.', 401)
  const r = await fetch(yol, {
    method: init?.method || 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init?.govde !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.govde !== undefined ? JSON.stringify(init.govde) : undefined,
    cache: 'no-store',
  })
  const j = (await r.json().catch(() => ({}))) as T & { error?: string }
  if (!r.ok) throw new IletisimHatasi(j.error || 'Bir sorun oldu. Lütfen yeniden deneyin.', r.status)
  return j
}
