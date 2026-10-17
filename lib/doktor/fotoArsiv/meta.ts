/**
 * FOTO-ARSIV-01 — the per-photo metadata document and the validated PATCH that edits it. Pure + client-safe.
 * The server stores `ozel` (tags, note, adjustments, annotations) encrypted; the plain columns are only the
 * filterable, non-clinical facets (region, favourite, stars, key photo, shot date, hidden).
 */
import { bolgeIdMi, etiketleriTemizle } from './bolgeler'
import { ayarlariDogrula, bosOzel, notasyonlariDogrula, NOT_AZAMI, type FotoOzel } from './duzenleme'

export interface FotoMeta {
  belgeId: string
  bolge: string | null
  bolgeKaynagi: 'hekim' | 'ayse' | null
  favori: boolean
  yildiz: number
  anahtar: boolean
  /** YYYY-MM-DD the doctor set as the real shot date; null = use the upload time */
  cekimTarihi: string | null
  gizli: boolean
  ozel: FotoOzel
}

export function bosMeta(belgeId: string): FotoMeta {
  return { belgeId, bolge: null, bolgeKaynagi: null, favori: false, yildiz: 0, anahtar: false, cekimTarihi: null, gizli: false, ozel: bosOzel() }
}

export interface MetaYamasi {
  bolge?: string | null
  bolgeKaynagi?: 'hekim' | 'ayse'
  favori?: boolean
  yildiz?: number
  anahtar?: boolean
  cekimTarihi?: string | null
  gizli?: boolean
  etiketler?: string[]
  not?: string
  ayarlar?: unknown
  notasyonlar?: unknown
}

const TARIH = /^\d{4}-\d{2}-\d{2}$/

export function tarihGecerliMi(s: string): boolean {
  if (!TARIH.test(s)) return false
  const t = Date.parse(`${s}T00:00:00Z`)
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s
}

/** Validates an incoming PATCH body. Unknown keys are ignored; an invalid known key is an error (400), never silently dropped. */
export function metaYamasiDogrula(govde: unknown): { yama?: MetaYamasi; hata?: string } {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) return { hata: 'Geçersiz istek.' }
  const g = govde as Record<string, unknown>
  const y: MetaYamasi = {}
  if ('bolge' in g) {
    if (g.bolge === null || g.bolge === '') y.bolge = null
    else if (bolgeIdMi(g.bolge)) y.bolge = g.bolge
    else return { hata: 'Bilinmeyen vücut bölgesi.' }
  }
  if ('bolgeKaynagi' in g) {
    if (g.bolgeKaynagi !== 'hekim' && g.bolgeKaynagi !== 'ayse') return { hata: 'Geçersiz bölge kaynağı.' }
    y.bolgeKaynagi = g.bolgeKaynagi
  }
  if ('favori' in g) { if (typeof g.favori !== 'boolean') return { hata: 'favori true/false olmalı.' }; y.favori = g.favori }
  if ('anahtar' in g) { if (typeof g.anahtar !== 'boolean') return { hata: 'anahtar true/false olmalı.' }; y.anahtar = g.anahtar }
  if ('gizli' in g) { if (typeof g.gizli !== 'boolean') return { hata: 'gizli true/false olmalı.' }; y.gizli = g.gizli }
  if ('yildiz' in g) {
    const n = Number(g.yildiz)
    if (!Number.isInteger(n) || n < 0 || n > 5) return { hata: 'yıldız 0-5 arası tam sayı olmalı.' }
    y.yildiz = n
  }
  if ('cekimTarihi' in g) {
    if (g.cekimTarihi === null || g.cekimTarihi === '') y.cekimTarihi = null
    else if (typeof g.cekimTarihi === 'string' && tarihGecerliMi(g.cekimTarihi)) y.cekimTarihi = g.cekimTarihi
    else return { hata: 'Çekim tarihi YYYY-AA-GG olmalı.' }
  }
  if ('etiketler' in g) {
    if (!Array.isArray(g.etiketler)) return { hata: 'etiketler bir dizi olmalı.' }
    y.etiketler = etiketleriTemizle(g.etiketler)
  }
  if ('not' in g) {
    if (typeof g.not !== 'string') return { hata: 'not metin olmalı.' }
    if (g.not.length > NOT_AZAMI * 2) return { hata: 'Not çok uzun.' }
    y.not = Array.from(g.not.replace(/\u0000/g, '')).slice(0, NOT_AZAMI).join('')
  }
  if ('ayarlar' in g) y.ayarlar = ayarlariDogrula(g.ayarlar)
  if ('notasyonlar' in g) {
    if (!Array.isArray(g.notasyonlar)) return { hata: 'notasyonlar bir dizi olmalı.' }
    y.notasyonlar = notasyonlariDogrula(g.notasyonlar)
  }
  if (Object.keys(y).length === 0) return { hata: 'Değiştirilecek bir alan yok.' }
  return { yama: y }
}

