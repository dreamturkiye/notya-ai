/**
 * NOTYA-ULKE-MESAJ-01 — "MY TEMPLATES": a doctor's own reusable text blocks (migration 141). Server only.
 *
 * WHAT A TEMPLATE IS. A title and a text the doctor wrote, and where it is offered: in a section of a note, in a
 * message, or in both. Create, edit, delete. Inserting one is done by the screen: the text is put at the end of what
 * the doctor is writing, and from then on it is part of that note or message — the template itself is not linked
 * to anything.
 *
 * NO PATIENT. The row has no column for a patient, no function here takes a patient id, and nothing here reads a
 * patient's table. What the doctor types is the doctor's own; the screen says that no patient's data belongs in it.
 * NO MODEL. Nothing here calls one: a template is never written, proposed or completed by a machine.
 *
 * DELETING IS SOFT: the row stays, marked; a deleted template is listed nowhere and cannot be edited or brought back
 * (the database holds that too).
 *
 * THE TITLE AND THE TEXT are one value, encrypted with the same helper as a patient's data (a doctor may type
 * anything into their own text). The country, the doctor and the template's own id are INSIDE the encrypted value as
 * well as in the row's key: a value that is not this row's own is read as "cannot be shown".
 *
 * ISOLATION. Service-role client, so this file is the isolation: every statement carries the authenticated doctor's
 * id; a template id from a request is matched against that doctor in the same statement, and another doctor's is
 * exactly "not found". Every statement is bound to this build's country (lib/ulke/uygulama/tablolar.ts).
 */
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { aktifUlke, ozellikAcik } from '../ulke'
import { ulkeTablosu } from '../uygulama/tablolar'
import { kapsamMi, SABLON_AD_AZAMI, SABLON_ADET_AZAMI, SABLON_METIN_AZAMI, sablonAdiAl, sablonMetniAl, type Sablon, type SablonKapsami, type SablonYeri } from './sabitler'

const TABLO = 'ulke_hekim_sablonlari'
const KOLONLAR = 'id, kapsam, icerik_encrypted, updated_at'
type Satir = { id: string; kapsam: string; icerik_encrypted: string | null; updated_at: string }

/** true = "my templates" exist in this country. */
export const sablonAcik = (): boolean => ozellikAcik('cekirdekMuayene') && ozellikAcik('hekimSablonlari')

export type SablonRetKodu = 'NOT_FOUND' | 'AD_GEREKLI' | 'METIN_GEREKLI' | 'UZUN' | 'KAPSAM' | 'COK_FAZLA' | 'BASARISIZ'
export const SABLON_DURUMU: Record<SablonRetKodu, number> = { NOT_FOUND: 404, AD_GEREKLI: 400, METIN_GEREKLI: 400, UZUN: 400, KAPSAM: 400, COK_FAZLA: 409, BASARISIZ: 500 }
type Ret = { tamam: false; kod: SablonRetKodu }

// ───────────────────────── the encrypted value ─────────────────────────

type Zarf = { v: 1; u: string; d: string; i: string; ad: string; m: string }
const sifrele = (z: Omit<Zarf, 'v' | 'u'>): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), ...z } satisfies Zarf))
/** What a row's value holds — or null when it is not THIS country's, doctor's and template's own value. */
function coz(ham: unknown, doktorId: string, id: string): { ad: string; metin: string } | null {
  if (typeof ham !== 'string' || !ham) return null
  try {
    const z = JSON.parse(decrypt(ham)) as Partial<Zarf> | null
    if (!z || z.v !== 1 || z.u !== aktifUlke() || z.d !== doktorId || z.i !== id || typeof z.ad !== 'string' || typeof z.m !== 'string') return null
    return { ad: z.ad, metin: z.m }
  } catch { return null }
}
const goster = (s: Satir, doktorId: string): Sablon | null => {
  const z = coz(s.icerik_encrypted, doktorId, s.id)
  return z && kapsamMi(s.kapsam) ? { id: s.id, ad: z.ad, metin: z.metin, kapsam: s.kapsam, guncellendi: s.updated_at } : null
}

