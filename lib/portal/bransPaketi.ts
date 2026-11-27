/**
 * BRANS-PAKETI (Kaan, 2026-11-27) — branş signature modules of the patient portal (Sağlığım). Phase 1: the 10 Özel
 * Branşlar (diyetisyen full package). Kaan: "Diyetisyen için yapacağın hasta portalını bütün branşlar için gerektiği
 * şekilde yap. Özel branşlar için de bunu yapman şart." The 30 medical branşlar are Phase 2 (docs/portal/BRANS-PAKETI-FAZ2.md).
 *
 * One registry, shared module KINDS (one look across branşlar and later countries — gorunum-paritesi): what differs per
 * branş is DATA (lib/portal/paket/*.ts). Combined per patient with
 *   1. the professional's accepted template (brans_paket_sablon.kabul_at) — a module never reaches a patient before the
 *      treating professional accepted (and optionally edited) it; there is no external clinical reviewer,
 *   2. the professional's per-patient switch (brans_paket_hasta.acik: true / false / null = default rule),
 *   3. for condition modules (diyetisyen): the diagnoses / ICD-10 / medicines on file (conservative patterns),
 *   4. age rules (ergoterapi sensory diet only under 18 — veli wording follows age, veliDiliMi; never for adults).
 *
 * brans-alan-sizmasi: a module belongs to exactly one Özel Branş; `hastaPaketiCoz` never returns a module whose branş is
 * not the token doctor's branş, and returns nothing for the 30 medical branşlar in Phase 1 (pinned by tests).
 * Nothing here is gamified: no streaks, badges or scores (diyetisyen weight loss is deliberately outside the habit
 * layer — see bransAyari.oyunDisi). Pure + client-safe (no fs, no Supabase).
 */
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import type { KlinikPortalModulId } from '@/lib/klinik/klinikPortal'
import { DIYETISYEN_PAKETI } from './paket/diyetisyen'
import { SAC_EKIMI_PAKETI, ESTETIK_CERRAHI_PAKETI, MEDIKAL_ESTETIK_PAKETI, KLINIK_DERMATOLOJI_PAKETI } from './paket/estetik'
import { LONGEVITY_PAKETI, FIZYOTERAPI_PAKETI, KLINIK_PSIKOLOG_PAKETI, ERGOTERAPI_PAKETI, ODYOLOJI_PAKETI } from './paket/terapi'

export type PaketModulTuru =
  | 'zaman'        // day-by-day timeline from a start date the professional sets
  | 'liste'        // checklist (tick once) or info list
  | 'gunluk'       // diary: fields + red-flag rules
  | 'foto'         // private photos, optional standard angles / months
  | 'program'      // professional-written items the patient ticks daily (exercises, homework, goals)
  | 'hatirlatma'   // professional-written reminder lines (+ link to the optional dose reminders)
  | 'biyobelirtec' // physician-ordered lab results over time (numbers only)
  | 'tabak'        // Tabağım: meal photo + the dietitian's comment (no calorie counting, no food recognition)
  | 'plan'         // weekly plan + shopping list from the dietitian's plan
  | 'tarama'       // screening questions (SCOFF) — no score ever shown to the patient
  | 'ilac-saati'   // levothyroxine → breakfast / coffee / calcium-iron times

export type PaketDuzey = 'acil' | 'hekime_bildir' | 'dikkat'

export interface PaketAlan {
  id: string
  etiket: string
  tur: 'olcek' | 'evet' | 'sayi' | 'metin' | 'saat'
  min?: number
  max?: number
  birim?: string
  /** shown only when the professional's per-patient setting is truthy (e.g. dren) */
  ayarKosulu?: string
}

export interface PaketBayrak {
  id: string
  /** all listed conditions must hold */
  kosullar: Array<{ alan: string; enAz?: number; evet?: true }>
  duzey: PaketDuzey
  /** patient copy (acil → always carries 112) */
  hasta: string
  /** professional copy (alert list / push) */
  hekim: string
}

export interface PaketAdim { gun: number; baslik: string; ayrinti: string }

export interface PaketIcerik {
  adimlar?: PaketAdim[]
  maddeler?: string[]
  alanlar?: PaketAlan[]
  bayraklar?: PaketBayrak[]
  acilar?: string[]
  aylar?: number[]
  not?: string
}

