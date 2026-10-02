/**
 * NOTYA-AYSE-GERI-03 — free slots of a day ("Yarın hangi saatler boş?", "Cuma müsait saatlerim").
 *
 * A calendar READ, answered without the model like the rest of the calendar reader: the doctor's working hours of
 * that weekday (doktor_calisma_saatleri, the same row the calendar page edits; 09:00–18:00 on weekdays when the
 * doctor never touched the setting) minus the day's non-cancelled appointments. Only ranges at least one slot long
 * are listed. Nothing is invented: a day marked closed is said to be closed, and its appointments are still shown.
 *
 * Isolation: both reads are scoped by doktor_id.
 * Timezone: appointment times arrive in the doctor's timezone (doktorunGununuOku); the working hours are wall-clock
 * values the doctor typed. For a doctor in Turkey the two agree; for a doctor abroad the working hours are read as
 * wall-clock in the same timezone as the list (see docs/ayse-restoration-report.md, UNVERIFIED).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { kisaTarihEtiketi, saatDakika, tarihEtiketi, type GunlukSatir } from '@/lib/randevu/gunlukOzet'
import { bugunTz, gunKaydirTz, isoSaatTz, saatDilimiSec } from '@/lib/randevu/tarihCozumle'

export interface CalismaGunu { acik: boolean; baslangic: string; bitis: string; slotDk: number }
export interface BosAralik { bas: string; bit: string }

const VARSAYILAN: CalismaGunu = { acik: true, baslangic: '09:00', bitis: '18:00', slotDk: 20 }

/** "hangi saatler boş", "boş saatlerim", "müsait saat var mı", "ne zaman boşum", "boşluk var mı". */
export function bosSaatSorusuMu(mesaj: string | null | undefined): boolean {
  const n = ` ${trAramaNormalize(String(mesaj || '')).replace(/[?!.,;:’'"]+/g, ' ').replace(/\s+/g, ' ').trim()} `
  return /\b(hangi|kac) saat\w* (bos|musait|uygun)\w*|\b(bos|musait|uygun) (saat|yer|aralik|zaman)\w*|\bboslu[gk]\w*|\bne zaman (bos|musait|uygun)\w*|\bsaat\w* kac\w* (bos|musait)\w*/.test(n)
}

const dk = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

/** Weekday of a YYYY-MM-DD in the JS getDay convention (0 = Sunday), calendar arithmetic only. */
function haftaGunu(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay()
}

/** The doctor's working window for that calendar day. A missing row or a malformed day falls back to the default week. */
export async function doktorCalismaGunu(supabase: SupabaseClient, doktorId: string, tarih: string): Promise<CalismaGunu> {
  const gun = haftaGunu(tarih)
  const haftaIci = gun >= 1 && gun <= 5
  const yedek: CalismaGunu = { ...VARSAYILAN, acik: haftaIci }
  try {
    const { data } = await supabase.from('doktor_calisma_saatleri').select('gunler, slot_dakika').eq('doktor_id', doktorId).maybeSingle()
    const satir = data as { gunler?: Record<string, { acik?: unknown; baslangic?: unknown; bitis?: unknown }> | null; slot_dakika?: unknown } | null
    const g = satir?.gunler?.[String(gun)]
    if (!g) return yedek
    const bas = String(g.baslangic || '')
    const bit = String(g.bitis || '')
    if (saatDakika(bas) == null || saatDakika(bit) == null || (saatDakika(bit) as number) <= (saatDakika(bas) as number)) return yedek
    const slot = Number(satir?.slot_dakika)
    return { acik: g.acik === true, baslangic: bas, bitis: bit, slotDk: Number.isFinite(slot) && slot >= 5 && slot <= 240 ? slot : VARSAYILAN.slotDk }
  } catch {
    return yedek
  }
}

/**
 * Working window minus the appointments. `enErken` (minutes from midnight) clips the start — for today, the ranges
 * begin at the current time, rounded up to the slot.
 */
export function bosAraliklar(satirlar: GunlukSatir[], gun: CalismaGunu, enErken?: number | null): BosAralik[] {
  const pencereBas = saatDakika(gun.baslangic)
  const pencereBit = saatDakika(gun.bitis)
  if (!gun.acik || pencereBas == null || pencereBit == null) return []
  let imlec = pencereBas
  if (enErken != null && enErken > imlec) imlec = Math.min(pencereBit, Math.ceil(enErken / gun.slotDk) * gun.slotDk)
  const dolu = satirlar
    .map((s) => ({ bas: saatDakika(s.saat), bit: saatDakika(s.bitisSaat) }))
    .filter((d): d is { bas: number; bit: number } => d.bas != null && d.bit != null)
    .sort((a, b) => a.bas - b.bas)
  const bos: BosAralik[] = []
  for (const d of dolu) {
    if (d.bit <= imlec) continue
    if (d.bas >= pencereBit) break
    if (d.bas - imlec >= gun.slotDk) bos.push({ bas: dk(imlec), bit: dk(Math.min(d.bas, pencereBit)) })
    imlec = Math.max(imlec, d.bit)
  }
  if (pencereBit - imlec >= gun.slotDk) bos.push({ bas: dk(imlec), bit: dk(pencereBit) })
  return bos
}

/** Screen and spoken answer for the free slots of `tarih`. */
export function bosSaatMetni(g: { tarih: string; satirlar: GunlukSatir[]; gun: CalismaGunu; tz?: string | null; simdi?: Date }): { metin: string; konusma: string } {
  const tz = saatDilimiSec(g.tz)
  const bugun = g.tarih === bugunTz(tz, g.simdi)
  const yarin = g.tarih === gunKaydirTz(1, tz, g.simdi)
  const tam = tarihEtiketi(g.tarih)
  const kisa = kisaTarihEtiketi(g.tarih)
  const sozGun = bugun ? `Bugün, ${kisa},` : yarin ? `Yarın, ${kisa},` : kisa
  const n = g.satirlar.length
  const randevu = n ? `${n} randevu var` : 'randevu yok'
  if (!g.gun.acik) {
    return {
      metin: `${tam} çalışma günü olarak işaretli değil; takvimde ${randevu}.`,
      konusma: `${sozGun} çalışma gününüz olarak işaretli değil Hocam; takviminizde ${randevu}.`,
    }
  }
  const simdiDk = bugun ? saatDakika(isoSaatTz((g.simdi ?? new Date()).toISOString(), tz)) : null
  const bos = bosAraliklar(g.satirlar, g.gun, simdiDk)
  const pencere = `çalışma saatleri ${g.gun.baslangic}–${g.gun.bitis}`
  // The screen text keeps the "takviminde … randevu" shape so a follow-up ("peki cuma?") continues the calendar lookup.
  if (!bos.length) {
    return {
      metin: `${tam} takviminde ${randevu}; boş saat kalmadı (${pencere}).`,
      konusma: `${sozGun} boş saatiniz kalmadı Hocam.`,
    }
  }
  const liste = bos.map((b) => `${b.bas}–${b.bit}`)
  const sozListe = liste.length <= 3 ? liste.join(', ') : `${liste.slice(0, 3).join(', ')} ve ${liste.length - 3} aralık daha, ekranınızda`
  return {
    metin: `${tam} takviminde ${randevu}; boş saatler (${pencere}): ${liste.join(', ')}.`,
    konusma: `${sozGun} boş saatleriniz Hocam: ${sozListe}.`,
  }
}
