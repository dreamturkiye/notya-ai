/**
 * FOTO-ARSIV-01 — the patient photo archive: upload, a viewer, a two-up compare. Country-shaped from the start
 * (migration 148) — not a port of the Turkish `app/doktor/.../fotoArsivi` tree (unreachable on a country build; see
 * docs/OPEN-COMMITMENTS.md → COUNTRY-BUILD-ROUTING-01) and not a port of its ~4,800-line implementation: this is a
 * deliberately smaller v1 (see the component for exactly what v1 leaves out and why).
 *
 * STORAGE AND VIEWING ONLY. NO model ever reads a photo kept here — that is FOTO-ARSIV-02 (AI evaluation), a
 * separate, explicitly not-yet-authorized item (regulatory sign-off outstanding per country). This file calls no
 * model and sends a photo to nobody.
 *
 * UPLOAD IS TWO STEPS, exactly like MUAYENE-EKLERI-07 and the visit recording: the browser puts the bytes straight
 * into the private bucket `hasta-fotograflari`, under its OWN `<country>/<account id>/` folder — then calls this
 * server with the resulting path, the patient, the clinical date and an optional label.
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client:
 *   - the patient id from the request is proven to be this doctor's own (hastaGetir) before anything is read or
 *     written with it;
 *   - a visit id, where one is given, is read WITH the doctor's id in the same statement, and this patient must be
 *     THAT visit's own patient — a photo cannot be filed under a visit of a different patient;
 *   - the upload path is checked as TEXT to be the caller's own country-and-account folder before storage is
 *     touched at all;
 *   - a row id from the request is read WITH the doctor's id in the same statement before it is returned, changed
 *     or removed.
 *
 * HEALTH DATA. The doctor's own free-text label can name a finding ("sol kol — lezyon") and is encrypted with the
 * same helper as the rest of a patient's data, bound to the row's id and the doctor's id.
 */
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { sesKlasoru, sesYoluGecerli as yolKendiKlasorundeMi, ulkeTablosu } from '../uygulama/tablolar'
import { aktifUlke } from '../ulke'
import { hastaGetir } from '../uygulama/hastalar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { gunGecerli, yerelAn } from '../uygulama/zaman'
import { HASTA_FOTO_DOSYA_AZAMI, HASTA_FOTO_KOVASI, HASTA_FOTO_MIME_TURLERI } from '../tipler'

const TABLO = 'ulke_hasta_fotograflari'
const KOLONLAR = 'id, session_id, cekim_tarihi, etiket_encrypted, mime_turu, boyut, depolama_yolu, created_at'
type Satir = { id: string; session_id: string | null; cekim_tarihi: string; etiket_encrypted: string | null; mime_turu: string; boyut: number; depolama_yolu: string; created_at: string }

export type HastaFotosu = { id: string; seansId: string | null; cekimTarihi: string; etiket: string; mimeTuru: string; boyut: number; olusturuldu: string }
export type FotoRetKodu = 'NOT_FOUND' | 'DOSYA_TURU' | 'BUYUK' | 'TARIH_GECERSIZ' | 'BASARISIZ'
const DURUM: Record<FotoRetKodu, number> = { NOT_FOUND: 404, DOSYA_TURU: 400, BUYUK: 400, TARIH_GECERSIZ: 400, BASARISIZ: 500 }
export const FOTO_DURUMU = DURUM
type Ret = { tamam: false; kod: FotoRetKodu }

const SIFRE_T = 'hasta-foto-etiket'
const etiketSifrele = (fotoId: string, doktorId: string, etiket: string): string => encrypt(JSON.stringify({ v: 1, u: aktifUlke(), t: SIFRE_T, k: fotoId, d: doktorId, m: etiket }))
function etiketCoz(ham: unknown, fotoId: string, doktorId: string): string {
  if (typeof ham !== 'string' || !ham) return ''
  try {
    const z = JSON.parse(decrypt(ham)) as { v?: number; u?: string; t?: string; k?: string; d?: string; m?: unknown } | null
    return z && z.v === 1 && z.u === aktifUlke() && z.t === SIFRE_T && z.k === fotoId && z.d === doktorId && typeof z.m === 'string' ? z.m : ''
  } catch { return '' }
}