export interface PaketAyarAlani { id: string; etiket: string; tur: 'sayi' | 'saat' | 'metin' | 'satirlar' | 'evet' | 'plan' }

export interface PaketModulTanimi {
  kod: string
  brans: KlinikYeniSlug
  tur: PaketModulTuru
  baslik: string
  aciklama: string
  varsayilan: PaketIcerik
  /** source ids — docs/kaynak/*.md */
  kaynaklar: string[]
  /** 'zaman' modules: the start date label ("İşlem günü") */
  baslangicEtiketi?: string
  /** per-patient settings the professional fills (protein target, plan, exercise list …) */
  ayarlar?: PaketAyarAlani[]
  /** condition module: on when a diagnosis / ICD / medicine on file matches (unless the professional switched it off) */
  durum?: { tani?: RegExp; icd?: RegExp; ilac?: RegExp }
  /** off unless the professional switches it on for this patient (e.g. isotretinoin monitoring) */
  varsayilanKapali?: boolean
  /** age gate: 'cocuk' = only under 18 (veli wording), 'eriskin' = only 18+ (unknown age = adult) */
  yas?: 'cocuk' | 'eriskin'
  /** 'liste' modules: can the patient tick items? */
  isaretlenir?: boolean
  /** the photo module needs the patient's separate photo consent text */
  fotoRizaMetni?: string
}

export const PAKET_ACIL_ORTAK = 'Acil bir durumda portal mesajı beklemeyin — 112’yi arayın.'

export const BRANS_PAKETLERI: Record<KlinikYeniSlug, readonly PaketModulTanimi[]> = {
  diyetisyen: DIYETISYEN_PAKETI,
  'sac-ekimi': SAC_EKIMI_PAKETI,
  'estetik-cerrahi': ESTETIK_CERRAHI_PAKETI,
  'medikal-estetik': MEDIKAL_ESTETIK_PAKETI,
  'klinik-dermatoloji': KLINIK_DERMATOLOJI_PAKETI,
  longevity: LONGEVITY_PAKETI,
  fizyoterapi: FIZYOTERAPI_PAKETI,
  'klinik-psikolog': KLINIK_PSIKOLOG_PAKETI,
  ergoterapi: ERGOTERAPI_PAKETI,
  odyoloji: ODYOLOJI_PAKETI,
}

/** The existing Özel Branş portal page each package renders on (lib/klinik/klinikPortal.ts — "Taban önce": kept). */
export const PAKET_SAYFASI: Record<KlinikYeniSlug, KlinikPortalModulId> = {
  'sac-ekimi': 'sacim', 'estetik-cerrahi': 'estetik-ameliyatim', 'medikal-estetik': 'estetik-bakimim',
  'klinik-dermatoloji': 'klinik-derim', longevity: 'longevitim', fizyoterapi: 'fizyom', 'klinik-psikolog': 'seanslarim',
  diyetisyen: 'beslenmem', ergoterapi: 'ergom', odyoloji: 'isitmem-odyoloji',
}

const TUM_MODULLER: readonly PaketModulTanimi[] = Object.values(BRANS_PAKETLERI).flat()

export function paketModulu(kod: string): PaketModulTanimi | null {
  return TUM_MODULLER.find((m) => m.kod === kod) || null
}

/** The token doctor's Özel Branş, or null (medical branşlar have no Phase-1 package). */
export function paketBransi(doktorBransi: string | null | undefined): KlinikYeniSlug | null {
  return klinikSlugCoz(doktorBransi)
}

/** True only when `kod` is a module of this doctor's own branş (the single leak gate every route uses). */
export function modulBransaAitMi(kod: string, doktorBransi: string | null | undefined): boolean {
  const b = paketBransi(doktorBransi)
  return !!b && BRANS_PAKETLERI[b].some((m) => m.kod === kod)
}

// ─── per-patient resolution ─────────────────────────────────────────────────────────────────────────────────────────

export interface SablonKaydi { icerik: PaketIcerik | null; kabulAt: string | null }
export interface HastaAyarKaydi { acik: boolean | null; baslangic: string | null; ayar: Record<string, unknown> }

