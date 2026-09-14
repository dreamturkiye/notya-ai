/**
 * NOTYA-GUNUN-NOTU-01 (Kaan 2026-09-14): M-CHAT-R/F ve Gelişim Taraması ortak ihtiyacı —
 * "Bitti düğmesine bastıktan sonra muayene formuna doğrudan sonucu eklesin." İkisi de aynı
 * mantığı kullanıyor: bugünkü (created_at bugünün tarihi) seansın notunu bul, değerlendirme
 * bölümüne bir satır ekle, öğrenme loguna yaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface GununNotunaEkleSonuc { eklendi: boolean; notId: string | null; sebep?: string }

export async function gununNotunaEkle(
  supabase: SupabaseClient,
  doktorId: string,
  patientId: string,
  ekSatir: string,
): Promise<GununNotunaEkleSonuc> {
  const bugunBasi = new Date(); bugunBasi.setHours(0, 0, 0, 0)
  const { data: seanslar } = await supabase
    .from('sessions').select('id, created_at').eq('doctor_id', doktorId).eq('patient_id', patientId)
    .gte('created_at', bugunBasi.toISOString()).order('created_at', { ascending: false }).limit(5)
  if (!seanslar?.length) return { eklendi: false, notId: null, sebep: 'Bugün bu hastaya ait bir muayene bulunamadı.' }

  const seansIdler = seanslar.map((s) => s.id)
  const { data: notlar } = await supabase
    .from('notes').select('id, content_degerlendirme, session_id').in('session_id', seansIdler)
    .order('created_at', { ascending: false }).limit(1)
  const not = notlar?.[0]
  if (!not) return { eklendi: false, notId: null, sebep: 'Bugünkü muayenenin henüz bir notu yok.' }

  const eskiMetin = String(not.content_degerlendirme || '')
  const yeniMetin = eskiMetin.trim() ? `${eskiMetin.trim()}\n${ekSatir}` : ekSatir
  const { error } = await supabase.from('notes').update({ content_degerlendirme: yeniMetin }).eq('id', not.id)
  if (error) return { eklendi: false, notId: not.id, sebep: error.message }

  await supabase.from('not_duzenlemeleri').insert({
    note_id: not.id, doctor_id: doktorId, alan: 'content_degerlendirme',
    onceki: eskiMetin.slice(0, 2000), sonraki: yeniMetin.slice(0, 2000),
  }).then(() => {}, () => {}) // log kritik değil

  return { eklendi: true, notId: not.id }
}
