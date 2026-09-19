/**
 * KBB-EXCEPTIONAL-01 — Otoskopi / kulak zarı (TM) muayene notu. SAF fonksiyon, LLM yok.
 *
 * Motor bir TANI ÜRETMEZ. Yaptığı tek şey: hekimin işaretlediği bulguları standart bir muayene
 * cümlesine çevirmek ve hangi alanların boş kaldığını söylemek. "Akut otitis media", "kolesteatom"
 * gibi etiketleri Notya yazmaz; not her zaman "bulgu" dilindedir ve sonunda hekim kilidi taşır.
 */
import type { Dipnot, Yan } from './kbb'
import { YAN_AD } from './kbb'

export type DisKulakBulgu = 'normal' | 'buşon' | 'akinti' | 'odem_hassasiyet' | 'yabanci_cisim'
export type TmGorunum = 'sag_gorunum' | 'hiperemik' | 'matlasmis' | 'retrakte' | 'bombe' | 'perforasyon' | 'tup_var' | 'seviye_hava_kabarcigi' | 'degerlendirilemedi'

export const DIS_KULAK_AD: Record<DisKulakBulgu, string> = {
  normal: 'Dış kulak yolu açık ve doğal',
  buşon: 'Dış kulak yolunda buşon (serumen tıkacı)',
  akinti: 'Dış kulak yolunda akıntı',
  odem_hassasiyet: 'Dış kulak yolunda ödem / tragus hassasiyeti',
  yabanci_cisim: 'Dış kulak yolunda yabancı cisim',
}

export const TM_AD: Record<TmGorunum, string> = {
  sag_gorunum: 'Kulak zarı doğal görünümde, ışık üçgeni izleniyor',
  hiperemik: 'Kulak zarı hiperemik',
  matlasmis: 'Kulak zarı matlaşmış / donuk',
  retrakte: 'Kulak zarı retrakte',
  bombe: 'Kulak zarı bombe',
  perforasyon: 'Kulak zarında perforasyon',
  tup_var: 'Ventilasyon tüpü mevcut',
  seviye_hava_kabarcigi: 'Zar arkasında sıvı seviyesi / hava kabarcığı',
  degerlendirilemedi: 'Kulak zarı değerlendirilemedi',
}

export const DIS_KULAK_LISTESI = Object.keys(DIS_KULAK_AD) as DisKulakBulgu[]
export const TM_LISTESI = Object.keys(TM_AD) as TmGorunum[]

/** Ek muayene kutucukları — hekim işaretler; hiçbiri tek başına tanı değildir. */
export const EK_BULGULAR: readonly string[] = [
  'Pnömatik otoskopi ile hareket azalmış',
  'Weber testi lateralize',
  'Rinne testi negatif',
  'Mastoid bölgede hassasiyet',
  'Postaurikuler şişlik / kızarıklık',
  'İşitme kaybı tarif ediyor',
  'Çınlama (tinnitus) tarif ediyor',
]

/** Hekimin aksiyona geçmesini gerektiren görünümler — "acil" değil, "bu vizitte karar" işaretidir. */
const DIKKAT_TM: ReadonlySet<TmGorunum> = new Set(['perforasyon', 'bombe', 'retrakte', 'degerlendirilemedi'])
const DIKKAT_DIS: ReadonlySet<DisKulakBulgu> = new Set(['akinti', 'yabanci_cisim', 'odem_hassasiyet'])

export interface OtoskopiKulak {
  yan: Exclude<Yan, 'iki'>
  disKulak: DisKulakBulgu[]
  tm: TmGorunum[]
}

export interface OtoskopiGirdi {
  kulaklar: OtoskopiKulak[]
  ekBulgular: string[]
  hekimNotu?: string
}

export interface OtoskopiSonuc {
  /** muayene cümleleri — nota olduğu gibi kopyalanabilir */
  satirlar: string[]
  /** tek parça not metni (hekim kilidi satırı dahil) */
  metin: string
  /** hekimin bu vizitte karar vermesi beklenen başlıklar */
  dikkat: string[]
  /** boş bırakılan alanlar — not "tam" sayılmaz */
  eksikler: string[]
  tamamMi: boolean
  dipnot: Dipnot
}

const KILIT_SATIRI = 'Bulgular hekim muayenesidir; tanı ve tedavi kararı hekimindedir (Notya tanı yazmaz, doz üretmez).'

export function otoskopiNotu(g: OtoskopiGirdi): OtoskopiSonuc {
  const satirlar: string[] = []
  const dikkat: string[] = []
  const eksikler: string[] = []

  const kulaklar = (g.kulaklar || []).filter((k) => k.yan === 'sag' || k.yan === 'sol')
  if (!kulaklar.length) eksikler.push('Hiçbir kulak için bulgu işaretlenmedi')

  for (const yan of ['sag', 'sol'] as const) {
    const k = kulaklar.find((x) => x.yan === yan)
    if (!k) { eksikler.push(`${YAN_AD[yan]}: muayene işaretlenmedi`); continue }
    const dis = (k.disKulak || []).filter((x) => DIS_KULAK_LISTESI.includes(x))
    const tm = (k.tm || []).filter((x) => TM_LISTESI.includes(x))
    if (!dis.length && !tm.length) { eksikler.push(`${YAN_AD[yan]}: bulgu işaretlenmedi`); continue }
    const parcalar = [...dis.map((x) => DIS_KULAK_AD[x]), ...tm.map((x) => TM_AD[x])]
    satirlar.push(`${YAN_AD[yan]}: ${parcalar.join('; ')}.`)
    for (const x of tm) if (DIKKAT_TM.has(x)) dikkat.push(`${YAN_AD[yan]} — ${TM_AD[x]}: bu vizitte karar/plan gerekir`)
    for (const x of dis) if (DIKKAT_DIS.has(x)) dikkat.push(`${YAN_AD[yan]} — ${DIS_KULAK_AD[x]}: bu vizitte karar/plan gerekir`)
  }

  const ek = (g.ekBulgular || []).filter((x) => EK_BULGULAR.includes(x))
  if (ek.length) satirlar.push(`Ek muayene: ${ek.join('; ')}.`)
  const hekimNotu = String(g.hekimNotu || '').trim()
  if (hekimNotu) satirlar.push(`Hekim notu: ${hekimNotu.slice(0, 1000)}`)

  const tamamMi = eksikler.length === 0
  const metin = [...satirlar, KILIT_SATIRI].join('\n')

  return {
    satirlar,
    metin,
    dikkat: [...new Set(dikkat)],
    eksikler,
    tamamMi,
    dipnot: {
      ref: 'TKBBD',
      not: 'Otoskopi kontrol listesi standart muayene başlıklarıdır; bulgunun tanıya çevrilmesi hekim değerlendirmesidir.',
    },
  }
}

/** Kısa özet — sticky şerit ve kohort için (tanı dili yok). */
export function otoskopiOzeti(sonuc: OtoskopiSonuc): string {
  if (!sonuc.satirlar.length) return 'Otoskopi kaydı yok'
  return sonuc.dikkat.length ? `Otoskopi: ${sonuc.dikkat.length} başlıkta karar bekliyor` : 'Otoskopi kaydedildi'
}