export interface PaketGirdisi {
  doktorBransi: string | null | undefined
  sablonlar: Record<string, SablonKaydi>
  hastaAyar: Record<string, HastaAyarKaydi>
  /** diagnoses (chronic list + physician diagnosis text on file), ICD-10 codes, medicine names */
  tanilar: readonly string[]
  icdKodlari: readonly string[]
  ilaclar: readonly string[]
  hastaYasYil: number | null
}

export interface CozulmusModul {
  tanim: PaketModulTanimi
  /** accepted content (template defaults merged with the professional's edits) */
  icerik: PaketIcerik
  baslangic: string | null
  ayar: Record<string, unknown>
  /** why it is on — for the professional's panel */
  neden: 'varsayilan' | 'uzman' | 'tani' | 'ilac'
}

export interface PaketCozumu {
  brans: KlinikYeniSlug | null
  moduller: CozulmusModul[]
  /** modules that would be on but whose template the professional has not accepted yet */
  hazirlaniyor: string[]
}

function durumEslesir(t: PaketModulTanimi, g: PaketGirdisi): 'tani' | 'ilac' | null {
  const d = t.durum
  if (!d) return null
  if (d.tani && g.tanilar.some((x) => d.tani!.test(String(x || '')))) return 'tani'
  if (d.icd && g.icdKodlari.some((x) => d.icd!.test(String(x || '').toUpperCase()))) return 'tani'
  if (d.ilac && g.ilaclar.some((x) => d.ilac!.test(String(x || '')))) return 'ilac'
  return null
}

function yasUygun(t: PaketModulTanimi, yas: number | null): boolean {
  if (!t.yas) return true
  const cocuk = yas != null && yas < 18
  return t.yas === 'cocuk' ? cocuk : !cocuk
}

/** Merge the accepted template over the defaults (only known keys; alanlar / bayraklar stay the registry's — safety). */
export function icerikBirlestir(t: PaketModulTanimi, kabul: PaketIcerik | null): PaketIcerik {
  const v = t.varsayilan
  if (!kabul) return v
  return {
    ...v,
    adimlar: Array.isArray(kabul.adimlar) && kabul.adimlar.length ? kabul.adimlar : v.adimlar,
    maddeler: Array.isArray(kabul.maddeler) && kabul.maddeler.length ? kabul.maddeler : v.maddeler,
    acilar: Array.isArray(kabul.acilar) && kabul.acilar.length ? kabul.acilar : v.acilar,
    aylar: Array.isArray(kabul.aylar) && kabul.aylar.length ? kabul.aylar : v.aylar,
    not: typeof kabul.not === 'string' && kabul.not.trim() ? kabul.not : v.not,
    alanlar: v.alanlar,
    bayraklar: v.bayraklar,
  }
}

export function hastaPaketiCoz(g: PaketGirdisi): PaketCozumu {
  const brans = paketBransi(g.doktorBransi)
  if (!brans) return { brans: null, moduller: [], hazirlaniyor: [] }
  const moduller: CozulmusModul[] = []
  const hazirlaniyor: string[] = []
  for (const t of BRANS_PAKETLERI[brans]) {
    if (t.brans !== brans || !yasUygun(t, g.hastaYasYil)) continue
    const h = g.hastaAyar[t.kod]
    let neden: CozulmusModul['neden'] | null
    if (h?.acik === false) neden = null
    else if (h?.acik === true) neden = 'uzman'
    else if (t.durum) neden = durumEslesir(t, g)
    else neden = t.varsayilanKapali ? null : 'varsayilan'
    if (!neden) continue
    const s = g.sablonlar[t.kod]
    if (!s?.kabulAt) { hazirlaniyor.push(t.kod); continue }
    moduller.push({ tanim: t, icerik: icerikBirlestir(t, s.icerik), baslangic: h?.baslangic ?? null, ayar: h?.ayar ?? {}, neden })
  }
  return { brans, moduller, hazirlaniyor }
}

// ─── red flags ──────────────────────────────────────────────────────────────────────────────────────────────────────

const DUZEY_SIRA: Record<PaketDuzey, number> = { dikkat: 1, hekime_bildir: 2, acil: 3 }

export interface BayrakSonucu { bayrak: PaketBayrak; duzey: PaketDuzey }