/** A visit id from the request, proven to belong to THIS doctor AND to this patient. null = neither, or none given. */
async function seansHastaninMi(supabase: SupabaseClient, doktorId: string, hastaId: string, seansId: unknown): Promise<string | null> {
  if (seansId === undefined || seansId === null || seansId === '') return null
  if (typeof seansId !== 'string') return null
  const { data, error } = await ulkeTablosu(supabase, 'ulke_muayeneler').select('id, patient_id').eq('id', seansId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const s = data as unknown as { id: string; patient_id: string | null }
  return s.patient_id === hastaId ? s.id : null
}

const satirdanGoruntu = (s: Satir, doktorId: string): HastaFotosu => ({ id: s.id, seansId: s.session_id, cekimTarihi: s.cekim_tarihi, etiket: etiketCoz(s.etiket_encrypted, s.id, doktorId), mimeTuru: s.mime_turu, boyut: s.boyut, olusturuldu: s.created_at })

/** Registers a photo the browser already put into THIS doctor's own storage folder, against one of THEIR patients. */
export async function fotoKaydet(
  supabase: SupabaseClient, doktorId: string,
  g: { hastaId: string; yol: unknown; mimeTuru: unknown; boyut: unknown; cekimTarihi: unknown; etiket?: unknown; seansId?: unknown },
): Promise<{ tamam: true; id: string } | Ret> {
  // ISOLATION: the patient must be this doctor's before anything else is looked at.
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  if (!yolKendiKlasorundeMi(doktorId, g.yol)) return { tamam: false, kod: 'NOT_FOUND' }
  const mimeTuru = typeof g.mimeTuru === 'string' ? g.mimeTuru.slice(0, 100) : ''
  if (!HASTA_FOTO_MIME_TURLERI.includes(mimeTuru as typeof HASTA_FOTO_MIME_TURLERI[number])) return { tamam: false, kod: 'DOSYA_TURU' }
  const boyut = typeof g.boyut === 'number' && Number.isInteger(g.boyut) ? g.boyut : 0
  if (boyut <= 0 || boyut > HASTA_FOTO_DOSYA_AZAMI) return { tamam: false, kod: 'BUYUK' }
  // "Not in the future" is read in the ACCOUNT's own time zone (a country may have several), never the server's clock.
  const bugun = yerelAn(Date.now(), await hesapSaatDilimi(supabase, doktorId)).gun
  const cekimTarihi = typeof g.cekimTarihi === 'string' && gunGecerli(g.cekimTarihi) ? g.cekimTarihi : ''
  if (!cekimTarihi || cekimTarihi > bugun) return { tamam: false, kod: 'TARIH_GECERSIZ' }
  const etiket = typeof g.etiket === 'string' ? g.etiket.trim().slice(0, 300) : ''
  // A visit id that is not this patient's own visit is dropped silently (filed with no visit link) rather than refused:
  // the photo itself is valid, it is only the optional link that does not hold.
  const seansId = await seansHastaninMi(supabase, doktorId, hasta.id, g.seansId)

  const sililecek = async () => { try { await supabase.storage.from(HASTA_FOTO_KOVASI).remove([g.yol as string]) } catch { /* nothing more to do */ } }
  const { data: nesne, error: nesneHatasi } = await supabase.storage.from(HASTA_FOTO_KOVASI).info(g.yol as string)
  if (nesneHatasi || !nesne || typeof nesne.size !== 'number' || nesne.size !== boyut) { await sililecek(); return { tamam: false, kod: 'BUYUK' } }

  const id = randomUUID()
  const an = new Date().toISOString()
  const { error } = await ulkeTablosu(supabase, TABLO).insert({
    id, doctor_id: doktorId, patient_id: hasta.id, session_id: seansId,
    cekim_tarihi: cekimTarihi, etiket_encrypted: etiket ? etiketSifrele(id, doktorId, etiket) : null,
    mime_turu: mimeTuru, boyut, depolama_yolu: g.yol as string, created_at: an, updated_at: an,
  })
  if (error) { await sililecek(); return { tamam: false, kod: 'BASARISIZ' } }
  return { tamam: true, id }
}

/** The photos of one of THIS doctor's patients, newest clinical date first. null = not this doctor's patient. */
export async function hastaninFotolari(supabase: SupabaseClient, doktorId: string, hastaId: string): Promise<HastaFotosu[] | null> {
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data, error } = await ulkeTablosu(supabase, TABLO).select(KOLONLAR).eq('doctor_id', doktorId).eq('patient_id', hasta.id).order('cekim_tarihi', { ascending: false }).order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as unknown as Satir[]).map((s) => satirdanGoruntu(s, doktorId))
}

