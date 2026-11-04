/**
 * AU-PMS-CLINIKO-01 — live Cliniko REST adapter (clinic API key, no vendor committee).
 *
 * Auth: HTTP Basic with API key as username and empty password.
 * Docs: https://docs.api.cliniko.com/
 * Never logs the raw key. Every fetch has an explicit timeout.
 */
import type { PmsExportPaket } from '@/lib/ulke/mektup/tipler'
import type { PmsAdapterSonuc } from './adapter'

const ZAMAN_ASIMI_MS = 15_000
const USER_AGENT = 'Notya (kaan@notya.io)'

export type ClinikoKimlik = {
  anahtar: string
  /** Optional explicit Cliniko patient id — skips demographic match. */
  hastaId?: string
  /** Override shard host (au1, uk1, …). Derived from key suffix when absent. */
  shard?: string
}

function maskele(anahtar: string): string {
  return anahtar.length <= 4 ? '****' : `…${anahtar.slice(-4)}`
}

/** Cliniko keys often end with `-<shard>` (e.g. `-au1`). */
export function clinikoShard(kimlik: ClinikoKimlik): string {
  const acik = typeof kimlik.shard === 'string' ? kimlik.shard.trim().toLowerCase() : ''
  if (/^[a-z]{2}\d+$/.test(acik)) return acik
  const m = /-([a-z]{2}\d+)$/i.exec(kimlik.anahtar.trim())
  return m ? m[1]!.toLowerCase() : 'au1'
}

export function clinikoTaban(kimlik: ClinikoKimlik): string {
  return `https://api.${clinikoShard(kimlik)}.cliniko.com/v1`
}

function basliklar(anahtar: string): HeadersInit {
  const token = Buffer.from(`${anahtar}:`, 'utf8').toString('base64')
  return {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
  }
}

