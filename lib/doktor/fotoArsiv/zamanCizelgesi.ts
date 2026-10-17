/**
 * FOTO-ARSIV-01 — timeline, filters, search and "same region" navigation of the patient photo archive.
 * Pure + client-safe (the archive filters hundreds of already-loaded rows in the browser; the notes are
 * encrypted in the database, so search cannot be a SQL query).
 */
import { ayniBolgeMi, bolgeEtiketi, etiketAnahtari } from './bolgeler'

export interface FotoOge {
  belgeId: string
  /** Visit the photo was taken in; null for a photo added straight to the patient file. */
  seansId: string | null
  /** ISO timestamp used for ordering and grouping: the doctor's corrected date, else the visit, else the upload. */
  cekimAt: string
  yuklenmeAt: string
  dosyaAdi: string
  mime: string
  boyut: number
  bolge: string | null
  bolgeKaynagi: 'hekim' | 'ayse' | null
  favori: boolean
  /** 0 = unrated, 1..5 stars */
  yildiz: number
  /** "key photo" marker */
  anahtar: boolean
  etiketler: string[]
  not: string
  duzenlendi: boolean
  notasyonSayisi: number
  kucukVar: boolean
  /** An AI evaluation exists for this exact image. */
  aiVar: boolean
}

export interface Filtre {
  bolge: string | null
  etiket: string | null
  seansId: string | null
  yalnizFavori: boolean
  yalnizAnahtar: boolean
  minYildiz: number
  arama: string
}

export const BOS_FILTRE: Readonly<Filtre> = Object.freeze({
  bolge: null, etiket: null, seansId: null, yalnizFavori: false, yalnizAnahtar: false, minYildiz: 0, arama: '',
})

export const TZ = 'Europe/Istanbul'

const zaman = (iso: string): number => {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : 0
}

/** Newest first; ties broken by upload time then id so the order is fully deterministic. */
export function yenidenEskiye(ogeler: readonly FotoOge[]): FotoOge[] {
  return [...ogeler].sort((a, b) => zaman(b.cekimAt) - zaman(a.cekimAt) || zaman(b.yuklenmeAt) - zaman(a.yuklenmeAt) || a.belgeId.localeCompare(b.belgeId))
}

export function eskidenYeniye(ogeler: readonly FotoOge[]): FotoOge[] {
  return yenidenEskiye(ogeler).reverse()
}

const trKatla = (s: string): string => s.toLocaleLowerCase('tr-TR').normalize('NFC')

export function aramaMetni(o: FotoOge): string {
  return trKatla([o.not, o.etiketler.join(' '), o.dosyaAdi, o.bolge ? bolgeEtiketi(o.bolge) : ''].join(' '))
}

export function filtrele(ogeler: readonly FotoOge[], f: Filtre): FotoOge[] {
  const aranan = trKatla(f.arama.trim())
  const etiket = f.etiket ? etiketAnahtari(f.etiket) : null
  return ogeler.filter((o) => {
    if (f.bolge && o.bolge !== f.bolge) return false
    if (f.seansId && o.seansId !== f.seansId) return false
    if (etiket && !o.etiketler.some((t) => etiketAnahtari(t) === etiket)) return false
    if (f.yalnizFavori && !o.favori) return false
    if (f.yalnizAnahtar && !o.anahtar) return false
    if (f.minYildiz > 0 && o.yildiz < f.minYildiz) return false
    if (aranan && !aramaMetni(o).includes(aranan)) return false
    return true
  })
}

export function filtreAktifMi(f: Filtre): boolean {
  return !!(f.bolge || f.etiket || f.seansId || f.yalnizFavori || f.yalnizAnahtar || f.minYildiz > 0 || f.arama.trim())
}

// ─── Dates (Turkish calendar day) ────────────────────────────────────────────────────────────────────────
/** YYYY-MM-DD of an instant in the clinic's timezone. */
export function gunAnahtari(iso: string, tz: string = TZ): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '0000-00-00'
  return new Date(t).toLocaleDateString('en-CA', { timeZone: tz })
}

/** Whole calendar days from `a` to `b` (positive when b is later). Uses calendar days, not 24 h blocks (DST safe). */
export function gunFarki(a: string, b: string, tz: string = TZ): number {
  const [ya, ma, da] = gunAnahtari(a, tz).split('-').map(Number)
  const [yb, mb, db] = gunAnahtari(b, tz).split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000)
}

