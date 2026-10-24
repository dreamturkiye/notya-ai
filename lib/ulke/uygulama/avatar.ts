/**
 * The doctor's own profile photo in a country build (Türkiye gold: Hesabım › profile photo). Own row only
 * (doctor_id = the authenticated account). The picture is encrypted before it is stored and comes back only to its
 * own account, as a data URL. No patient data. Codes only: the sentences are the pack's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkeTablosu } from './tablolar'

export const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const
export const AVATAR_AZAMI_BAYT = 4 * 1024 * 1024
const TABLO = 'ulke_hekim_avatarlari' as const

export type AvatarSonucu = { tamam: true } | { tamam: false; kod: 'TUR' | 'BOYUT' | 'BASARISIZ' }

export const avatarMimeMi = (m: unknown): m is (typeof AVATAR_MIME)[number] => typeof m === 'string' && (AVATAR_MIME as readonly string[]).includes(m)

/** The first bytes must say what the declared type says: a renamed file is not a picture. */
export function avatarImzasiUyar(mime: string, b: Buffer): boolean {
  if (mime === 'image/jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (mime === 'image/png') return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/webp') return b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'
  return false
}

export async function avatarOku(supabase: SupabaseClient, doktorId: string): Promise<string | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('mime_type, image_encrypted').eq('doctor_id', doktorId).maybeSingle()
  const s = data as { mime_type?: unknown; image_encrypted?: unknown } | null
  if (error || !s || !avatarMimeMi(s.mime_type) || typeof s.image_encrypted !== 'string') return null
  try { return `data:${s.mime_type};base64,${decrypt(s.image_encrypted)}` } catch { return null }
}

export async function avatarYaz(supabase: SupabaseClient, doktorId: string, mime: unknown, bayt: Buffer): Promise<AvatarSonucu> {
  if (!avatarMimeMi(mime) || !avatarImzasiUyar(mime, bayt)) return { tamam: false, kod: 'TUR' }
  if (bayt.length === 0 || bayt.length > AVATAR_AZAMI_BAYT) return { tamam: false, kod: 'BOYUT' }
  const { error } = await ulkeTablosu(supabase, TABLO).upsert(
    { doctor_id: doktorId, mime_type: mime, byte_length: bayt.length, image_encrypted: encrypt(bayt.toString('base64')), updated_at: new Date().toISOString() },
    { onConflict: 'doctor_id' },
  )
  return error ? { tamam: false, kod: 'BASARISIZ' } : { tamam: true }
}

export async function avatarSil(supabase: SupabaseClient, doktorId: string): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, TABLO).delete().eq('doctor_id', doktorId)
  return !error
}
