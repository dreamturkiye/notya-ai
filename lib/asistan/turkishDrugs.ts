
// ============================================================
// NOTYA ASISTAN — Türkiye İlaç Formulasyonu
// Kaynak: SGK İlaç Listesi + TİTCK + Vademecum
// ============================================================

export interface TurkishDrug {
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

export const TURKISH_DRUGS: Record<string, TurkishDrug> = {
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
export function searchDrug(query: string): TurkishDrug[] {
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

// İlaç etkileşimi kontrolü
export function checkInteractions(drug1Key: string, drug2Key: string): string | null {
  const drug1 = TURKISH_DRUGS[drug1Key]
  const drug2 = TURKISH_DRUGS[drug2Key]
  if (!drug1 || !drug2) return null
  
  const hasInteraction = drug1.interactions.some(i =>
    drug2.name.toLowerCase().includes(i.toLowerCase())
  ) || drug2.interactions.some(i =>
    drug1.name.toLowerCase().includes(i.toLowerCase())
  )
  
  return hasInteraction
    ? `⚠️ UYARI: ${drug1.name} ve ${drug2.name} arasında etkileşim var!`
    : null
}
