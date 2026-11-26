// ============================================================
// NOTYA ASISTAN — Türkiye İlaç Tablosu (CLINICAL SAFETY DATA)
//
// Kaan, 2026-09-19: "drug table to 150". The table behind the ilaç card held 18 molecules, so the
// card could only say "etkileşim kontrolü yapılamadı" for most of Turkish outpatient prescribing.
// The entries now live in `lib/asistan/ilac/veri/` by therapeutic group; this file is the ENGINE
// and the public surface, unchanged for every existing caller.
//
// Sourcing rule (docs/README_EYLEM.md, NOTYA-EYLEM-28): every entry names the document its numbers
// came from (`kaynak.belge` + `kaynak.url`) and how it was verified (`kaynak.dogrulama`). A
// pediatric mg/kg line exists ONLY where a fetched TİTCK KÜB or a named Turkish paediatric source
// stated it — an empty field is safe, an invented one is not.
// ============================================================
import { receteRengi } from '@/lib/doktor/receteRengi'
import type { Dogrulama, Etkilesim, PediatrikDoz, TürkishDrug } from './ilac/tipler'
import { ANALJEZIK } from './ilac/veri/analjezik'
import { ANTIBIYOTIK } from './ilac/veri/antibiyotik'
import { ANTIINFEKTIF } from './ilac/veri/antiinfektif'
import { SOLUNUM_ALERJI } from './ilac/veri/solunumAlerji'
import { GASTROINTESTINAL } from './ilac/veri/gastrointestinal'
import { KARDIYOVASKULER } from './ilac/veri/kardiyovaskuler'
import { ENDOKRIN } from './ilac/veri/endokrin'
import { INSULIN } from './ilac/veri/insulin'
import { HEMATOLOJI } from './ilac/veri/hematoloji'
import { NOROPSIKIYATRI } from './ilac/veri/noropsikiyatri'
import { DERM_ROMATOLOJI } from './ilac/veri/dermRomatoloji'
import { KADIN_DOGUM } from './ilac/veri/kadinDogum'
import { UROLOJI_DIGER } from './ilac/veri/urolojiDiger'

export type { TürkishDrug, Dogrulama, Etkilesim, PediatrikDoz }
export { DOGRULAMA_ETIKET } from './ilac/tipler'

export const TURKISH_DRUGS: Record<string, TürkishDrug> = {
  ...ANALJEZIK,
  ...ANTIBIYOTIK,
  ...ANTIINFEKTIF,
  ...SOLUNUM_ALERJI,
  ...GASTROINTESTINAL,
  ...KARDIYOVASKULER,
  ...ENDOKRIN,
  ...INSULIN,
  ...HEMATOLOJI,
  ...NOROPSIKIYATRI,
  ...DERM_ROMATOLOJI,
  ...KADIN_DOGUM,
  ...UROLOJI_DIGER,
}

/** Molecule count, for the card's coverage sentence and the review sheet. */
export const MOLEKUL_SAYISI = Object.keys(TURKISH_DRUGS).length

export function dogrulamaSayilari(): Record<Dogrulama, number> {
  const out: Record<Dogrulama, number> = { kub_okundu: 0, literatur: 0, hekim_dogruladi: 0 }
  for (const d of Object.values(TURKISH_DRUGS)) out[d.kaynak.dogrulama] += 1
  return out
}

// ============================================================
// DRUG SEARCH — by name, brand or category
// ============================================================
export function searchDrug(query: string): TürkishDrug[] {
  const q = query.toLowerCase()
  const bulunan = Object.values(TURKISH_DRUGS).filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.brand.some(b => b.toLowerCase().includes(q)) ||
    d.category.toLowerCase().includes(q)
  )
  // ILAC-TABLOSU-INSULIN: the caller reads drugs[0]. A substring hit in table order put the first entry whose CATEGORY
  // contains the word ahead of the molecule the doctor named; the confident name match now always comes first.
  const enIyi = enIyiIlacAnahtari(query)
  if (!enIyi) return bulunan
  const d = TURKISH_DRUGS[enIyi]
  return [d, ...bulunan.filter((x) => x !== d)]
}

/**
 * Compact model-facing context for one drug. The full entry is now large enough that
 * `JSON.stringify(drug)` in a chat prompt would cost more tokens than the answer is worth
 * (`/api/asistan/chat` did exactly that when the table held 18 small entries).
 */
