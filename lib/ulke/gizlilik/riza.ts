/**
 * AU-BETA-01 — THE CONSENT LEDGER. Server only. One row = one acceptance of one notice version by one patient of one
 * doctor, with the time and the place it was given (the portal card, the intake form, or recorded by the doctor).
 * The row stores a SHA-256 of the exact words accepted (notice + consent sentence), so a later edit of the words can
 * never be read back as what was agreed. Append-only in the database (migration 149); withdrawal sets one column.
 *
 * Not a finding that any law is met: Initial compliance draft – external legal review later.
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkePaketi } from '../ulke'
import { ulkeTablosu } from '../uygulama/tablolar'
import type { RizaKaynagi } from './hesap'

export type RizaKaydi = { id: string; surum: string; kaynak: string; verildiAt: string; geriCekildiAt: string | null }

/** The hash of the words of the active pack's notice and consent sentence. null = the pack has no privacy extension. */
export function aktifRizaOzeti(): { surum: string; ozet: string } | null {
  const g = ulkePaketi().uzanti?.gizlilik
  if (!g) return null
  const metin = JSON.stringify([g.surum, g.bildirim, g.riza.metin, g.riza.kutu])
  return { surum: g.surum, ozet: createHash('sha256').update(metin).digest('hex') }
}

type Satir = { id: string; surum: string; kaynak: string; verildi_at: string; geri_cekildi_at: string | null }
const donustur = (s: Satir): RizaKaydi => ({ id: s.id, surum: s.surum, kaynak: s.kaynak, verildiAt: s.verildi_at, geriCekildiAt: s.geri_cekildi_at })

/** The patient's latest record of the ACTIVE version that has not been withdrawn, or null. */
export async function gecerliRiza(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<RizaKaydi | null> {
  const a = aktifRizaOzeti()
  if (!a) return null
  const { data } = await ulkeTablosu(supabase, 'ulke_riza_kayitlari').select('id, surum, kaynak, verildi_at, geri_cekildi_at')
    .eq('doctor_id', doktorId).eq('patient_id', hastaId).eq('surum', a.surum).is('geri_cekildi_at', null).order('verildi_at', { ascending: false }).limit(1)
  const s = (data as Satir[] | null)?.[0]
  return s ? donustur(s) : null
}

/** Adds a record. Idempotent per version: an active, unwithdrawn record of this version is returned instead of a second row. */
export async function rizaEkle(supabase: SupabaseClient, doktorId: string, hastaId: string, kaynak: RizaKaynagi): Promise<RizaKaydi | null> {
  const a = aktifRizaOzeti()
  if (!a) return null
  const var_ = await gecerliRiza(supabase, doktorId, hastaId)
  if (var_) return var_
  const { data, error } = await ulkeTablosu(supabase, 'ulke_riza_kayitlari')
    .insert({ doctor_id: doktorId, patient_id: hastaId, surum: a.surum, metin_ozeti: a.ozet, kaynak })
    .select('id, surum, kaynak, verildi_at, geri_cekildi_at').single()
  if (error || !data) return null
  return donustur(data as unknown as Satir)
}

export async function rizaGeriCek(supabase: SupabaseClient, doktorId: string, hastaId: string, simdi = Date.now()): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, 'ulke_riza_kayitlari').update({ geri_cekildi_at: new Date(simdi).toISOString() })
    .eq('doctor_id', doktorId).eq('patient_id', hastaId).is('geri_cekildi_at', null)
  return !error
}

/** The doctor's list: the latest record of every patient (newest first). */
export async function hekimRizaListesi(supabase: SupabaseClient, doktorId: string, azami = 100): Promise<(RizaKaydi & { hastaId: string })[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_riza_kayitlari').select('id, patient_id, surum, kaynak, verildi_at, geri_cekildi_at')
    .eq('doctor_id', doktorId).order('verildi_at', { ascending: false }).limit(azami)
  return ((data as (Satir & { patient_id: string })[] | null) ?? []).map((s) => ({ ...donustur(s), hastaId: s.patient_id }))
}
