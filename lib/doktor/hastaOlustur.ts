/**
 * The ONE patient-create write (patients row + the name search index). Used by POST /api/doktor/hastalar (doctor and front
 * desk) and, since WHATSAPP-ONBURO-01, by the desk's approval of a WhatsApp request from an unknown number — so a patient
 * created from a chat request is the same record a manually added patient is, never a second kind of row.
 *
 * HASTA-IZOLASYON-01: `doktorId` is the session's practice doctor (pratikOturum().doktorId), never a request value.
 * The caller validates the fields; this function only encrypts and writes.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { encrypt } from '@/lib/security/encryption'
import { hastaAramaIndeksiniGuncelle } from '@/lib/doktor/hastaAramaIndeksi'

export interface YeniHasta {
  adSoyad: string
  tcKimlikNo?: string | null
  dogumTarihi?: string | null
  cinsiyet?: string | null
  telefon?: string | null
  eposta?: string | null
  /** Already filtered by the caller's role (a role without clinical write access passes demographics only). */
  notlar?: Record<string, unknown>
}

export async function hastaKaydiOlustur(
  supabase: SupabaseClient, doktorId: string, h: YeniHasta,
): Promise<{ ok: true; patient: Record<string, unknown> & { id: string } } | { ok: false; hata: string }> {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      doctor_id: doktorId,
      tc_kimlik_hash: h.tcKimlikNo ? createHash('sha256').update(String(h.tcKimlikNo)).digest('hex') : null,
      name_encrypted: encrypt(JSON.stringify({ ad: h.adSoyad })),
      dob_encrypted: h.dogumTarihi ? encrypt(h.dogumTarihi) : null,
      gender_encrypted: h.cinsiyet ? encrypt(h.cinsiyet) : null,
      phone_encrypted: h.telefon ? encrypt(h.telefon) : null,
      email_encrypted: h.eposta ? encrypt(String(h.eposta).trim()) : null,
      notes_encrypted: encrypt(JSON.stringify(h.notlar ?? {})),
      is_active: true,
    })
    .select()
    .single()
  if (error || !data) return { ok: false, hata: error?.message || 'bilinmeyen' }
  await hastaAramaIndeksiniGuncelle(supabase, doktorId, String(data.id), h.adSoyad)
  return { ok: true, patient: data as Record<string, unknown> & { id: string } }
}
