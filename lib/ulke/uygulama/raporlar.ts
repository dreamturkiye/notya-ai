/**
 * The practice numbers of the Reports screen (Türkiye: Raporlar), counted from the signed-in doctor's own rows only.
 * PATIENT ISOLATION: service-role client, so every count carries the authenticated doctor's id; no id comes from the request.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeGunBasi, ulkeGunu } from './gun'
import { hesapSaatDilimi } from './saatDilimi'
import { ulkeTablosu } from './tablolar'

export type RaporAralik = 'hafta' | 'ay' | '3ay' | 'yil'
export const RAPOR_ARALIKLARI: readonly RaporAralik[] = ['hafta', 'ay', '3ay', 'yil']
export type Adet = { ad: string; sayi: number }
export type GunOlcu = { etiket: string; ad: string; sayi: number; ortalamaDk: number | null }
/** The range-dependent part (Türkiye: the part under the fixed numbers): day by day, types, note work. */
export type RaporAralikVerisi = {
  aralik: RaporAralik
  gunler: GunOlcu[]
  tipler: Adet[]
  notTurleri: Adet[]
  onaylanan: number
  bekleyen: number
  tartiliOrtalamaDk: number | null
}
/** The fixed volume numbers (Türkiye: the six cards on top), each with its comparison. */
export type RaporHacim = {
  yeniBuAy: number; yeniGecenAy: number; yeniSon3Ay: number; yeniOnceki3Ay: number; aktifHasta: number
  muayeneBuHafta: number; muayeneGecenHafta: number; muayeneBuAy: number; muayeneGecenAy: number; muayeneToplam: number
}
export type RaporOzeti = {
  hacim: RaporHacim
  veri: RaporAralikVerisi
  /** Kept for the clients of the first version of this endpoint. */
  hastaToplam: number; hastaYeniAy: number
  muayeneHafta: number; muayeneAy: number; muayeneToplam: number
  notOnayli: number; notBekleyen: number
  randevuAy: number; randevuTamam: number; randevuIptal: number
}

const GUN = 86400000

async function say(sorgu: PromiseLike<{ count: number | null; error: unknown }>): Promise<number | null> {
  const { count, error } = await sorgu
  return error || count === null ? null : count
}

/** null = a count could not be read (the screen says so instead of showing a wrong zero). */
export async function raporOzeti(supabase: SupabaseClient, doktorId: string, aralik: RaporAralik = 'ay'): Promise<RaporOzeti | null> {
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const gunBasi = ulkeGunBasi(new Date(), dilim)
  const haftaBasi = new Date(gunBasi.getTime() - 6 * GUN).toISOString()
  const ayBasi = new Date(gunBasi.getTime() - 29 * GUN).toISOString()
  const t = (ad: 'ulke_hastalar' | 'ulke_muayeneler' | 'ulke_notlar' | 'ulke_randevulari') => ulkeTablosu(supabase, ad).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId)
  const r = await Promise.all([
    say(t('ulke_hastalar')),
    say(t('ulke_hastalar').gte('created_at', ayBasi)),
    say(t('ulke_muayeneler').gte('started_at', haftaBasi)),
    say(t('ulke_muayeneler').gte('started_at', ayBasi)),
    say(t('ulke_muayeneler')),
    say(t('ulke_notlar').not('approved_at', 'is', null)),
    say(t('ulke_notlar').is('approved_at', null)),
    say(t('ulke_randevulari').gte('baslangic', ayBasi)),
    say(t('ulke_randevulari').gte('baslangic', ayBasi).eq('durum', 'tamamlandi')),
    say(t('ulke_randevulari').gte('baslangic', ayBasi).in('durum', ['iptal', 'gelmedi'])),
  ])
  if (r.some((x) => x === null)) return null
  const [hastaToplam, hastaYeniAy, muayeneHafta, muayeneAy, muayeneToplam, notOnayli, notBekleyen, randevuAy, randevuTamam, randevuIptal] = r as number[]
  const hacim = await hacimOku(supabase, doktorId, dilim, gunBasi, hastaToplam, muayeneToplam)
  const veri = await aralikOku(supabase, doktorId, dilim, gunBasi, aralik)
  if (!hacim || !veri) return null
  return { hacim, veri, hastaToplam, hastaYeniAy, muayeneHafta, muayeneAy, muayeneToplam, notOnayli, notBekleyen, randevuAy, randevuTamam, randevuIptal }
}

/** Calendar days (YYYY-MM-DD) in the zone, `n` days before `gunBasi`'s day. */
const gunOnce = (gunBasi: Date, n: number): Date => new Date(gunBasi.getTime() - n * GUN)

