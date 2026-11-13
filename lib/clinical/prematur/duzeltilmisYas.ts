/**
 * PREMATURE-MODUL — Düzeltilmiş yaş (corrected age). Saf, ülkeden bağımsız; kural eşikleri enjekte edilir.
 *
 * Tanım: düzeltilmiş yaş = kronolojik yaş − (40 hafta − doğumdaki gestasyon haftası). Düzeltilmiş doğum tarihi = tahmini term
 * tarihidir (TDT); düzeltilmiş yaş o tarihten itibaren geçen süredir.
 *   Tanım kaynağı: Engle WA; AAP Committee on Fetus and Newborn. "Age terminology during the perinatal period."
 *   Pediatrics 2004;114(5):1362-1364 (kronolojik, postmenstrüel ve düzeltilmiş yaş terimleri).
 * Kesim kuralı (varsayılan): doğumda < 37 hafta olan bebekler düzeltilir; büyüme persentili için kronolojik 24. aya kadar.
 *   Kaynak: CDC "Use of World Health Organization and CDC Growth Charts" (Grummer-Strawn LM ve ark., MMWR 2010;59(RR-9)) —
 *   prematüre bebeklerde gestasyonel yaş düzeltmesi en az 2 yaşına kadar (ikincil özet üzerinden okundu, bkz. docs/PREMATURE-MODUL.md).
 *   Gelişimsel izlemde de aynı üst sınır kullanılır; bazı rehberler çok erken doğanlar için daha uzun düzeltme önerir —
 *   bu sınır PrematurProtokol.duzeltme içinde ülke/kurum bazında değiştirilebilir. Karar hekimindir.
 *
 * Bu dosya tanı koymaz, persentil üretmez; yalnız yaş aritmetiği yapar. Aşılar KRONOLOJİK yaşla uygulanır (düzeltme kullanılmaz).
 */
import { gunEkle, gunFarki, tamAy } from '@/specialties/pediatri/engines/girdi'

/** Term gestasyon (40 hafta = 280 gün). */
export const TERM_GUN = 280
/** "Prematüre" sınırı: < 37 hafta = < 259 gün. */
export const PREMATUR_ESIK_GUN = 37 * 7

export interface DuzeltmeKurali {
  /** Doğumda bu haftadan KÜÇÜK olanlar düzeltilir (varsayılan 37). */
  baslangicHafta: number
  /** Büyüme persentili için düzeltme, kronolojik yaş bu aydan KÜÇÜK oldukça uygulanır (varsayılan 24). */
  buyumeUstAy: number
  /** Gelişimsel izlem için aynı (varsayılan 24). */
  gelisimUstAy: number
  kaynak: string
}

export const VARSAYILAN_DUZELTME_KURALI: DuzeltmeKurali = {
  baslangicHafta: 37,
  buyumeUstAy: 24,
  gelisimUstAy: 24,
  kaynak: 'AAP Fetus & Newborn Komitesi (Engle 2004, Pediatrics 114:1362) tanımı; CDC/WHO büyüme eğrisi kullanım rehberi (MMWR 2010;59 RR-9) — < 37 hafta, 24 aya kadar',
}

/** Geçerli gestasyon aralığı (gün): 20+0 – 45+0 hafta (gebelikHaftasiCoz ile aynı). */
export const GEST_GUN_MIN = 20 * 7
export const GEST_GUN_MAX = 45 * 7

/** Ondalık hafta (32,57 ya da 32+4 → 32,57) → tamsayı gün. Geçersiz → null. */
export function gestasyonGunu(haftaOndalik: number | null | undefined): number | null {
  if (haftaOndalik == null || !Number.isFinite(haftaOndalik)) return null
  const g = Math.round(haftaOndalik * 7)
  return g >= GEST_GUN_MIN && g <= GEST_GUN_MAX ? g : null
}

/** "32+4" gösterimi. */
export function gestasyonMetni(gestGun: number | null): string {
  if (gestGun == null) return '—'
  return `${Math.floor(gestGun / 7)}+${gestGun % 7}`
}

export interface YasGirdisi {
  dogumIso: string
  /** Doğumdaki gestasyon (gün). null → bilinmiyor, düzeltme yapılamaz. */
  gestasyonGun: number | null
  tarihIso: string
}

export interface YasKullanimi {
  /** Bu amaçla kullanılacak yaş (gün). Düzeltme uygulanıyorsa düzeltilmiş (term öncesiyse negatif olabilir), değilse kronolojik. */
  gun: number
  duzeltilmis: boolean
  /** Düzeltilmiş yaş 0'ın altında: bebek henüz term (40 hafta) olmadı — Neyzi / WHO referansı uygulanamaz. */
  termOncesi: boolean
}

