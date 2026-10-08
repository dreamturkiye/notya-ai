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
 * ROLE FIELDS (NOTYA-UZ-BRANSLAR-01). A note written with a role's template has fields beside the four sections.
 * They live in `not_dil_kaydi.alanlar` (and `ikinci_alanlar` for the second draft), migration 134. LEAK RULE: the
 * pack names the keys a template owns for this patient (`notAlanlari`); `alanlariSuz` keeps those and DROPS every
 * other key — on the model's answer, on what a request sends, and again on what is read back to be shown. A note
 * of one role can therefore neither store nor show a field of another, whatever the model or a client sends.
 *
 * APPROVAL IS ALL OR NOTHING (NOTYA-UZ-RANDEVU-01). Approving is ONE call to one database function,
 * `ulke_not_onayla` (migration 135), which runs in one transaction: the note's text and approval, its role fields
 * (and the exchange of the two drafts when the other one is approved), and "done" on the appointment the visit was
 * started from. This file makes no other write while approving — so a failure anywhere leaves the note unapproved
 * and every row as it was. (Before, the fields were a second statement after the approval.)
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
import { ALAN_AZAMI, alanlariOku, BOLUM_AZAMI, modeldenNot, notModelEtiketi } from './notModeli'

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
  /** Field keys this note's template owns for this patient, in display order. Empty = four sections only. */
  alanAnahtarlari: readonly string[]
  muayene: MuayeneDetayi
}

export type NotRetKodu = 'NOT_FOUND' | 'ONAYLI' | 'GECERSIZ' | 'BOS' | 'NOT_YAZILAMADI' | 'YENIDEN_YAZILAMADI' | 'HAZIR_DEGIL' | 'BASARISIZ'
type Ret = { tamam: false; kod: NotRetKodu; alan?: string }
const ret = (kod: NotRetKodu, alan?: string): Ret => ({ tamam: false, kod, ...(alan ? { alan } : {}) })

type NotSatiri = { id: string; session_id: string; approved_at: string | null; content_subjektif: string | null; content_objektif: string | null; content_degerlendirme: string | null; content_plan: string | null }
type DilSatiri = { not_dili: string; ikinci_dil: string | null; ikinci_s: string | null; ikinci_o: string | null; ikinci_a: string | null; ikinci_p: string | null; alanlar?: unknown; ikinci_alanlar?: unknown }
const NOT_KOLONLARI = 'id, session_id, approved_at, content_subjektif, content_objektif, content_degerlendirme, content_plan'
const DIL_KOLONLARI = 'not_dili, ikinci_dil, ikinci_s, ikinci_o, ikinci_a, ikinci_p, alanlar, ikinci_alanlar'

const satirdan = (n: NotSatiri): NotIcerigi => ({ s: n.content_subjektif ?? '', o: n.content_objektif ?? '', a: n.content_degerlendirme ?? '', p: n.content_plan ?? '' })
const kolonlara = (i: NotIcerigi) => ({ content_subjektif: i.s, content_objektif: i.o, content_degerlendirme: i.a, content_plan: i.p })
/** The database function that approves a note in one transaction (migration 135). */
export const NOT_ONAY_ISLEVI = 'ulke_not_onayla'
const bosMu = (i: NotIcerigi) => !(i.s.trim() || i.o.trim() || i.a.trim() || i.p.trim())

/**
 * The four sections from a request body: text only, trimmed of nothing but length. `alanlar` is present exactly when
 * the body carries a field object (an empty one included: that is how the doctor clears every field).
 */
export function icerikAl(g: Record<string, unknown>): NotIcerigi {
  const al = (ham: unknown) => (typeof ham === 'string' ? ham.slice(0, BOLUM_AZAMI) : '')
  const icerik: NotIcerigi = { s: al(g.s), o: al(g.o), a: al(g.a), p: al(g.p) }
  return g.alanlar && typeof g.alanlar === 'object' && !Array.isArray(g.alanlar) ? { ...icerik, alanlar: alanlariOku(g.alanlar) ?? {} } : icerik
}

/**
 * THE FILTER (leak rule): of `ham`, only the keys on `izinli` — the list the pack gives for the note's template and
 * patient — in that list's order. null = nothing is left. A key of another role's template never passes.
 */
export function alanlariSuz(ham: unknown, izinli: readonly string[]): Record<string, string> | null {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham) || !izinli.length) return null
  const kaynak = ham as Record<string, unknown>
  const cikti: Record<string, string> = {}
  for (const k of izinli) {
    const v = Object.prototype.hasOwnProperty.call(kaynak, k) ? kaynak[k] : undefined
    if (typeof v === 'string' && v.trim()) cikti[k] = v.slice(0, ALAN_AZAMI)
  }
  return Object.keys(cikti).length ? cikti : null
}