/** Which red-flag rules a diary entry trips (highest level first). */
export function kayitDegerlendir(icerik: PaketIcerik, veri: Record<string, unknown>): BayrakSonucu[] {
  const out: BayrakSonucu[] = []
  for (const b of icerik.bayraklar || []) {
    const tum = b.kosullar.every((k) => {
      const v = veri[k.alan]
      if (k.evet) return v === true
      if (k.enAz != null) return typeof v === 'number' && Number.isFinite(v) && v >= k.enAz
      return false
    })
    if (tum) out.push({ bayrak: b, duzey: b.duzey })
  }
  return out.sort((a, b) => DUZEY_SIRA[b.duzey] - DUZEY_SIRA[a.duzey])
}

/** Validate + clean a diary entry against the module's fields (and the per-patient conditions). */
export function kayitTemizle(icerik: PaketIcerik, ham: unknown, ayar: Record<string, unknown> = {}): { ok: true; veri: Record<string, unknown> } | { ok: false; hata: string } {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const veri: Record<string, unknown> = {}
  for (const a of icerik.alanlar || []) {
    if (a.ayarKosulu && !ayar[a.ayarKosulu]) continue
    const v = g[a.id]
    if (v === undefined || v === null || v === '') continue
    if (a.tur === 'evet') { if (typeof v !== 'boolean') return { ok: false, hata: `${a.etiket}: evet / hayır.` }; veri[a.id] = v; continue }
    if (a.tur === 'olcek' || a.tur === 'sayi') {
      const n = Number(String(v).replace(',', '.'))
      const min = a.min ?? (a.tur === 'olcek' ? 0 : 0), max = a.max ?? (a.tur === 'olcek' ? 10 : 100000)
      if (!Number.isFinite(n) || n < min || n > max) return { ok: false, hata: `${a.etiket}: ${min}–${max}.` }
      veri[a.id] = Math.round(n * 10) / 10
      continue
    }
    if (a.tur === 'saat') { if (typeof v !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return { ok: false, hata: `${a.etiket}: SS:DD.` }; veri[a.id] = v; continue }
    if (a.tur === 'metin') { veri[a.id] = String(v).slice(0, 500); continue }
  }
  if (!Object.keys(veri).length) return { ok: false, hata: 'Boş kayıt.' }
  return { ok: true, veri }
}

// ─── timeline ───────────────────────────────────────────────────────────────────────────────────────────────────────

export function gunFarki(bas: string, bugun: string): number | null {
  const a = Date.parse(`${bas}T00:00:00Z`), b = Date.parse(`${bugun}T00:00:00Z`)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86_400_000) : null
}

/** Timeline steps with their state relative to today: 'gecti' | 'bugun' | 'sirada' | 'ileride'. */
export function zamanCizelgesi(adimlar: readonly PaketAdim[], baslangic: string | null, bugun: string): Array<PaketAdim & { tarih: string | null; durum: 'gecti' | 'bugun' | 'sirada' | 'ileride' }> {
  const fark = baslangic ? gunFarki(baslangic, bugun) : null
  const sirali = [...adimlar].sort((a, b) => a.gun - b.gun)
  const siradaki = fark == null ? -1 : sirali.findIndex((a) => a.gun > fark)
  return sirali.map((a, i) => {
    const tarih = baslangic ? new Date(Date.parse(`${baslangic}T00:00:00Z`) + a.gun * 86_400_000).toISOString().slice(0, 10) : null
    const durum = fark == null ? 'ileride' : a.gun === fark ? 'bugun' : a.gun < fark ? 'gecti' : i === siradaki ? 'sirada' : 'ileride'
    return { ...a, tarih, durum }
  })
}

/** A dose written into a template or a portal line ("5 mg", "2 tablet", "10 ünite") — refused (portal: no dose). */
export const DOZ_DESENI = /\b\d+([.,]\d+)?\s*(mg|mcg|µg|ml|ünite|iu|ie|tb|tablet|kapsül|damla|puf)\b/i

// ─── template editing (professional) ────────────────────────────────────────────────────────────────────────────────

