/**
 * AU-PMS-MAGENTUS-01 — Magentus Partner API (Genie desktop + Gentu cloud share one FHIR surface).
 *
 * Auth: OAuth2 client_credentials + x-api-key (docs.geniesolutions.io).
 * Live write uses FHIR DocumentReference create for clinician-approved note / letter text.
 * Without complete partner credentials → PARTNER_YOK (never fake Synced).
 * Every fetch has an explicit timeout.
 */
import type { PmsExportPaket } from '@/lib/ulke/mektup/tipler'
import type { PmsAdapterSonuc } from './adapter'

const ZAMAN_ASIMI_MS = 15_000

export type MagentusKimlik = {
  /** x-api-key from Magentus developer portal. */
  anahtar: string
  clientId?: string
  clientSecret?: string
  tokenUrl?: string
  apiUrl?: string
  scopes?: string
  /** Optional FHIR Patient id for subject reference. */
  hastaId?: string
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export function magentusKimlikTamMi(k: MagentusKimlik, ortam: NodeJS.ProcessEnv = process.env): boolean {
  const anahtar = str(k.anahtar)
  const clientId = str(k.clientId) || str(ortam.NOTYA_PMS_MAGENTUS_CLIENT_ID)
  const clientSecret = str(k.clientSecret) || str(ortam.NOTYA_PMS_MAGENTUS_CLIENT_SECRET)
  const tokenUrl = str(k.tokenUrl) || str(ortam.NOTYA_PMS_MAGENTUS_TOKEN_URL)
  const apiUrl = str(k.apiUrl) || str(ortam.NOTYA_PMS_MAGENTUS_API_URL)
  return Boolean(anahtar && clientId && clientSecret && tokenUrl && apiUrl)
}

function magentusConfig(k: MagentusKimlik, ortam: NodeJS.ProcessEnv = process.env) {
  return {
    anahtar: str(k.anahtar),
    clientId: str(k.clientId) || str(ortam.NOTYA_PMS_MAGENTUS_CLIENT_ID),
    clientSecret: str(k.clientSecret) || str(ortam.NOTYA_PMS_MAGENTUS_CLIENT_SECRET),
    tokenUrl: str(k.tokenUrl) || str(ortam.NOTYA_PMS_MAGENTUS_TOKEN_URL),
    apiUrl: (str(k.apiUrl) || str(ortam.NOTYA_PMS_MAGENTUS_API_URL)).replace(/\/$/, ''),
    scopes: str(k.scopes) || str(ortam.NOTYA_PMS_MAGENTUS_SCOPES) || 'openid',
    hastaId: str(k.hastaId),
  }
}

async function magentusJeton(
  cfg: ReturnType<typeof magentusConfig>,
): Promise<{ tamam: true; token: string } | { tamam: false; kod: 'PARTNER_YOK' | 'BASARISIZ' }> {
  if (!cfg.anahtar || !cfg.clientId || !cfg.clientSecret || !cfg.tokenUrl || !cfg.apiUrl) {
    return { tamam: false, kod: 'PARTNER_YOK' }
  }
  const govde = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: cfg.scopes,
  })
  try {
    const r = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: govde.toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
    })
    const j = await r.json().catch(() => null) as { access_token?: string } | null
    if (!r.ok || !j?.access_token) return { tamam: false, kod: 'BASARISIZ' }
    return { tamam: true, token: j.access_token }
  } catch {
    return { tamam: false, kod: 'BASARISIZ' }
  }
}

async function magentusIstek(
  cfg: ReturnType<typeof magentusConfig>,
  token: string,
  yol: string,
  init?: RequestInit,
): Promise<{ ok: true; status: number; data: unknown } | { ok: false; kod: 'BASARISIZ' }> {
  const url = `${cfg.apiUrl}${yol.startsWith('/') ? yol : `/${yol}`}`
  try {
    const r = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': cfg.anahtar,
        Accept: 'application/fhir+json, application/json',
        'Content-Type': 'application/fhir+json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
    })
    const text = await r.text()
    let data: unknown = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!r.ok) return { ok: false, kod: 'BASARISIZ' }
    return { ok: true, status: r.status, data }
  } catch {
    return { ok: false, kod: 'BASARISIZ' }
  }
}

/** Validate Magentus partner keys via CapabilityStatement (GET /metadata). */
export async function magentusDogrula(
  kimlik: MagentusKimlik,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  const cfg = magentusConfig(kimlik, ortam)
  if (!magentusKimlikTamMi(kimlik, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  const jeton = await magentusJeton(cfg)
  if (!jeton.tamam) return { tamam: false, kod: jeton.kod }
  const r = await magentusIstek(cfg, jeton.token, '/metadata')
  if (!r.ok) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, ref: 'magentus-metadata' }
}

function notMetni(paket: PmsExportPaket): string {
  const satirlar = [
    `Notya approved visit (${paket.notId})`,
    paket.onayTarihi ? `Approved: ${paket.onayTarihi}` : '',
    '',
    'Subjective:', paket.not.s,
    '',
    'Objective:', paket.not.o,
    '',
    'Assessment:', paket.not.a,
    '',
    'Plan:', paket.not.p,
  ]
  if (paket.mektuplar) {
    for (const [tur, metin] of Object.entries(paket.mektuplar)) {
      if (metin?.trim()) satirlar.push('', `Letter (${tur}):`, metin)
    }
  }
  return satirlar.filter((s) => s !== undefined).join('\n')
}

/**
 * Create a FHIR DocumentReference carrying the approved note as base64 text.
 * Magentus Letters workflow maps DocumentReference / correspondence attachments.
 */
export async function magentusYaz(
  kimlik: MagentusKimlik,
  paket: PmsExportPaket,
  ortam: NodeJS.ProcessEnv = process.env,
): Promise<PmsAdapterSonuc> {
  const cfg = magentusConfig(kimlik, ortam)
  if (!magentusKimlikTamMi(kimlik, ortam)) return { tamam: false, kod: 'PARTNER_YOK' }
  const jeton = await magentusJeton(cfg)
  if (!jeton.tamam) return { tamam: false, kod: jeton.kod }

  const metin = notMetni(paket)
  const data = Buffer.from(metin, 'utf8').toString('base64')
  const resource: Record<string, unknown> = {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'preliminary',
    type: {
      coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }],
      text: 'Notya approved visit note',
    },
    date: paket.onayTarihi || new Date().toISOString(),
    description: 'Clinician-approved Notya visit note. Review before filing.',
    content: [{
      attachment: {
        contentType: 'text/plain; charset=utf-8',
        data,
        title: `notya-${paket.notId}.txt`,
      },
    }],
  }
  if (cfg.hastaId) {
    resource.subject = { reference: `Patient/${cfg.hastaId}` }
  }

  const r = await magentusIstek(cfg, jeton.token, '/DocumentReference', {
    method: 'POST',
    body: JSON.stringify(resource),
  })
  if (!r.ok) return { tamam: false, kod: 'BASARISIZ' }
  const id = (r.data as { id?: string } | null)?.id
  return { tamam: true, ref: id ? `magentus-doc:${id}` : 'magentus-doc' }
}
