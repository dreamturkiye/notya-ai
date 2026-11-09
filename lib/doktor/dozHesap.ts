/**
 * TR-PARITE-01 (Kaan, 2026-11-09, "item 3") — REÇETE YAZAN BRANŞLAR İÇİN DOZ HESAPLAYICI. Saf; yalnız hesap makinesi.
 *
 * Ülke yapılarındaki ortak doz motorunun (release/* lib/ulke/araclar/dozMotoru.ts) Türkiye karşılığı; Pediatri'nin kendi
 * motoru (specialties/pediatri/engines/doz.ts, /doktor-tools/pedi-doz) OLDUĞU GİBİ kalır ve Pediatri bu aracı görmez.
 *
 * KURUCU KURALI (Pediatri motoruyla aynı, lib/doktor/dozKilidi.ts ilkesi): HEKİM HER SAYIYI KENDİSİ GİRER. Bu modül ilaç
 * bilmez; varsayılan miktar, önerilen doz, ilaç → doz eşlemesi veya kendi tavanı YOKTUR. İlaç adı serbest metindir
 * (yalnız kayıt ve çıktı için). Miktar, konsantrasyon ve tavan hekimindir; araç aritmetik ve birim çevirisi yapar ve
 * hekimin kendi tavanı aşılınca uyarır. Hiçbir şey reçeteye, nota veya sunucuya yazılmaz.
 *
 * Temeller:
 *   kg     kilogram başına miktar (günlük veya doz başına)
 *   m2     vücut yüzey alanı (m²) başına miktar; alan hekimin girdiği değerdir ya da boşsa boy ve kilodan Mosteller ile
 *          hesaplanır (Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987;317(17):1098)
 *   sabit  doz başına sabit miktar
 *
 * Görünürlük (specialty-doktor-araclari): reçete yazan branşlar — Pediatri dışındaki 29 tıp branşı (Pediatri kendi
 * motorunu kullanır) ve Özel Branşların 5 hekim dalı. Müttefik meslekler (fizyoterapi, klinik psikolog, diyetisyen,
 * ergoterapi, odyoloji) reçete yazamaz → görmez.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'

export const DOZ_TEMELLERI = ['kg', 'm2', 'sabit'] as const
export type DozTemeli = (typeof DOZ_TEMELLERI)[number]

/** Bu hacmin altındaki tek doz için küçük hacim uyarısı (mL). */
export const DOZ_KUCUK_HACIM_ML = 1

/** Mosteller: √(boy cm × kilo kg / 3600), m². */
export const mosteller = (boyCm: number, kiloKg: number): number => Math.sqrt((boyCm * kiloKg) / 3600)

const sayiMi = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

export type DozGirdisi = {
  temel: DozTemeli
  kiloKg?: number | null
  boyCm?: number | null
  /** Hekimin girdiği vücut yüzey alanı (m²) — boy ve kiloya üstün gelir. */
  bsa?: number | null
  /** mg/kg, mg/m² veya (sabit) doz başına mg. */
  miktar: number
  /** 'gun' = miktar günlük; 'doz' = doz başına. `sabit` için yok sayılır. */
  mod: 'gun' | 'doz'
  /** Günde kaç doz (1–6). */
  dozSayisi: number
  konsMg?: number | null
  konsMl?: number | null
  tavanDozMg?: number | null
  tavanGunMg?: number | null
}

export type DozUyarisi = 'tavan_doz' | 'tavan_gun' | 'kilo_birim' | 'ml_kucuk'

export type DozSonucu = {
  dozMg: number
  gunlukMg: number
  aralikSaat: number
  bsa: number | null
  dozMl: number | null
  gunlukMl: number | null
  /** Tavan aşıldıysa tavanla sınırlanmış karşılık — hekim seçer, araç kendiliğinden uygulamaz. */
  tavanliDozMg: number | null
  tavanliDozMl: number | null
  uyarilar: readonly DozUyarisi[]
}

/** Yalnız aritmetik. null = temelin gerektirdiği bir değer eksik. */
export function dozHesapla(g: DozGirdisi): DozSonucu | null {
  const n = Math.round(g.dozSayisi)
  if (!sayiMi(g.miktar) || !(g.miktar > 0) || !(n >= 1 && n <= 6)) return null
  let carpan: number
  let bsa: number | null = null
  if (g.temel === 'kg') {
    if (!sayiMi(g.kiloKg) || !(g.kiloKg > 0)) return null
    carpan = g.kiloKg
  } else if (g.temel === 'm2') {
    if (sayiMi(g.bsa) && g.bsa > 0) bsa = g.bsa
    else if (sayiMi(g.boyCm) && g.boyCm > 0 && sayiMi(g.kiloKg) && g.kiloKg > 0) bsa = mosteller(g.boyCm, g.kiloKg)
    else return null
    carpan = bsa
  } else carpan = 1
  const gunlukMg = g.temel === 'sabit' ? g.miktar * n : g.mod === 'gun' ? carpan * g.miktar : carpan * g.miktar * n
  const dozMg = gunlukMg / n
  const mgPerMl = sayiMi(g.konsMg) && sayiMi(g.konsMl) && g.konsMg > 0 && g.konsMl > 0 ? g.konsMg / g.konsMl : null
  const ml = (mg: number) => (mgPerMl ? mg / mgPerMl : null)
  const tDoz = sayiMi(g.tavanDozMg) && g.tavanDozMg > 0 ? g.tavanDozMg : null
  const tGun = sayiMi(g.tavanGunMg) && g.tavanGunMg > 0 ? g.tavanGunMg : null
  const asim = Boolean((tDoz && dozMg > tDoz) || (tGun && gunlukMg > tGun))
  const tavanli = asim ? Math.min(tDoz ?? Infinity, tGun ? tGun / n : Infinity, dozMg) : null
  const dozMl = ml(dozMg), gunlukMl = ml(gunlukMg), tavanliMl = tavanli !== null ? ml(tavanli) : null
  const uyarilar: DozUyarisi[] = []
  if (tDoz && dozMg > tDoz) uyarilar.push('tavan_doz')
  if (tGun && gunlukMg > tGun) uyarilar.push('tavan_gun')
  if (sayiMi(g.kiloKg) && g.kiloKg > 150) uyarilar.push('kilo_birim')
  if ((dozMl !== null && dozMl < DOZ_KUCUK_HACIM_ML) || (tavanliMl !== null && tavanliMl < DOZ_KUCUK_HACIM_ML)) uyarilar.push('ml_kucuk')
  return { dozMg, gunlukMg, aralikSaat: 24 / n, bsa, dozMl, gunlukMl, tavanliDozMg: tavanli, tavanliDozMl: tavanliMl, uyarilar }
}