export function ilacBaglamMetni(d: TürkishDrug): string {
  const satir = [
    `${d.name} (${d.brand.slice(0, 3).join(', ')}) — ${d.category}`,
    `Doz: ${d.dose}`,
    d.pediatricDose ? `Pediatrik: ${d.pediatricDose}` : '',
    d.contraindications.length ? `Kontrendikasyon: ${d.contraindications.slice(0, 5).join('; ')}` : '',
    d.interactions.length ? `Etkileşim: ${d.interactions.slice(0, 8).join(', ')}` : '',
    d.gebelik ? `Gebelik: ${d.gebelik.kategori ? `kategori ${d.gebelik.kategori} — ` : ''}${d.gebelik.metin}` : '',
    d.sgkRestriction ? `SGK: ${d.sgkRestriction}` : '',
    d.atc || d.insulinTuru ? `ATC: ${d.atc ?? '—'}${d.insulinTuru ? ` · İnsülin türü: ${d.insulinTuru}` : ''}` : '',
    d.piyasaDurumu ? `PİYASA DURUMU (${d.piyasaDurumu.durum === 'cekildi' ? 'piyasadan çekildi' : 'piyasadan çekiliyor'}, kontrol ${d.piyasaDurumu.kontrol}): ${d.piyasaDurumu.metin}` : '',
    d.notes && /KARIŞTIRILMAMALIDIR/.test(d.notes) ? `Dikkat: ${d.notes}` : '',
    `Kaynak: ${d.kaynak.belge}`,
  ]
  return satir.filter(Boolean).join('\n')
}

// ============================================================
// DOSE CALCULATOR — pediatric weight-based dosing
// ============================================================

export interface PediatrikDozHesabi {
  /** Turkish sentence for the card. */
  metin: string
  /** Computed daily total in mg, when the source expressed the dose per kilogram. */
  gunlukMinMg?: number
  gunlukMaxMg?: number
  /** Per-dose total in mg, when the unit is mg/kg/doz. */
  dozBasiMinMg?: number
  dozBasiMaxMg?: number
  /** The ceiling this was measured against, when one is sourced. */
  tavanMgGun?: number
  /** True when the computed daily total exceeds the sourced ceiling — NOTYA-EYLEM-30. */
  asim?: boolean
  asimMetni?: string
  /** False until a physician signs the entry off; drives the "KÜB'den teyit edin" line. */
  hekimDogruladi: boolean
}

/** Units the calculator can turn into a daily milligram total. Others are informational only. */
const HESAPLANABILIR = new Set<PediatrikDoz['birim']>(['mg/kg/doz', 'mg/kg/gün'])

/**
 * Structured pediatric dose for a weight. THE fix for NOTYA-EYLEM-30: the old calculator read a
 * free-text line where some molecules meant mg/kg/DOZ and others mg/kg/GÜN, and printed both as
 * "mg/gün". Here the unit is a typed field, so a daily total is only ever produced when the source
 * said something that can honestly be turned into one — and an overdose verdict is only given when
 * a ceiling (`maxMgKgGun` / `mutlakMaxMgGun`) was actually sourced.
 */
