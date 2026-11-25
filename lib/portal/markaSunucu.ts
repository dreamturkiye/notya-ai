/**
 * HASTA-ALANI-MARKA — server side of the doctor-first portal brand (pure rules: lib/portal/marka.ts).
 *
 *   portalMarkasiTokenla(token)  the brand of a portal link, read ONCE per request on the server (React cache): the
 *                                token's own doctor only — users, hasta_alani_gorunumu, doctor_avatars (type / size /
 *                                date only, never the image), Notya Klinik membership. Rendered into the page HTML by
 *                                app/portal/hasta/[token]/layout.tsx, so the portal home needs NO extra request for it
 *                                (perf budget) and the PIN screen already shows the doctor. No patient data is read.
 *   hekimMarkasi(sb, doctorId)   the same for a signed-in doctor (settings preview, /portal/onizleme).
 *   pushMarkaAdlari(sb, ids)     doctor id → short brand name for patient push titles — batched (one query per table).
 *
 * Isolation (hasta-izolasyon): every query is keyed by the token's doctor_id or the caller's own doctor id; a foreign
 * doctor's settings / logo path are never read. Files: one public-read bucket, per-doctor folder, content-hashed names.
 */
import * as React from 'react'
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { hekimUnvanliSatirdan } from '@/lib/doktor/hekimAdi'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
import { BILINMEYEN_MARKA, hekimKisaAdi, markaCoz, type PortalMarka } from './marka'

export const MARKA_KOVASI = 'hasta-alani-marka'

