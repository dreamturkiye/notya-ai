/**
 * NOTYA-GUNUN-NOTU-01 (Kaan 2026-09-14): M-CHAT-R/F ve Gelişim Taraması ortak ihtiyacı —
 * "Bitti düğmesine bastıktan sonra muayene formuna doğrudan sonucu eklesin." İkisi de aynı
 * mantığı kullanıyor: bugünkü (created_at bugünün tarihi) seansın notunu bul, değerlendirme
 * bölümüne bir satır ekle, öğrenme loguna yaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'

export interface GununNotunaEkleSonuc { eklendi: boolean; notId: string | null; sebep?: string }

export async function gununNotunaEkle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string,
  ekSatir: string,
  alan: 'content_degerlendirme' | 'content_subjektif' | 'content_objektif' = 'content_degerlendirme',
): Promise<GununNotunaEkleSonuc> {
  const bugunBasi = new Date(); bugunBasi.setHours(0, 0, 0, 0)
  // NOTYA-ARSIV-01: arşivlenmiş bir muayene "bugünkü not" sayılmaz — sonuç ona yazılmaz.
  const { data: seanslar } = await arsivsizSeanslar(supabase, 'id, created_at').eq('doctor_id', doktorId).eq('patient_id', patientId)
    .gte('created_at', bugunBasi.toISOString()).order('created_at', { ascending: false }).limit(5)
  if (!seanslar?.length) return { eklendi: false, notId: null, sebep: 'Bugün bu hastaya ait bir muayene bulunamadı.' }

  const seansIdler = seanslar.map((s: { id: string }) => s.id)
  const { data: notlar } = await arsivsizNotlar(supabase, 'id, content_degerlendirme, content_subjektif, content_objektif, session_id').in('session_id', seansIdler)
    .order('created_at', { ascending: false }).limit(1)
  const not = notlar?.[0]
  if (!not) return { eklendi: false, notId: null, sebep: 'Bugünkü muayenenin henüz bir notu yok.' }

  const eskiMetin = String((not as Record<string, unknown>)[alan] || '')
  const yeniMetin = eskiMetin.trim() ? `${eskiMetin.trim()}\n${ekSatir}` : ekSatir
  const { error } = await supabase.from('notes').update({ [alan]: yeniMetin }).eq('id', not.id)
  if (error) { console.error('[gununNotunaEkle]', error.message); return { eklendi: false, notId: not.id, sebep: 'Not güncellenemedi. Lütfen tekrar deneyin.' } }

  await supabase.from('not_duzenlemeleri').insert({
    note_id: not.id, doctor_id: doktorId, alan,
    onceki: eskiMetin.slice(0, 2000), sonraki: yeniMetin.slice(0, 2000),
  }).then(() => {}, () => {}) // log kritik değil

  return { eklendi: true, notId: not.id }
}

/**
 * NOTYA-EYLEM — the same "today's note" resolution, for the vitaller JSONB.
 *
 * Measurements are not their own table: boy / kilo / baş çevresi / vitals live in `notes.vitaller`,
 * and the büyüme eğrileri endpoint recomputes the curves from approved notes. So "record a
 * measurement" means merging keys into today's note, exactly where the İnceleme form and Cihaz
 * Köprüsü put them — not opening a parallel store.
 *
 * `basCevresi` is pediatric; the caller gates it (BRANS-ALAN-SIZMASI) and this function does not
 * second-guess which keys it is handed.
 */
export interface VitalEkleSonuc extends GununNotunaEkleSonuc {
  once: Record<string, unknown> | null
  sonra: Record<string, unknown> | null
}

export async function gununNotunaVitalEkle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string,
  vitaller: Record<string, unknown>,
): Promise<VitalEkleSonuc> {
  const bugunBasi = new Date(); bugunBasi.setHours(0, 0, 0, 0)
  const { data: seanslar } = await arsivsizSeanslar(supabase, 'id, created_at').eq('doctor_id', doktorId).eq('patient_id', patientId)
    .gte('created_at', bugunBasi.toISOString()).order('created_at', { ascending: false }).limit(5)
  if (!seanslar?.length) return { eklendi: false, notId: null, once: null, sonra: null, sebep: 'Bugün bu hastaya ait bir muayene bulunamadı.' }

  const { data: notlar } = await arsivsizNotlar(supabase, 'id, vitaller').in('session_id', seanslar.map((s: { id: string }) => s.id))
    .order('created_at', { ascending: false }).limit(1)
  const not = notlar?.[0]
  if (!not) return { eklendi: false, notId: null, once: null, sonra: null, sebep: 'Bugünkü muayenenin henüz bir notu yok.' }

  const once = (not.vitaller && typeof not.vitaller === 'object' ? not.vitaller : {}) as Record<string, unknown>
  const sonra = { ...once, ...vitaller }
  const { error } = await supabase.from('notes').update({ vitaller: sonra }).eq('id', not.id)
  if (error) { console.error('[gununNotunaEkle] vitaller', error.message); return { eklendi: false, notId: not.id, once, sonra: null, sebep: 'Ölçümler nota yazılamadı. Lütfen tekrar deneyin.' } }
  return { eklendi: true, notId: not.id, once, sonra }
}

/** Undo for the above: put the previous vitaller blob back on the same note. */
export async function notVitalleriGeriYukle(
  supabase: SupabaseClient,
  notId: string,
  once: Record<string, unknown> | null,
): Promise<void> {
  await supabase.from('notes').update({ vitaller: once ?? {} }).eq('id', notId)
}
