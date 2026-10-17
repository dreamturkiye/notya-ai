/** WHATSAPP-API-01 — browser: authenticated fetch for the WhatsApp card, helper and inbox. Client-only. */
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

export async function waIstek(yol: string, init?: RequestInit): Promise<Response | null> {
  const t = await ensureDoctorAccessToken()
  if (!t) return null
  return fetch(yol, { ...init, cache: 'no-store', headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}` } })
}
