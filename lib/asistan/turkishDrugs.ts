
// ============================================================
// NOTYA ASISTAN — Türkiye İlaç Formulasyonu
// Kaynak: SGK İlaç Listesi + TİTCK + Vademecum
// ============================================================

export interface TürkishDrug {
  name: string            // Jenerik ad
  brand: string[]         // Türkiye'deki marka adları
  dose: string            // Standart doz
  pediatricDose?: string  // Pediatrik doz (mg/kg)
  form: string            // Tablet, şurup, ampul vb.
  sgkCovered: boolean     // SGK ödeme durumu
  sgkRestriction?: string // SGK kısıtlaması
  category: string        // Farmakolojik kategori
  contraindications: string[]
  interactions: string[]
  notes?: string
}

export const TURKISH_DRUGS: Record<string, TürkishDrug> = {
  amoksisilin: {
    name: "Amoksisilin",
    brand: ["Amoksina", "Amoksipen", "Largopen", "Alfoxil", "Amoklavin (+ klavulanat)"],
    dose: "500mg 3x1 veya 875mg 2x1 (yetişkin)",
    pediatricDose: "40-90 mg/kg/gün 3 eşit doza bölünmüş",
    form: "Kapsül, şurup, efervesan",
    sgkCovered: true,
    category: "Penisilin antibiyotik",
    contraindications: ["Penisilin alerjisi", "Mononükleoz"],
    interactions: ["Varfarin", "Allopürinol", "Metotreksat"],
    notes: "Otit için 10 gün, ÜSYE için 7 gün önerilir"
  },
  parasetamol: {
    name: "Parasetamol (Asetaminofen)",
    brand: ["Parol", "Minoset", "Calpol", "Tylol", "Atafen", "Panadon"],
    dose: "500-1000mg 4-6 saatte bir (max 4g/gün)",
    pediatricDose: "10-15 mg/kg/doz, 4-6 saatte bir (max 60mg/kg/gün)",
    form: "Tablet, şurup, supozituar, IV",
    sgkCovered: true,
    category: "Analjezik/Antipiretik",
    contraindications: ["Ağır karaciğer yetmezliği"],
    interactions: ["Warfarin (yüksek doz)", "Alkol"],
    notes: "SGK kısıtlaması yok. Türkiye'de en yaygın kullanılan."
  },
  naproksen: {
    name: "Naproksen",
    brand: ["Naprosyn", "Apranax", "Naproks", "Xenar"],
    dose: "250-500mg 2x1",
    form: "Tablet, jel",
    sgkCovered: true,
    category: "NSAID",
    contraindications: ["Aktif peptik ülser", "Böbrek yetmezliği", "Astım (aspirin duyarlı)"],
    interactions: ["Warfarin", "Lityum", "Metotreksat", "Antihipertansifler"],
  },
  diklofenak: {
    name: "Diklofenak",
    brand: ["Voltaren", "Dikloron", "Voltfast", "Cataflam"],
    dose: "75mg 2x1 veya 50mg 3x1",
    form: "Tablet, IM, jel, supozituar",
    sgkCovered: true,
    category: "NSAID",
    contraindications: ["Peptik ülser", "KVH", "Böbrek yetmezliği"],
    interactions: ["Warfarin", "ACE inhibitörleri", "Diüretikler"],
  },
  ibuprofen: {
    name: "İbuprofen",
    brand: ["Brufen", "Nurofen", "Advil", "Profen"],
    dose: "400-800mg 3-4x/gün",
    pediatricDose: "5-10 mg/kg/doz 6-8 saatte bir",
    form: "Tablet, şurup",
    sgkCovered: true,
    category: "NSAID",
    contraindications: ["Peptik ülser", "KVH", "6 ay altı bebek"],
    interactions: ["Aspirin", "Warfarin", "ACE inhibitörleri"],
  },
  amoksisilinKlavulanat: {
    name: "Amoksisilin + Klavulanat",
    brand: ["Augmentin", "Amoklavin", "Klavamoks", "Synulox"],
    dose: "875/125mg 2x1 (yetişkin)",
    pediatricDose: "45/6.4 mg/kg/gün 2 eşit doza",
    form: "Tablet, şurup",
    sgkCovered: true,
    category: "Beta-laktamaz inhibitörlü penisilin",
    contraindications: ["Penisilin alerjisi", "Kolestaz öyküsü"],
    interactions: ["Varfarin", "Allopürinol"],
    notes: "Komplike otit, sinüzit, pnömoni için tercih edilir"
  },
  azitromisin: {
    name: "Azitromisin",
    brand: ["Zithromax", "Azitro", "Ribotrex", "Azitrobak"],
    dose: "500mg 1x1 (3-5 gün) veya tek doz 1g",
    pediatricDose: "10 mg/kg/gün 1x1 (3 gün)",
    form: "Tablet, şurup",
    sgkCovered: true,
    sgkRestriction: "Penisilin alerjisi veya atipik pnömoni belgelenirse",
    category: "Makrolid antibiyotik",
    contraindications: ["QT uzaması", "Karaciğer yetmezliği"],
    interactions: ["Warfarin", "Digoksin", "QT uzatan ilaçlar"],
  },
  metilprednizolon: {
    name: "Metilprednizolon",
    brand: ["Prednol", "Medrol", "Metpred", "Caberdelta"],
    dose: "4-32mg/gün oral, 40-125mg IV/IM",
    pediatricDose: "0.5-1.7 mg/kg/gün",
    form: "Tablet, IV, IM",
    sgkCovered: true,
    category: "Kortikosteroid",
    contraindications: ["Sistemik mantar enfeksiyonu", "Canlı aşı"],
    interactions: ["NSAIDs", "Aspirin", "Warfarin", "İnsülin"],
  },
  sertralin: {
    name: "Sertralin",
    brand: ["Lustral", "Zoloft", "Serteva", "Xydep", "Selectra"],
    dose: "50-200mg 1x1 sabah",
    form: "Tablet",
    sgkCovered: true,
    category: "SSRI antidepresan",
    contraindications: ["MAO inhibitörü kullanımı (14 gün beklenmeli)"],
    interactions: ["MAOIs", "Pimozid", "Triptanlar", "Tramadol"],
    notes: "Türkiye'de en yaygın SSRI. Karaciğer hastaları dikkatli kullanmalı."
  },
  metformin: {
    name: "Metformin",
    brand: ["Glucophage", "Diaformin", "Glifor", "Metforal"],
    dose: "500-2000mg/gün 2-3 doza bölünmüş, yemekle",
    form: "Tablet, XR tablet",
    sgkCovered: true,
    category: "Biguanid antidiyabetik",
    contraindications: ["eGFR <30", "Kontrast madde öncesi", "Ağır karaciğer yetmezliği"],
    interactions: ["Kontrast maddeler", "Alkol", "Simetidin"],
    notes: "Tip 2 DM birinci basamak tedavisi. XR formu GI yan etkiyi azaltır."
  },
  atorvastatin: {
    name: "Atorvastatin",
    brand: ["Sortis", "Lipitor", "Atol", "Atoris", "Liponorm"],
    dose: "10-80mg 1x1 gece",
    form: "Tablet",
    sgkCovered: true,
    category: "Statin (HMG-CoA redüktaz inhibitörü)",
    contraindications: ["Aktif karaciğer hastalığı", "Gebelik", "Emzirme"],
    interactions: ["Siklosporin", "Gemfibrozil", "Eritromisin", "Diltiazem"],
  },
  ranitidin: {
    name: "Famotidin (Ranitidin artık piyasada yok)",
    brand: ["Quamatel", "Pepcid", "Famoser"],
    dose: "20-40mg 2x1",
    form: "Tablet, IV",
    sgkCovered: true,
    category: "H2 reseptör antagonisti",
    contraindications: [],
    interactions: ["Ketokonazol", "Itrakonazol"],
    notes: "Not: Ranitidin TİTCK tarafından piyasadan kaldırıldı (NDMA). Famotidin kullanın."
  },
  omeprazol: {
    name: "Omeprazol",
    brand: ["Losec", "Prilosec", "Omez", "Gastrozol", "Pepticum"],
    dose: "20-40mg 1x1 sabah aç karnına",
    form: "Kapsül, IV",
    sgkCovered: true,
    category: "Proton pompa inhibitörü",
    contraindications: [],
    interactions: ["Klopidogrel (etkiyi azaltır)", "Metotreksat", "Rifampisin"],
  },
  furosemid: {
    name: "Furosemid",
    brand: ["Lasix", "Furanthril", "Diuver (torasemid)"],
    dose: "20-80mg/gün oral, 20-40mg IV",
    pediatricDose: "1-2 mg/kg/doz",
    form: "Tablet, IV, IM",
    sgkCovered: true,
    category: "Loop diüretik",
    contraindications: ["Anüri", "Hipovolemi", "Sulfonamid alerjisi"],
    interactions: ["ACE inhibitörleri", "NSAIDs", "Aminoglikozidler", "Lityum"],
    notes: "Potasyum takibi zorunlu. KKY'de standart tedavi."
  },
  sumatriptan: {
    name: "Sumatriptan",
    brand: ["İmitrex", "Imigran", "Sumatran"],
    dose: "50-100mg oral, 6mg SC, 20mg nazal",
    form: "Tablet, enjeksiyon, nazal sprey",
    sgkCovered: true,
    sgkRestriction: "Nörolog reçetesi veya nöroloji raporu gerekli",
    category: "Triptan (5-HT1B/1D agonisti)",
    contraindications: ["İskemik KVH", "İnme öyküsü", "Kontrolsüz HT", "Hemiplejik migren"],
    interactions: ["MAOIs", "Ergotamin", "Diğer triptanlar", "SSRI/SNRI (serotonin sendromu)"],
  },
  amlodipim: {
    name: "Amlodipin",
    brand: ["Norvasc", "Amlovas", "Tenox", "Amlodis"],
    dose: "5-10mg 1x1",
    form: "Tablet",
    sgkCovered: true,
    category: "Kalsiyum kanal blokörü (dihidropiridin)",
    contraindications: ["Ağır hipotansiyon", "Kararsız anjin"],
    interactions: ["Siklosporin", "Takrolimus", "Simvastatin (doz kısıtlaması)"],
  },
  ramipril: {
    name: "Ramipril",
    brand: ["Delix", "Tritace", "Ramiprol", "Ramace"],
    dose: "2.5-10mg 1x1",
    form: "Kapsül, tablet",
    sgkCovered: true,
    category: "ACE inhibitörü",
    contraindications: ["Gebelik", "Anjiyoödem öyküsü", "Bilateral renal arter stenozu"],
    interactions: ["Potasyum tutucu diüretikler", "NSAIDs", "Lityum"],
  },
  metoprolol: {
    name: "Metoprolol",
    brand: ["Beloc", "Beloc-Zok", "Lopressor", "Toprol"],
    dose: "25-200mg/gün (suksinat: 1x1, tartrat: 2x1)",
    form: "Tablet, IV",
    sgkCovered: true,
    category: "Beta-1 selektif blokör",
    contraindications: ["Ağır bradikardi", "İkinci/üçüncü derece AV blok", "Dekompanze KKY"],
    interactions: ["Verapamil", "Diltiazem", "Klonidin", "İnsülin"],
  },
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

// ============================================================
// DOSE CALCULATOR — pediatric weight-based dosing
// ============================================================
export function calculatePediatricDose(drugKey: string, weightKg: number): string {
  const drug = TURKISH_DRUGS[drugKey]
  if (!drug?.pediatricDose) return "Pediatrik doz bilgisi mevcut değil"
  
  const match = drug.pediatricDose.match(/(\d+)(?:-(\d+))?\s*mg\/kg/)
  if (!match) return drug.pediatricDose
  
  const minDose = parseInt(match[1])
  const maxDose = match[2] ? parseInt(match[2]) : minDose
  const minTotal = Math.round(minDose * weightKg)
  const maxTotal = Math.round(maxDose * weightKg)
  
  return maxDose > minDose
    ? `${minTotal}-${maxTotal} mg/gün (${drug.pediatricDose})`
    : `${minTotal} mg/gün (${drug.pediatricDose})`
}

// SGK kısıtlaması kontrolü
export function checkSGKRestriction(drugKey: string): string | null {
  return TURKISH_DRUGS[drugKey]?.sgkRestriction || null
}

// ============================================================
// EŞLEŞTİRME — tek motor (NOTYA-EYLEM-25)
// ============================================================
/**
 * `interactions` / `contraindications` entries are written the way a doctor writes them: sometimes a
 * molecule ("Warfarin"), sometimes a CLASS ("NSAIDs", "ACE inhibitörleri", "SSRI/SNRI"), sometimes
 * with an aside ("Warfarin (yüksek doz)"). The original matcher only compared an entry against the
 * other drug's `name`, so every class entry silently never fired — ibuprofen + ramipril, naproksen +
 * metilprednizolon and sertralin + sumatriptan all read as "no interaction".
 *
 * This is the same engine reading the field that actually holds the class (`category`) plus the
 * brand list. No second drug table, no new data: only the matching rule is honest now.
 *
 * Conservative on false positives: an entry matches only when EVERY significant token of it matches
 * a token of the target. "ACE inhibitörleri" therefore does not fire on "Proton pompa inhibitörü".
 */
const KUCUK_TR = (x: string) => x.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr')

function tokenlar(ifade: string): string[] {
  return KUCUK_TR(ifade)
    .replace(/\([^)]*\)/g, ' ')          // parenthetical aside is explanation, not a name
    .split(/[^a-zçğıöşü0-9]+/i)
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

/** The searchable vocabulary of a drug: generic name, brands and pharmacological class. */
function ilacTokenlari(d: TürkishDrug): string[] {
  return [...tokenlar(d.name), ...d.brand.flatMap(tokenlar), ...tokenlar(d.category)]
}

/**
 * True when a free-text clinical phrase (an interaction entry, a contraindication, a recorded
 * allergy) names this drug — by molecule, by brand or by class.
 */
export function ifadeIlaciAnlatiyorMu(ifade: string, drug: TürkishDrug): boolean {
  const hedef = ilacTokenlari(drug)
  // "SSRI/SNRI", "Warfarin, Lityum" → alternatives; each alternative must match on its own.
  return KUCUK_TR(ifade)
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

/** Free-text drug name ("Largopen 1000 mg", "PAROL (parasetamol)") → table key, or null. */
export function drugKeyFor(ad: string): string | null {
  const t = tokenlar(String(ad || ''))
  if (!t.length) return null
  for (const [anahtar, d] of Object.entries(TURKISH_DRUGS)) {
    const hedef = [...tokenlar(d.name), ...d.brand.flatMap(tokenlar), ...tokenlar(anahtar)]
    if (t.some((x) => hedef.some((h) => tokenEslesir(x, h)))) return anahtar
  }
  return null
}

// İlaç etkileşimi kontrolü
export function checkInteractions(drug1Key: string, drug2Key: string): string | null {
  const drug1 = TURKISH_DRUGS[drug1Key]
  const drug2 = TURKISH_DRUGS[drug2Key]
  if (!drug1 || !drug2) return null
  if (drug1Key === drug2Key) return null

  const hasInteraction =
    drug1.interactions.some((i) => ifadeIlaciAnlatiyorMu(i, drug2)) ||
    drug2.interactions.some((i) => ifadeIlaciAnlatiyorMu(i, drug1))

  return hasInteraction
    ? `⚠️ UYARI: ${drug1.name} ve ${drug2.name} arasında etkileşim var!`
    : null
}
