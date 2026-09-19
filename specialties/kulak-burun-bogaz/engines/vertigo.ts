/**
 * KBB-EXCEPTIONAL-01 — Vestibüler muayene / Dix-Hallpike ve repozisyon manevrası notu. SAF fonksiyon.
 *
 * Motor TANI KOYMAZ. "BPPV" etiketini Notya yazmaz: manevra sonucu bir MUAYENE BULGUSUDUR, tanı ve
 * tedavi kararı hekimindedir. Manevra adımları uygulama talimatı değil, hekimin yaptığını kayda
 * geçirmek için standart alanlardır.
 *
 * SERT KAPI: nörolojik bulgu eşlik eden baş dönmesinde manevra YAPILMAZ — acil değerlendirme
 * (engines/acil.ts · vertigo_noro). Bu motor o durumda "manevra uygun değil" der.
 */
import type { Dipnot, Yan } from './kbb'
import { YAN_AD } from './kbb'

export type Manevra = 'dix_hallpike' | 'supine_roll' | 'epley' | 'barbecue' | 'head_impulse' | 'romberg'

export const MANEVRA_AD: Record<Manevra, string> = {
  dix_hallpike: 'Dix-Hallpike (tanısal, posterior kanal)',
  supine_roll: 'Supine roll (tanısal, horizontal kanal)',
  epley: 'Epley repozisyon manevrası (hekim uyguladı)',
  barbecue: 'Barbecue / Lempert repozisyon manevrası (hekim uyguladı)',
  head_impulse: 'Baş itme (head impulse) testi',
  romberg: 'Romberg / yürüme değerlendirmesi',
}
export const MANEVRA_LISTESI = Object.keys(MANEVRA_AD) as Manevra[]

export type ManevraSonucu = 'pozitif' | 'negatif' | 'yapilamadi'
export const SONUC_AD: Record<ManevraSonucu, string> = {
  pozitif: 'Pozitif (nistagmus / semptom uyarıldı)',
  negatif: 'Negatif',
  yapilamadi: 'Uygulanamadı',
}

/** Nistagmus tanımlayıcıları — hekim işaretler; yorum hekimindedir. */
export const NISTAGMUS_OZELLIKLERI: readonly string[] = [
  'Torsiyonel / yukarı vuran',
  'Horizontal',
  'Latans var (birkaç saniye gecikme)',
  'Yorulabilir (tekrarda azalıyor)',
  'Latans yok / yorulmuyor',
  'Yön değiştiren',
  'Fiksasyonla baskılanmıyor',
]

/**
 * SANTRAL şüphesi uyandıran işaretler — hekim yüzünde ayrı blok. Bunlardan biri işaretliyse motor
 * "manevra uygun değil / acil değerlendirme" der ve repozisyon notu üretmez.
 */
export const SANTRAL_ISARETLERI: readonly string[] = [
  'Çift görme, konuşma bozukluğu veya yutma güçlüğü',
  'Yüzde asimetri, uyuşma veya güç kaybı',
  'Ayakta duramama / desteksiz yürüyememe',
  'Latans yok, yorulmayan veya yön değiştiren nistagmus',
  'Fiksasyonla baskılanmayan nistagmus',
  'Ani, şiddetli ve alışılmadık baş ağrısı',
]

export interface VertigoGirdi {
  /** hekimin uyguladığı manevralar ve sonuçları */
  manevralar: Array<{ manevra: Manevra; yan?: Yan; sonuc: ManevraSonucu }>
  nistagmus: string[]
  santralIsaretleri: string[]
  /** işitme kaybı / çınlama / kulakta dolgunluk eşlik ediyor mu (hekim işareti) */
  kulakBelirtisi: boolean
  hekimNotu?: string
}

export interface VertigoSonuc {
  satirlar: string[]
  metin: string
  /** santral işaret varken repozisyon manevrası önerilmez */
  manevraUygunMu: boolean
  uyarilar: string[]
  eksikler: string[]
  dipnot: Dipnot
}

const KILIT_SATIRI =
  'Manevra sonuçları muayene bulgusudur; tanı, tedavi ve ileri tetkik kararı hekimindedir. Notya tanı yazmaz, ilaç ve doz önermez.'

const SANTRAL_SATIRI =
  '⚑ Santral şüphesi işareti var: repozisyon manevrası uygun değil, acil / nöroloji değerlendirmesi öncelikli (112 veya en yakın acil).'

export function vertigoNotu(g: VertigoGirdi): VertigoSonuc {
  const satirlar: string[] = []
  const uyarilar: string[] = []
  const eksikler: string[] = []

  const santral = (g.santralIsaretleri || []).filter((x) => SANTRAL_ISARETLERI.includes(x))
  const manevraUygunMu = santral.length === 0

  if (santral.length) {
    uyarilar.push(SANTRAL_SATIRI)
    satirlar.push(`Santral şüphesi işaretleri: ${santral.join('; ')}.`)
  }

  const manevralar = (g.manevralar || []).filter((m) => MANEVRA_LISTESI.includes(m.manevra))
  if (!manevralar.length) eksikler.push('Hiçbir manevra / test işaretlenmedi')
  for (const m of manevralar) {
    const yan = m.yan ? ` — ${YAN_AD[m.yan]}` : ''
    satirlar.push(`${MANEVRA_AD[m.manevra]}${yan}: ${SONUC_AD[m.sonuc] || SONUC_AD.yapilamadi}.`)
    if (!manevraUygunMu && (m.manevra === 'epley' || m.manevra === 'barbecue')) {
      uyarilar.push('Repozisyon manevrası santral şüphesi işaretiyle birlikte kaydedildi — gerekçeyi hekim notuna yazın.')
    }
  }

  const nis = (g.nistagmus || []).filter((x) => NISTAGMUS_OZELLIKLERI.includes(x))
  if (nis.length) satirlar.push(`Nistagmus özellikleri: ${nis.join('; ')}.`)
  else if (manevralar.some((m) => m.sonuc === 'pozitif')) eksikler.push('Pozitif manevra var ama nistagmus özelliği işaretlenmedi')

  satirlar.push(g.kulakBelirtisi
    ? 'Eşlik eden kulak belirtisi (işitme kaybı / çınlama / dolgunluk) tarif ediyor.'
    : 'Eşlik eden kulak belirtisi tarif etmiyor.')

  const hekimNotu = String(g.hekimNotu || '').trim()
  if (hekimNotu) satirlar.push(`Hekim notu: ${hekimNotu.slice(0, 1000)}`)

  const metin = [...uyarilar, ...satirlar, KILIT_SATIRI].join('\n')

  return {
    satirlar,
    metin,
    manevraUygunMu,
    uyarilar: [...new Set(uyarilar)],
    eksikler,
    dipnot: {
      ref: 'TKBBD',
      not: 'Dix-Hallpike / supine roll tanısal, Epley / barbecue tedavi edici manevralardır; uygulama ve yorum hekimindedir. Santral bulgu varlığında manevra yerine acil değerlendirme.',
    },
  }
}

/** Kontrol randevusu taslağı: manevra sonrası yeniden değerlendirme (gün). Hekim değiştirebilir. */
export function manevraSonrasiKontrolGun(sonuc: VertigoSonuc): number {
  return sonuc.manevraUygunMu ? 7 : 1
}
