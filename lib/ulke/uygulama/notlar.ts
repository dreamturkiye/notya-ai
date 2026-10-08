/**
 * NOTYA-UZ-MUAYENE-01 — the note of a visit: written by the model, rewritten in the other language as a second
 * draft, edited and approved by the doctor, and only then part of the patient's file.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * a note id or a visit id from a request is read with the authenticated doctor's id in the same query, and every
 * later read or write of that note carries the doctor's id again. A foreign id is "not found", never "forbidden".
 *
 * AN APPROVED NOTE IS NEVER OVERWRITTEN. Every write to the note's text carries `approved_at IS NULL` in the same
 * statement — not a check made beforehand — so a late save, a second approval or a rewrite cannot change a note
 * the doctor has approved; they answer 'ONAYLI'. A rewrite never touches the note at all: it is stored beside it.
 *
 * Storage: the core `notes` table holds the note (its four SOAP columns), as the rest of the product reads it.
 * `not_dil_kaydi` (migration 133), one row per note, holds what the core table has no place for: the language the
 * note's text is in, and the second draft in the other language.
 *
 *   draft           notes.content_* = the text in `not_dili`;  not_dil_kaydi.ikinci_* = the other draft, if asked for
 *   approve (same)  notes.content_* ← the text on the screen, approved_at set
 *   approve (other) the two drafts change places first (nothing is lost), then as above
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import type { DilKodu, NotIcerigi } from '../tipler'
import { uygulamaDiliMi } from '../ulke'
import { hastaGetir } from './hastalar'
import { hekimDilleri, muayeneGetir, type MuayeneDetayi } from './muayeneKaydi'
import { BOLUM_AZAMI, modeldenNot, notModelEtiketi } from './notModeli'

export type NotDetayi = {
  notId: string
  seansId: string
  onayli: boolean
  onayTarihi: string | null
  /** Language of the note's text. */
  dil: DilKodu
  icerik: NotIcerigi
  /** The second draft, while the note is not approved. */
  ikinci: { dil: DilKodu; icerik: NotIcerigi } | null
  /** The language one click would rewrite the note in; null when there is nothing to offer. */
  yenidenYazilabilir: DilKodu | null
  muayene: MuayeneDetayi
}

export type NotRetKodu = 'NOT_FOUND' | 'ONAYLI' | 'GECERSIZ' | 'BOS' | 'NOT_YAZILAMADI' | 'YENIDEN_YAZILAMADI' | 'HAZIR_DEGIL' | 'BASARISIZ'
type Ret = { tamam: false; kod: NotRetKodu; alan?: string }
const ret = (kod: NotRetKodu, alan?: string): Ret => ({ tamam: false, kod, ...(alan ? { alan } : {}) })

type NotSatiri = { id: string; session_id: string; approved_at: string | null; content_subjektif: string | null; content_objektif: string | null; content_degerlendirme: string | null; content_plan: string | null }
type DilSatiri = { not_dili: string; ikinci_dil: string | null; ikinci_s: string | null; ikinci_o: string | null; ikinci_a: string | null; ikinci_p: string | null }
const NOT_KOLONLARI = 'id, session_id, approved_at, content_subjektif, content_objektif, content_degerlendirme, content_plan'
const DIL_KOLONLARI = 'not_dili, ikinci_dil, ikinci_s, ikinci_o, ikinci_a, ikinci_p'

const satirdan = (n: NotSatiri): NotIcerigi => ({ s: n.content_subjektif ?? '', o: n.content_objektif ?? '', a: n.content_degerlendirme ?? '', p: n.content_plan ?? '' })
const kolonlara = (i: NotIcerigi) => ({ content_subjektif: i.s, content_objektif: i.o, content_degerlendirme: i.a, content_plan: i.p })
const bosMu = (i: NotIcerigi) => !(i.s.trim() || i.o.trim() || i.a.trim() || i.p.trim())

/** The four sections from a request body: text only, trimmed of nothing but length. */
export function icerikAl(g: Record<string, unknown>): NotIcerigi {
  const al = (ham: unknown) => (typeof ham === 'string' ? ham.slice(0, BOLUM_AZAMI) : '')
  return { s: al(g.s), o: al(g.o), a: al(g.a), p: al(g.p) }
}

async function notuOku(supabase: SupabaseClient, doktorId: string, notId: string): Promise<{ not: NotSatiri; dil: DilSatiri } | null> {
  const { data: n, error } = await supabase.from('notes').select(NOT_KOLONLARI).eq('id', notId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !n) return null
  const { data: d } = await supabase.from('not_dil_kaydi').select(DIL_KOLONLARI).eq('note_id', notId).eq('doctor_id', doktorId).maybeSingle()
  // A note without its language record is not one of this application's notes (it cannot say what language it is in).
  if (!d || !uygulamaDiliMi((d as DilSatiri).not_dili)) return null
  return { not: n as NotSatiri, dil: d as DilSatiri }
}