/** The field keys the pack allows for a visit's template and patient. Empty where the pack has no fields. */
function izinliAlanlar(muayene: Pick<MuayeneDetayi, 'sablon' | 'baslangic' | 'hasta'> | null): readonly string[] {
  if (!muayene) return []
  return AKTIF_KLINIK?.notAlanlari?.(muayene.sablon, { dogumTarihi: muayene.hasta?.dogumTarihi ?? '', muayeneTarihi: muayene.baslangic.slice(0, 10) }) ?? []
}
const alanliIcerik = (icerik: NotIcerigi, alanlar: Record<string, string> | null): NotIcerigi => {
  const { alanlar: _atilan, ...dort } = icerik
  return alanlar ? { ...dort, alanlar } : dort
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
  const sablon = String(k?.sablon ?? muayene.sablon)
  const talimat = notDili ? klinik.notTalimati(notDili, sablon) : null
  if (!notDili || !talimat) return ret('NOT_YAZILAMADI')
  const hasta = await hastaGetir(supabase, doktorId, muayene.hasta.id)
  if (!hasta) return ret('NOT_FOUND')

  // What leaves for the model: age, sex, the transcript. No name, no phone, no identity number, no patient id.
  const muayeneTarihi = muayene.baslangic.slice(0, 10)
  const girdi = klinik.notGirdisi(notDili, { dogumTarihi: hasta.dogumTarihi, cinsiyet: hasta.cinsiyet, muayeneTarihi, metin: muayene.metin.slice(0, 120_000), sablon })
  const icerik = await modeldenNot({ gorev: 'soap', talimat, girdi, doktorId, butceMs })
  if (!icerik) return ret('NOT_YAZILAMADI')
  // LEAK RULE: of what the model returned, only the fields THIS template owns for THIS patient are kept.
  const alanlar = alanlariSuz(icerik.alanlar, klinik.notAlanlari?.(sablon, { dogumTarihi: hasta.dogumTarihi, muayeneTarihi }) ?? [])

  const { data: n, error } = await supabase
    .from('notes')
    .insert({ session_id: seansId, doctor_id: doktorId, note_type: 'soap', ...kolonlara(icerik), ai_model: notModelEtiketi() })
    .select('id')
    .single()
  const notId = (n as { id?: string } | null)?.id
  if (error || !notId) return ret('BASARISIZ')
  const { error: dilHatasi } = await supabase.from('not_dil_kaydi').insert({ note_id: notId, doctor_id: doktorId, patient_id: hasta.id, not_dili: notDili, ...(alanlar ? { alanlar } : {}) })
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
  // LEAK RULE, on the way out as well: a stored key this template does not own is not shown.
  const alanAnahtarlari = izinliAlanlar(muayene)
  const ikinci = !onayli && uygulamaDiliMi(o.dil.ikinci_dil)
    ? { dil: o.dil.ikinci_dil, icerik: alanliIcerik({ s: o.dil.ikinci_s ?? '', o: o.dil.ikinci_o ?? '', a: o.dil.ikinci_a ?? '', p: o.dil.ikinci_p ?? '' }, alanlariSuz(o.dil.ikinci_alanlar, alanAnahtarlari)) }
    : null
  let yenidenYazilabilir: DilKodu | null = null
  if (!onayli && !ikinci && AKTIF_KLINIK) {
    const h = await hekimDilleri(supabase, doktorId)
    const diger = AKTIF_KLINIK.digerDil(dil, [h.notDili, h.arayuzDili])
    yenidenYazilabilir = diger && AKTIF_KLINIK.yenidenYazimTalimati(diger) ? diger : null
  }
  return { notId: o.not.id, seansId: o.not.session_id, onayli, onayTarihi: o.not.approved_at ?? null, dil, icerik: alanliIcerik(satirdan(o.not), alanlariSuz(o.dil.alanlar, alanAnahtarlari)), ikinci, yenidenYazilabilir, alanAnahtarlari, muayene }
}