/** The doctor corrects the label or the clinical date of one of THEIR OWN photos. Everything else about a row is fixed. */
export async function fotoDuzenle(supabase: SupabaseClient, doktorId: string, fotoId: string, g: { cekimTarihi?: unknown; etiket?: unknown }): Promise<{ tamam: true } | Ret> {
  const { data, error: okumaHatasi } = await ulkeTablosu(supabase, TABLO).select('id').eq('id', fotoId).eq('doctor_id', doktorId).maybeSingle()
  if (okumaHatasi) return { tamam: false, kod: 'BASARISIZ' }
  if (!data) return { tamam: false, kod: 'NOT_FOUND' }
  const degerler: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (g.cekimTarihi !== undefined) {
    const bugun = yerelAn(Date.now(), await hesapSaatDilimi(supabase, doktorId)).gun
    if (typeof g.cekimTarihi !== 'string' || !gunGecerli(g.cekimTarihi) || g.cekimTarihi > bugun) return { tamam: false, kod: 'TARIH_GECERSIZ' }
    degerler.cekim_tarihi = g.cekimTarihi
  }
  if (g.etiket !== undefined) {
    const etiket = typeof g.etiket === 'string' ? g.etiket.trim().slice(0, 300) : ''
    degerler.etiket_encrypted = etiket ? etiketSifrele(fotoId, doktorId, etiket) : null
  }
  const { error } = await ulkeTablosu(supabase, TABLO).update(degerler).eq('id', fotoId).eq('doctor_id', doktorId)
  return error ? { tamam: false, kod: 'BASARISIZ' } : { tamam: true }
}

/** A short-lived signed URL for one of THIS doctor's own photos. null = not this doctor's row, or the URL could not be made. */
export async function fotoGoruntuBaglantisi(supabase: SupabaseClient, doktorId: string, fotoId: string): Promise<string | null> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('depolama_yolu').eq('id', fotoId).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return null
  const yol = (data as unknown as { depolama_yolu: string }).depolama_yolu
  const { data: imzali, error: imzaHatasi } = await supabase.storage.from(HASTA_FOTO_KOVASI).createSignedUrl(yol, 300)
  return imzaHatasi || !imzali?.signedUrl ? null : imzali.signedUrl
}

/** Removes one of THIS doctor's own photos — the row and, best-effort, the object. */
export async function fotoSil(supabase: SupabaseClient, doktorId: string, fotoId: string): Promise<{ tamam: true } | Ret> {
  const { data, error } = await ulkeTablosu(supabase, TABLO).select('depolama_yolu').eq('id', fotoId).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  if (!data) return { tamam: false, kod: 'NOT_FOUND' }
  const yol = (data as unknown as { depolama_yolu: string }).depolama_yolu
  const { error: silmeHatasi } = await ulkeTablosu(supabase, TABLO).delete().eq('id', fotoId).eq('doctor_id', doktorId)
  if (silmeHatasi) return { tamam: false, kod: 'BASARISIZ' }
  try { await supabase.storage.from(HASTA_FOTO_KOVASI).remove([yol]) } catch { /* the row is gone; the object is now unreachable through this account regardless */ }
  return { tamam: true }
}

/** The folder a file MUST be uploaded into: this account's own, under this build's country. Client-safe. */
export const fotoKlasoru = sesKlasoru