async function hacimOku(supabase: SupabaseClient, doktorId: string, dilim: string, gunBasi: Date, aktifHasta: number, muayeneToplam: number): Promise<RaporHacim | null> {
  const [y, m] = ulkeGunu(gunBasi, dilim).split('-').map(Number)
  // Month starts are taken as the zone's first day of the month: the day-start of day 1 in that zone.
  const ayIlk = (yy: number, mm: number): Date => {
    const idx = yy * 12 + (mm - 1)
    const Y = Math.floor(idx / 12), M = (idx % 12) + 1
    return ulkeGunBasi(new Date(Date.UTC(Y, M - 1, 1, 12)), dilim)
  }
  const buAy = ayIlk(y, m), gecenAy = ayIlk(y, m - 1), uc = ayIlk(y, m - 2), alti = ayIlk(y, m - 5)
  const haftaBasi = gunOnce(gunBasi, ((new Date(gunBasi.getTime() + 12 * 3600000).getUTCDay() + 6) % 7))
  const gecenHafta = new Date(haftaBasi.getTime() - 7 * GUN)
  const t = (ad: 'ulke_hastalar' | 'ulke_muayeneler') => ulkeTablosu(supabase, ad).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId)
  const iso = (d: Date) => d.toISOString()
  const r = await Promise.all([
    say(t('ulke_hastalar').gte('created_at', iso(buAy))),
    say(t('ulke_hastalar').gte('created_at', iso(gecenAy)).lt('created_at', iso(buAy))),
    say(t('ulke_hastalar').gte('created_at', iso(uc))),
    say(t('ulke_hastalar').gte('created_at', iso(alti)).lt('created_at', iso(uc))),
    say(t('ulke_muayeneler').gte('started_at', iso(haftaBasi))),
    say(t('ulke_muayeneler').gte('started_at', iso(gecenHafta)).lt('started_at', iso(haftaBasi))),
    say(t('ulke_muayeneler').gte('started_at', iso(buAy))),
    say(t('ulke_muayeneler').gte('started_at', iso(gecenAy)).lt('started_at', iso(buAy))),
  ])
  if (r.some((x) => x === null)) return null
  const [yeniBuAy, yeniGecenAy, yeniSon3Ay, yeniOnceki3Ay, muayeneBuHafta, muayeneGecenHafta, muayeneBuAy, muayeneGecenAy] = r as number[]
  return { yeniBuAy, yeniGecenAy, yeniSon3Ay, yeniOnceki3Ay, aktifHasta, muayeneBuHafta, muayeneGecenHafta, muayeneBuAy, muayeneGecenAy, muayeneToplam }
}

const sirala = (m: Map<string, number>): Adet[] => [...m.entries()].map(([ad, sayi]) => ({ ad, sayi })).sort((a, b) => b.sayi - a.sayi || a.ad.localeCompare(b.ad)).slice(0, 8)
const kisalt = (ham: string | null | undefined): string => { const s = String(ham ?? '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1, 40) : '' }

async function aralikOku(supabase: SupabaseClient, doktorId: string, dilim: string, gunBasi: Date, aralik: RaporAralik): Promise<RaporAralikVerisi | null> {
  const [y, m, d] = ulkeGunu(gunBasi, dilim).split('-').map(Number)
  const gunSayisi = aralik === 'hafta' ? 7 : aralik === 'ay' ? d : aralik === '3ay' ? 90 : Math.max(1, Math.round((gunBasi.getTime() - ulkeGunBasi(new Date(Date.UTC(y, 0, 1, 12)), dilim).getTime()) / GUN) + 1)
  const bas = gunOnce(gunBasi, gunSayisi - 1)
  const gunlukMu = gunSayisi <= 31
  const [mu, no] = await Promise.all([
    ulkeTablosu(supabase, 'ulke_muayeneler').select('started_at, session_type, duration_seconds').eq('doctor_id', doktorId).gte('started_at', bas.toISOString()).order('started_at', { ascending: true }).limit(5000),
    ulkeTablosu(supabase, 'ulke_notlar').select('note_type, approved_at').eq('doctor_id', doktorId).gte('created_at', bas.toISOString()).limit(5000),
  ])
  if (mu.error || no.error) return null
  const anahtar = (an: Date) => { const g = ulkeGunu(an, dilim); return gunlukMu ? g : g.slice(0, 7) }
  const kovalar = new Map<string, { sayi: number; sn: number; sureli: number }>()
  for (let i = 0; i < gunSayisi; i++) { const k = anahtar(gunOnce(gunBasi, gunSayisi - 1 - i)); if (!kovalar.has(k)) kovalar.set(k, { sayi: 0, sn: 0, sureli: 0 }) }
  const tipler = new Map<string, number>()
  let sureliToplam = 0, sureliAdet = 0
  for (const s of (mu.data ?? []) as { started_at: string; session_type: string | null; duration_seconds: number | null }[]) {
    const k = anahtar(new Date(s.started_at)); const b = kovalar.get(k); if (!b) continue
    b.sayi += 1
    if (typeof s.duration_seconds === 'number' && s.duration_seconds > 0) { b.sn += s.duration_seconds; b.sureli += 1; sureliToplam += s.duration_seconds; sureliAdet += 1 }
    const tip = kisalt(s.session_type); if (tip) tipler.set(tip, (tipler.get(tip) ?? 0) + 1)
  }
  const tur = new Map<string, number>(); let onaylanan = 0, bekleyen = 0
  for (const n of (no.data ?? []) as { note_type: string | null; approved_at: string | null }[]) {
    if (n.approved_at) onaylanan += 1; else bekleyen += 1
    const k = String(n.note_type ?? '').toUpperCase(); if (k) tur.set(k, (tur.get(k) ?? 0) + 1)
  }
  const gunler: GunOlcu[] = [...kovalar.entries()].map(([k, b]) => ({
    etiket: gunlukMu ? k.slice(8) : k.slice(5), ad: k, sayi: b.sayi, ortalamaDk: b.sureli ? Math.round(b.sn / b.sureli / 60) : null,
  }))
  return { aralik, gunler, tipler: sirala(tipler), notTurleri: sirala(tur), onaylanan, bekleyen, tartiliOrtalamaDk: sureliAdet ? Math.round(sureliToplam / sureliAdet / 60) : null }
}
