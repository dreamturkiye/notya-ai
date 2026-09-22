/**
 * BRANS-ALAN-SIZMASI — sunucu yardımcısı: bir notun branş kapsamı için gereken iki veriyi (hekimin
 * users.specialty değeri + hastanın doğum tarihi) tek yerden okur, kararı kapsam.ts'ye bırakır.
 * Hasta sorgusu doctor_id ile sınırlı (hasta izolasyonu kuralı); okunamazsa doğum tarihi bilinmiyor sayılır —
 * bilinmeyen yaş hiçbir zaman pediatrik bağlam açmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { bransKapsami, type BransKapsami } from './kapsam'
import type { Cinsiyet } from '@/lib/clinical/buyumeEgrisi'

export async function hastaDogumIso(sb: SupabaseClient, doctorId: string, patientId: string | null | undefined): Promise<string | null> {
  if (!patientId) return null
  try {
    const { data } = await sb.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
    const dob = data?.dob_encrypted ? decrypt(String(data.dob_encrypted)) : ''
    return dob || null
  } catch { return null }
}

/** Neyzi için cinsiyet — aynı hasta + doctor_id kapısı. */
export async function hastaCinsiyet(sb: SupabaseClient, doctorId: string, patientId: string | null | undefined): Promise<Cinsiyet | null> {
  if (!patientId) return null
  try {
    const { data } = await sb.from('patients').select('gender_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
    const g = data?.gender_encrypted ? decrypt(String(data.gender_encrypted)) : ''
    return g === 'male' || g === 'female' ? g : null
  } catch { return null }
}

export interface NotKapsamiGirdisi {
  doctorId: string
  seansBransi?: string | null
  patientId?: string | null
  /** zaten okunduysa tekrar sorgulanmaz */
  doktorBransi?: string | null
  hastaDogumIso?: string | null
}

export async function notKapsamiGetir(sb: SupabaseClient, g: NotKapsamiGirdisi): Promise<BransKapsami & { doktorBransi: string | null; hastaDogumIso: string | null }> {
  const [doktorBransi, dogum] = await Promise.all([
    g.doktorBransi !== undefined ? Promise.resolve(g.doktorBransi) : hekimBransi(sb, g.doctorId),
    g.hastaDogumIso !== undefined ? Promise.resolve(g.hastaDogumIso) : hastaDogumIso(sb, g.doctorId, g.patientId),
  ])
  return { ...bransKapsami({ seansBransi: g.seansBransi, doktorBransi, hastaDogumIso: dogum }), doktorBransi, hastaDogumIso: dogum }
}
