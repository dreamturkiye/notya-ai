/**
 * NOTYA-ULKE-PORTAL-01 — A SUMMARY FOR THE PATIENT, and sharing it. The doctor's side.
 *
 * SHARING IS THE DOCTOR'S ACT, ITEM BY ITEM. Nothing here is ever shared by itself:
 *   - a summary is WRITTEN (by the model, from the approved note and nothing else, in the patient's own language —
 *     or by the doctor) as a DRAFT the patient cannot see;
 *   - the doctor reads it, may change it, and SHARES it; from that moment the portal shows it;
 *   - the doctor TAKES IT BACK at any time; from that moment the portal does not show it (the portal reads the
 *     switch on every request, so "at once" is literal);
 *   - a shared summary is not changed under the patient's eyes: to edit or rewrite it, the doctor takes it back first.
 *
 * AN UNAPPROVED NOTE CAN NEVER BE SHARED, AND HAS NO SUMMARY. Checked here before anything is written, and held by
 * the database on its own (the trigger of migration 137 refuses a summary row for a note that is not approved).
 * THE CLINICAL NOTE ITSELF IS NEVER SHOWN TO A PATIENT: the portal reads `ulke_hasta_ozetleri` and never a note.
 *
 * MODEL POLICY (.cursor/skills/ai-model-politikasi/SKILL.md): no model is named here; the call goes through the one
 * place a country's code talks to the model (lib/ulke/uygulama/notModeli.ts → the shared gateway), with the pack's
 * own instruction for the patient's language. What leaves for the model: the approved note's text. No name, no
 * phone, no identity number, no id. The model's text reaches nobody but the doctor.
 *
 * PATIENT ISOLATION. A note id from a request is read with the authenticated doctor's id in the same query
 * (notGetir); its patient is read by doctor AND id; every statement on the summary carries the doctor's id. A
 * foreign id is "not found". Every statement is bound to this build's country.
 *
 * Storage: `ulke_hasta_ozetleri` (migration 137), one row per note, the text encrypted like the rest of a patient's data.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { hastaIcinBicim } from '../arayuz/dilSecimi'
import type { DilKodu } from '../tipler'
import { ulkePaketi, uygulamaDiliMi } from '../ulke'
import { hastaGetir } from '../uygulama/hastalar'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { modeldenHastaOzeti } from '../uygulama/notModeli'
import { notGetir } from '../uygulama/notlar'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { OZET_AZAMI } from './sabitler'

export type HastaOzeti = {
  id: string
  notId: string
  /** The language form the summary is written in. */
  dil: DilKodu
  metin: string
  paylasildi: boolean
  paylasimAni: string | null
  guncellendi: string
}

export type OzetRetKodu = 'NOT_FOUND' | 'ONAYSIZ' | 'PAYLASILDI' | 'BOS' | 'HAZIR_DEGIL' | 'OZET_YAZILAMADI' | 'BASARISIZ'
type Ret = { tamam: false; kod: OzetRetKodu }
const ret = (kod: OzetRetKodu): Ret => ({ tamam: false, kod })

/** HTTP status of each code the summary API answers with. */
export const OZET_DURUMU: Record<OzetRetKodu, number> = {
  NOT_FOUND: 404,
  // The note is not approved: there is nothing that may be summarised or shared.
  ONAYSIZ: 409,
  // The summary is shared: it is taken back before it is changed.
  PAYLASILDI: 409,
  BOS: 400,
  HAZIR_DEGIL: 503,
  OZET_YAZILAMADI: 502,
  BASARISIZ: 500,
}

type Satir = { id: string; note_id: string; patient_id: string; dil: string; ozet_encrypted: string | null; paylasildi_at: string | null; updated_at: string | null; created_at: string | null }
const KOLONLAR = 'id, note_id, patient_id, dil, ozet_encrypted, paylasildi_at, updated_at, created_at'
const TABLO = 'ulke_hasta_ozetleri'

const coz = (ham: unknown): string => {
  if (typeof ham !== 'string' || !ham) return ''
  try { return decrypt(ham) } catch { return '' }
}

