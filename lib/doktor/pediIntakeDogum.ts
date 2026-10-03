/**
 * NOTYA-CEK-HASTA-01 — bebek kartında yoksa hasta bilgi formundan (intake)
 * prematüre / doğum kilosu okunur. Çek listesi ve tarama paneli aynı kaynağı kullanır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { gebelikHaftasiCoz, gramCoz } from '@/specialties/pediatri/engines/girdi'

export type PediIntakeDogum = { gebelikHaftasi: number | null; dogumKiloGr: number | null }

/** Intake seçenekleri → hafta (preterm eşiği vizitPlani ile aynı: < 37). */
export function gebelikHaftasiPedCoz(ham: string | null | undefined): number | null {
  const s = String(ham || '').trim()
  if (!s) return null
  const k = s.toLocaleLowerCase('tr-TR')
  // Seçenek metinleri sayı çözücüden ÖNCE — "37 haftadan önce" sayiCoz ile 37 olmasın.
  if (/haftadan\s*önce|haftadan\s*once|prematur|erken\s*doğum|erken\s*dogum/.test(k)) return 34
  if (/37\s*[-–]\s*38/.test(k) || /37-38\s*hafta/.test(k)) return 37.5
  if (/39\s*hafta|term|miad/.test(k)) return 39
  if (/hatirlamiyorum|bilmiyorum/.test(k)) return null
  return gebelikHaftasiCoz(s)
}

export function pediIntakeDogumAlanlari(yanitlar: Record<string, unknown> | null | undefined): PediIntakeDogum {
  const y = yanitlar || {}
  const gh = gebelikHaftasiPedCoz(String(y.gebelikHaftasiPed ?? y.gebelikHaftasi ?? ''))
  const kilo = gramCoz(String(y.dogumKilosuPed ?? y.dogumKilosu ?? y.dogumAgirligi ?? ''))
  return { gebelikHaftasi: gh, dogumKiloGr: kilo }
}

export async function pediIntakeDogumYukle(
  sb: SupabaseClient,
  doktorId: string,
  patientId: string,
): Promise<PediIntakeDogum> {
  const { data } = await sb
    .from('hasta_intake_formlari')
    .select('form_data_encrypted')
    .eq('patient_id', patientId)
    .eq('doktor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(1)
  const form = (data?.[0] as { form_data_encrypted?: string } | undefined)?.form_data_encrypted
  if (!form) return { gebelikHaftasi: null, dogumKiloGr: null }
  try {
    return pediIntakeDogumAlanlari(JSON.parse(decrypt(form)) as Record<string, unknown>)
  } catch {
    return { gebelikHaftasi: null, dogumKiloGr: null }
  }
}

/** Kart öncelikli; boşsa intake ile doldur. */
export function pediDogumBirlesik(
  kart: PediIntakeDogum,
  intake: PediIntakeDogum,
): PediIntakeDogum {
  return {
    gebelikHaftasi: kart.gebelikHaftasi ?? intake.gebelikHaftasi,
    dogumKiloGr: kart.dogumKiloGr ?? intake.dogumKiloGr,
  }
}