export function pediatrikDozHesapla(drugKey: string, weightKg: number, verilenGunlukMg?: number, yasAy?: number | null): PediatrikDozHesabi | null {
  const drug = TURKISH_DRUGS[drugKey]
  const p = drug?.pediatrik
  if (!drug || !p) return null
  const hekimDogruladi = drug.kaynak.dogrulama === 'hekim_dogruladi'

  // NOTYA-AYSE-GUVENLIK-01: a fixed dose is never multiplied by a weight. The line is the source's own wording;
  // a verdict is given only against a reference the source stated — the age band the patient falls in, or an
  // absolute daily ceiling. Neither sourced → no verdict (`asim` stays undefined) and the card says so.
  if (p.sabitDoz) {
    const yuvarla = (n: number) => Math.round(n * 10) / 10
    const bant = typeof yasAy === 'number' ? p.yasBantlari?.find((b) => yasAy >= b.enAzAy && yasAy < b.ustAy) : undefined
    const mutlak = typeof p.mutlakMaxMgGun === 'number' ? p.mutlakMaxMgGun : undefined
    const parcalar = ['Sabit doz (kiloya göre hesaplanmaz)']
    if (drug.pediatricDose) parcalar.push(drug.pediatricDose)
    if (mutlak !== undefined) parcalar.push(`Kaynaktaki tavan: ${yuvarla(mutlak)} mg/gün`)
    const referans = bant ? bant.mgGun : mutlak
    let asim: boolean | undefined
    let asimMetni: string | undefined
    if (referans !== undefined && typeof verilenGunlukMg === 'number' && Number.isFinite(verilenGunlukMg)) {
      asim = verilenGunlukMg > referans
      if (asim) {
        asimMetni = bant
          ? `Yazılan günlük doz (${yuvarla(verilenGunlukMg)} mg), kaynakta bu yaş grubu için verilen dozun (${yuvarla(bant.mgGun)} mg/gün) ÜZERİNDE.`
          : `Yazılan günlük doz (${yuvarla(verilenGunlukMg)} mg) kaynaktaki tavanı (${yuvarla(referans)} mg/gün) AŞIYOR.`
      }
    }
    return { metin: `${parcalar.join('. ')}. Kaynak: ${p.metin}`, tavanMgGun: referans, asim, asimMetni, hekimDogruladi }
  }

  if (!HESAPLANABILIR.has(p.birim) || !Number.isFinite(weightKg) || weightKg <= 0) {
    return { metin: p.metin, hekimDogruladi }
  }

  const min = typeof p.min === 'number' ? p.min : undefined
  const max = typeof p.max === 'number' ? p.max : min
  if (min === undefined) return { metin: p.metin, hekimDogruladi }

  const bolum = p.gunlukBolum && p.gunlukBolum > 0 ? p.gunlukBolum : 1
  const perDozMin = p.birim === 'mg/kg/doz' ? min * weightKg : (min * weightKg) / bolum
  const perDozMax = p.birim === 'mg/kg/doz' ? (max ?? min) * weightKg : ((max ?? min) * weightKg) / bolum
  const gunlukMin = p.birim === 'mg/kg/doz' ? perDozMin * bolum : min * weightKg
  const gunlukMax = p.birim === 'mg/kg/doz' ? perDozMax * bolum : (max ?? min) * weightKg

  const yuvarla = (n: number) => Math.round(n * 10) / 10

  // Ceiling: the lower of the per-kg ceiling and the absolute daily ceiling, when sourced.
  const tavanlar: number[] = []
  if (typeof p.maxMgKgGun === 'number') tavanlar.push(p.maxMgKgGun * weightKg)
  if (typeof p.mutlakMaxMgGun === 'number') tavanlar.push(p.mutlakMaxMgGun)
  const tavan = tavanlar.length ? Math.min(...tavanlar) : undefined

  const parcalar = [
    p.birim === 'mg/kg/doz'
      ? `${yuvarla(perDozMin)}${perDozMax !== perDozMin ? `–${yuvarla(perDozMax)}` : ''} mg/doz (günde ${bolum} kez, toplam ${yuvarla(gunlukMin)}${gunlukMax !== gunlukMin ? `–${yuvarla(gunlukMax)}` : ''} mg/gün)`
      : `${yuvarla(gunlukMin)}${gunlukMax !== gunlukMin ? `–${yuvarla(gunlukMax)}` : ''} mg/gün${bolum > 1 ? ` (${bolum} doza bölünmüş: ${yuvarla(perDozMin)}${perDozMax !== perDozMin ? `–${yuvarla(perDozMax)}` : ''} mg/doz)` : ''}`,
  ]
  if (tavan !== undefined) parcalar.push(`Kaynaktaki tavan: ${yuvarla(tavan)} mg/gün`)

  let asim: boolean | undefined
  let asimMetni: string | undefined
  if (tavan !== undefined && typeof verilenGunlukMg === 'number' && Number.isFinite(verilenGunlukMg)) {
    asim = verilenGunlukMg > tavan
    if (asim) asimMetni = `Yazılan günlük doz (${yuvarla(verilenGunlukMg)} mg) kaynaktaki tavanı (${yuvarla(tavan)} mg/gün) AŞIYOR.`
  }

  return {
    metin: `${weightKg} kg için ${parcalar.join('. ')}. Kaynak: ${p.metin}`,
    gunlukMinMg: yuvarla(gunlukMin),
    gunlukMaxMg: yuvarla(gunlukMax),
    dozBasiMinMg: yuvarla(perDozMin),
    dozBasiMaxMg: yuvarla(perDozMax),
    tavanMgGun: tavan === undefined ? undefined : yuvarla(tavan),
    asim,
    asimMetni,
    hekimDogruladi,
  }
}