/** "47 gün arayla" for the compare view. Order-independent. */
export function aralikMetni(a: string, b: string, tz: string = TZ): string {
  const g = Math.abs(gunFarki(a, b, tz))
  if (g === 0) return 'Aynı gün'
  if (g === 1) return '1 gün arayla'
  if (g >= 365) {
    const yil = g / 365.25
    return `${g} gün arayla (≈ ${yil.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yıl)`
  }
  if (g >= 60) return `${g} gün arayla (≈ ${Math.round(g / 30.44)} ay)`
  return `${g} gün arayla`
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

/** "12 Ekim 2026" from a YYYY-MM-DD key. */
export function gunBasligi(anahtar: string, bugunAnahtar: string): string {
  if (anahtar === bugunAnahtar) return 'Bugün'
  const [y, m, d] = anahtar.split('-').map(Number)
  if (!y || !m || !d) return 'Tarihsiz'
  const [by, bm, bd] = bugunAnahtar.split('-').map(Number)
  if (by && Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(y, m - 1, d)) / 86_400_000) === 1) return 'Dün'
  return `${d} ${AYLAR[m - 1]} ${y}`
}

export interface Grup {
  anahtar: string
  baslik: string
  seansId: string | null
  ogeler: FotoOge[]
}

/** Groups newest-first photos by calendar day and visit (same day, different visit = separate group). */
export function gruplandir(ogeler: readonly FotoOge[], simdiIso: string = new Date().toISOString(), tz: string = TZ): Grup[] {
  const bugun = gunAnahtari(simdiIso, tz)
  const gruplar: Grup[] = []
  const dizin = new Map<string, Grup>()
  for (const o of yenidenEskiye(ogeler)) {
    const gun = gunAnahtari(o.cekimAt, tz)
    const k = `${gun}|${o.seansId ?? '-'}`
    let g = dizin.get(k)
    if (!g) {
      g = { anahtar: k, baslik: gunBasligi(gun, bugun), seansId: o.seansId, ogeler: [] }
      dizin.set(k, g)
      gruplar.push(g)
    }
    g.ogeler.push(o)
  }
  return gruplar
}

// ─── Same-region navigation ──────────────────────────────────────────────────────────────────────────────
/** The photo of the same region taken before `hedef` that is closest in time; null when there is none. */
export function oncekiAyniBolge(ogeler: readonly FotoOge[], hedef: FotoOge): FotoOge | null {
  if (!hedef.bolge) return null
  const t = zaman(hedef.cekimAt)
  const aday = yenidenEskiye(ogeler).filter((o) => o.belgeId !== hedef.belgeId && ayniBolgeMi(o.bolge, hedef.bolge))
  // strictly older by time, or the same instant but listed after it (stable tie-break)
  const eskiler = aday.filter((o) => zaman(o.cekimAt) < t || (zaman(o.cekimAt) === t && o.belgeId.localeCompare(hedef.belgeId) > 0))
  return eskiler[0] ?? null
}

/** Next (yon = 1: newer) or previous (yon = -1: older) photo of the same region as `hedef`. */
export function bolgedeKomsu(ogeler: readonly FotoOge[], hedef: FotoOge, yon: 1 | -1): FotoOge | null {
  if (!hedef.bolge) return null
  const sira = eskidenYeniye(ogeler.filter((o) => ayniBolgeMi(o.bolge, hedef.bolge) || o.belgeId === hedef.belgeId))
  const i = sira.findIndex((o) => o.belgeId === hedef.belgeId)
  if (i < 0) return null
  return sira[i + yon] ?? null
}

/** Neighbour in the currently visible (filtered, newest-first) list, for swipe / arrow-key navigation. */
export function listedeKomsu(gorunen: readonly FotoOge[], belgeId: string, yon: 1 | -1): FotoOge | null {
  const i = gorunen.findIndex((o) => o.belgeId === belgeId)
  if (i < 0) return null
  return gorunen[i + yon] ?? null
}

/** Distinct tags of the archive with counts, most used first (for the filter chips and tag suggestions). */
export function etiketOzeti(ogeler: readonly FotoOge[]): { etiket: string; adet: number }[] {
  const sayac = new Map<string, { etiket: string; adet: number }>()
  for (const o of ogeler) {
    for (const t of o.etiketler) {
      const k = etiketAnahtari(t)
      const m = sayac.get(k)
      if (m) m.adet++
      else sayac.set(k, { etiket: t, adet: 1 })
    }
  }
  return [...sayac.values()].sort((a, b) => b.adet - a.adet || a.etiket.localeCompare(b.etiket, 'tr'))
}

/** Per-region counts for the region filter / body map badges. */
export function bolgeSayilari(ogeler: readonly FotoOge[]): Record<string, number> {
  const s: Record<string, number> = {}
  for (const o of ogeler) {
    const k = o.bolge ?? '_yok'
    s[k] = (s[k] ?? 0) + 1
  }
  return s
}