const satirdan = (s: Satir): HastaOzeti => ({
  id: s.id, notId: s.note_id, dil: (uygulamaDiliMi(s.dil) ? s.dil : ulkePaketi().varsayilanDil) as DilKodu, metin: coz(s.ozet_encrypted),
  paylasildi: Boolean(s.paylasildi_at), paylasimAni: s.paylasildi_at ?? null, guncellendi: String(s.updated_at ?? s.created_at ?? ''),
})

/** The text of a summary from a request: text only, one size. */
export const ozetMetniAl = (ham: unknown): string => (typeof ham === 'string' ? ham.trim().slice(0, OZET_AZAMI) : '')

/** The note, proven this doctor's, with its patient — or the reason there can be no summary. */
async function notuHazirla(supabase: SupabaseClient, doktorId: string, notId: string) {
  // ISOLATION: note id and doctor in one query; the visit and the patient are each read with the doctor's id again.
  const not = await notGetir(supabase, doktorId, notId)
  const hastaId = not?.muayene.hasta?.id
  if (!not || !hastaId) return ret('NOT_FOUND')
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return ret('NOT_FOUND')
  return { tamam: true as const, not, hasta }
}

async function satirOku(supabase: SupabaseClient, doktorId: string, notId: string): Promise<Satir | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('note_id', notId).eq('doctor_id', doktorId).maybeSingle()
  return error || !data ? null : (data as Satir)
}

/** The language form a summary for this patient is written in: the patient's language; where it has several scripts, the doctor's. */
async function ozetDili(supabase: SupabaseClient, doktorId: string, hastaDili: string): Promise<DilKodu> {
  const h = await hekimDilleri(supabase, doktorId)
  return hastaIcinBicim(ulkePaketi().uygulama?.dilGruplari ?? [], hastaDili, { dil: h.arayuzDili, notDili: h.notDili })
}

/**
 * The summary of one note of THIS doctor, if there is one, and whether one may be written at all.
 * null = no such note for this doctor.
 */
export async function ozetGetir(supabase: SupabaseClient, doktorId: string, notId: string): Promise<{ ozet: HastaOzeti | null; onayli: boolean; dil: DilKodu; yazilabilir: boolean } | null> {
  const n = await notuHazirla(supabase, doktorId, notId)
  if (!n.tamam) return null
  const dil = await ozetDili(supabase, doktorId, n.hasta.dil)
  const s = n.not.onayli ? await satirOku(supabase, doktorId, notId) : null
  // A row whose patient is not the note's patient is not shown as this note's summary (the database refuses to write one).
  const ozet = s && s.patient_id === n.hasta.id ? satirdan(s) : null
  return { ozet, onayli: n.not.onayli, dil, yazilabilir: n.not.onayli && Boolean(AKTIF_KLINIK?.hastaOzetiTalimati?.(dil)) }
}

/** Writes or replaces the DRAFT. Never a shared summary: the statement itself carries "not shared". */
async function taslakYaz(supabase: SupabaseClient, doktorId: string, notId: string, hastaId: string, dil: DilKodu, metin: string): Promise<{ tamam: true; ozet: HastaOzeti } | Ret> {
  const simdi = new Date().toISOString()
  const mevcut = await satirOku(supabase, doktorId, notId)
  if (mevcut?.paylasildi_at) return ret('PAYLASILDI')
  if (mevcut) {
    const { data, error } = await ulkeTablosu(supabase, TABLO)
      .update({ dil, ozet_encrypted: encrypt(metin), updated_at: simdi })
      .eq('id', mevcut.id)
      .eq('doctor_id', doktorId)
      .is('paylasildi_at', null)
      .select(KOLONLAR)
    if (error) return ret('BASARISIZ')
    const yeni = ((data as Satir[] | null) ?? [])[0]
    // Shared between the read and this statement: nothing was changed.
    return yeni ? { tamam: true, ozet: satirdan(yeni) } : ret('PAYLASILDI')
  }
  const { data, error } = await ulkeTablosu(supabase, TABLO)
    .insert({ doctor_id: doktorId, patient_id: hastaId, note_id: notId, dil, ozet_encrypted: encrypt(metin), paylasildi_at: null, updated_at: simdi })
    .select(KOLONLAR)
    .single()
  if (error || !data) return ret('BASARISIZ')
  return { tamam: true, ozet: satirdan(data as Satir) }
}