/** Back-compat wrapper: the free-text line the older callers print. */
export function calculatePediatricDose(drugKey: string, weightKg: number): string {
  const h = pediatrikDozHesapla(drugKey, weightKg)
  if (!h) return 'Pediatrik doz bilgisi mevcut değil'
  return h.metin
}

// SGK kısıtlaması kontrolü
export function checkSGKRestriction(drugKey: string): string | null {
  return TURKISH_DRUGS[drugKey]?.sgkRestriction || null
}

// ============================================================
// EŞLEŞTİRME — tek motor (NOTYA-EYLEM-25 / -29)
// ============================================================
/**
 * `interactions` / `contraindications` entries are written the way a doctor writes them: sometimes a
 * molecule ("Warfarin"), sometimes a CLASS ("NSAİİ", "ACE inhibitörü", "QT uzatan ilaç"), sometimes
 * with an aside ("Warfarin (yüksek doz)"). The original matcher only compared an entry against the
 * other drug's `name`, so every class entry silently never fired — ibuprofen + ramipril, naproksen +
 * metilprednizolon and sertralin + sumatriptan all read as "no interaction".
 *
 * NOTYA-EYLEM-29 closed the rest of that gap: a molecule now carries EVERY class label it answers to
 * in `siniflar`, so "Antihipertansifler", "QT uzatan ilaçlar" and "Aminoglikozidler" resolve instead
 * of going quiet. A test asserts that every class named in an interaction resolves to ≥1 molecule.
 *
 * Conservative on false positives: an entry matches only when EVERY significant token of it matches
 * a token of the target. "ACE inhibitörü" therefore does not fire on "Proton pompa inhibitörü".
 */
const KUCUK_TR = (x: string) => x.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr')

/**
 * Turkish case folding, for matching only. Doctors type the same brand as "İmigran", "Imigran" and
 * "imigran"; a matcher that distinguishes ı from i reads those as three different drugs and goes
 * silent — which is exactly the failure mode this whole module exists to prevent. Folding ı→i is
 * safe here because the comparison is between drug names and class labels, not between Turkish
 * words whose meaning turns on the dot.
 */
const ESLESME_KATLA = (x: string) => x.replace(/ı/g, 'i')

function tokenlar(ifade: string): string[] {
  return ESLESME_KATLA(KUCUK_TR(ifade))
    .replace(/\([^)]*\)/g, ' ')          // parenthetical aside is explanation, not a name
    .split(/[^a-zçğiöşü0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
}

function tokenEslesir(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 5 || b.length < 5) return false
  const kisa = a.length <= b.length ? a : b
  const uzun = a.length <= b.length ? b : a
  if (uzun.startsWith(kisa)) return true
  let i = 0
  while (i < kisa.length && kisa[i] === uzun[i]) i++
  return i >= 5 // "inhibitörleri" ↔ "inhibitörü"
}

/**
 * ILAC-TABLOSU-INSULIN — a phrase names this drug when every token matches: a NAME or BRAND token only by the strict
 * name rule (`adTokenEslesir` — exact, Turkish case suffix, long substance stem), a CLASS token by the lenient
 * `tokenEslesir` ("inhibitörleri" ↔ "inhibitörü"). The lenient 5-letter shared-prefix rule on brand names is what made a
 * "Levemir" allergy fire on Levemax (levetirasetam) and back.
 */
export function ifadeIlaciAnlatiyorMu(ifade: string, drug: TürkishDrug): boolean {
  const ad = tokenlar(drug.name)
  const marka = drug.brand.flatMap(tokenlar)
  const sinif = [...tokenlar(drug.category), ...(drug.siniflar || []).flatMap(tokenlar)]
  // "SSRI/SNRI", "Warfarin, Lityum" → alternatives; each alternative must match on its own.
  return ESLESME_KATLA(KUCUK_TR(ifade))
    .replace(/\([^)]*\)/g, ' ')
    .split(/[/,;+]|\bveya\b|\bve\b/)
    .some((alt) => {
      const t = tokenlar(alt)
      return (
        t.length > 0 &&
        t.every(
          (x) =>
            ad.some((h) => adTokenEslesir(x, h) || maddeKokuEslesir(x, h)) ||
            marka.some((h) => adTokenEslesir(x, h)) ||
            sinif.some((h) => tokenEslesir(x, h))
        )
      )
    })
}

