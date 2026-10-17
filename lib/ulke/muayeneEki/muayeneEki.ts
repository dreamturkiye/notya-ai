/**
 * MUAYENE-EKLERI-07 — "Yüklenen dosyalar": a file attached to ONE visit of ONE patient (a lab PDF, a scanned
 * referral, a photographed document). Country-shaped from the start (migration 148) — not a port of the Turkish
 * `app/api/doktor/muayene-ekleri` tree, which is unreachable on a country build (see docs/OPEN-COMMITMENTS.md →
 * COUNTRY-BUILD-ROUTING-01).
 *
 * UPLOAD IS TWO STEPS, like a visit recording (migration 132 / lib/ulke/uygulama/muayeneKaydi.ts): the browser
 * puts the bytes straight into the private bucket `muayene-ekleri`, under its OWN `<country>/<account id>/` folder
 * (the only folder its storage policy accepts) — then calls this server with the resulting path. Nothing here ever
 * receives a file's bytes in a request body.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 *   - the visit id from the request is read WITH the doctor's id in the same statement, and its patient's id
 *     comes from that same row — never from the request;
 *   - the upload path is checked, as TEXT, to be the caller's own country-and-account folder before storage is
 *     touched at all (sesYoluGecerli, reused from the recordings feature — same two-folder rule, same bucket shape);
 *   - a row id from the request is read WITH the doctor's id in the same statement before it is returned or removed.
 *
 * HEALTH DATA. The original file name can name a test or a diagnosis ("biyopsi-sonucu.pdf") and is encrypted with
 * the same helper as the rest of a patient's data (lib/security/encryption.ts), bound to the row's id and both
 * accounts' ids so that a value is never read as belonging to a different row.
 *
 * DOWNLOAD never streams bytes through this server: once ownership is proven, a short-lived SIGNED URL is issued
 * (service role; storage RLS has no read rule at all for either browser role, so only the service role can sign).
 */
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { sesKlasoru, sesYoluGecerli as yolKendiKlasorundeMi, ulkeTablosu } from '../uygulama/tablolar'
import { aktifUlke } from '../ulke'
import { MUAYENE_EKI_DOSYA_AZAMI, MUAYENE_EKLERI_KOVASI, MUAYENE_EKI_MIME_TURLERI } from '../tipler'

const TABLO = 'ulke_muayene_ekleri'
const KOLONLAR = 'id, session_id, ad_encrypted, mime_turu, boyut, depolama_yolu, created_at'
type Satir = { id: string; session_id: string; ad_encrypted: string; mime_turu: string; boyut: number; depolama_yolu: string; created_at: string }

export type MuayeneEki = { id: string; ad: string; mimeTuru: string; boyut: number; olusturuldu: string }
export type MuayeneEkiRetKodu = 'NOT_FOUND' | 'DOSYA_TURU' | 'BUYUK' | 'AD_GEREKLI' | 'BASARISIZ'
const DURUM: Record<MuayeneEkiRetKodu, number> = { NOT_FOUND: 404, DOSYA_TURU: 400, BUYUK: 400, AD_GEREKLI: 400, BASARISIZ: 500 }
export const MUAYENE_EKI_DURUMU = DURUM
type Ret = { tamam: false; kod: MuayeneEkiRetKodu }

const SIFRE_T = 'muayene-ek-adi'
const adSifrele = (ekId: string, doktorId: string, ad: string): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), t: SIFRE_T, k: ekId, d: doktorId, m: ad }))
function adCoz(ham: unknown, ekId: string, doktorId: string): string {
  if (typeof ham !== 'string' || !ham) return ''
  try {
    const z = JSON.parse(decrypt(ham)) as { v?: number; u?: string; t?: string; k?: string; d?: string; m?: unknown } | null
    return z && z.v === 1 && z.u === aktifUlke() && z.t === SIFRE_T && z.k === ekId && z.d === doktorId && typeof z.m === 'string' ? z.m : ''
  } catch { return '' }
}

/** The visit's id AND patient, proven to be this doctor's own in one query. null = not this doctor's visit. */
async function muayeneSahipligi(supabase: SupabaseClient, doktorId: string, seansId: string): Promise<{ patientId: string } | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_muayeneler').select('id, patient_id').eq('id', seansId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const s = data as unknown as { patient_id: string | null }
  return s.patient_id ? { patientId: s.patient_id } : null
}

