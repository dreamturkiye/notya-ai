/**
 * AYSE-OGRENME-V3f — CLINIC SHARED STYLE in a country build: the doctor's explicit consent (default OFF), and the
 * removal of the doctor's rules from the clinic pool on leaving. The country's version of Türkiye's
 * lib/doktor/ogrenme/klinikUslup.ts, resolved through the country tables:
 *
 *   clinic membership   ulke_klinik_uyeleri (the account's own row; an account is a member of at most one clinic)
 *   role (the split)    hekim_rolu.rol — the pool is split by role, so a rule of one role never reaches another
 *   consent             ulke_klinik_uslup_katilim (no row = off)
 *   pool                ulke_klinik_ortak_uslup (the source doctor is stored only so that leaving can delete the rows)
 *
 * WHAT IS NOT HERE YET, ON PURPOSE: nothing writes rules into the pool. A country has no store of learned rules and no
 * application of them in its note prompt yet (docs/OPEN-COMMITMENTS.md, AYSE-OGRENME-V3f). Until it has, consent
 * would be consent to share nothing, and a consent given now would start sharing the day a producer exists — a consent
 * given before the thing it covers exists is not a consent. So `KLINIK_HAVUZU_HAZIR` is false and turning the switch ON
 * is refused ('HAZIR_DEGIL'); turning it OFF (and leaving) always works and always cleans up.
 *
 * PATIENT ISOLATION: no patient and no note is read here. Every statement carries the authenticated account's id.
 * A front-desk member shares nothing (they write no notes).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { klinikAyarlari, uyelikOku } from '../klinikHesabi/klinik'
import { hekimRolunuOku } from '../uygulama/rol'
import { ulkeTablosu } from '../uygulama/tablolar'

/** false until a country has learned rules to share (see the top of this file). Tests pass their own value. */
export const KLINIK_HAVUZU_HAZIR = false

export type KlinikUslupDurumu = {
  /** A member of a clinic who writes notes (not the front desk), in a country with clinic accounts. */
  uye: boolean
  /** The doctor's consent is on, for the clinic they are a member of now. */
  aktif: boolean
  /** Rules this doctor receives from the pool: always 0 until the pool has a producer. */
  gelen: number
  /** false = consent cannot be given yet; the screen shows nothing to switch. */
  hazir: boolean
}

type Uye = { klinikId: string }

/** The clinic this account may share style with, or null: no clinic accounts here, not a member, or the front desk. */
async function paylasabilenUyelik(supabase: SupabaseClient, doktorId: string): Promise<Uye | null> {
  if (!klinikAyarlari()) return null
  const u = await uyelikOku(supabase, doktorId)
  if (!u || u.konum === 'on-buro') return null
  return { klinikId: u.klinikId }
}

export async function klinikUslupDurumu(supabase: SupabaseClient, doktorId: string, hazir: boolean = KLINIK_HAVUZU_HAZIR): Promise<KlinikUslupDurumu> {
  const uye = await paylasabilenUyelik(supabase, doktorId)
  if (!uye) return { uye: false, aktif: false, gelen: 0, hazir }
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_uslup_katilim').select('aktif, klinik_id').eq('doctor_id', doktorId).maybeSingle()
  const k = data as { aktif?: unknown; klinik_id?: unknown } | null
  // A consent counts only for the clinic the account is a member of NOW (the key also removes it on leaving).
  const aktif = !error && Boolean(k?.aktif) && k?.klinik_id === uye.klinikId
  return { uye: true, aktif, gelen: 0, hazir }
}

/** Removes the account's rules from every pool and switches its consent off. Safe to run twice; a missing table is "nothing to remove". */
export async function klinikUslupKapat(supabase: SupabaseClient, doktorId: string): Promise<void> {
  const simdi = new Date().toISOString()
  await ulkeTablosu(supabase, 'ulke_klinik_ortak_uslup').delete().eq('doctor_id', doktorId)
  await ulkeTablosu(supabase, 'ulke_klinik_uslup_katilim').update({ aktif: false, ayrildi_at: simdi, updated_at: simdi }).eq('doctor_id', doktorId)
}

export type KlinikUslupAcSonucu = { tamam: true } | { tamam: false; kod: 'UYE_DEGIL' | 'HAZIR_DEGIL' | 'ROL_YOK' | 'BASARISIZ' }

/** Consent: needs a clinic membership, a chosen role (the pool is split by it) and a country that has something to share. */
export async function klinikUslupAc(supabase: SupabaseClient, doktorId: string, hazir: boolean = KLINIK_HAVUZU_HAZIR): Promise<KlinikUslupAcSonucu> {
  const uye = await paylasabilenUyelik(supabase, doktorId)
  if (!uye) return { tamam: false, kod: 'UYE_DEGIL' }
  if (!hazir) return { tamam: false, kod: 'HAZIR_DEGIL' }
  if (!(await hekimRolunuOku(supabase, doktorId))) return { tamam: false, kod: 'ROL_YOK' }
  const simdi = new Date().toISOString()
  const { error } = await ulkeTablosu(supabase, 'ulke_klinik_uslup_katilim').upsert(
    { doctor_id: doktorId, klinik_id: uye.klinikId, aktif: true, onay_at: simdi, ayrildi_at: null, updated_at: simdi },
    { onConflict: 'ulke,doctor_id' },
  )
  return error ? { tamam: false, kod: 'BASARISIZ' } : { tamam: true }
}