/** True when every significant token of `aranan` also appears in `hedef` (both free clinical text). */
export function ifadeMetindeGecerMi(aranan: string, hedef: string): boolean {
  const a = tokenlar(aranan)
  const h = tokenlar(hedef)
  return a.length > 0 && h.length > 0 && a.every((x) => h.some((y) => tokenEslesir(x, y)))
}

// ============================================================
// AD → MOLEKÜL ÇÖZÜMÜ — ILAC-TABLOSU-INSULIN (2026-11-25)
// ============================================================
/**
 * The bug class this section closes: the old resolver accepted any two tokens sharing their first five letters, so
 * "Levemir" (insülin detemir) resolved to levetirasetam through the brand "Levemax" — an antiepileptic's interactions on
 * an insulin card — and Humalog / NovoRapid / Tresiba resolved to nothing. Name resolution now has three tiers:
 *
 *   1. STRONG — exact token, or the table token + a Turkish case suffix ("Lantus'u", "insülini", "Parolü"), or (generic
 *      substance names only) a long shared stem ("klavulanat" ↔ "klavulanik": ≥7 letters and ≥70 % of the shorter).
 *      Brand names never stem-match: brands are coined words and look-alike brands belong to unrelated drugs.
 *   2. PHRASE — a multi-word brand written out whole ("Humulin N", "Humalog Mix 25") adds its word count, so one- and
 *      two-letter brand parts that the token rule drops still pick the right product.
 *   3. TYPO — only when nothing matched strongly anywhere: one edit (Damerau) on a ≥7-letter token, same first letter,
 *      AND exactly one table entry has any token within two edits. A name close to two entries is ambiguous → nothing.
 *
 * No confident match → null. Unknown is safer than wrong: the card then says "tabloda yok" instead of checking the
 * wrong molecule. Numbers, units, dosage forms and pen names are not drug names and are ignored on both sides.
 */
const AD_DOLGU: ReadonlySet<string> = new Set([
  'tablet', 'tablet', 'tab', 'film', 'kapli', 'kapsul', 'kapsül', 'şurup', 'surup', 'süspansiyon', 'suspansiyon', 'damla',
  'flakon', 'ampul', 'kalem', 'kartuş', 'kartus', 'enjeksiyon', 'enjeksiyonluk', 'çözelti', 'cozelti', 'krem', 'merhem',
  'jel', 'sprey', 'efervesan', 'oral', 'iceren', 'içeren', 'kullanima', 'kullanıma', 'hazir', 'hazır', 'steril', 'adet',
  'kutu', 'birim', 'unite', 'ünite', 'solostar', 'flexpen', 'kwikpen', 'penfill', 'penfil', 'flextouch', 'dispopen',
  'junior', 'mcg', 'mikrogram',
])

/** Turkish case/possessive/plural endings a written drug name carries (after ı→i folding). */
const AD_EKLERI: ReadonlySet<string> = new Set([
  'i', 'u', 'ü', 'a', 'e', 'yi', 'yu', 'yü', 'ya', 'ye', 'ni', 'nu', 'nü', 'si', 'su', 'sü', 'in', 'un', 'ün', 'nin',
  'nun', 'nün', 'yin', 'yun', 'yün', 'da', 'de', 'ta', 'te', 'dan', 'den', 'tan', 'ten', 'la', 'le', 'yla', 'yle', 'lar',
  'ler', 'lari', 'leri',
])

function adTokenlari(ifade: string): string[] {
  return tokenlar(ifade).filter((t) => !/^\d+$/.test(t) && !AD_DOLGU.has(t))
}

/** Strict name-token match: identical, or the table token followed by a Turkish suffix. */
function adTokenEslesir(girdi: string, hedef: string): boolean {
  if (girdi === hedef) return true
  return hedef.length >= 5 && girdi.startsWith(hedef) && AD_EKLERI.has(girdi.slice(hedef.length))
}

