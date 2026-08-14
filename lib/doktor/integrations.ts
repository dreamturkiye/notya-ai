/**
 * Doctor integration credential vault.
 * Secrets encrypted at rest; clients only see connected/meta/lastVerified.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'

export type IntegrationProvider = 'medula' | 'nvi_kps'

export type MedulaSecrets = {
  hekimTc: string
  sifre: string
  tesisKodu?: string
  sicilNo?: string
}

export type NviSecrets = {
  username: string
  password: string
}

export type IntegrationSecrets = MedulaSecrets | NviSecrets

export type IntegrationPublicStatus = {
  provider: IntegrationProvider
  connected: boolean
  meta: Record<string, unknown>
  lastVerified: string | null
  lastError: string | null
}

function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function authDoctorFromBearer(token: string): Promise<{ userId: string } | null> {
  const sb = serviceClient()
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token)
  if (error || !user) return null
  return { userId: user.id }
}

function maskTc(tc: string): string {
  const digits = tc.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  return `${digits.slice(0, 3)}****${digits.slice(-2)}`
}

export function publicMetaForProvider(
  provider: IntegrationProvider,
  secrets: IntegrationSecrets,
  existingMeta: Record<string, unknown> = {}
): Record<string, unknown> {
  if (provider === 'medula') {
    const s = secrets as MedulaSecrets
    return {
      ...existingMeta,
      hekimTcMasked: maskTc(s.hekimTc),
      tesisKodu: s.tesisKodu || null,
      sicilNo: s.sicilNo || null,
    }
  }
  const s = secrets as NviSecrets
  return {
    ...existingMeta,
    usernameMasked: s.username ? `${s.username.slice(0, 2)}***` : null,
  }
}

export async function getIntegrationStatus(
  doctorId: string,
  provider: IntegrationProvider
): Promise<IntegrationPublicStatus> {
  const sb = serviceClient()
  const { data } = await sb
    .from('doctor_integrations')
    .select('provider, status, meta, last_verified_at, last_error')
    .eq('doctor_id', doctorId)
    .eq('provider', provider)
    .maybeSingle()

  if (!data) {
    return {
      provider,
      connected: false,
      meta: {},
      lastVerified: null,
      lastError: null,
    }
  }

  return {
    provider,
    connected: data.status === 'connected' && Boolean(data),
    meta: (data.meta as Record<string, unknown>) || {},
    lastVerified: data.last_verified_at || null,
    lastError: data.last_error || null,
  }
}

export async function listIntegrationStatuses(
  doctorId: string
): Promise<IntegrationPublicStatus[]> {
  const providers: IntegrationProvider[] = ['medula', 'nvi_kps']
  return Promise.all(providers.map((p) => getIntegrationStatus(doctorId, p)))
}

export async function upsertIntegrationSecrets(
  doctorId: string,
  provider: IntegrationProvider,
  secrets: IntegrationSecrets,
  metaExtra: Record<string, unknown> = {}
): Promise<IntegrationPublicStatus> {
  const sb = serviceClient()
  const meta = publicMetaForProvider(provider, secrets, metaExtra)
  const secrets_encrypted = encryptPII(JSON.stringify(secrets))
  const now = new Date().toISOString()

  const { error } = await sb.from('doctor_integrations').upsert(
    {
      doctor_id: doctorId,
      provider,
      status: 'connected',
      meta,
      secrets_encrypted,
      last_verified_at: now,
      last_error: null,
      updated_at: now,
    },
    { onConflict: 'doctor_id,provider' }
  )

  if (error) throw new Error(error.message)

  return {
    provider,
    connected: true,
    meta,
    lastVerified: now,
    lastError: null,
  }
}

export async function disconnectIntegration(
  doctorId: string,
  provider: IntegrationProvider
): Promise<void> {
  const sb = serviceClient()
  await sb
    .from('doctor_integrations')
    .update({
      status: 'disconnected',
      secrets_encrypted: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('doctor_id', doctorId)
    .eq('provider', provider)
}

/** Server-only: load decrypted secrets for upstream calls. */
export async function loadIntegrationSecrets<T extends IntegrationSecrets>(
  doctorId: string,
  provider: IntegrationProvider
): Promise<{ secrets: T; meta: Record<string, unknown> } | null> {
  const sb = serviceClient()
  const { data } = await sb
    .from('doctor_integrations')
    .select('secrets_encrypted, meta, status')
    .eq('doctor_id', doctorId)
    .eq('provider', provider)
    .maybeSingle()

  if (!data || data.status !== 'connected' || !data.secrets_encrypted) return null

  try {
    const secrets = JSON.parse(decryptPII(data.secrets_encrypted)) as T
    return { secrets, meta: (data.meta as Record<string, unknown>) || {} }
  } catch {
    return null
  }
}

export async function markIntegrationError(
  doctorId: string,
  provider: IntegrationProvider,
  message: string
): Promise<void> {
  const sb = serviceClient()
  await sb
    .from('doctor_integrations')
    .update({
      status: 'error',
      last_error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq('doctor_id', doctorId)
    .eq('provider', provider)
}
