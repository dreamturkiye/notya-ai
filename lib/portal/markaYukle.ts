/**
 * HASTA-ALANI-MARKA — store a validated logo in the brand bucket (server only, service role).
 * Path = <owner folder>/logo-<sha256[0:16]>.<ext>: content-hashed, so the public URL is immutable and cached for a year;
 * a new logo is a new file and the old one is removed. The owner folder is ALWAYS derived from the caller's own doctor id
 * (or his clinic's id) on the server — never from the request.
 */
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MARKA_UZANTI, markaGorseliHazirla } from './markaGorsel'
import { MARKA_KOVASI } from './markaSunucu'

export async function markaLogosuYukle(sb: SupabaseClient, klasor: string, ham: Buffer): Promise<{ yol: string; mime: string }> {
  const { bayt, mime } = markaGorseliHazirla(ham)
  const ozet = createHash('sha256').update(bayt).digest('hex').slice(0, 16)
  const yol = `${klasor}/logo-${ozet}.${MARKA_UZANTI[mime]}`
  const { error } = await sb.storage.from(MARKA_KOVASI).upload(yol, bayt, { contentType: mime, cacheControl: '31536000', upsert: true })
  if (error) throw new Error(`upload: ${error.message}`)
  return { yol, mime }
}

/** Remove a previous logo — only when it sits in the same owner folder (defence in depth). */
export async function eskiLogoyuSil(sb: SupabaseClient, klasor: string, eskiYol: string | null | undefined, yeniYol?: string | null) {
  const y = String(eskiYol || '')
  if (!y || y === yeniYol || !y.startsWith(`${klasor}/logo-`)) return
  await sb.storage.from(MARKA_KOVASI).remove([y]).catch(() => undefined)
}