/** Generic substance stems only ("klavulanat" ↔ "klavulanik"): ≥7 shared leading letters covering ≥70 % of the shorter. */
function maddeKokuEslesir(a: string, b: string): boolean {
  if (a.length < 8 || b.length < 8) return false
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i >= 7 && i >= 0.7 * Math.min(a.length, b.length)
}

/** Optimal-string-alignment (Damerau) distance, capped: returns `sinir + 1` as soon as the distance exceeds it. */
export function duzeltmeMesafesi(a: string, b: string, sinir = 2): number {
  if (Math.abs(a.length - b.length) > sinir) return sinir + 1
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let satirMin = Infinity
    for (let j = 1; j <= b.length; j++) {
      const m = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + m)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      satirMin = Math.min(satirMin, d[i][j])
    }
    if (satirMin > sinir) return sinir + 1
  }
  return Math.min(d[a.length][b.length], sinir + 1)
}

/** Words of a phrase, every length kept (for multi-word brand phrases: "Humulin N"). */
function ifadeKelimeleri(x: string): string[] {
  return ESLESME_KATLA(KUCUK_TR(x)).replace(/\([^)]*\)/g, ' ').split(/[^a-zçğiöşü0-9]+/i).filter(Boolean)
}

/** Whole written name, for the exact-name tie-break: every word kept except dosage-form/pen words ("Aerius" ≠ "Aerius-L"). */
function tamAd(x: string): string {
  return ifadeKelimeleri(x).filter((w) => !AD_DOLGU.has(w)).join(' ')
}

function altDiziMi(buyuk: string[], kucuk: string[]): boolean {
  if (!kucuk.length || kucuk.length > buyuk.length) return false
  for (let i = 0; i + kucuk.length <= buyuk.length; i++) if (kucuk.every((k, j) => buyuk[i + j] === k)) return true
  return false
}

interface AdSozlugu {
  anahtar: string
  ad: string[]
  marka: string[]
  anahtarToken: string[]
  /** Multi-word brands, as word lists. */
  ifadeler: string[][]
  /** The name and every brand as a whole (name tokens joined) — an exact whole-name hit breaks a tie. */
  tamAdlar: Set<string>
  hepsi: string[]
}

let SOZLUK: AdSozlugu[] | null = null
function adSozlugu(): AdSozlugu[] {
  if (SOZLUK) return SOZLUK
  SOZLUK = Object.entries(TURKISH_DRUGS).map(([anahtar, d]) => {
    const ad = adTokenlari(d.name)
    const marka = d.brand.flatMap(adTokenlari)
    const anahtarToken = tokenlar(anahtar)
    const ifadeler = d.brand.map(ifadeKelimeleri).filter((k) => k.length >= 2)
    const tamAdlar = new Set([d.name, ...d.brand, anahtar].map(tamAd).filter(Boolean))
    return { anahtar, ad, marka, anahtarToken, ifadeler, tamAdlar, hepsi: [...ad, ...marka, ...anahtarToken] }
  })
  return SOZLUK
}

function gucluEslesir(x: string, s: AdSozlugu): boolean {
  return (
    s.ad.some((h) => adTokenEslesir(x, h) || maddeKokuEslesir(x, h)) ||
    s.marka.some((h) => adTokenEslesir(x, h)) ||
    s.anahtarToken.some((h) => adTokenEslesir(x, h))
  )
}

/**
 * Every candidate for a written name, best first (score, then table order). Empty when nothing matches confidently.
 * Exported for the cross-class sweep test.
 */