/** The public URL prefix of the brand bucket; a clinic logo outside it is never drawn on a patient's device. */
export function markaKovaTabani(): string {
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/${MARKA_KOVASI}/`
}

export function markaLogoUrl(yol: string | null | undefined): string | null {
  const y = String(yol || '').trim()
  return y && /^[\w-]+(\/[\w-]+)*\/logo-[0-9a-f]{16}\.(png|jpg|webp)$/.test(y) ? `${markaKovaTabani()}${y}` : null
}

/** A Notya Klinik logo is drawn only when it is a file we stored (no third-party image request from a patient's phone). */
export function klinikLogoGuvenli(url: string | null | undefined): string | null {
  const u = String(url || '').trim()
  return u.startsWith(`${markaKovaTabani()}klinik/`) ? u : null
}

/** Photos the patient's browser can show and the icon renderer can read. WebP only when small enough to send as is. */
export function fotoKullanilabilir(av: { mime_type?: unknown; byte_length?: unknown } | null | undefined): boolean {
  const mime = String(av?.mime_type || '')
  const bayt = Number(av?.byte_length || 0)
  if (mime === 'image/jpeg' || mime === 'image/png') return true
  return mime === 'image/webp' && bayt > 0 && bayt <= 400_000
}

export function fotoSurumu(updatedAt: unknown): string {
  return createHash('sha256').update(String(updatedAt || '')).digest('hex').slice(0, 12)
}

type HamMarka = {
  user: { full_name?: unknown; title?: unknown; unvan?: unknown; specialty?: unknown; clinic_name?: unknown } | null
  ayar: { logo_yol?: unknown; gorunen_ad?: unknown; vurgu?: unknown; foto_goster?: unknown } | null
  avatar: { mime_type?: unknown; byte_length?: unknown; updated_at?: unknown } | null
  klinik: { name?: unknown; logo_url?: unknown } | null
}

/** Read the raw rows for one doctor (all keyed by that doctor's id). Two round trips at most (clinic via membership). */
export async function hamMarkaOku(sb: SupabaseClient, doctorId: string): Promise<HamMarka> {
  const [u, a, av, sahip, uye] = await Promise.all([
    sb.from('users').select('full_name, title, unvan, specialty, clinic_name').eq('id', doctorId).maybeSingle(),
    sb.from('hasta_alani_gorunumu').select('logo_yol, gorunen_ad, vurgu, foto_goster').eq('doctor_id', doctorId).maybeSingle(),
    sb.from('doctor_avatars').select('mime_type, byte_length, updated_at').eq('doctor_id', doctorId).maybeSingle(),
    sb.from('clinics').select('name, logo_url').eq('owner_id', doctorId).eq('is_active', true).limit(1).maybeSingle(),
    sb.from('clinic_members').select('clinic_id').eq('user_id', doctorId).eq('is_active', true).limit(1).maybeSingle(),
  ])
  let klinik = (sahip.data as HamMarka['klinik']) || null
  if (!klinik && uye.data?.clinic_id) {
    const k = await sb.from('clinics').select('name, logo_url').eq('id', String(uye.data.clinic_id)).eq('is_active', true).maybeSingle()
    klinik = (k.data as HamMarka['klinik']) || null
  }
  return { user: (u.data as HamMarka['user']) || null, ayar: (a.error ? null : (a.data as HamMarka['ayar'])) || null, avatar: (av.data as HamMarka['avatar']) || null, klinik }
}

/** Raw rows → brand. `fotoUrl` builds the photo URL for this surface (token route for patients). */
export function hamdanMarka(h: HamMarka, fotoUrl: (surum: string) => string | null): PortalMarka {
  const specialty = String(h.user?.specialty || '').trim()
  const foto = fotoKullanilabilir(h.avatar) ? fotoUrl(fotoSurumu(h.avatar?.updated_at)) : null
  return markaCoz({
    hekimAdi: hekimUnvanliSatirdan(h.user) || null,
    brans: specialty ? bransEtiketi(specialty) : null,
    klinikAdi: h.user?.clinic_name ? String(h.user.clinic_name) : null,
    gorunenAd: h.ayar?.gorunen_ad ? String(h.ayar.gorunen_ad) : null,
    vurgu: h.ayar?.vurgu ? String(h.ayar.vurgu) : null,
    logoUrl: markaLogoUrl(h.ayar?.logo_yol as string | null),
    fotoUrl: foto,
    fotoGoster: h.ayar ? h.ayar.foto_goster !== false : true,
    notyaKlinik: h.klinik?.name ? { ad: String(h.klinik.name), logoUrl: klinikLogoGuvenli(h.klinik.logo_url as string | null) } : null,
  })
}

export function portalFotoYolu(token: string, surum: string): string {
  return `/api/portal/hasta/${encodeURIComponent(token)}/marka/gorsel?v=${surum}`
}

export type TokenDoktoru = { doctorId: string; patientId: string }

/** The doctor (and patient) of a live portal token, or null (unknown / expired). Same lookup as the portal API. */
export async function tokenDoktoru(sb: SupabaseClient, token: string): Promise<TokenDoktoru | null> {
  if (!token || token.length > 200) return null
  const { data, error } = await sb
    .from('hasta_portal_tokens')
    .select('patient_id, doctor_id')
    .eq('token_hash', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw new Error(`portal token: ${error.message}`)
  return data?.doctor_id ? { doctorId: String(data.doctor_id), patientId: String(data.patient_id) } : null
}

/** Throws on a database error (so a failure is never cached); null only for an unknown / expired link. */
async function tokenlaOkuKati(token: string): Promise<{ marka: PortalMarka; ham: HamMarka; doctorId: string } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const sb = servisSupabase()
  const t = await tokenDoktoru(sb, token)
  if (!t) return null
  const ham = await hamMarkaOku(sb, t.doctorId)
  return { ham, doctorId: t.doctorId, marka: hamdanMarka(ham, (v) => portalFotoYolu(token, v)) }
}

async function tokenlaOku(token: string) {
  try {
    return await tokenlaOkuKati(token)
  } catch (e) {
    console.error('[portal-marka]', (e as Error).message)
    return null
  }
}

/**
 * Perf budget: the layout's generateMetadata runs again on every in-portal navigation, so the brand read is kept in
 * Next's data cache for 5 minutes per link (brand only — no patient data; a settings change shows on the next open
 * after that). Outside the Next runtime (unit tests) unstable_cache is unavailable → a direct read.
 */
async function onbellekliOku(token: string) {
  try {
    return await unstable_cache(() => tokenlaOkuKati(token), ['portal-marka-v1', token], { revalidate: 300 })()
  } catch {
    return tokenlaOku(token)
  }
}
const reactCache = (React as unknown as { cache?: <F extends (...a: never[]) => unknown>(f: F) => F }).cache
export const portalMarkaKaydi = reactCache ? reactCache(onbellekliOku) : onbellekliOku

/** The brand for a portal link; BILINMEYEN_MARKA (neutral, no Notya mark) when the link is unknown or expired. */
export async function portalMarkasiTokenla(token: string): Promise<PortalMarka> {
  return (await portalMarkaKaydi(token))?.marka ?? BILINMEYEN_MARKA
}

/** A signed-in doctor's own brand (settings preview, /portal/onizleme). `fotoUrl` is the doctor-side photo source. */
export async function hekimMarkasi(sb: SupabaseClient, doctorId: string, fotoUrl: string | null = null): Promise<PortalMarka> {
  return hamdanMarka(await hamMarkaOku(sb, doctorId), () => fotoUrl)
}

/** doctor id → short brand name for push titles. Batched: one query per table whatever the number of doctors. */
export async function pushMarkaAdlari(sb: SupabaseClient, doctorIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(doctorIds.filter(Boolean))]
  const out = new Map<string, string>()
  if (!ids.length) return out
  try {
    const [u, a, sahip, uye] = await Promise.all([
      sb.from('users').select('id, full_name, title, unvan').in('id', ids),
      sb.from('hasta_alani_gorunumu').select('doctor_id, gorunen_ad').in('doctor_id', ids),
      sb.from('clinics').select('id, owner_id, name').in('owner_id', ids).eq('is_active', true),
      sb.from('clinic_members').select('user_id, clinic_id').in('user_id', ids).eq('is_active', true),
    ])
    const uyelik = new Map(((uye.data || []) as Array<{ user_id: string; clinic_id: string }>).map((r) => [String(r.user_id), String(r.clinic_id)]))
    const klinikIdleri = [...new Set(uyelik.values())]
    const k = klinikIdleri.length ? await sb.from('clinics').select('id, name').in('id', klinikIdleri).eq('is_active', true) : { data: [] }
    const klinikAdi = new Map(((k.data || []) as Array<{ id: string; name: string }>).map((r) => [String(r.id), String(r.name || '')]))
    const sahipKlinik = new Map(((sahip.data || []) as Array<{ owner_id: string; name: string }>).map((r) => [String(r.owner_id), String(r.name || '')]))
    const gorunen = new Map(((a.data || []) as Array<{ doctor_id: string; gorunen_ad: string | null }>).map((r) => [String(r.doctor_id), String(r.gorunen_ad || '').trim()]))
    for (const r of (u.data || []) as Array<{ id: string; full_name?: unknown; title?: unknown; unvan?: unknown }>) {
      const id = String(r.id)
      const klinik = sahipKlinik.get(id) || (uyelik.has(id) ? klinikAdi.get(uyelik.get(id)!) : '') || ''
      const ad = klinik.trim() || gorunen.get(id) || hekimKisaAdi(hekimUnvanliSatirdan(r))
      if (ad) out.set(id, ad)
    }
  } catch (e) {
    console.error('[portal-marka] push adlari:', (e as Error).message)
  }
  return out
}
