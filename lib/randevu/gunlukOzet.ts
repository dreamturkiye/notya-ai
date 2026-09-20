/**
 * Doctor-day appointment summary — what Ayşe reads back and the form lists.
 *
 * Isolation: randevular are always .eq('doktor_id'); names come from that doctor's
 * patients row or hasta_adi_serbest on the same booking. Never another doctor's day.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaAdiCoz } from '@/core/eylemler/hasta'
export interface GunlukSatir {
  saat: string
  bitisSaat: string
  hastaAdi: string
  tur: string
}

export function saatDakika(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm || '').trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function slotlarCakisiyorMu(aBas: string, aBit: string, bBas: string, bBit: string): boolean {
  const a0 = saatDakika(aBas)
  const a1 = saatDakika(aBit)
  const b0 = saatDakika(bBas)
  const b1 = saatDakika(bBit)
  if (a0 == null || a1 == null || b0 == null || b1 == null) return false
  return a0 < b1 && a1 > b0
}

export function bitisSaati(saat: string, sureDk: number): string {
  const bas = saatDakika(saat)
  if (bas == null) return saat
  const bit = Math.min(bas + Math.max(5, sureDk || 20), 24 * 60 - 1)
  const h = Math.floor(bit / 60)
  const m = bit % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function gunlukOzetMetni(g: {
  tarih: string
  satirlar: GunlukSatir[]
  istenenSaat?: string | null
  istenenSureDk?: number
}): { metin: string; cakisiyor: boolean; cakisan?: GunlukSatir } {
  const tarih = g.tarih
  if (!g.satirlar.length) {
    const slot = g.istenenSaat ? ` İstediğiniz ${g.istenenSaat} boş.` : ''
    return { metin: `${tarih} takviminde randevu yok.${slot}`, cakisiyor: false }
  }
  const liste = g.satirlar
    .map((s) => `${s.saat}–${s.bitisSaat} ${s.hastaAdi} (${s.tur})`)
    .join('; ')
  let cakisiyor = false
  let cakisan: GunlukSatir | undefined
  if (g.istenenSaat && saatDakika(g.istenenSaat) != null) {
    const bit = bitisSaati(g.istenenSaat, g.istenenSureDk || 20)
    cakisan = g.satirlar.find((s) => slotlarCakisiyorMu(g.istenenSaat!, bit, s.saat, s.bitisSaat))
    cakisiyor = Boolean(cakisan)
  }
  const kafa = `${tarih} takviminde ${g.satirlar.length} randevu: ${liste}.`
  if (!g.istenenSaat) return { metin: kafa, cakisiyor: false }
  if (cakisiyor && cakisan) {
    return {
      metin: `${kafa} İstediğiniz ${g.istenenSaat} DOLU — ${cakisan.hastaAdi} (${cakisan.saat}–${cakisan.bitisSaat}). Başka saat söyleyin veya kartı yine onaylarsanız çakışmayı siz seçersiniz.`,
      cakisiyor: true,
      cakisan,
    }
  }
  return { metin: `${kafa} İstediğiniz ${g.istenenSaat} boş.`, cakisiyor: false }
}

export function isoTrtSaat(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
  } catch {
    return '?'
  }
}

const TUR: Record<string, string> = { muayene: 'muayene', kontrol: 'kontrol', ilk_muayene: 'ilk muayene', diger: 'diğer' }

/** Doctor-scoped day list. `tarih` = YYYY-MM-DD in TRT. */
export async function doktorunGununuOku(
  supabase: SupabaseClient,
  doktorId: string,
  tarih: string
): Promise<GunlukSatir[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return []
  const bas = new Date(`${tarih}T00:00:00+03:00`).toISOString()
  const bit = new Date(`${tarih}T23:59:59+03:00`).toISOString()
  const { data, error } = await supabase
    .from('randevular')
    .select('baslangic, bitis, tur, durum, patient_id, hasta_adi_serbest')
    .eq('doktor_id', doktorId)
    .neq('durum', 'iptal')
    .lt('baslangic', bit)
    .gt('bitis', bas)
    .order('baslangic', { ascending: true })
    .limit(40)
  if (error || !data?.length) return []
  const pidler = [...new Set(data.map((r) => r.patient_id).filter(Boolean))] as string[]
  const adlar = new Map<string, string>()
  if (pidler.length) {
    const { data: hastalar } = await supabase
      .from('patients')
      .select('id, name_encrypted')
      .eq('doctor_id', doktorId)
      .in('id', pidler)
    for (const h of hastalar || []) adlar.set(String(h.id), hastaAdiCoz(h.name_encrypted as string | null))
  }
  return data.map((r) => ({
    saat: isoTrtSaat(String(r.baslangic)),
    bitisSaat: isoTrtSaat(String(r.bitis)),
    hastaAdi: (r.patient_id && adlar.get(String(r.patient_id))) || String(r.hasta_adi_serbest || '').trim() || 'Hasta',
    tur: TUR[String(r.tur)] || String(r.tur || 'randevu'),
  }))
}