export function ilacAdiAdaylari(ad: string): Array<{ anahtar: string; puan: number; yol: 'guclu' | 'yazim' }> {
  const metin = String(ad || '')
  const t = [...new Set(adTokenlari(metin))]
  if (!t.length) return []
  const kelimeler = ifadeKelimeleri(metin)
  const tamGirdi = tamAd(metin)
  const sozluk = adSozlugu()

  const guclu: Array<{ anahtar: string; puan: number; sira: number; yol: 'guclu' }> = []
  sozluk.forEach((s, sira) => {
    const eslesen = t.filter((x) => gucluEslesir(x, s)).length
    if (!eslesen) return
    const ifade = Math.max(0, ...s.ifadeler.filter((k) => altDiziMi(kelimeler, k)).map((k) => k.length))
    // Tie-break only (½ point): "Levonorgestrel (acil kontrasepsiyon)" is the single-agent row, not the first row
    // that also carries the word levonorgestrel.
    const tam = s.tamAdlar.has(tamGirdi) ? 0.5 : 0
    guclu.push({ anahtar: s.anahtar, puan: eslesen + ifade + tam, sira, yol: 'guclu' })
  })
  if (guclu.length) {
    guclu.sort((a, b) => b.puan - a.puan || a.sira - b.sira)
    return guclu.map(({ anahtar, puan, yol }) => ({ anahtar, puan, yol }))
  }

  // Typo tier — one edit, one unambiguous table word, nothing else nearby. "Humalogg" is one edit from "humalog", which
  // two rows carry (Humalog, Humalog Mix) — still ONE word, so it is re-read as "humalog"; "Levemir" is two edits from
  // "levemax" and resolves only because "levemir" itself is now in the table.
  for (const x of t) {
    if (x.length < 7) continue
    const yakin = new Set<string>()
    let tekHata: string | null = null
    for (const s of sozluk) {
      for (const h of s.hepsi) {
        if (h.length < 5) continue
        const m = duzeltmeMesafesi(x, h, 2)
        if (m <= 2) yakin.add(h)
        if (m === 1 && h.length >= 7 && h[0] === x[0]) tekHata = h
      }
    }
    if (tekHata && yakin.size === 1) {
      const duzeltilmis = t.map((y) => (y === x ? tekHata! : y)).join(' ')
      return ilacAdiAdaylari(duzeltilmis).map((a) => ({ ...a, yol: 'yazim' as const }))
    }
  }
  return []
}

/**
 * NOTYA-ILK10-DOZ-01 / ILAC-TABLOSU-INSULIN — the table key that matches a written drug BEST, or null when no entry
 * matches confidently. "amoksisilin-klavulanat" → the combination (more tokens), "Humulin N" → NPH (whole brand
 * phrase), "Levemir" → insülin detemir (never levetirasetam).
 */
export function enIyiIlacAnahtari(ad: string): string | null {
  return ilacAdiAdaylari(ad)[0]?.anahtar ?? null
}

/**
 * Free-text drug name ("Largopen 1000 mg", "PAROL (parasetamol)") → table key, or null. Matches on molecule name, brand
 * and the table key only — NOT on `category`/`siniflar` (a class label is not one molecule: "bir NSAİİ" is not
 * ibuprofen). Since ILAC-TABLOSU-INSULIN this is the same best-match resolver the dose check uses; the old first-hit
 * loop returned whichever entry a token touched first ("Humalog Mix 25" → plain lispro).
 */
export function drugKeyFor(ad: string): string | null {
  return enIyiIlacAnahtari(ad)
}

/** Every class label used anywhere in the table — the vocabulary a class-level entry may draw on. */
export function tumSiniflar(): Set<string> {
  const out = new Set<string>()
  for (const d of Object.values(TURKISH_DRUGS)) {
    out.add(d.category)
    for (const s of d.siniflar || []) out.add(s)
  }
  return out
}

/**
 * NOTYA-EYLEM-29 — interaction targets that are KNOWINGLY outside the molecule table.
 *
 * The bug this list exists to prevent: an interaction written against a name nothing in the table
 * answers to fires for nobody and says nothing, so the gap is invisible. Every such name now has to
 * be declared here, and `core/eylemler/tests/ilacTablosu.test.ts` fails when a new one appears — so
 * "this class never matched" becomes a red test instead of a quiet card.
 *
 * Two kinds of entry:
 *   • molecules that are real and prescribed in Turkey but not yet in the table (amiodaron,
 *     lityum, teofilin, verapamil…) — adding the molecule removes it from this list automatically;
 *   • things that are not table rows at all ("Canlı aşı", "Alkol").
 */