/**
 * Writes the note of a visit from its transcript, in the doctor's note language. Once per visit: asked again for a
 * visit that has a note, it answers with that note and calls nobody.
 */
export async function notYaz(supabase: SupabaseClient, doktorId: string, seansId: string, butceMs?: number): Promise<{ tamam: true; notId: string } | Ret> {
  const klinik = AKTIF_KLINIK
  if (!klinik) return ret('HAZIR_DEGIL')
  // ISOLATION: the visit, its language record and its patient are each read with the doctor's id.
  const muayene = await muayeneGetir(supabase, doktorId, seansId)
  if (!muayene || !muayene.hasta) return ret('NOT_FOUND')
  if (muayene.notId) return { tamam: true, notId: muayene.notId }
  if (!muayene.metin.trim()) return ret('NOT_YAZILAMADI')
  const { data: kayit } = await supabase.from('muayene_dil_kaydi').select('not_dili, sablon').eq('session_id', seansId).eq('doctor_id', doktorId).maybeSingle()
  const k = kayit as { not_dili?: unknown; sablon?: unknown } | null
  const notDili = uygulamaDiliMi(k?.not_dili) ? k.not_dili : null
  const talimat = notDili ? klinik.notTalimati(notDili, String(k?.sablon ?? muayene.sablon)) : null
  if (!notDili || !talimat) return ret('NOT_YAZILAMADI')
  const hasta = await hastaGetir(supabase, doktorId, muayene.hasta.id)
  if (!hasta) return ret('NOT_FOUND')

  // What leaves for the model: age, sex, the transcript. No name, no phone, no identity number, no patient id.
  const girdi = klinik.notGirdisi(notDili, { dogumTarihi: hasta.dogumTarihi, cinsiyet: hasta.cinsiyet, muayeneTarihi: muayene.baslangic.slice(0, 10), metin: muayene.metin.slice(0, 120_000) })
  const icerik = await modeldenNot({ gorev: 'soap', talimat, girdi, doktorId, butceMs })
  if (!icerik) return ret('NOT_YAZILAMADI')

  const { data: n, error } = await supabase
    .from('notes')
    .insert({ session_id: seansId, doctor_id: doktorId, note_type: 'soap', ...kolonlara(icerik), ai_model: notModelEtiketi() })
    .select('id')
    .single()
  const notId = (n as { id?: string } | null)?.id
  if (error || !notId) return ret('BASARISIZ')
  const { error: dilHatasi } = await supabase.from('not_dil_kaydi').insert({ note_id: notId, doctor_id: doktorId, patient_id: hasta.id, not_dili: notDili })
  if (dilHatasi) {
    try { await supabase.from('notes').delete().eq('id', notId).eq('doctor_id', doktorId).is('approved_at', null) } catch { /* reported as a failure either way */ }
    return ret('BASARISIZ')
  }
  return { tamam: true, notId }
}

/** One note of THIS doctor with its visit, or null — for a foreign id exactly as for one that does not exist. */
export async function notGetir(supabase: SupabaseClient, doktorId: string, notId: string): Promise<NotDetayi | null> {
  const o = await notuOku(supabase, doktorId, notId)
  if (!o) return null
  const muayene = await muayeneGetir(supabase, doktorId, o.not.session_id)
  if (!muayene) return null
  const onayli = Boolean(o.not.approved_at)
  const dil = o.dil.not_dili as DilKodu
  const ikinci = !onayli && uygulamaDiliMi(o.dil.ikinci_dil)
    ? { dil: o.dil.ikinci_dil, icerik: { s: o.dil.ikinci_s ?? '', o: o.dil.ikinci_o ?? '', a: o.dil.ikinci_a ?? '', p: o.dil.ikinci_p ?? '' } }
    : null
  let yenidenYazilabilir: DilKodu | null = null
  if (!onayli && !ikinci && AKTIF_KLINIK) {
    const h = await hekimDilleri(supabase, doktorId)
    const diger = AKTIF_KLINIK.digerDil(dil, [h.notDili, h.arayuzDili])
    yenidenYazilabilir = diger && AKTIF_KLINIK.yenidenYazimTalimati(diger) ? diger : null
  }
  return { notId: o.not.id, seansId: o.not.session_id, onayli, onayTarihi: o.not.approved_at ?? null, dil, icerik: satirdan(o.not), ikinci, yenidenYazilabilir, muayene }
}

