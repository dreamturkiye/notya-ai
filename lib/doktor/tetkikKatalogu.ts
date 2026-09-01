/**
 * Tetkik kataloğu — Türkiye özel laboratuvarlarının test rehberi yapısıyla (Düzen, Pakize Tarzı,
 * E-Lab) aynı bölümleme. Her test: ad, numune, açlık gerekip gerekmediği, kısa not.
 * SUT kodları Medula'da eşleşir; burada tutulmaz.
 *
 * n: numune kısaltmaları — S serum (sarı/kırmızı), E EDTA tam kan (mor), C sitrat plazma (mavi),
 * H heparin (yeşil), F florür (gri), İ spot idrar, İ24 24 saatlik idrar, G gaita, K kültür örneği,
 * SW sürüntü, B balgam, BOS, D diğer.
 */
export type Numune = 'S' | 'E' | 'C' | 'H' | 'F' | 'İ' | 'İ24' | 'G' | 'K' | 'SW' | 'B' | 'BOS' | 'D'
export interface Tetkik { ad: string; n: Numune; aclik?: boolean; not?: string }
export interface TetkikBolumu { bolum: string; testler: Tetkik[] }

export const NUMUNE_ADI: Record<Numune, string> = {
  S: 'Serum', E: 'EDTA tam kan', C: 'Sitratlı plazma', H: 'Heparinli plazma', F: 'Florürlü tüp',
  İ: 'Spot idrar', İ24: '24 saatlik idrar', G: 'Gaita', K: 'Kültür örneği', SW: 'Sürüntü', B: 'Balgam', BOS: 'BOS', D: 'Diğer',
}

const t = (ad: string, n: Numune, aclik?: boolean, not?: string): Tetkik => ({ ad, n, ...(aclik ? { aclik } : {}), ...(not ? { not } : {}) })