export const DOZ_UYARI_METNI: Record<DozUyarisi, string> = {
  tavan_doz: 'Doz başına mg, girdiğiniz doz tavanını aşıyor.',
  tavan_gun: 'Günlük toplam, girdiğiniz günlük tavanı aşıyor.',
  kilo_birim: 'Kilo 150 kg üzerinde — birimi (kg) kontrol edin.',
  ml_kucuk: 'Tek doz 1 mL altında — ölçüm aracını ve konsantrasyonu kontrol edin.',
}

export type DozBransi = Exclude<SpecialtyKey, 'pediatri'> | 'sac-ekimi' | 'estetik-cerrahi' | 'medikal-estetik' | 'klinik-dermatoloji' | 'longevity'

/**
 * Branşın çalıştığı temeller (sunulma sırasıyla). Kilo temeli ağırlığa göre doz veren branşlarda (anestezi, acil,
 * çocuk cerrahisi, enfeksiyon, nefroloji, dermatoloji, romatoloji, onkoloji, yoğun cerrahi branşlar), m² onkoloji ve
 * romatolojide. Her branşta sabit doz da vardır. Branşa ilaç veya miktar bağlanmaz — yalnız hangi hesap biçimlerinin
 * sunulacağı.
 */
const K: DozTemeli[] = ['sabit', 'kg']
export const DOZ_TEMELI_BRANSA_GORE: Readonly<Record<DozBransi, readonly DozTemeli[]>> = {
  kardiyoloji: K, noroloji: K, dahiliye: K, psikiyatri: ['sabit'], 'genel-cerrahi': K, ortopedi: K, dermatoloji: ['kg', 'sabit'],
  'kulak-burun-bogaz': K, 'goz-hastaliklari': ['sabit'], 'kadin-hastaliklari-dogum': K, uroloji: K, radyoloji: K,
  anestezi: ['kg', 'sabit'], 'acil-tip': ['kg', 'sabit'], 'fizik-tedavi': ['sabit'], 'enfeksiyon-hastaliklari': ['kg', 'sabit'],
  endokrinoloji: K, gastroenteroloji: K, nefroloji: ['kg', 'sabit'], romatoloji: ['kg', 'm2', 'sabit'], onkoloji: ['m2', 'kg', 'sabit'],
  'gogus-hastaliklari': K, 'gogus-cerrahisi': K, 'plastik-cerrahi': K, 'beyin-cerrahisi': K, 'kalp-damar-cerrahisi': ['kg', 'sabit'],
  'cocuk-cerrahisi': ['kg', 'sabit'], 'aile-hekimligi': K, 'spor-hekimligi': ['sabit'],
  'sac-ekimi': K, 'estetik-cerrahi': K, 'medikal-estetik': K, 'klinik-dermatoloji': ['kg', 'sabit'], longevity: K,
}

/** Doz aracının Özel Branş hekim dalları. */
export const DOZ_KLINIK_DALLARI: readonly KlinikYeniSlug[] = ['sac-ekimi', 'estetik-cerrahi', 'medikal-estetik', 'klinik-dermatoloji', 'longevity']
/** Doz aracının tıp branşları (Pediatri hariç — kendi motoru). */
export const DOZ_TUS_BRANSLARI: readonly SpecialtyKey[] = (Object.keys(DOZ_TEMELI_BRANSA_GORE) as string[]).filter((k) => !(DOZ_KLINIK_DALLARI as readonly string[]).includes(k)) as SpecialtyKey[]

/**
 * Hekimin `users.specialty` değeri → doz aracı temelleri, ya da null (araç yok). Bilinmeyen / boş branş, Pediatri
 * (kendi motoru) ve müttefik meslekler → null.
 */
export function dozAraciTemelleri(ham: string | null | undefined): readonly DozTemeli[] | null {
  const klinik = klinikSlugCoz(ham)
  if (klinik) return (DOZ_KLINIK_DALLARI as readonly string[]).includes(klinik) ? DOZ_TEMELI_BRANSA_GORE[klinik as DozBransi] : null
  const tus = bransAnahtari(String(ham || '').trim().toLocaleLowerCase('tr-TR'))
  return tus && (DOZ_TUS_BRANSLARI as readonly string[]).includes(tus) ? DOZ_TEMELI_BRANSA_GORE[tus as DozBransi] : null
}
export const dozAraciBransi = (ham: string | null | undefined): boolean => dozAraciTemelleri(ham) !== null

export const fmtDoz = (n: number, ondalik = 2): string => (Math.round(n * 10 ** ondalik) / 10 ** ondalik).toLocaleString('tr-TR', { maximumFractionDigits: ondalik })