/** Registers a file the browser already put into THIS doctor's own storage folder, against one of THEIR visits. */
export async function muayeneEkiKaydet(
  supabase: SupabaseClient, doktorId: string,
  g: { seansId: string; yol: unknown; ad: unknown; mimeTuru: unknown; boyut: unknown },
): Promise<{ tamam: true; id: string } | Ret> {
  const muayene = await muayeneSahipligi(supabase, doktorId, g.seansId)
  if (!muayene) return { tamam: false, kod: 'NOT_FOUND' }
  // The path must be text in the caller's own country-and-account folder before storage is touched for it at all.
  if (!yolKendiKlasorundeMi(doktorId, g.yol)) return { tamam: false, kod: 'NOT_FOUND' }
  const ad = typeof g.ad === 'string' ? g.ad.trim().slice(0, 200) : ''
  if (!ad) return { tamam: false, kod: 'AD_GEREKLI' }
  const mimeTuru = typeof g.mimeTuru === 'string' ? g.mimeTuru.slice(0, 100) : ''
  if (!MUAYENE_EKI_MIME_TURLERI.includes(mimeTuru as typeof MUAYENE_EKI_MIME_TURLERI[number])) return { tamam: false, kod: 'DOSYA_TURU' }
  const boyut = typeof g.boyut === 'number' && Number.isInteger(g.boyut) ? g.boyut : 0
  if (boyut <= 0 || boyut > MUAYENE_EKI_DOSYA_AZAMI) return { tamam: false, kod: 'BUYUK' }

  const sililecek = async () => { try { await supabase.storage.from(MUAYENE_EKLERI_KOVASI).remove([g.yol as string]) } catch { /* nothing more to do */ } }
  // The object must really be there, and really be the size the row is about to claim: trust the bucket, not the caller's number.
  const { data: nesne, error: nesneHatasi } = await supabase.storage.from(MUAYENE_EKLERI_KOVASI).info(g.yol as string)
  if (nesneHatasi || !nesne || typeof nesne.size !== 'number' || nesne.size !== boyut) { await sililecek(); return { tamam: false, kod: 'BUYUK' } }

  const id = randomUUID()
  const an = new Date().toISOString()
  const { error } = await ulkeTablosu(supabase, TABLO).insert({
    id, doctor_id: doktorId, patient_id: muayene.patientId, session_id: g.seansId,
    ad_encrypted: adSifrele(id, doktorId, ad), mime_turu: mimeTuru, boyut, depolama_yolu: g.yol as string, created_at: an,
  })
  if (error) { await sililecek(); return { tamam: false, kod: 'BASARISIZ' } }
  return { tamam: true, id }
}

/** The attachments of one of THIS doctor's visits, oldest first. null = not this doctor's visit. */
export async function muayeneEkleriListesi(supabase: SupabaseClient, doktorId: string, seansId: string): Promise<MuayeneEki[] | null> {
  const muayene = await muayeneSahipligi(supabase, doktorId, seansId)
  if (!muayene) return null
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('session_id', seansId).eq('doctor_id', doktorId).order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as unknown as Satir[]).map((s) => ({ id: s.id, ad: adCoz(s.ad_encrypted, s.id, doktorId) || '—', mimeTuru: s.mime_turu, boyut: s.boyut, olusturuldu: s.created_at }))
}

/** A short-lived signed URL for one of THIS doctor's own attachments. null = not this doctor's row, or the URL could not be made. */
export async function muayeneEkiIndirmeBaglantisi(supabase: SupabaseClient, doktorId: string, ekId: string): Promise<string | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('depolama_yolu').eq('id', ekId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const yol = (data as unknown as { depolama_yolu: string }).depolama_yolu
  const { data: imzali, error: imzaHatasi } = await supabase.storage.from(MUAYENE_EKLERI_KOVASI).createSignedUrl(yol, 300)
  return imzaHatasi || !imzali?.signedUrl ? null : imzali.signedUrl
}

/** Removes one of THIS doctor's own attachments — the row and, best-effort, the object. */
export async function muayeneEkiSil(supabase: SupabaseClient, doktorId: string, ekId: string): Promise<{ tamam: true } | Ret> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('depolama_yolu').eq('id', ekId).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  if (!data) return { tamam: false, kod: 'NOT_FOUND' }
  const yol = (data as unknown as { depolama_yolu: string }).depolama_yolu
  const { error: silmeHatasi } = await ulkeTablosu(supabase, TABLO).delete().eq('id', ekId).eq('doctor_id', doktorId)
  if (silmeHatasi) return { tamam: false, kod: 'BASARISIZ' }
  try { await supabase.storage.from(MUAYENE_EKLERI_KOVASI).remove([yol]) } catch { /* the row is gone; the object is now unreachable through this account regardless */ }
  return { tamam: true }
}

/** The folder a file MUST be uploaded into: this account's own, under this build's country. Client-safe. */
export const muayeneEkiKlasoru = sesKlasoru