export interface DuzeltilmisYas {
  gecerli: boolean
  /** Neden geçersiz / uygulanamıyor (kısa kod). */
  durumKodu: 'ok' | 'gestasyon-yok' | 'gestasyon-gecersiz' | 'tarih-gecersiz'
  kronolojikGun: number
  kronolojikAy: number
  prematur: boolean
  /** Term'e kadar eksik gün (40 hf − gestasyon); term/post-term için 0. */
  erkenGun: number
  /** Tahmini term tarihi (düzeltilmiş doğum tarihi). Prematür değilse null. */
  terimTarihiIso: string | null
  /** Postmenstrüel yaş (gün) = gestasyon + kronolojik. */
  postmenstrualGun: number | null
  /** Ham düzeltilmiş yaş (gün) — prematürde kronolojik − erkenGun; değilse kronolojik. */
  duzeltilmisGun: number
  buyume: YasKullanimi
  gelisim: YasKullanimi
}

/**
 * Düzeltilmiş yaş. Term (≥ 37 hf) bebekler ASLA düzeltilmez: duzeltilmisGun = kronolojikGun, duzeltilmis = false.
 * Üst sınır: kronolojik TAKVİM ayı (tamAy) kural.buyumeUstAy'a ulaşınca düzeltme biter (24. ay doğum günü dahil kronolojik).
 */
export function duzeltilmisYas(g: YasGirdisi, kural: DuzeltmeKurali = VARSAYILAN_DUZELTME_KURALI): DuzeltilmisYas {
  const bos = (kod: DuzeltilmisYas['durumKodu'], kron = 0): DuzeltilmisYas => ({
    gecerli: false, durumKodu: kod, kronolojikGun: kron, kronolojikAy: 0, prematur: false, erkenGun: 0, terimTarihiIso: null,
    postmenstrualGun: null, duzeltilmisGun: kron,
    buyume: { gun: kron, duzeltilmis: false, termOncesi: false }, gelisim: { gun: kron, duzeltilmis: false, termOncesi: false },
  })
  const tarihOk = (s: string) => /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(`${s.slice(0, 10)}T00:00:00Z`))
  if (!tarihOk(g.dogumIso) || !tarihOk(g.tarihIso)) return bos('tarih-gecersiz')
  const kron = gunFarki(g.dogumIso, g.tarihIso)
  if (kron < 0) return bos('tarih-gecersiz')
  const kronAy = tamAy(g.dogumIso, g.tarihIso)
  if (g.gestasyonGun == null) return { ...bos('gestasyon-yok', kron), kronolojikAy: kronAy }
  if (!Number.isInteger(g.gestasyonGun) || g.gestasyonGun < GEST_GUN_MIN || g.gestasyonGun > GEST_GUN_MAX) return { ...bos('gestasyon-gecersiz', kron), kronolojikAy: kronAy }

  const prematur = g.gestasyonGun < kural.baslangicHafta * 7
  const erken = prematur ? TERM_GUN - g.gestasyonGun : 0
  const duz = kron - erken
  const kullanim = (ustAy: number): YasKullanimi => {
    const uygula = prematur && kronAy < ustAy
    return uygula ? { gun: duz, duzeltilmis: true, termOncesi: duz < 0 } : { gun: kron, duzeltilmis: false, termOncesi: false }
  }
  return {
    gecerli: true, durumKodu: 'ok', kronolojikGun: kron, kronolojikAy: kronAy, prematur, erkenGun: erken,
    terimTarihiIso: prematur ? gunEkle(g.dogumIso, erken) : null,
    postmenstrualGun: g.gestasyonGun + kron, duzeltilmisGun: duz,
    buyume: kullanim(kural.buyumeUstAy), gelisim: kullanim(kural.gelisimUstAy),
  }
}

/** Büyüme eğrisi için ondalık ay (≥ 0) — düzeltilmişse düzeltilmiş yaş; term öncesi için null (referans yok). */
export function buyumeAyi(y: DuzeltilmisYas): number | null {
  if (!y.gecerli) return y.kronolojikGun >= 0 ? y.kronolojikGun / 30.4375 : null
  if (y.buyume.termOncesi) return null
  return y.buyume.gun / 30.4375
}

/** Postmenstrüel yaş "36+2" (hafta+gün). */
export function postmenstrualMetni(y: DuzeltilmisYas): string {
  return y.postmenstrualGun == null ? '—' : `${Math.floor(y.postmenstrualGun / 7)}+${y.postmenstrualGun % 7}`
}

/** Ekranda düzeltilmiş yaş: "düzeltilmiş 2 ay 5 gün", term öncesi: "term öncesi (−3 hf 2 gün)". */
export function duzeltilmisYasMetni(y: DuzeltilmisYas, tarihIso: string): string {
  if (!y.gecerli || !y.prematur || !y.terimTarihiIso) return ''
  if (y.duzeltilmisGun < 0) {
    const e = -y.duzeltilmisGun
    return `term öncesi (term tarihine ${Math.floor(e / 7)} hf ${e % 7} gün)`
  }
  const gun = y.duzeltilmisGun
  if (gun < 31) return `${gun} günlük`
  const ay = tamAy(y.terimTarihiIso, tarihIso)
  if (ay < 24) return `${ay} aylık`
  const yil = Math.floor(ay / 12), kalan = ay % 12
  return kalan ? `${yil} yaş ${kalan} ay` : `${yil} yaş`
}