export function yamayiUygula(mevcut: FotoMeta, y: MetaYamasi): FotoMeta {
  const m: FotoMeta = JSON.parse(JSON.stringify(mevcut))
  if ('bolge' in y) { m.bolge = y.bolge ?? null; m.bolgeKaynagi = y.bolge ? (y.bolgeKaynagi ?? 'hekim') : null }
  else if (y.bolgeKaynagi && m.bolge) m.bolgeKaynagi = y.bolgeKaynagi
  if (y.favori !== undefined) m.favori = y.favori
  if (y.anahtar !== undefined) m.anahtar = y.anahtar
  if (y.gizli !== undefined) m.gizli = y.gizli
  if (y.yildiz !== undefined) m.yildiz = y.yildiz
  if ('cekimTarihi' in y) m.cekimTarihi = y.cekimTarihi ?? null
  if (y.etiketler) m.ozel.etiketler = y.etiketler
  if (y.not !== undefined) m.ozel.not = y.not
  if (y.ayarlar) m.ozel.ayarlar = y.ayarlar as FotoOzel['ayarlar']
  if (y.notasyonlar) m.ozel.notasyonlar = y.notasyonlar as FotoOzel['notasyonlar']
  return m
}

// ─── Batch actions ──────────────────────────────────────────────────────────────────────────────────────
export const TOPLU_ISLEMLER = ['etiket-ekle', 'etiket-cikar', 'favori', 'anahtar', 'yildiz', 'bolge', 'gizle'] as const
export type TopluIslem = (typeof TOPLU_ISLEMLER)[number]
export const TOPLU_AZAMI = 100

export interface TopluIstek { islem: TopluIslem; belgeIds: string[]; etiket?: string; deger?: boolean | number | string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const uuidMi = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)

export function topluIstekDogrula(govde: unknown): { istek?: TopluIstek; hata?: string } {
  if (!govde || typeof govde !== 'object') return { hata: 'Geçersiz istek.' }
  const g = govde as Record<string, unknown>
  if (!(TOPLU_ISLEMLER as readonly string[]).includes(String(g.islem))) return { hata: 'Bilinmeyen toplu işlem.' }
  if (!Array.isArray(g.belgeIds) || !g.belgeIds.length) return { hata: 'Fotoğraf seçilmedi.' }
  if (g.belgeIds.length > TOPLU_AZAMI) return { hata: `Bir seferde en fazla ${TOPLU_AZAMI} fotoğraf.` }
  const belgeIds = [...new Set((g.belgeIds as unknown[]).filter(uuidMi))]
  if (belgeIds.length !== new Set(g.belgeIds as unknown[]).size) return { hata: 'Geçersiz fotoğraf kimliği.' }
  const islem = g.islem as TopluIslem
  const istek: TopluIstek = { islem, belgeIds }
  if (islem === 'etiket-ekle' || islem === 'etiket-cikar') {
    const e = etiketleriTemizle([g.etiket])[0]
    if (!e) return { hata: 'Etiket boş.' }
    istek.etiket = e
  } else if (islem === 'yildiz') {
    const n = Number(g.deger)
    if (!Number.isInteger(n) || n < 0 || n > 5) return { hata: 'yıldız 0-5 olmalı.' }
    istek.deger = n
  } else if (islem === 'bolge') {
    if (g.deger !== null && !bolgeIdMi(g.deger)) return { hata: 'Bilinmeyen vücut bölgesi.' }
    istek.deger = g.deger as string | null
  } else {
    if (typeof g.deger !== 'boolean') return { hata: 'deger true/false olmalı.' }
    istek.deger = g.deger
  }
  return { istek }
}

export function topluYamaya(i: TopluIstek, mevcut: FotoMeta): MetaYamasi {
  switch (i.islem) {
    case 'etiket-ekle': return { etiketler: etiketleriTemizle([...mevcut.ozel.etiketler, i.etiket]) }
    case 'etiket-cikar': return { etiketler: mevcut.ozel.etiketler.filter((t) => t.toLocaleLowerCase('tr-TR') !== String(i.etiket).toLocaleLowerCase('tr-TR')) }
    case 'favori': return { favori: i.deger as boolean }
    case 'anahtar': return { anahtar: i.deger as boolean }
    case 'gizle': return { gizli: i.deger as boolean }
    case 'yildiz': return { yildiz: i.deger as number }
    case 'bolge': return { bolge: i.deger as string | null, bolgeKaynagi: 'hekim' }
  }
}
