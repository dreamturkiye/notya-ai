/**
 * PEDI-ARACLAR-01 — Araçlar › Pediatri sunucu ortakları (route.ts yalnız handler export edebilir).
 * Oturum: doktorOturum (sekreter hesabı klinik araçlara ulaşmaz). Branş kapısı sunucuda da: users.specialty → pediatri
 * (istemci kabuğu PediAracKabugu yönlendirir; burası derinlemesine savunma). Her hasta kimliği hastaSahibiMi'den geçer.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { doktorAracBransi } from '@/lib/doktor/doktorAraclari'
import { decrypt } from '@/lib/security/encryption'

export function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

export const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function pediOturum(req: NextRequest): Promise<{ sb: SupabaseClient; doktorId: string } | { hata: NextResponse }> {
  const o = await doktorOturum(req)
  if ('hata' in o) return o
  const { data: u } = await o.supabase.from('users').select('specialty').eq('id', o.user.id).maybeSingle()
  if (doktorAracBransi(u?.specialty as string | null) !== 'pediatri') {
    return { hata: NextResponse.json({ error: 'Bu araç yalnızca pediatri için.' }, { status: 403 }) }
  }
  return { sb: o.supabase, doktorId: o.user.id }
}

export interface PediHasta { id: string; dogumIso: string | null; cinsiyet: 'male' | 'female' | null }

/** Sahiplik + kimlik: hasta bu hekimin değilse null (çağıran 404 döner — yabancı kimlik = yok). */
export async function pediHasta(sb: SupabaseClient, doktorId: string, patientId: string | null | undefined): Promise<PediHasta | null> {
  if (!patientId) return null
  const { data, error } = await sb.from('patients').select('id, dob_encrypted, gender_encrypted').eq('id', String(patientId)).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const dob = guvenliCoz(data.dob_encrypted as string).slice(0, 10)
  const g = guvenliCoz(data.gender_encrypted as string)
  return { id: String(data.id), dogumIso: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null, cinsiyet: g === 'male' || g === 'female' ? g : null }
}

export const bulunamadi = () => NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