export const TETKIK_KATALOGU: TetkikBolumu[] = [
  { bolum: 'Rutin Biyokimya', testler: [
    t('Glukoz (açlık)', 'F', true), t('Glukoz (tokluk, 2. saat)', 'F'), t('HbA1c', 'E'), t('İnsülin (açlık)', 'S', true), t('C-peptid', 'S', true),
    t('OGTT 75 g (0-120 dk)', 'F', true), t('OGTT 50 g gebelik tarama', 'F'), t('HOMA-IR', 'S', true),
    t('Üre (BUN)', 'S'), t('Kreatinin', 'S'), t('eGFR (CKD-EPI)', 'S'), t('Ürik asit', 'S'), t('Sistatin C', 'S'),
    t('Total protein', 'S'), t('Albümin', 'S'), t('Protein elektroforezi', 'S'), t('İmmünfiksasyon elektroforezi', 'S'),
    t('AST', 'S'), t('ALT', 'S'), t('GGT', 'S'), t('ALP', 'S'), t('LDH', 'S'), t('Total bilirubin', 'S'), t('Direkt bilirubin', 'S'), t('İndirekt bilirubin', 'S'),
    t('Amilaz', 'S'), t('Lipaz', 'S'), t('CK (kreatin kinaz)', 'S'), t('CK-MB', 'S'), t('Kolinesteraz', 'S'),
    t('Total kolesterol', 'S', true), t('LDL kolesterol', 'S', true), t('HDL kolesterol', 'S', true), t('Trigliserid', 'S', true), t('VLDL', 'S', true), t('Non-HDL kolesterol', 'S', true),
    t('Lipoprotein (a)', 'S'), t('Apolipoprotein A1', 'S'), t('Apolipoprotein B', 'S'),
    t('CRP', 'S'), t('hs-CRP', 'S'), t('Sedimentasyon (ESR)', 'E'), t('Prokalsitonin', 'S'), t('Ferritin', 'S'),
    t('Homosistein', 'E'), t('Laktat', 'F'), t('Amonyak', 'E'), t('Kan gazı (arteriyel)', 'H'), t('Osmolalite (serum)', 'S'),
  ]},
  { bolum: 'Elektrolit ve Mineraller', testler: [
    t('Sodyum (Na)', 'S'), t('Potasyum (K)', 'S'), t('Klor (Cl)', 'S'), t('Kalsiyum (Ca)', 'S'), t('İyonize kalsiyum', 'H'), t('Fosfor (P)', 'S'), t('Magnezyum (Mg)', 'S'),
    t('Bikarbonat (HCO3)', 'S'), t('Çinko', 'S'), t('Bakır', 'S'), t('Selenyum', 'S'), t('Demir', 'S', true), t('Total demir bağlama kapasitesi (TDBK)', 'S', true), t('Transferrin', 'S'), t('Transferrin satürasyonu', 'S', true),
  ]},
  { bolum: 'Hematoloji', testler: [
    t('Tam kan sayımı (Hemogram)', 'E'), t('Periferik yayma', 'E'), t('Retikülosit', 'E'), t('Sedimentasyon', 'E'), t('Kan grubu ve Rh', 'E'), t('Direkt Coombs', 'E'), t('İndirekt Coombs', 'S'),
    t('Hemoglobin elektroforezi', 'E'), t('HbA2 / HbF', 'E'), t('G6PD', 'E'), t('Ozmotik frajilite', 'H'), t('Kemik iliği aspirasyonu değerlendirmesi', 'D'), t('Akım sitometrisi (lösemi/lenfoma paneli)', 'E'),
    t('Eritrosit sedimantasyon hızı (Westergren)', 'E'), t('Trombosit fonksiyon testi (PFA-100)', 'C'),
  ]},
  { bolum: 'Koagülasyon', testler: [
    t('Protrombin zamanı (PT) / INR', 'C'), t('aPTT', 'C'), t('Fibrinojen', 'C'), t('D-Dimer', 'C'), t('Kanama zamanı', 'D'), t('Trombin zamanı', 'C'),
    t('Antitrombin III', 'C'), t('Protein C aktivitesi', 'C'), t('Protein S (serbest)', 'C'), t('Faktör V Leiden mutasyonu', 'E'), t('Protrombin G20210A mutasyonu', 'E'), t('MTHFR C677T / A1298C', 'E'),
    t('Lupus antikoagülanı', 'C'), t('Antikardiyolipin IgG/IgM', 'S'), t('Anti-β2 glikoprotein I IgG/IgM', 'S'), t('Faktör VIII', 'C'), t('Faktör IX', 'C'), t('von Willebrand faktör antijeni', 'C'), t('Anti-Xa (heparin düzeyi)', 'C'),
  ]},
  { bolum: 'Tiroid', testler: [
    t('TSH', 'S'), t('Serbest T4 (sT4)', 'S'), t('Serbest T3 (sT3)', 'S'), t('Total T4', 'S'), t('Total T3', 'S'), t('Anti-TPO', 'S'), t('Anti-tiroglobulin', 'S'), t('Tiroglobulin', 'S'), t('TSH reseptör antikoru (TRAb)', 'S'), t('Kalsitonin', 'S'),
  ]},
  { bolum: 'Üreme ve Gonad Hormonları', testler: [
    t('FSH', 'S'), t('LH', 'S'), t('Estradiol (E2)', 'S'), t('Progesteron', 'S'), t('Prolaktin', 'S'), t('Total testosteron', 'S'), t('Serbest testosteron', 'S'), t('SHBG', 'S'), t('DHEA-SO4', 'S'), t('Androstenedion', 'S'),
    t('17-OH progesteron', 'S'), t('AMH (Anti-Müllerian hormon)', 'S'), t('İnhibin B', 'S'), t('β-hCG (kantitatif)', 'S'), t('hCG (kalitatif, idrar)', 'İ'),
  ]},
  { bolum: 'Adrenal, Hipofiz ve Diğer Hormonlar', testler: [
    t('Kortizol (sabah 08:00)', 'S'), t('Kortizol (gece 23:00)', 'S'), t('Kortizol (24 saatlik idrar)', 'İ24'), t('ACTH', 'E'), t('Deksametazon supresyon testi (1 mg)', 'S'), t('Aldosteron', 'S'), t('Renin (plazma renin aktivitesi)', 'E'), t('Aldosteron/renin oranı', 'E'),
    t('Metanefrin / normetanefrin (plazma)', 'E'), t('Metanefrin / normetanefrin (24 saatlik idrar)', 'İ24'), t('VMA (24 saatlik idrar)', 'İ24'), t('5-HIAA (24 saatlik idrar)', 'İ24'),
    t('Büyüme hormonu (GH)', 'S'), t('IGF-1', 'S'), t('IGFBP-3', 'S'), t('Parathormon (PTH)', 'E'), t('Gastrin', 'S', true), t('Leptin', 'S'), t('Eritropoietin', 'S'),
  ]},
  { bolum: 'Vitaminler ve Kemik Metabolizması', testler: [
    t('25-OH Vitamin D', 'S'), t('1,25-(OH)2 Vitamin D', 'S'), t('Vitamin B12', 'S'), t('Folat (folik asit)', 'S'), t('Eritrosit folat', 'E'), t('Vitamin A', 'S'), t('Vitamin E', 'S'), t('Vitamin B1 (tiamin)', 'E'), t('Vitamin B6', 'E'), t('Vitamin C', 'S'), t('Vitamin K', 'S'),
    t('Osteokalsin', 'S'), t('β-CrossLaps (CTX)', 'S', true), t('P1NP', 'S'), t('Kemik ALP', 'S'), t('Alkalen fosfataz izoenzimleri', 'S'),
  ]},
  { bolum: 'Kardiyak Belirteçler', testler: [
    t('Troponin I (hs)', 'S'), t('Troponin T (hs)', 'S'), t('CK-MB (kütle)', 'S'), t('Miyoglobin', 'S'), t('NT-proBNP', 'S'), t('BNP', 'E'), t('hs-CRP', 'S'), t('Lipoprotein (a)', 'S'), t('Homosistein', 'E'),
  ]},
  { bolum: 'Tümör Belirteçleri', testler: [
    t('CEA', 'S'), t('AFP', 'S'), t('CA 125', 'S'), t('CA 15-3', 'S'), t('CA 19-9', 'S'), t('CA 72-4', 'S'), t('Total PSA', 'S'), t('Serbest PSA', 'S'), t('Serbest/Total PSA oranı', 'S'), t('β2-mikroglobulin', 'S'),
    t('NSE', 'S'), t('CYFRA 21-1', 'S'), t('SCC', 'S'), t('HE4', 'S'), t('ROMA indeksi (CA125 + HE4)', 'S'), t('Kromogranin A', 'S'), t('Kalsitonin', 'S'), t('Tiroglobulin', 'S'), t('β-hCG (tümör belirteci)', 'S'), t('Serbest hafif zincir kappa/lambda', 'S'), t('M2-PK (gaita)', 'G'),
  ]},
  { bolum: 'Otoimmün ve Romatoloji', testler: [
    t('ANA (IFA)', 'S'), t('ENA profili', 'S'), t('Anti-dsDNA', 'S'), t('Anti-Sm', 'S'), t('Anti-SS-A (Ro)', 'S'), t('Anti-SS-B (La)', 'S'), t('Anti-Scl-70', 'S'), t('Anti-Jo-1', 'S'), t('Anti-sentromer', 'S'), t('Anti-RNP', 'S'),
    t('Romatoid faktör (RF)', 'S'), t('Anti-CCP', 'S'), t('ANCA (c-ANCA / p-ANCA)', 'S'), t('Anti-MPO', 'S'), t('Anti-PR3', 'S'), t('HLA-B27', 'E'), t('HLA-B51', 'E'),
    t('Kompleman C3', 'S'), t('Kompleman C4', 'S'), t('CH50', 'S'), t('Anti-GBM', 'S'), t('AMA (anti-mitokondriyal)', 'S'), t('ASMA (anti-düz kas)', 'S'), t('Anti-LKM-1', 'S'),
    t('Anti-tTG IgA', 'S'), t('Anti-tTG IgG', 'S'), t('Anti-gliadin IgA/IgG', 'S'), t('Anti-endomisyum IgA', 'S'), t('Total IgA', 'S'), t('Anti-parietal hücre antikoru', 'S'), t('Anti-intrinsik faktör', 'S'),
    t('Anti-GAD', 'S'), t('Anti-insülin antikoru', 'S'), t('Anti-adacık hücre antikoru (ICA)', 'S'), t('Anti-fosfolipid paneli', 'S'), t('Anti-nöronal antikorlar', 'S'), t('Anti-asetilkolin reseptör antikoru', 'S'),
  ]},
  { bolum: 'İmmünoloji ve Alerji', testler: [
    t('IgG', 'S'), t('IgA', 'S'), t('IgM', 'S'), t('IgE (total)', 'S'), t('IgG alt grupları (1-4)', 'S'), t('IgG4', 'S'), t('Spesifik IgE — inhalan panel', 'S'), t('Spesifik IgE — gıda paneli', 'S'), t('Spesifik IgE — pediatrik panel', 'S'),
    t('Spesifik IgE (tek alerjen)', 'S', false, 'alerjeni belirtin'), t('Triptaz', 'S'), t('Eozinofil katyonik protein (ECP)', 'S'), t('Lenfosit alt grupları (CD3/CD4/CD8/CD19/CD56)', 'E'), t('CD4/CD8 oranı', 'E'), t('Kriyoglobulin', 'S'), t('Serbest hafif zincir', 'S'), t('İnterlökin-6 (IL-6)', 'S'),
  ]},
  { bolum: 'Enfeksiyon Serolojisi', testler: [
    t('HBsAg', 'S'), t('Anti-HBs', 'S'), t('Anti-HBc IgM', 'S'), t('Anti-HBc total', 'S'), t('HBeAg', 'S'), t('Anti-HBe', 'S'), t('Anti-HCV', 'S'), t('Anti-HAV IgM', 'S'), t('Anti-HAV IgG (total)', 'S'), t('Anti-HDV', 'S'), t('Anti-HEV IgM/IgG', 'S'),
    t('Anti-HIV 1/2 (4. kuşak)', 'S'), t('VDRL / RPR', 'S'), t('TPHA', 'S'), t('Anti-CMV IgM', 'S'), t('Anti-CMV IgG', 'S'), t('CMV IgG avidite', 'S'), t('Anti-Toxoplazma IgM', 'S'), t('Anti-Toxoplazma IgG', 'S'), t('Toxoplazma IgG avidite', 'S'), t('Anti-Rubella IgM', 'S'), t('Anti-Rubella IgG', 'S'),
    t('EBV VCA IgM', 'S'), t('EBV VCA IgG', 'S'), t('EBV EBNA IgG', 'S'), t('Monospot (heterofil antikor)', 'S'), t('Anti-HSV 1/2 IgM/IgG', 'S'), t('Anti-VZV IgM/IgG', 'S'), t('Parvovirus B19 IgM/IgG', 'S'), t('Kızamık IgM/IgG', 'S'), t('Kabakulak IgM/IgG', 'S'),
    t('Brucella (Rose Bengal)', 'S'), t('Brucella (Wright) aglütinasyon', 'S'), t('Brucella Coombs', 'S'), t('Salmonella (Gruber-Widal)', 'S'), t('ASO', 'S'), t('Anti-DNase B', 'S'), t('H. pylori IgG', 'S'), t('H. pylori antijeni (gaita)', 'G'), t('H. pylori üre nefes testi', 'D'),
    t('Borrelia (Lyme) IgM/IgG', 'S'), t('Mycoplasma pneumoniae IgM/IgG', 'S'), t('Chlamydia pneumoniae IgM/IgG', 'S'), t('Chlamydia trachomatis IgM/IgG', 'S'), t('Anti-Kist hidatik (Echinococcus) IgG', 'S'), t('Anti-Leishmania', 'S'), t('Anti-Entamoeba histolytica', 'S'), t('Quantiferon TB Gold', 'H'), t('Tüberkülin deri testi (PPD)', 'D'),
  ]},
  { bolum: 'Mikrobiyoloji — Kültürler', testler: [
    t('İdrar kültürü + antibiyogram', 'K'), t('Boğaz kültürü', 'SW'), t('Kan kültürü (aerob/anaerob)', 'K'), t('Balgam kültürü', 'B'), t('Yara kültürü', 'SW'), t('Gaita kültürü (Salmonella/Shigella/Campylobacter)', 'G'), t('Vajinal kültür', 'SW'), t('Servikal kültür', 'SW'), t('Üretral akıntı kültürü', 'SW'),
    t('Semen kültürü', 'K'), t('Burun kültürü (MRSA taraması)', 'SW'), t('Göz kültürü (konjonktiva)', 'SW'), t('Kulak kültürü', 'SW'), t('BOS kültürü', 'BOS'), t('Mantar kültürü', 'K'), t('Tırnak/deri kazıntısı direkt mikroskopi (KOH)', 'D'), t('Mikobakteri (ARB) boyama', 'B'), t('Mikobakteri kültürü', 'B'),
    t('Gram boyama', 'SW'), t('Anaerob kültür', 'K'), t('Clostridioides difficile toksin A/B', 'G'), t('Rotavirus/Adenovirus antijeni (gaita)', 'G'), t('Gaita parazit (direkt + konsantrasyon)', 'G'), t('Selofan bant (Enterobius)', 'D'), t('Gaitada gizli kan', 'G'), t('Gaitada kalprotektin', 'G'), t('Gaita elastaz (pankreas)', 'G'),
  ]},
  { bolum: 'Moleküler Tanı (PCR)', testler: [
    t('HBV DNA (kantitatif)', 'E'), t('HCV RNA (kantitatif)', 'E'), t('HCV genotip', 'E'), t('HIV RNA (kantitatif)', 'E'), t('HPV DNA + genotip', 'SW'), t('CMV DNA (kantitatif)', 'E'), t('EBV DNA (kantitatif)', 'E'), t('SARS-CoV-2 PCR', 'SW'), t('İnfluenza A/B + RSV PCR', 'SW'),
    t('Solunum viral panel (multiplex PCR)', 'SW'), t('Gastrointestinal panel (multiplex PCR)', 'G'), t('Cinsel yolla bulaşan enfeksiyon paneli (PCR)', 'SW'), t('Chlamydia trachomatis / N. gonorrhoeae PCR', 'İ'), t('Mycoplasma / Ureaplasma PCR', 'SW'), t('Tüberküloz PCR', 'B'), t('Menenjit/ensefalit paneli (BOS PCR)', 'BOS'), t('JAK2 V617F', 'E'), t('BCR-ABL (kantitatif)', 'E'),
  ]},
  { bolum: 'İdrar Tetkikleri', testler: [
    t('Tam idrar tetkiki (TİT)', 'İ'), t('İdrar mikroskopisi', 'İ'), t('Mikroalbümin (spot idrar)', 'İ'), t('Albümin/kreatinin oranı (spot)', 'İ'), t('Protein/kreatinin oranı (spot)', 'İ'), t('24 saatlik idrarda protein', 'İ24'), t('24 saatlik idrarda mikroalbümin', 'İ24'), t('Kreatinin klirensi', 'İ24'),
    t('24 saatlik idrarda kalsiyum', 'İ24'), t('24 saatlik idrarda ürik asit', 'İ24'), t('24 saatlik idrarda sodyum/potasyum', 'İ24'), t('24 saatlik idrarda oksalat/sitrat', 'İ24'), t('İdrar osmolalitesi', 'İ'), t('İdrar elektrolitleri (spot)', 'İ'), t('İdrar Bence-Jones proteini', 'İ24'), t('İdrar sitolojisi', 'İ'), t('İdrarda uyuşturucu taraması', 'İ'), t('Gebelik testi (idrar)', 'İ'),
  ]},
  { bolum: 'Gebelik ve Prenatal', testler: [
    t('β-hCG (kantitatif)', 'S'), t('İkili tarama testi (PAPP-A + free β-hCG)', 'S', false, '11-14. hafta'), t('Üçlü tarama testi', 'S', false, '16-20. hafta'), t('Dörtlü tarama testi', 'S', false, '16-20. hafta'), t('NIPT (fetal DNA)', 'E', false, '10. haftadan itibaren'),
    t('TORCH paneli (Toxo/Rubella/CMV/HSV IgM-IgG)', 'S'), t('İndirekt Coombs (gebelik)', 'S'), t('Kan grubu ve Rh (gebelik)', 'E'), t('OGTT 50 g (24-28. hafta)', 'F'), t('OGTT 100 g (3 saat)', 'F', true), t('Grup B streptokok taraması (vajinal/rektal)', 'SW', false, '35-37. hafta'), t('Prolaktin', 'S'), t('Progesteron', 'S'),
  ]},
  { bolum: 'İlaç Düzeyleri ve Toksikoloji', testler: [
    t('Digoksin', 'S'), t('Lityum', 'S'), t('Valproik asit', 'S'), t('Karbamazepin', 'S'), t('Fenitoin', 'S'), t('Lamotrijin', 'S'), t('Levetirasetam', 'S'), t('Vankomisin', 'S'), t('Gentamisin', 'S'), t('Amikasin', 'S'), t('Takrolimus', 'E'), t('Siklosporin', 'E'), t('Sirolimus', 'E'), t('Metotreksat', 'S'), t('Teofilin', 'S'),
    t('Etanol (kan)', 'F'), t('Karboksihemoglobin', 'E'), t('Kurşun (kan)', 'E'), t('Cıva (kan/idrar)', 'E'), t('Arsenik (idrar)', 'İ24'), t('Parasetamol düzeyi', 'S'), t('Salisilat düzeyi', 'S'), t('Uyuşturucu paneli (idrar, 10 madde)', 'İ'), t('Kotinin (idrar)', 'İ'),
  ]},
  { bolum: 'Genetik', testler: [
    t('Karyotip (periferik kan)', 'H'), t('FMF (MEFV) mutasyon paneli', 'E'), t('Kistik fibrozis (CFTR) mutasyon paneli', 'E'), t('Talasemi mutasyon analizi', 'E'), t('Frajil X (FMR1)', 'E'), t('BRCA1/BRCA2 dizi analizi', 'E'), t('HLA doku tiplendirmesi', 'E'), t('Farmakogenetik panel (CYP2C19/CYP2D6)', 'E'), t('Trombofili paneli (FVL, PT, MTHFR, PAI-1)', 'E'), t('SMA taşıyıcılık (SMN1)', 'E'), t('Y kromozomu mikrodelesyon', 'E'), t('Tüm ekzom dizileme (WES)', 'E'),
  ]},
]

