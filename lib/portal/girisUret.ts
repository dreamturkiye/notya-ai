/**
 * INTAKE-PORTAL-01 (Dr. Gökhan's live audit, 2026-10-25): the intake message carries the patient's portal link AND PIN.
 * The PIN is stored only as a scrypt hash, so a message that shows it needs a NEW link + PIN minted at send time — the same
 * mint as /api/doktor/araclar/hasta-portali (an extra token row; links and PINs already given stay valid). SERVER ONLY.
 * HASTA-IZOLASYON-01: the patient is checked with the doctor's id before anything is minted. Nothing here is logged.
 */
import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generatePortalPin, hashPortalPin } from '@/lib/portal/pinAuth'

export type PortalGirisi = { url: string; pin: string }

export async function portalGirisiUret(sb: SupabaseClient, doktorId: string, hastaId: string): Promise<PortalGirisi | null> {
  const secret = process.env.PORTAL_TOKEN_SECRET
  if (!secret || !doktorId || !hastaId) return null
  try {
    const { data: hasta } = await sb.from('patients').select('id').eq('id', hastaId).eq('doctor_id', doktorId).maybeSingle()
    if (!hasta) return null
    const pin = generatePortalPin()
    const hmac = createHmac('sha256', secret).update(`${hastaId}${doktorId}${Date.now()}`).digest('hex')
    const { error } = await sb.from('hasta_portal_tokens').upsert({
      token_hash: hmac, doctor_id: doktorId, patient_id: hastaId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), pin_hash: hashPortalPin(pin),
    }, { onConflict: 'token_hash' })
    if (error) return null
    return { url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.notya.io'}/portal/hasta/${hmac}`, pin }
  } catch {
    return null
  }
}
