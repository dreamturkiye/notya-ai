/**
 * Hekimin görünen adı — veli özeti/uyarılarda "Doktorunuz" yerine (Kaan 2026-09-10: "çok şık olur").
 * Unvan varsa onunla ("Dr. Gökhan Mamur"); ad yoksa boş döner ve model "doktorunuz" der.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function hekimAdi(sb: SupabaseClient, doctorId: string): Promise<string> {
  try {
    const { data } = await sb.from('users').select('first_name, last_name, title, full_name').eq('id', doctorId).maybeSingle()
    if (!data) return ''
    const UNVAN = /^(?:prof|doç|doc|uzm|op|dr|dt)\.?$/i
    const ad = [data.first_name, data.last_name].map((x) => String(x || '').trim()).filter(Boolean).join(' ')
      || String(data.full_name || '').trim().split(/\s+/).filter((p) => !UNVAN.test(p)).join(' ')
    if (!ad) return ''
    const unvan = String(data.title || 'Dr.').trim()
    return `${unvan} ${ad}`.replace(/\s+/g, ' ')
  } catch { return '' }
}