/** Hazır istek panelleri — tek tıkla seçilir, sonra düzenlenir. Adlar kataloğa birebir uyar. */
export const TETKIK_PANELLERI: Record<string, string[]> = {
  'Genel Check-up': ['Tam kan sayımı (Hemogram)', 'Glukoz (açlık)', 'HbA1c', 'Üre (BUN)', 'Kreatinin', 'Ürik asit', 'AST', 'ALT', 'GGT', 'ALP', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'TSH', 'Vitamin B12', '25-OH Vitamin D', 'Ferritin', 'CRP', 'Tam idrar tetkiki (TİT)', 'Sedimentasyon (ESR)'],
  'Diyabet Takibi': ['Glukoz (açlık)', 'HbA1c', 'İnsülin (açlık)', 'C-peptid', 'Kreatinin', 'eGFR (CKD-EPI)', 'Mikroalbümin (spot idrar)', 'Albümin/kreatinin oranı (spot)', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'ALT'],
  'Tiroid Paneli': ['TSH', 'Serbest T4 (sT4)', 'Serbest T3 (sT3)', 'Anti-TPO', 'Anti-tiroglobulin'],
  'Lipid Paneli': ['Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Non-HDL kolesterol', 'Lipoprotein (a)'],
  'Karaciğer Paneli': ['AST', 'ALT', 'GGT', 'ALP', 'Total bilirubin', 'Direkt bilirubin', 'Albümin', 'Total protein', 'Protrombin zamanı (PT) / INR', 'HBsAg', 'Anti-HCV'],
  'Böbrek Paneli': ['Üre (BUN)', 'Kreatinin', 'eGFR (CKD-EPI)', 'Ürik asit', 'Sodyum (Na)', 'Potasyum (K)', 'Kalsiyum (Ca)', 'Fosfor (P)', 'Tam idrar tetkiki (TİT)', 'Albümin/kreatinin oranı (spot)', 'Parathormon (PTH)'],
  'Anemi Paneli': ['Tam kan sayımı (Hemogram)', 'Periferik yayma', 'Retikülosit', 'Demir', 'Total demir bağlama kapasitesi (TDBK)', 'Ferritin', 'Vitamin B12', 'Folat (folik asit)', 'Hemoglobin elektroforezi'],
  'Hepatit Paneli': ['HBsAg', 'Anti-HBs', 'Anti-HBc total', 'Anti-HCV', 'Anti-HAV IgG (total)', 'Anti-HIV 1/2 (4. kuşak)'],
  'Preoperatif': ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT', 'Glukoz (açlık)', 'Üre (BUN)', 'Kreatinin', 'Sodyum (Na)', 'Potasyum (K)', 'AST', 'ALT', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)', 'Kan grubu ve Rh'],
  'Gebelik İlk Vizit': ['Tam kan sayımı (Hemogram)', 'Kan grubu ve Rh (gebelik)', 'İndirekt Coombs (gebelik)', 'Glukoz (açlık)', 'TSH', 'Tam idrar tetkiki (TİT)', 'İdrar kültürü + antibiyogram', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)', 'VDRL / RPR', 'TORCH paneli (Toxo/Rubella/CMV/HSV IgM-IgG)', 'Ferritin', 'Vitamin B12', '25-OH Vitamin D'],
  'Romatoloji Tarama': ['Tam kan sayımı (Hemogram)', 'Sedimentasyon (ESR)', 'CRP', 'Romatoid faktör (RF)', 'Anti-CCP', 'ANA (IFA)', 'Ürik asit', 'HLA-B27', 'Kompleman C3', 'Kompleman C4', 'Tam idrar tetkiki (TİT)'],
  'Kardiyak Risk': ['Troponin I (hs)', 'NT-proBNP', 'hs-CRP', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Lipoprotein (a)', 'Homosistein', 'HbA1c', 'Kreatinin'],
  'Kadın Hormon (2-4. gün)': ['FSH', 'LH', 'Estradiol (E2)', 'Prolaktin', 'AMH (Anti-Müllerian hormon)', 'TSH', 'Total testosteron', 'DHEA-SO4', '17-OH progesteron'],
  'Erkek Hormon / İnfertilite': ['FSH', 'LH', 'Total testosteron', 'Serbest testosteron', 'SHBG', 'Prolaktin', 'Estradiol (E2)', 'Semen kültürü'],
  'Enfeksiyon Tarama (ateş)': ['Tam kan sayımı (Hemogram)', 'CRP', 'Prokalsitonin', 'Sedimentasyon (ESR)', 'Kan kültürü (aerob/anaerob)', 'İdrar kültürü + antibiyogram', 'Tam idrar tetkiki (TİT)', 'Brucella (Rose Bengal)', 'Salmonella (Gruber-Widal)'],
}

export const TUM_TETKIKLER: Tetkik[] = TETKIK_KATALOGU.flatMap((b) => b.testler)
export const TETKIK_BOLUMU = new Map<string, string>(TETKIK_KATALOGU.flatMap((b) => b.testler.map((x) => [x.ad, b.bolum] as [string, string])))

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
export function tetkikAra(q: string, bolum?: string): Tetkik[] {
  const nq = norm(q.trim())
  const kaynak = bolum ? (TETKIK_KATALOGU.find((b) => b.bolum === bolum)?.testler || []) : TUM_TETKIKLER
  if (!nq) return kaynak
  return kaynak.filter((x) => norm(x.ad).includes(nq)).slice(0, 60)
}