/** Clean a professional's edit of a template: only timeline / list / photo / note keys, bounded sizes, no doses. */
export function sablonDuzenlemesiTemizle(t: PaketModulTanimi, ham: unknown): { ok: true; icerik: PaketIcerik; duzenlendi: boolean } | { ok: false; hata: string } {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const icerik: PaketIcerik = {}
  const DOZ = DOZ_DESENI
  if (Array.isArray(g.adimlar)) {
    const adimlar: PaketAdim[] = []
    for (const a of g.adimlar.slice(0, 40)) {
      const o = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>
      const gun = Number(o.gun)
      const baslik = String(o.baslik || '').trim().slice(0, 80)
      const ayrinti = String(o.ayrinti || '').trim().slice(0, 400)
      if (!Number.isInteger(gun) || gun < 0 || gun > 730 || !baslik) return { ok: false, hata: 'Her adımda gün (0–730) ve başlık olmalı.' }
      if (DOZ.test(baslik) || DOZ.test(ayrinti)) return { ok: false, hata: 'Şablona doz yazılmaz — ilaç planı hasta dosyasında kalır.' }
      adimlar.push({ gun, baslik, ayrinti })
    }
    if (adimlar.length) icerik.adimlar = adimlar
  }
  if (Array.isArray(g.maddeler)) {
    const maddeler = g.maddeler.slice(0, 40).map((x) => String(x || '').trim().slice(0, 300)).filter(Boolean)
    if (maddeler.some((m) => DOZ.test(m))) return { ok: false, hata: 'Şablona doz yazılmaz — ilaç planı hasta dosyasında kalır.' }
    // A screening instrument keeps its item count (scoring is per item) — wording may be aligned to the published form.
    if (t.tur === 'tarama' && maddeler.length !== (t.varsayilan.maddeler || []).length) return { ok: false, hata: `Tarama formu ${(t.varsayilan.maddeler || []).length} sorudan oluşur; soru sayısı değiştirilemez.` }
    if (maddeler.length) icerik.maddeler = maddeler
  }
  if (Array.isArray(g.acilar)) {
    const acilar = g.acilar.slice(0, 12).map((x) => String(x || '').trim().slice(0, 40)).filter(Boolean)
    if (acilar.length) icerik.acilar = acilar
  }
  if (Array.isArray(g.aylar)) {
    const aylar = [...new Set(g.aylar.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 36))].sort((a, b) => a - b).slice(0, 12)
    if (aylar.length) icerik.aylar = aylar
  }
  if (typeof g.not === 'string' && g.not.trim()) {
    if (DOZ.test(g.not)) return { ok: false, hata: 'Şablona doz yazılmaz.' }
    icerik.not = g.not.trim().slice(0, 600)
  }
  const birlesik = icerikBirlestir(t, icerik)
  const duzenlendi = JSON.stringify({ a: birlesik.adimlar, m: birlesik.maddeler, c: birlesik.acilar, y: birlesik.aylar, n: birlesik.not })
    !== JSON.stringify({ a: t.varsayilan.adimlar, m: t.varsayilan.maddeler, c: t.varsayilan.acilar, y: t.varsayilan.aylar, n: t.varsayilan.not })
  return { ok: true, icerik, duzenlendi }
}

/** Clean the professional's per-patient settings for one module (only the module's declared keys). */
export function ayarTemizle(t: PaketModulTanimi, ham: unknown): { ok: true; ayar: Record<string, unknown> } | { ok: false; hata: string } {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const ayar: Record<string, unknown> = {}
  for (const a of t.ayarlar || []) {
    const v = g[a.id]
    if (v === undefined || v === null || v === '') continue
    if (a.tur === 'sayi') { const n = Number(String(v).replace(',', '.')); if (!Number.isFinite(n) || n < 0 || n > 100000) return { ok: false, hata: `${a.etiket}: sayı.` }; ayar[a.id] = n }
    else if (a.tur === 'saat') { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) return { ok: false, hata: `${a.etiket}: SS:DD.` }; ayar[a.id] = String(v) }
    else if (a.tur === 'evet') ayar[a.id] = v === true
    else if (a.tur === 'satirlar') {
      const satirlar = (Array.isArray(v) ? v : String(v).split(/\r?\n/)).map((x) => String(x || '').trim().slice(0, 300)).filter(Boolean).slice(0, 40)
      if (satirlar.some((x) => DOZ_DESENI.test(x))) return { ok: false, hata: 'Portal satırına doz yazılmaz — ilaç ve doz hasta dosyasında ve Doz takviminde kalır.' }
      ayar[a.id] = satirlar
    }
    else ayar[a.id] = String(v).slice(0, a.tur === 'plan' ? 12000 : 600)
  }
  return { ok: true, ayar }
}