/** Saves the doctor's edits to ONE draft (named by its language). Never an approved note. */
export async function notKaydet(supabase: SupabaseClient, doktorId: string, notId: string, dil: unknown, icerik: NotIcerigi): Promise<{ tamam: true } | Ret> {
  const o = await notuOku(supabase, doktorId, notId)
  if (!o) return ret('NOT_FOUND')
  if (o.not.approved_at) return ret('ONAYLI')
  if (dil === o.dil.not_dili) {
    const { data, error } = await supabase.from('notes').update(kolonlara(icerik)).eq('id', notId).eq('doctor_id', doktorId).is('approved_at', null).select('id')
    if (error) return ret('BASARISIZ')
    return (data as unknown[] | null)?.length ? { tamam: true } : ret('ONAYLI')
  }
  if (o.dil.ikinci_dil && dil === o.dil.ikinci_dil) {
    const { error } = await supabase.from('not_dil_kaydi').update({ ikinci_s: icerik.s, ikinci_o: icerik.o, ikinci_a: icerik.a, ikinci_p: icerik.p, updated_at: new Date().toISOString() }).eq('note_id', notId).eq('doctor_id', doktorId)
    return error ? ret('BASARISIZ') : { tamam: true }
  }
  return ret('GECERSIZ', 'dil')
}

/**
 * One click: the note rewritten in the other language, stored as a SECOND draft beside the note. The note itself is
 * not touched. Asked again while a second draft exists, it answers with that draft's language and calls nobody —
 * a second click can neither overwrite the doctor's edits nor cost a second call.
 */
export async function notYenidenYaz(supabase: SupabaseClient, doktorId: string, notId: string, butceMs?: number): Promise<{ tamam: true; dil: DilKodu } | Ret> {
  const klinik = AKTIF_KLINIK
  if (!klinik) return ret('HAZIR_DEGIL')
  const o = await notuOku(supabase, doktorId, notId)
  if (!o) return ret('NOT_FOUND')
  if (o.not.approved_at) return ret('ONAYLI')
  if (uygulamaDiliMi(o.dil.ikinci_dil)) return { tamam: true, dil: o.dil.ikinci_dil }
  const h = await hekimDilleri(supabase, doktorId)
  const hedef = klinik.digerDil(o.dil.not_dili as DilKodu, [h.notDili, h.arayuzDili])
  const talimat = hedef ? klinik.yenidenYazimTalimati(hedef) : null
  if (!hedef || !talimat || !uygulamaDiliMi(hedef)) return ret('YENIDEN_YAZILAMADI')
  const kaynak = satirdan(o.not)
  if (bosMu(kaynak)) return ret('BOS')
  const icerik = await modeldenNot({ gorev: 'not-uretimi', talimat, girdi: klinik.yenidenYazimGirdisi(hedef, kaynak), doktorId, butceMs })
  if (!icerik) return ret('YENIDEN_YAZILAMADI')
  const { error } = await supabase
    .from('not_dil_kaydi')
    .update({ ikinci_dil: hedef, ikinci_s: icerik.s, ikinci_o: icerik.o, ikinci_a: icerik.a, ikinci_p: icerik.p, updated_at: new Date().toISOString() })
    .eq('note_id', notId)
    .eq('doctor_id', doktorId)
  return error ? ret('BASARISIZ') : { tamam: true, dil: hedef }
}

/**
 * The doctor approves ONE draft, with the text as it stands on the screen. From then on it is the note in the
 * patient's file and cannot be changed here. Approving twice answers 'ONAYLI' and changes nothing.
 */
export async function notOnayla(supabase: SupabaseClient, doktorId: string, notId: string, dil: unknown, icerik: NotIcerigi): Promise<{ tamam: true; onayTarihi: string } | Ret> {
  if (bosMu(icerik)) return ret('BOS')
  const o = await notuOku(supabase, doktorId, notId)
  if (!o) return ret('NOT_FOUND')
  if (o.not.approved_at) return ret('ONAYLI')
  const ayni = dil === o.dil.not_dili
  if (!ayni && !(o.dil.ikinci_dil && dil === o.dil.ikinci_dil)) return ret('GECERSIZ', 'dil')
  const simdi = new Date().toISOString()
  if (!ayni) {
    // The other draft is the one being approved: the two change places, so the draft that is not chosen is kept
    // beside the note. If the next step fails, a retry lands in the "same language" branch with the text from the screen.
    const eski = satirdan(o.not)
    const { error } = await supabase
      .from('not_dil_kaydi')
      .update({ not_dili: dil as string, ikinci_dil: o.dil.not_dili, ikinci_s: eski.s, ikinci_o: eski.o, ikinci_a: eski.a, ikinci_p: eski.p, updated_at: simdi })
      .eq('note_id', notId)
      .eq('doctor_id', doktorId)
    if (error) return ret('BASARISIZ')
  }
  // The decisive write: text and approval together, and only while the note is still unapproved.
  const { data, error } = await supabase
    .from('notes')
    .update({ ...kolonlara(icerik), approved_at: simdi, approved_by: doktorId })
    .eq('id', notId)
    .eq('doctor_id', doktorId)
    .is('approved_at', null)
    .select('id')
  if (error) return ret('BASARISIZ')
  if (!(data as unknown[] | null)?.length) return ret('ONAYLI')
  return { tamam: true, onayTarihi: simdi }
}
