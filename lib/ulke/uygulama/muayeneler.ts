/**
 * NOTYA-UZ-MUAYENE-01 — visits of the signed-in application: what the home lists.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md): service-role client, so every query carries the
 * authenticated doctor's id. Visits are read by doctor; the notes of those visits are read by doctor AND visit; the
 * patient names are read by doctor AND patient id (lib/ulke/uygulama/hastalar.ts) — a visit row that points at a
 * patient who is not this doctor's gets no name, it does not borrow one.
 *
 * Storage is the country tables `ulke_muayeneler` and `ulke_notlar` (migrations 132, 133), bound to this build's
 * country in every statement (lib/ulke/uygulama/tablolar.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaAdlari } from './hastalar'
import { ulkeGunBasi } from './gun'
import { ulkeTablosu } from './tablolar'

export type MuayeneOzeti = {
  seansId: string
  /** null = the visit has no note yet (recording failed before a note was written). */
  notId: string | null
  hastaId: string | null
  hastaAdi: string
  /** ISO instant the visit started. */
  baslangic: string
  durum: 'taslak' | 'onayli' | 'notsuz'
}

type SeansSatiri = { id: string; patient_id: string | null; started_at: string | null; created_at: string | null }
type NotSatiri = { id: string; session_id: string; approved_at: string | null }

async function ozetle(supabase: SupabaseClient, doktorId: string, seanslar: SeansSatiri[]): Promise<MuayeneOzeti[]> {
  if (!seanslar.length) return []
  const { data: notlar } = await ulkeTablosu(supabase, 'ulke_notlar')
    .select('id, session_id, approved_at')
    .eq('doctor_id', doktorId)
    .in('session_id', seanslar.map((s) => s.id))
  const notHaritasi = new Map(((notlar as NotSatiri[] | null) ?? []).map((n) => [n.session_id, n]))
  const adlar = await hastaAdlari(supabase, doktorId, seanslar.map((s) => s.patient_id ?? ''))
  return seanslar.map((s) => {
    const n = notHaritasi.get(s.id)
    // A patient id this doctor does not own has no entry in `adlar`: the visit is listed without a patient.
    const hastaId = s.patient_id && adlar.has(s.patient_id) ? s.patient_id : null
    return {
      seansId: s.id,
      notId: n?.id ?? null,
      hastaId,
      hastaAdi: hastaId ? adlar.get(hastaId) ?? '' : '',
      baslangic: String(s.started_at ?? s.created_at ?? ''),
      durum: !n ? 'notsuz' : n.approved_at ? 'onayli' : 'taslak',
    }
  })
}

/** This doctor's visits since the country's day began, newest first. null = could not be read. */
export async function bugunkuMuayeneler(supabase: SupabaseClient, doktorId: string): Promise<MuayeneOzeti[] | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_muayeneler')
    .select('id, patient_id, started_at, created_at')
    .eq('doctor_id', doktorId)
    .gte('started_at', ulkeGunBasi().toISOString())
    .order('started_at', { ascending: false })
    .limit(100)
  if (error || !data) return null
  return ozetle(supabase, doktorId, data as SeansSatiri[])
}

/** Visits of ONE patient of this doctor, newest first. The caller has already proven the patient is the doctor's. */
export async function hastaninMuayeneleri(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<MuayeneOzeti[] | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_muayeneler')
    .select('id, patient_id, started_at, created_at')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .order('started_at', { ascending: false })
    .limit(200)
  if (error || !data) return null
  return ozetle(supabase, doktorId, data as SeansSatiri[])
}
