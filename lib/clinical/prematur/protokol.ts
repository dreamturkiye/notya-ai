/**
 * PREMATURE-MODUL — Ülkeden bağımsız takip motorunun veri şeması. Motor (takipPlani.ts) hiçbir eşik, tarih ya da kaynak
 * taşımaz; hepsi bir PrematurProtokol tablosundan gelir. Türkiye tablosu protokolTR.ts'tedir; us / gb / ca / au / nz / uz
 * kendi tablolarını aynı şemayla enjekte eder (ülke taşıma işi — docs/OPEN-COMMITMENTS.md PREMATUR-ULKE-01).
 *
 * Her kural kaynağını verinin içinde taşır ve kaynağın bu çalışmada NASIL doğrulandığını söyler (KaynakDurumu).
 * Motor doz önermez, tanı koymaz; "kriter karşılandı / karşılanmadı / belirsiz" gösterir, karar hekimindir.
 */
import type { DuzeltmeKurali } from './duzeltilmisYas'

/** birincil-okundu: yayının/kılavuzun kendi metninden okundu · ikincil-ozet: güvenilir bir özetten okundu, birincil metin okunamadı · dogrulanmadi: yalnız künye. */
export type KaynakDurumu = 'birincil-okundu' | 'ikincil-ozet' | 'dogrulanmadi'

export interface Kaynak {
  kisa: string
  tam: string
  durum: KaynakDurumu
  not?: string
}

export type GirdiAlani =
  | 'gestasyonHafta' // doğumdaki TAM hafta (32+4 → 32)
  | 'dogumKiloGr'
  | 'yasAy' // kronolojik takvim ayı (bugün)
  | 'nicuGun'
  | 'oksijen28Gun'
  | 'hsKkh'
  | 'ototoksik5Gun'
  | 'degisimTransfuzyonu'
  | 'ecmo'
  | 'ropSecili'

export interface KriterKosulu {
  alan: GirdiAlani
  op: '<' | '<=' | '>' | '>=' | 'dogru'
  deger?: number
  /** Ekranda gösterilen kriter metni: "gestasyon ≤ 32 hafta". */
  etiket: string
}

/** Ya-da (herhangi biri) → her biri ve (hepsi). Bir grup tüm koşulları sağlarsa kriter karşılanır. */
export interface Kriter {
  herhangiBiri: KriterKosulu[][]
}

export type ZamanNoktasi =
  | { tur: 'dogumdan-gun'; gun: number }
  | { tur: 'dogumdan-hafta'; hafta: number }
  /** Postmenstrüel yaş = gestasyon + doğumdan beri geçen süre; bu hafta dolduğunda. Gestasyon bilinmiyorsa hesaplanamaz. */
  | { tur: 'pma-hafta'; hafta: number }
  | { tur: 'kronolojik-ay'; ay: number }

export interface Zamanlama {
  kod: string
  etiket: string
  /** Bu zamanlama yalnız bu koşullar (hepsi) doğruysa üretilir. */
  kosul?: KriterKosulu[]
  /** Koşul alanı bilinmiyorsa: 'dahil' → yine üret (not düşülür). Varsayılan 'haric'. */
  bilinmiyorsa?: 'dahil' | 'haric'
  bas?: ZamanNoktasi | null
  son?: ZamanNoktasi | null
}

export type KuralKategori = 'goz' | 'beyin' | 'isitme' | 'akciger' | 'kan' | 'kemik' | 'enfeksiyon'

export interface PrematurKural {
  kod: string
  kategori: KuralKategori
  baslik: string
  aciklama: string
  kriter: Kriter
  /** Boşsa tarihsiz bayrak (yalnız "kriter karşılandı" bilgisi). */
  zamanlamalar: Zamanlama[]
  /** Mevcut Notya kaydıyla (pedi_taramalar.tur) eşleşme — kayıt varsa öğe otomatik "yapıldı (kayıt)" görünür. */
  kayitTuru?: string
  /** true → doğumdan sonraki HERHANGİ bir kayıt ilk zamanlamayı kapatır (ör. ROP'ta ilk muayene). */
  herhangiKayitKapatir?: boolean
  kaynaklar: Kaynak[]
  hekimNotu?: string
}

export interface PrematurProtokol {
  ulke: string
  ad: string
  surum: string
  duzeltme: DuzeltmeKurali
  /** Plan kapsamı: doğumda < bu hafta ya da doğum ağırlığı ≤ bu gram. */
  kapsam: { gestasyonHaftaKucuk: number; dogumKiloGrEnFazla: number; kaynak: string }
  /** Ürün parametreleri (klinik eşik DEĞİL): bitiş tarihi tanımsız zamanlamalarda gecikme toleransı, yaklaşan penceresi, gürültü sınırı. */
  urun: { gecikmeToleransGun: number; yaklasanGun: number; gecikmeGorunurGun: number; planUstAy: number }
  kurallar: PrematurKural[]
}

/** Hekimin girdiği yenidoğan yoğun bakım öyküsü (null = bilinmiyor). */
export interface PrematurProfil {
  gestasyonHafta?: number | null
  dogumKiloGr?: number | null
  nicuGun?: number | null
  oksijen28Gun?: boolean | null
  oksijen36Hafta?: boolean | null
  hsKkh?: boolean | null
  ototoksik5Gun?: boolean | null
  degisimTransfuzyonu?: boolean | null
  ecmo?: boolean | null
  ropSecili?: boolean | null
  /** KD taburcu paketinden gelen doğum öyküsü (kayıt; kural girdisi DEĞİL). */
  antenatalSteroid?: boolean | null
  pprom?: boolean | null
  magnezyum?: boolean | null
  kaynak?: 'kd-taburcu' | 'elle' | null
}

export const PROFIL_BOOL_ALANLARI = ['oksijen28Gun', 'oksijen36Hafta', 'hsKkh', 'ototoksik5Gun', 'degisimTransfuzyonu', 'ecmo', 'ropSecili', 'antenatalSteroid', 'pprom', 'magnezyum'] as const

/** İstemciden / veritabanından gelen ham profili sınır ve tür denetimiyle temizler. */
export function profilTemizle(ham: unknown): PrematurProfil {
  const r = (ham && typeof ham === 'object' && !Array.isArray(ham) ? ham : {}) as Record<string, unknown>
  const sayi = (v: unknown, min: number, max: number): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
    return Number.isFinite(n) && n >= min && n <= max ? n : null
  }
  const bool = (v: unknown): boolean | null => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : null)
  const p: PrematurProfil = {
    gestasyonHafta: sayi(r.gestasyonHafta, 20, 45),
    dogumKiloGr: sayi(r.dogumKiloGr, 200, 7000),
    nicuGun: sayi(r.nicuGun, 0, 400),
  }
  for (const a of PROFIL_BOOL_ALANLARI) (p as Record<string, unknown>)[a] = bool(r[a])
  p.kaynak = r.kaynak === 'kd-taburcu' ? 'kd-taburcu' : r.kaynak === 'elle' ? 'elle' : null
  return p
}
