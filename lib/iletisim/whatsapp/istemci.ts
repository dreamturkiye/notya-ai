/** WHATSAPP-API-01 — browser: authenticated fetch for the WhatsApp card, helper and inbox. Client-only. */
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorFetch } from '@/lib/doktor/oturumFetch'

export async function waIstek(yol: string, init?: RequestInit): Promise<Response | null> {
  const t = await ensureDoctorAccessToken()
  if (!t) return null
  return doktorFetch(yol, { ...init, cache: 'no-store', headers: { ...(init?.headers || {}) } })
}
