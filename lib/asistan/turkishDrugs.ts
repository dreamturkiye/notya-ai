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
  return Object.values(TURKISH_DRUGS).filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.brand.some(b => b.toLowerCase().includes(q)) ||
    d.category.toLowerCase().includes(q)
  )
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
export function pediatrikDozHesapla(drugKey: string, weightKg: number, verilenGunlukMg?: number): PediatrikDozHesabi | null {
  const drug = TURKISH_DRUGS[drugKey]
  const p = drug?.pediatrik
  if (!drug || !p) return null
  const hekimDogruladi = drug.kaynak.dogrulama === 'hekim_dogruladi'

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

/** The searchable vocabulary of a drug: generic name, brands, primary class and every class label. */
function ilacTokenlari(d: TürkishDrug): string[] {
  return [
    ...tokenlar(d.name),
    ...d.brand.flatMap(tokenlar),
    ...tokenlar(d.category),
    ...(d.siniflar || []).flatMap(tokenlar),
  ]
}

/**
 * True when a free-text clinical phrase (an interaction entry, a contraindication, a recorded
 * allergy) names this drug — by molecule, by brand or by class.
 */
export function ifadeIlaciAnlatiyorMu(ifade: string, drug: TürkishDrug): boolean {
  const hedef = ilacTokenlari(drug)
  // "SSRI/SNRI", "Warfarin, Lityum" → alternatives; each alternative must match on its own.
  return ESLESME_KATLA(KUCUK_TR(ifade))
    .replace(/\([^)]*\)/g, ' ')
    .split(/[/,;+]|\bveya\b|\bve\b/)
    .some((alt) => {
      const t = tokenlar(alt)
      return t.length > 0 && t.every((x) => hedef.some((h) => tokenEslesir(x, h)))
    })
}

/** True when every significant token of `aranan` also appears in `hedef` (both free clinical text). */
export function ifadeMetindeGecerMi(aranan: string, hedef: string): boolean {
  const a = tokenlar(aranan)
  const h = tokenlar(hedef)
  return a.length > 0 && h.length > 0 && a.every((x) => h.some((y) => tokenEslesir(x, y)))
}

/**
 * Free-text drug name ("Largopen 1000 mg", "PAROL (parasetamol)") → table key, or null.
 *
 * Matches on molecule name, brand and the table key only — NOT on `category`/`siniflar`: a class
 * label resolving a written prescription line to one arbitrary member of that class would make the
 * duplicate-ingredient check wrong ("bir NSAİİ" is not ibuprofen).
 */
export function drugKeyFor(ad: string): string | null {
  const t = tokenlar(String(ad || ''))
  if (!t.length) return null
  for (const [anahtar, d] of Object.entries(TURKISH_DRUGS)) {
    const hedef = [...tokenlar(d.name), ...d.brand.flatMap(tokenlar), ...tokenlar(anahtar)]
    if (t.some((x) => hedef.some((h) => tokenEslesir(x, h)))) return anahtar
  }
  return null
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
 * NOTYA-EYLEM-29 — interaction targets that are KNOWINGLY outside the 176-molecule table.
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
  'Ritonavir', 'Sisaprid', 'Sitalopram', 'Sukralfat', 'Takrolimus', 'Tamoksifen', 'Teofilin',
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