export const TABLO_DISI_ETKILESIM: ReadonlySet<string> = new Set([
  // not a drug row
  'Alkol', 'Canlı aşı', 'Aktif kömür',
  // classes with no member in the table yet
  'Trisiklik antidepresan',
  // molecules not in the table
  'Amiodaron', 'Apomorfin', 'Atazanavir', 'Azatiyoprin', 'Busulfan', 'Diazepam', 'Diltiazem',
  'Disülfiram', 'Fenitoin', 'Fenobarbital', 'Flukloksasilin', 'Gemfibrozil', 'Ketokonazol',
  'Klonidin', 'Kloramfenikol', 'Klorpromazin', 'Levodopa', 'Linezolid', 'Lityum', 'Midazolam',
  'Mikofenolat mofetil', 'Mikonazol', 'Nelfinavir', 'Pimozid', 'Probenesid', 'Rilpivirin',
  'Ritonavir', 'Sisaprid', 'Simetidin', 'Sitalopram', 'Sukralfat', 'Takrolimus', 'Tamoksifen', 'Teofilin',
  'Tizanidin', 'Verapamil', 'Vildagliptin', 'Vorikonazol', 'Zidovudin',
])

/** Every interaction target that no molecule in the table answers to and that is not declared above. */
export function bildirilmemisEtkilesimHedefleri(): string[] {
  const out = new Set<string>()
  for (const d of Object.values(TURKISH_DRUGS)) {
    for (const e of d.etkilesimler || []) {
      if (TABLO_DISI_ETKILESIM.has(e.ile)) continue
      if (!Object.values(TURKISH_DRUGS).some((x) => ifadeIlaciAnlatiyorMu(e.ile, x))) out.add(e.ile)
    }
  }
  return [...out].sort()
}

export interface EtkilesimBulgusu {
  /** Which molecule the interaction is WITH. */
  digerAnahtar: string
  siddet: 'ciddi' | 'orta'
  /** One Turkish line: mechanism → advice. */
  not: string
  /** Which of the two entries declared it, for the card's `Kaynak:` line. */
  bildiren: string
}

/**
 * Structured interaction verdict between two table molecules, or null. Symmetric by construction:
 * both entries' lists are read, so "A lists B" and "B lists A" produce the same answer.
 */
export function etkilesimBul(drug1Key: string, drug2Key: string): EtkilesimBulgusu | null {
  const d1 = TURKISH_DRUGS[drug1Key]
  const d2 = TURKISH_DRUGS[drug2Key]
  if (!d1 || !d2 || drug1Key === drug2Key) return null

  const adaylar: EtkilesimBulgusu[] = []
  for (const e of d1.etkilesimler || []) {
    if (ifadeIlaciAnlatiyorMu(e.ile, d2)) adaylar.push({ digerAnahtar: drug2Key, siddet: e.siddet, not: e.not, bildiren: d1.name })
  }
  for (const e of d2.etkilesimler || []) {
    if (ifadeIlaciAnlatiyorMu(e.ile, d1)) adaylar.push({ digerAnahtar: drug2Key, siddet: e.siddet, not: e.not, bildiren: d2.name })
  }
  if (!adaylar.length) {
    // Back-compat: an entry that only carries the free-text list still fires.
    const serbest =
      (d1.interactions || []).some((i) => ifadeIlaciAnlatiyorMu(i, d2)) ||
      (d2.interactions || []).some((i) => ifadeIlaciAnlatiyorMu(i, d1))
    if (!serbest) return null
    return { digerAnahtar: drug2Key, siddet: 'ciddi', not: `${d1.name} ile ${d2.name} arasında etkileşim bildiriliyor.`, bildiren: d1.name }
  }
  // Most severe wins; among equals, the first declaration.
  adaylar.sort((a, b) => (a.siddet === b.siddet ? 0 : a.siddet === 'ciddi' ? -1 : 1))
  return adaylar[0]
}

/** Back-compat boolean/string form. */
export function checkInteractions(drug1Key: string, drug2Key: string): string | null {
  const b = etkilesimBul(drug1Key, drug2Key)
  if (!b) return null
  const d1 = TURKISH_DRUGS[drug1Key]
  const d2 = TURKISH_DRUGS[drug2Key]
  return `⚠️ UYARI: ${d1.name} ve ${d2.name} arasında etkileşim var! ${b.not}`
}

/** `renkliRecete` must agree with lib/doktor/receteRengi — asserted by a test, computed here. */
export function beklenenReceteRengi(d: TürkishDrug): ReturnType<typeof receteRengi> {
  return receteRengi(d.name, d.brand.join(' '))
}