async function clinikoIstek<T>(
  kimlik: ClinikoKimlik,
  yol: string,
  init?: RequestInit,
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; kod: 'BASARISIZ' | 'PARTNER_YOK' }> {
  const anahtar = kimlik.anahtar.trim()
  if (anahtar.length < 8) return { ok: false, status: 0, kod: 'BASARISIZ' }
  const url = `${clinikoTaban(kimlik)}${yol.startsWith('/') ? yol : `/${yol}`}`
  try {
    const r = await fetch(url, {
      ...init,
      headers: { ...basliklar(anahtar), ...(init?.headers || {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
    })
    if (r.status === 401 || r.status === 403) return { ok: false, status: r.status, kod: 'PARTNER_YOK' }
    const text = await r.text()
    let data: T | undefined
    try { data = text ? JSON.parse(text) as T : undefined } catch { /* non-JSON */ }
    if (!r.ok || data === undefined) return { ok: false, status: r.status, kod: 'BASARISIZ' }
    return { ok: true, status: r.status, data }
  } catch {
    return { ok: false, status: 0, kod: 'BASARISIZ' }
  }
}

/** Cheapest real call: GET /user proves the key. */
export async function clinikoDogrula(kimlik: ClinikoKimlik): Promise<PmsAdapterSonuc> {
  const r = await clinikoIstek<{ id?: string }>(kimlik, '/user')
  if (!r.ok) return { tamam: false, kod: r.kod === 'PARTNER_YOK' ? 'BASARISIZ' : r.kod }
  if (!r.data.id) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, ref: `cliniko-user:${r.data.id}` }
}

function soyad(ad: string, otaIsmi?: string): { first: string; last: string } {
  const tam = [ad, otaIsmi].filter(Boolean).join(' ').trim()
  const parca = tam.split(/\s+/).filter(Boolean)
  if (parca.length === 0) return { first: '', last: '' }
  if (parca.length === 1) return { first: parca[0]!, last: parca[0]! }
  return { first: parca[0]!, last: parca[parca.length - 1]! }
}

type ClinikoHasta = { id: string; first_name?: string; last_name?: string }

/**
 * Resolve Cliniko patient_id: explicit kimlik.hastaId, else demographic search
 * (last name + DOB, then phone). Zero or many matches → BASARISIZ (never guess).
 */
export async function clinikoHastaBul(
  kimlik: ClinikoKimlik,
  hasta: { ad?: string; otaIsmi?: string; dogumTarihi?: string; telefon?: string } | null | undefined,
): Promise<{ tamam: true; id: string } | { tamam: false; kod: 'BASARISIZ' }> {
  const acik = typeof kimlik.hastaId === 'string' ? kimlik.hastaId.trim() : ''
  if (/^\d+$/.test(acik)) return { tamam: true, id: acik }
  if (!hasta?.ad) return { tamam: false, kod: 'BASARISIZ' }

  const { last } = soyad(hasta.ad, hasta.otaIsmi)
  const q: string[] = []
  if (last) q.push(`last_name:~${encodeURIComponent(last)}`)
  if (hasta.dogumTarihi && /^\d{4}-\d{2}-\d{2}$/.test(hasta.dogumTarihi)) {
    q.push(`date_of_birth:=${hasta.dogumTarihi}`)
  }
  if (q.length === 0) return { tamam: false, kod: 'BASARISIZ' }

  const qs = q.map((x) => `q[]=${x}`).join('&')
  const r = await clinikoIstek<{ patients?: ClinikoHasta[]; total_entries?: number }>(
    kimlik,
    `/patients?per_page=5&${qs}`,
  )
  if (!r.ok) return { tamam: false, kod: 'BASARISIZ' }
  const liste = r.data.patients ?? []
  if (liste.length === 1 && liste[0]?.id) return { tamam: true, id: String(liste[0].id) }

  // Phone fallback only when name+DOB was ambiguous or empty.
  const tel = (hasta.telefon || '').replace(/\D/g, '')
  if (tel.length >= 8) {
    const tr = await clinikoIstek<{ patients?: ClinikoHasta[] }>(
      kimlik,
      `/patients?per_page=5&q[]=phone:~${encodeURIComponent(tel.slice(-9))}`,
    )
    if (tr.ok) {
      const tListe = tr.data.patients ?? []
      if (tListe.length === 1 && tListe[0]?.id) return { tamam: true, id: String(tListe[0].id) }
    }
  }
  return { tamam: false, kod: 'BASARISIZ' }
}

function soapMetin(paket: PmsExportPaket): string {
  const bolumler = [
    ['Subjective', paket.not.s],
    ['Objective', paket.not.o],
    ['Assessment', paket.not.a],
    ['Plan', paket.not.p],
  ] as const
  const govde = bolumler
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `<p><b>${k}</b></p><p>${v.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>`)
    .join('')
  const mektup = paket.mektuplar
    ? Object.entries(paket.mektuplar)
      .filter(([, v]) => v?.trim())
      .map(([tur, v]) => `<p><b>Letter (${tur})</b></p><p>${String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>`)
      .join('')
    : ''
  return (govde + mektup) || '<p>(empty approved note)</p>'
}

/** Write an approved visit as a Cliniko treatment note (draft: true — clinician finalises in Cliniko). */
export async function clinikoYaz(kimlik: ClinikoKimlik, paket: PmsExportPaket): Promise<PmsAdapterSonuc> {
  const hasta = await clinikoHastaBul(kimlik, paket.hasta)
  if (!hasta.tamam) return { tamam: false, kod: 'BASARISIZ' }

  const govde = {
    patient_id: hasta.id,
    title: `Notya visit ${paket.onayTarihi?.slice(0, 10) || paket.notId.slice(0, 8)}`,
    draft: true,
    content: {
      sections: [{
        name: 'Notya approved note',
        description: 'Pushed from Notya after clinician approval. Review in Cliniko before finalising.',
        questions: [{
          name: 'Clinical note',
          type: 'paragraph',
          answer: soapMetin(paket),
        }],
      }],
    },
  }

  const r = await clinikoIstek<{ id?: string }>(kimlik, '/treatment_notes', {
    method: 'POST',
    body: JSON.stringify(govde),
  })
  if (!r.ok) return { tamam: false, kod: r.kod === 'PARTNER_YOK' ? 'BASARISIZ' : r.kod }
  if (!r.data.id) return { tamam: false, kod: 'BASARISIZ' }
  // Quiet success path — mask only used if we ever log.
  void maskele(kimlik.anahtar)
  return { tamam: true, ref: `cliniko-note:${r.data.id}` }
}