type Girdi = { ad?: unknown; metin?: unknown; kapsam?: unknown }
function denetle(g: Girdi): { tamam: true; ad: string; metin: string; kapsam: SablonKapsami } | Ret {
  const ad = sablonAdiAl(g.ad), metin = sablonMetniAl(g.metin)
  if (!ad) return { tamam: false, kod: 'AD_GEREKLI' }
  if (!metin) return { tamam: false, kod: 'METIN_GEREKLI' }
  if (ad.length > SABLON_AD_AZAMI || metin.length > SABLON_METIN_AZAMI) return { tamam: false, kod: 'UZUN' }
  if (!kapsamMi(g.kapsam)) return { tamam: false, kod: 'KAPSAM' }
  return { tamam: true, ad, metin, kapsam: g.kapsam }
}

// ───────────────────────── reading ─────────────────────────

/**
 * THIS doctor's templates in use, last saved first. `yer` narrows to what a picker in a note or in a message offers
 * (the templates for that place, and the ones for both). A template whose value cannot be read is left out.
 */
export async function sablonlariListele(supabase: SupabaseClient, doktorId: string, yer?: SablonYeri): Promise<Sablon[]> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).is('silindi_at', null).order('updated_at', { ascending: false }).limit(SABLON_ADET_AZAMI)
  if (error || !data) return []
  return (data as unknown as Satir[]).flatMap((s) => { const x = goster(s, doktorId); return x && (!yer || x.kapsam === yer || x.kapsam === 'hepsi') ? [x] : [] })
}

// ───────────────────────── writing ─────────────────────────

export async function sablonOlustur(supabase: SupabaseClient, doktorId: string, g: Girdi, simdi = Date.now()): Promise<{ tamam: true; sablon: Sablon } | Ret> {
  const d = denetle(g)
  if (!d.tamam) return d
  const { data: mevcut } = await ulkeTablosu(supabase, TABLO).select('id').eq('doctor_id', doktorId).is('silindi_at', null).limit(SABLON_ADET_AZAMI + 1)
  if (Array.isArray(mevcut) && mevcut.length >= SABLON_ADET_AZAMI) return { tamam: false, kod: 'COK_FAZLA' }
  // The id is made here so that it can be written INTO the encrypted value: the value then belongs to this row only.
  const id = randomUUID()
  const an = new Date(simdi).toISOString()
  const { error } = await ulkeTablosu(supabase, TABLO).insert({ id, doctor_id: doktorId, kapsam: d.kapsam, icerik_encrypted: sifrele({ d: doktorId, i: id, ad: d.ad, m: d.metin }), silindi_at: null, created_at: an, updated_at: an })
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, sablon: { id, ad: d.ad, metin: d.metin, kapsam: d.kapsam, guncellendi: an } }
}

export async function sablonGuncelle(supabase: SupabaseClient, doktorId: string, id: string, g: Girdi, simdi = Date.now()): Promise<{ tamam: true; sablon: Sablon } | Ret> {
  const d = denetle(g)
  if (!d.tamam) return d
  const an = new Date(simdi).toISOString()
  // ISOLATION: template id + doctor_id in the same statement, and only a template that is in use.
  const { data, error } = await ulkeTablosu(supabase, TABLO).update({ kapsam: d.kapsam, icerik_encrypted: sifrele({ d: doktorId, i: id, ad: d.ad, m: d.metin }), updated_at: an }).eq('id', id).eq('doctor_id', doktorId).is('silindi_at', null).select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'NOT_FOUND' }
  return { tamam: true, sablon: { id, ad: d.ad, metin: d.metin, kapsam: d.kapsam, guncellendi: an } }
}

/** Soft: the row stays, marked. A template that is already deleted answers like one that does not exist. */
export async function sablonSil(supabase: SupabaseClient, doktorId: string, id: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const an = new Date(simdi).toISOString()
  const { data, error } = await ulkeTablosu(supabase, TABLO).update({ silindi_at: an, updated_at: an }).eq('id', id).eq('doctor_id', doktorId).is('silindi_at', null).select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  if (!Array.isArray(data) || !data.length) return { tamam: false, kod: 'NOT_FOUND' }
  return { tamam: true }
}
