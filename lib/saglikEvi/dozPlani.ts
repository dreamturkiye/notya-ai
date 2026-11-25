/**
 * HASTA-PORTALI-GUNLUK — Doz Takvimi math: turning the doctor's "kullanım sıklığı" text into suggested times, the slots
 * of a day, each slot's state, adherence %, and the "two missed days" rule. Pure, no I/O.
 *
 * Nothing here computes a dose. The dose text is shown exactly as the doctor wrote it; times are a suggestion the
 * patient can move.
 */
import type { DozKaydi, DozPlani, SlotDurumu } from './tipler'
import { gunEkle, haftaGunu, trGun, trSaatAni } from './zaman'

/** A slot is "due now" from 60 min before to 3 h after its time; later without a record = missed. */
export const ERKEN_DK = 60
export const GEC_DK = 180
export const ERTELE_DK = 30

const ASCII: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
const sade = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => ASCII[c] || c)

/**
 * "2x1", "günde 2 kez", "1*1", "sabah-akşam", "12 saatte bir", "haftada 1", "gerektiğinde", "ateş olursa" …
 * → suggested 'HH:MM' times (Türkiye), as-needed flag, weekly flag.
 */
export function siklikCoz(ham: string | null | undefined): { saatler: string[]; gerektikce: boolean; haftalik: boolean } {
  const s = sade(String(ham || '')).trim()
  if (!s) return { saatler: ['09:00'], gerektikce: false, haftalik: false }
  if (/gerekti|gerekirse|luzum|ihtiyac|agri ol|ates ol|ates cik|kriz|prn\b|lzm/.test(s)) return { saatler: [], gerektikce: true, haftalik: false }
  if (/haftada|haftalik|hafta da/.test(s)) return { saatler: ['09:00'], gerektikce: false, haftalik: true }
  const aralik = s.match(/(\d{1,2})\s*saat(te|de)?\s*(bir|1)/)
  if (aralik) {
    const h = Number(aralik[1])
    if (h === 6) return { saatler: ['00:00', '06:00', '12:00', '18:00'], gerektikce: false, haftalik: false }
    if (h === 8) return { saatler: ['06:00', '14:00', '22:00'], gerektikce: false, haftalik: false }
    if (h === 12) return { saatler: ['08:00', '20:00'], gerektikce: false, haftalik: false }
    if (h === 24) return { saatler: ['09:00'], gerektikce: false, haftalik: false }
  }
  const kelimeler: Array<[RegExp, string]> = [[/sabah/, '08:00'], [/ogle/, '13:00'], [/aksam/, '20:00'], [/gece|yatmadan|yatarken/, '22:00']]
  const kelimeSaat = kelimeler.filter(([r]) => r.test(s)).map(([, t]) => t)
  if (kelimeSaat.length) return { saatler: kelimeSaat, gerektikce: false, haftalik: false }
  const carpim = s.match(/(\d)\s*[x*×]\s*\d/) || s.match(/gunde\s*(\d)/) || s.match(/(\d)\s*(kez|defa|kere)/)
  const n = carpim ? Number(carpim[1]) : 1
  const tablo: Record<number, string[]> = { 1: ['09:00'], 2: ['08:00', '20:00'], 3: ['08:00', '14:00', '20:00'], 4: ['08:00', '12:00', '16:00', '20:00'] }
  return { saatler: tablo[n] || tablo[1], gerektikce: false, haftalik: false }
}

/** Is the plan in effect on this Türkiye day? */
export function plandaMi(p: DozPlani, gun: string): boolean {
  if (!p.aktif || p.gerektikce) return false
  if (p.baslangic && gun < p.baslangic) return false
  if (p.bitis && gun > p.bitis) return false
  if (p.haftaGunu != null && haftaGunu(gun) !== p.haftaGunu) return false
  return true
}

/** Scheduled instants of a plan on one day. */
export function gunSlotlari(p: DozPlani, gun: string): string[] {
  return plandaMi(p, gun) ? [...p.saatler].sort().map((s) => trSaatAni(gun, s)) : []
}

const haritaOnbellek = new WeakMap<DozKaydi[], Map<string, DozKaydi>>()
/** Index records by plan + slot (cached per array: the composer asks for the same list many times). */
export function kayitHaritasi(kayitlar: DozKaydi[]): Map<string, DozKaydi> {
  const v = haritaOnbellek.get(kayitlar)
  if (v) return v
  const m = new Map<string, DozKaydi>()
  haritaOnbellek.set(kayitlar, m)
  for (const k of kayitlar) {
    const anahtar = `${k.planId}|${new Date(k.planlananAt).toISOString()}`
    const v = m.get(anahtar)
    if (!v || v.kayitAt < k.kayitAt) m.set(anahtar, k)
  }
  return m
}

