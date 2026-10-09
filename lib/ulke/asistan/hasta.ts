/**
 * NOTYA-ULKE-ASISTAN-01 — THE PATIENT MODE: what the assistant is given about ONE patient. Server only.
 *
 *   WHO     a patient the caller has already proven to be THIS doctor's (`hasta` comes from hastaGetir, read with the
 *           doctor's id). Every statement below carries the doctor's id again, and the patient's id with it.
 *   WHAT    the date of birth and the sex (for the pack's own sentence about age and sex), and the patient's latest
 *           APPROVED notes — as many as the pack says (`hastaModu.notSayisi`), each cut to the pack's length.
 *   NEVER   a name, a phone number, an identity number, an id of any kind; a DRAFT note, a second draft, a
 *           transcript, an intake form's answers, a kept tool result, anything of another patient.
 *
 * AN APPROVED NOTE ONLY. "Approved" is asked of the database in the statement (`approved_at` is not null) and
 * checked again on the note as the note library reads it (lib/ulke/uygulama/notlar.ts → notGetir), which also proves
 * once more that the note is this doctor's, that its visit is this doctor's and that its visit's patient is THIS
 * patient — and applies the leak rule to the role fields (a field the note's template does not own is not read).
 *
 * The pack writes the message that carries this to the model (`hastaGirdisi`); nothing here is a sentence.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotIcerigi } from '../tipler'
import { ulkeGunu } from '../uygulama/gun'
import type { Hasta } from '../uygulama/hastalar'
import { notGetir } from '../uygulama/notlar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import type { AsistanHastaModu, AsistanHastaVerisi } from './tipler'

/** One note, cut so that all of its text together is no longer than `azami` characters. Sections first, then fields. */
export function notuKirp(icerik: NotIcerigi, azami: number): NotIcerigi {
  let kalan = Math.max(0, Math.floor(azami))
  const al = (metin: string): string => { const t = metin.slice(0, kalan); kalan -= t.length; return t }
  const kirpik: NotIcerigi = { s: al(icerik.s), o: al(icerik.o), a: al(icerik.a), p: al(icerik.p) }
  const alanlar: Record<string, string> = {}
  for (const [k, v] of Object.entries(icerik.alanlar ?? {})) { const t = al(v); if (t) alanlar[k] = t }
  return Object.keys(alanlar).length ? { ...kirpik, alanlar } : kirpik
}

export async function asistanHastaVerisi(supabase: SupabaseClient, doktorId: string, hasta: Pick<Hasta, 'id' | 'dogumTarihi' | 'cinsiyet'>, ayar: AsistanHastaModu, simdi: number = Date.now()): Promise<AsistanHastaVerisi> {
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const veri: AsistanHastaVerisi = { dogumTarihi: hasta.dogumTarihi, cinsiyet: hasta.cinsiyet, bugun: ulkeGunu(new Date(simdi), dilim), notlar: [] }
  const adet = Number.isInteger(ayar.notSayisi) && ayar.notSayisi > 0 ? ayar.notSayisi : 0
  if (!adet) return veri

  // The visits of THIS patient with THIS doctor.
  const { data: seanslar, error: seansHatasi } = await ulkeTablosu(supabase, 'ulke_muayeneler').select('id').eq('doctor_id', doktorId).eq('patient_id', hasta.id)
  const seansIdleri = seansHatasi ? [] : ((seanslar as unknown as { id: string }[] | null) ?? []).map((s) => s.id).filter(Boolean)
  if (!seansIdleri.length) return veri

  // Their APPROVED notes, latest approval first. A draft is not in the answer of this statement at all.
  const { data: notlar, error: notHatasi } = await ulkeTablosu(supabase, 'ulke_notlar').select('id, approved_at').eq('doctor_id', doktorId).in('session_id', seansIdleri).not('approved_at', 'is', null).order('approved_at', { ascending: false }).limit(adet)
  if (notHatasi) return veri

  const secilen: { tarih: string; icerik: NotIcerigi }[] = []
  for (const s of ((notlar as unknown as { id: string; approved_at: string | null }[] | null) ?? [])) {
    // Read once more through the note library: this doctor's note, approved, of a visit of THIS patient.
    const n = await notGetir(supabase, doktorId, s.id)
    if (!n || !n.onayli || n.muayene.hasta?.id !== hasta.id) continue
    const baslangic = new Date(n.muayene.baslangic)
    secilen.push({ tarih: Number.isNaN(baslangic.getTime()) ? '' : ulkeGunu(baslangic, dilim), icerik: notuKirp(n.icerik, ayar.notAzamiKarakter) })
  }
  return { ...veri, notlar: secilen }
}
