/**
 * Doctor-day appointment summary — what Ayşe reads back and the form lists.
 *
 * Isolation: randevular are always .eq('doktor_id'); names come from that doctor's
 * patients row or hasta_adi_serbest on the same booking. Never another doctor's day.
 *
 * NOTYA-TAKVIM-TZ-01 (2026-09-29): the day's boundaries and the spoken "Bugün / Yarın" are computed in
 * the doctor's timezone (`tz`, IANA); callers without one keep TRT. Slot times are shown in that same tz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaAdiCoz } from '@/core/eylemler/hasta'
import { bugunTz, gunKaydirTz, gunSinirlariUtc, isoSaatTz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'
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

/** "2026-09-25" → "25 Eylül 2026 Cuma" (what Ayşe says / shows). Anything else passes through. */
export function tarihEtiketi(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(d)
}

/** "2026-09-30" → "30 Eylül Çarşamba" — the spoken form names the resolved day, not only "Yarın". */
export function kisaTarihEtiketi(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'long', weekday: 'long' }).format(d)
}

export function gunlukOzetMetni(g: {
  tarih: string
  satirlar: GunlukSatir[]
  istenenSaat?: string | null
  istenenSureDk?: number
}): { metin: string; cakisiyor: boolean; cakisan?: GunlukSatir } {
  const tarih = tarihEtiketi(g.tarih)
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

/**
 * Spoken form of the day list. The screen keeps every slot (`gunlukOzetMetni`);
 * voice is at most two sentences so Fish / ElevenLabs actually start.
 */
export function gunlukKonusmaMetni(g: {
  tarih: string
  satirlar: GunlukSatir[]
  istenenSaat?: string | null
  cakisiyor?: boolean
  cakisan?: GunlukSatir
  /** Doctor's IANA timezone; decides whether `tarih` is "Bugün" / "Yarın". Default TRT. */
  tz?: string | null
  simdi?: Date
}): string {
  const tz = saatDilimiSec(g.tz)
  const bugun = g.tarih === bugunTz(tz, g.simdi)
  const yarin = g.tarih === gunKaydirTz(1, tz, g.simdi)
  const etiket = kisaTarihEtiketi(g.tarih)
  const gun = bugun ? `Bugün, ${etiket},` : yarin ? `Yarın, ${etiket},` : etiket
  const n = g.satirlar.length
  if (!n) {
    const slot = g.istenenSaat ? ` İstediğiniz ${g.istenenSaat} boş.` : ''
    return `${gun} takviminizde randevu yok Hocam.${slot}`
  }
  const ilk = g.satirlar[0]
  let soz = n === 1
    ? `${gun} 1 randevu var Hocam: ${ilk.saat} ${ilk.hastaAdi} ${ilk.tur}.`
    : `${gun} ${n} randevu var Hocam. İlki ${ilk.saat} ${ilk.hastaAdi}.`
  if (n === 2) soz += ` İkincisi ${g.satirlar[1].saat} ${g.satirlar[1].hastaAdi}.`
  else if (n >= 3) soz += ' Ayrıntı ekranınızda.'
  if (g.istenenSaat && g.cakisiyor && g.cakisan) soz += ` ${g.istenenSaat} dolu — ${g.cakisan.hastaAdi}.`
  else if (g.istenenSaat && !g.cakisiyor) soz += ` ${g.istenenSaat} boş.`
  return soz.replace(/\s+/g, ' ').trim()
}

export function isoTrtSaat(iso: string): string {
  return isoSaatTz(iso, 'Europe/Istanbul')
}

const TUR: Record<string, string> = { muayene: 'muayene', kontrol: 'kontrol', ilk_muayene: 'ilk muayene', diger: 'diğer' }

/** Doctor-scoped day list. `tarih` = YYYY-MM-DD in the doctor's timezone `tz` (default TRT); day boundaries and slot times follow it. */
export async function doktorunGununuOku(
  supabase: SupabaseClient,
  doktorId: string,
  tarih: string,
  tz?: string | null,
): Promise<GunlukSatir[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return []
  const dilim = saatDilimiSec(tz)
  const { bas, bit } = gunSinirlariUtc(tarih, dilim)
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
    saat: isoSaatTz(String(r.baslangic), dilim),
    bitisSaat: isoSaatTz(String(r.bitis), dilim),
    hastaAdi: (r.patient_id && adlar.get(String(r.patient_id))) || String(r.hasta_adi_serbest || '').trim() || 'Hasta',
    tur: TUR[String(r.tur)] || String(r.tur || 'randevu'),
  }))
}