export function slotDurumu(planId: string, slotIso: string, harita: Map<string, DozKaydi>, simdi: Date | number | string): SlotDurumu {
  const t = new Date(simdi).getTime(), s = Date.parse(slotIso)
  const k = harita.get(`${planId}|${new Date(slotIso).toISOString()}`)
  if (k?.durum === 'alindi' || k?.durum === 'atlandi') return k.durum
  if (k?.durum === 'ertelendi') {
    const bitis = k.erteleUntil ? Date.parse(k.erteleUntil) : s + ERTELE_DK * 60_000
    return t > bitis + GEC_DK * 60_000 ? 'kacirildi' : 'ertelendi'
  }
  if (t < s - ERKEN_DK * 60_000) return 'bekliyor'
  if (t <= s + GEC_DK * 60_000) return 'zamani'
  return 'kacirildi'
}

export interface UyumSonucu { alinan: number; beklenen: number; yuzde: number | null }

/**
 * Adherence over [bas, bit] (Türkiye days, inclusive): taken ÷ resolved slots. A slot counts once it is resolved —
 * taken, skipped or missed. Future, due-now and postponed slots don't count yet (no penalty before the window closes).
 */
export function uyum(planlar: DozPlani[], kayitlar: DozKaydi[], bas: string, bit: string, simdi: Date | number | string): UyumSonucu {
  const harita = kayitHaritasi(kayitlar)
  let alinan = 0, beklenen = 0
  for (let g = bas; g <= bit; g = gunEkle(g, 1)) {
    for (const p of planlar) {
      for (const s of gunSlotlari(p, g)) {
        const d = slotDurumu(p.id, s, harita, simdi)
        if (d === 'alindi') { alinan++; beklenen++ } else if (d === 'atlandi' || d === 'kacirildi') beklenen++
      }
    }
  }
  return { alinan, beklenen, yuzde: beklenen ? Math.round((alinan / beklenen) * 100) : null }
}

/** Per-plan adherence for the doctor's card. */
export function planUyumlari(planlar: DozPlani[], kayitlar: DozKaydi[], bas: string, bit: string, simdi: Date | number | string) {
  return planlar.filter((p) => !p.gerektikce).map((p) => ({ planId: p.id, ad: p.ad, kritik: p.kritik, kaynak: p.kaynak, ...uyum([p], kayitlar, bas, bit, simdi) }))
}

/**
 * Two missed days: the plan had slots on BOTH of the last two complete days and not one of them was taken.
 * Skipped-on-purpose counts as not taken (the doctor of a kritik medicine still wants to know).
 */
export function ikiGunKacirdiMi(p: DozPlani, kayitlar: DozKaydi[], simdi: Date | number | string): boolean {
  const bugun = trGun(simdi)
  const harita = kayitHaritasi(kayitlar)
  for (const g of [gunEkle(bugun, -1), gunEkle(bugun, -2)]) {
    const s = gunSlotlari(p, g)
    if (!s.length) return false
    if (s.some((x) => slotDurumu(p.id, x, harita, simdi) === 'alindi')) return false
  }
  return true
}

/** Today's timeline: every slot of every plan, grouped by time. */
export function bugunPlani(planlar: DozPlani[], kayitlar: DozKaydi[], simdi: Date | number | string) {
  const gun = trGun(simdi)
  const harita = kayitHaritasi(kayitlar)
  const slotlar: Array<{ planId: string; ad: string; doz: string | null; kritik: boolean; kaynak: DozPlani['kaynak']; at: string; saat: string; durum: SlotDurumu }> = []
  for (const p of planlar) {
    for (const s of [...p.saatler].sort()) {
      if (!plandaMi(p, gun)) continue
      const at = trSaatAni(gun, s)
      slotlar.push({ planId: p.id, ad: p.ad, doz: p.doz, kritik: p.kritik, kaynak: p.kaynak, at, saat: s, durum: slotDurumu(p.id, at, harita, simdi) })
    }
  }
  slotlar.sort((a, b) => a.at.localeCompare(b.at) || a.ad.localeCompare(b.ad, 'tr'))
  return slotlar
}

/** As-needed plans: last time taken (for "son doz: 3 sa 20 dk önce" + the doctor's minimum interval, if set). */
export function gerektikceDurumu(planlar: DozPlani[], kayitlar: DozKaydi[], simdi: Date | number | string) {
  const t = new Date(simdi).getTime()
  return planlar.filter((p) => p.aktif && p.gerektikce).map((p) => {
    const son = kayitlar.filter((k) => k.planId === p.id && k.durum === 'alindi').sort((a, b) => b.planlananAt.localeCompare(a.planlananAt))[0]
    const sonAt = son?.planlananAt ?? null
    const uygunAt = sonAt && p.minAralikSaat ? new Date(Date.parse(sonAt) + p.minAralikSaat * 3600_000).toISOString() : null
    const bugunSayisi = kayitlar.filter((k) => k.planId === p.id && k.durum === 'alindi' && trGun(k.planlananAt) === trGun(t)).length
    return { planId: p.id, ad: p.ad, doz: p.doz, minAralikSaat: p.minAralikSaat, sonAt, uygunAt, bekle: !!uygunAt && Date.parse(uygunAt) > t, bugunSayisi }
  })
}