/**
 * The model writes the draft, from the APPROVED note only, in the patient's language. The doctor asked for it; the
 * patient sees nothing until the doctor shares it.
 */
export async function ozetUret(supabase: SupabaseClient, doktorId: string, notId: string, butceMs?: number): Promise<{ tamam: true; ozet: HastaOzeti } | Ret> {
  const klinik = AKTIF_KLINIK
  if (!klinik?.hastaOzetiTalimati || !klinik.hastaOzetiGirdisi) return ret('HAZIR_DEGIL')
  const n = await notuHazirla(supabase, doktorId, notId)
  if (!n.tamam) return n
  if (!n.not.onayli) return ret('ONAYSIZ')
  if ((await satirOku(supabase, doktorId, notId))?.paylasildi_at) return ret('PAYLASILDI')
  const dil = await ozetDili(supabase, doktorId, n.hasta.dil)
  const talimat = klinik.hastaOzetiTalimati(dil)
  if (!talimat) return ret('HAZIR_DEGIL')
  // What leaves for the model: the approved note's own text (and its role fields). Nothing else about the patient.
  const girdi = klinik.hastaOzetiGirdisi(dil, n.not.icerik)
  const metin = await modeldenHastaOzeti({ talimat, girdi, doktorId, butceMs, azami: OZET_AZAMI, olcum: { supabase, gorev: 'hasta-ozeti' } })
  if (!metin) return ret('OZET_YAZILAMADI')
  return taslakYaz(supabase, doktorId, notId, n.hasta.id, dil, metin)
}

/** The doctor's own text for the draft (an edit of the model's, or written from nothing). */
export async function ozetKaydet(supabase: SupabaseClient, doktorId: string, notId: string, metin: string): Promise<{ tamam: true; ozet: HastaOzeti } | Ret> {
  if (!metin.trim()) return ret('BOS')
  const n = await notuHazirla(supabase, doktorId, notId)
  if (!n.tamam) return n
  if (!n.not.onayli) return ret('ONAYSIZ')
  return taslakYaz(supabase, doktorId, notId, n.hasta.id, await ozetDili(supabase, doktorId, n.hasta.dil), metin.trim().slice(0, OZET_AZAMI))
}

/** The doctor shares the summary (`paylas` true) or takes it back (false). Recorded for the doctor either way. */
export async function ozetPaylas(supabase: SupabaseClient, doktorId: string, notId: string, paylas: boolean, simdi = Date.now()): Promise<{ tamam: true; ozet: HastaOzeti } | Ret> {
  const n = await notuHazirla(supabase, doktorId, notId)
  if (!n.tamam) return n
  // An unapproved note can never be shared. (It has no summary either; this is the answer the doctor gets.)
  if (paylas && !n.not.onayli) return ret('ONAYSIZ')
  const s = await satirOku(supabase, doktorId, notId)
  if (!s || s.patient_id !== n.hasta.id) return ret('NOT_FOUND')
  if (paylas && !coz(s.ozet_encrypted).trim()) return ret('BOS')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_ozet_paylas', { p_doctor_id: doktorId, p_ozet_id: s.id, p_paylas: paylas, p_simdi: new Date(simdi).toISOString() })
  if (error) return ret('BASARISIZ')
  if (data === 'NOT_FOUND') return ret('NOT_FOUND')
  if (data !== 'TAMAM' && data !== 'AYNI') return ret('BASARISIZ')
  const yeni = await satirOku(supabase, doktorId, notId)
  return yeni ? { tamam: true, ozet: satirdan(yeni) } : ret('BASARISIZ')
}

/** Every summary of ONE patient of this doctor, by note id — for the patient's file. The caller has proven the patient is the doctor's. */
export async function hastaninOzetleri(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<Map<string, { paylasildi: boolean }>> {
  const { data } = await ulkeTablosu(supabase, TABLO).select('note_id, paylasildi_at').eq('doctor_id', doktorId).eq('patient_id', hastaId)
  return new Map(((data as { note_id: string; paylasildi_at: string | null }[] | null) ?? []).map((x) => [x.note_id, { paylasildi: Boolean(x.paylasildi_at) }]))
}