/** Saves the doctor's edits to ONE draft (named by its language). Never an approved note. */
export async function notKaydet(supabase: SupabaseClient, doktorId: string, notId: string, dil: unknown, icerik: NotIcerigi): Promise<{ tamam: true } | Ret> {
  const o = await notuOku(supabase, doktorId, notId)
  if (!o) return ret('NOT_FOUND')
  if (o.not.approved_at) return ret('ONAYLI')
  // Fields are written only when the request carries them, and only the ones this note's template owns.
  const alanlar = icerik.alanlar === undefined ? undefined : alanlariSuz(icerik.alanlar, izinliAlanlar(await muayeneGetir(supabase, doktorId, o.not.session_id)))
  if (dil === o.dil.not_dili) {
    const { data, error } = await supabase.from('notes').update(kolonlara(icerik)).eq('id', notId).eq('doctor_id', doktorId).is('approved_at', null).select('id')
    if (error) return ret('BASARISIZ')
    if (!(data as unknown[] | null)?.length) return ret('ONAYLI')
    if (alanlar !== undefined) {
      const { error: alanHatasi } = await supabase.from('not_dil_kaydi').update({ alanlar, updated_at: new Date().toISOString() }).eq('note_id', notId).eq('doctor_id', doktorId)
      if (alanHatasi) return ret('BASARISIZ')
    }
    return { tamam: true }
  }
  if (o.dil.ikinci_dil && dil === o.dil.ikinci_dil) {
    const { error } = await supabase.from('not_dil_kaydi').update({ ikinci_s: icerik.s, ikinci_o: icerik.o, ikinci_a: icerik.a, ikinci_p: icerik.p, ...(alanlar !== undefined ? { ikinci_alanlar: alanlar } : {}), updated_at: new Date().toISOString() }).eq('note_id', notId).eq('doctor_id', doktorId)
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
  // The note's own fields travel with it — the ones its template owns, nothing else that may sit in the row.
  const kaynakAlanlari = o.dil.alanlar ? alanlariSuz(o.dil.alanlar, izinliAlanlar(await muayeneGetir(supabase, doktorId, o.not.session_id))) : null
  const kaynak = alanliIcerik(satirdan(o.not), kaynakAlanlari)
  if (bosMu(kaynak)) return ret('BOS')
  const icerik = await modeldenNot({ gorev: 'not-uretimi', talimat, girdi: klinik.yenidenYazimGirdisi(hedef, kaynak), doktorId, butceMs })
  if (!icerik) return ret('YENIDEN_YAZILAMADI')
  // A rewrite may return only the fields the note already had: it adds no field, of this role or of any other.
  const ikinciAlanlar = kaynakAlanlari ? alanlariSuz(icerik.alanlar, Object.keys(kaynakAlanlari)) : null
  const { error } = await supabase
    .from('not_dil_kaydi')
    .update({ ikinci_dil: hedef, ikinci_s: icerik.s, ikinci_o: icerik.o, ikinci_a: icerik.a, ikinci_p: icerik.p, ...(kaynakAlanlari ? { ikinci_alanlar: ikinciAlanlar } : {}), updated_at: new Date().toISOString() })
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
  // Fields: only when the request carries them or the row has some — and only the ones this note's template owns.
  const alanVar = icerik.alanlar !== undefined || o.dil.alanlar != null || o.dil.ikinci_alanlar != null
  const izinli = alanVar ? izinliAlanlar(await muayeneGetir(supabase, doktorId, o.not.session_id)) : []
  const ekrandaki = icerik.alanlar === undefined ? undefined : alanlariSuz(icerik.alanlar, izinli)
  // What `not_dil_kaydi` must hold afterwards. Only the keys named here are written; null = the row is left alone.
  let dilKaydi: Record<string, unknown> | null = null
  if (!ayni) {
    // The other draft is the one being approved: the two change places, so the draft that is not chosen is kept
    // beside the note. The fields change places with the text: the chosen draft's (as on the screen) become the note's.
    const eski = satirdan(o.not)
    dilKaydi = {
      not_dili: dil as string, ikinci_dil: o.dil.not_dili, ikinci_s: eski.s, ikinci_o: eski.o, ikinci_a: eski.a, ikinci_p: eski.p,
      ...(alanVar ? { alanlar: ekrandaki !== undefined ? ekrandaki : alanlariSuz(o.dil.ikinci_alanlar, izinli), ikinci_alanlar: alanlariSuz(o.dil.alanlar, izinli) } : {}),
    }
  } else if (ekrandaki !== undefined) {
    // Same language: the fields as they stand on the screen.
    dilKaydi = { alanlar: ekrandaki }
  }
  // THE ONE WRITE. Text, approval, fields and the appointment's "done" happen together or not at all; the function
  // itself refuses a note that is already approved (and one that is not this doctor's) without changing anything.
  const { data, error } = await supabase.rpc(NOT_ONAY_ISLEVI, {
    p_note_id: notId, p_doctor_id: doktorId, p_onay_ani: simdi,
    p_s: icerik.s, p_o: icerik.o, p_a: icerik.a, p_p: icerik.p,
    p_dil_kaydi: dilKaydi,
  })
  if (error) return ret('BASARISIZ')
  if (data === 'ONAYLI') return ret('ONAYLI')
  if (data === 'NOT_FOUND') return ret('NOT_FOUND')
  if (data !== 'TAMAM') return ret('BASARISIZ')
  return { tamam: true, onayTarihi: simdi }
}
