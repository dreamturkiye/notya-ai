/**
 * TR-PARITE-01 (Kaan, 2026-11-09, "item 3") — HER BRANŞIN KENDİ İSTEM / YÖNLENDİRME LİSTESİ.
 *
 * Ülke yapılarında (release/*) her rolün kendi sipariş listesi var (ULKE-BRANS-DERINLIK-09). Türkiye'de bunun karşılığı:
 * 30 tıp branşı + 10 Özel Branş, her biri kendi Türkçe listesiyle. Liste, o branşın hekiminin sık istediği tetkikleri,
 * görüntülemeleri ve yönlendirmeleri tek dokunuşta işaretlemesi içindir. İşaretlemek hiçbir şeyi istemez/göndermez;
 * hekim düzenler, Tetkik İstek Formu'na (BELGE-NO-01 künyesiyle) yazdırır.
 *
 * KURALLAR
 *  - `lab` adları lib/doktor/tetkikKatalogu.ts'deki adlarla BİREBİR aynıdır (test kilitler) — kâğıtta numune/açlık bilgisi
 *    katalogdan gelir. Görüntüleme ve yönlendirme serbest metindir.
 *  - Liste branşa KAPILI (brans-alan-sizmasi): bir branş yalnız kendi listesini görür. Bilinmeyen / boş branş → liste yok
 *    (pediatri değil). Pediatriye özgü kalemler (büyüme izlemi, gelişim taraması, aşı onamı, hedef boy) başka hiçbir listede
 *    yoktur; çocuk cerrahisinin listesi cerrahi içeriklidir.
 *  - Müttefik sağlık meslekleri (fizyoterapi, klinik psikolog, diyetisyen, ergoterapi, odyoloji): 29.03.2025 tarihli
 *    yönetmelik md.16 — tetkik isteyemez (lib/specialties/klinikDikey.ts MUTTEFIK_TANI_KILIT). Listeleri YALNIZ hekime
 *    yönlendirmedir; `lab` ve `goruntuleme` boştur (test kilitler).
 *  - Sonuç eşiği, doz, tanı yoktur.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export type IstemBransi = SpecialtyKey | KlinikYeniSlug

export interface BransIstemListesi {
  /** Katalog adları (lib/doktor/tetkikKatalogu.ts). */
  lab: readonly string[]
  /** Görüntüleme / tanısal test istemleri (serbest metin). */
  goruntuleme: readonly string[]
  /** Konsültasyon / yönlendirme. */
  sevk: readonly string[]
}

const L = (lab: string[], goruntuleme: string[], sevk: string[]): BransIstemListesi => ({ lab, goruntuleme, sevk })

/** Müttefik meslek: yalnız hekime yönlendirme (tetkik isteyemez). */
const Y = (sevk: string[]): BransIstemListesi => ({ lab: [], goruntuleme: [], sevk })

export const BRANS_ISTEMLERI: Readonly<Record<IstemBransi, BransIstemListesi>> = {
  pediatri: L(
    ['Tam kan sayımı (Hemogram)', 'CRP', 'Tam idrar tetkiki (TİT)', 'İdrar kültürü + antibiyogram', 'Boğaz kültürü', 'Ferritin', '25-OH Vitamin D', 'TSH', 'Serbest T4 (sT4)', 'Gaita parazit (direkt + konsantrasyon)', 'Selofan bant (Enterobius)', 'Spesifik IgE — pediatrik panel'],
    ['Akciğer grafisi (PA)', 'Batın USG', 'Üriner sistem USG', 'El-bilek grafisi (kemik yaşı)', 'Kalça USG (gelişimsel kalça displazisi)'],
    ['Çocuk kardiyolojisi konsültasyonu', 'Çocuk nörolojisi konsültasyonu', 'Çocuk endokrinolojisi konsültasyonu', 'Çocuk alerji ve immünolojisi konsültasyonu', 'Göz muayenesi', 'Odyolojik değerlendirme'],
  ),
  kardiyoloji: L(
    ['Troponin I (hs)', 'NT-proBNP', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Lipoprotein (a)', 'HbA1c (glike hemoglobin)', 'Kreatinin', 'eGFR (CKD-EPI)', 'Potasyum (K)', 'TSH', 'Protrombin zamanı (PT) / INR', 'Digoksin'],
    ['EKG (12 derivasyon)', 'Ekokardiyografi', 'Efor testi', '24 saatlik ritim Holter', '24 saatlik ambulatuvar kan basıncı (ABPM)', 'Koroner BT anjiyografi', 'Karotis Doppler USG'],
    ['Kalp damar cerrahisi konsültasyonu', 'Nefroloji konsültasyonu', 'Endokrinoloji konsültasyonu', 'Kardiyak rehabilitasyon'],
  ),
  noroloji: L(
    ['Vitamin B12', 'Folat (folik asit)', 'TSH', 'HbA1c (glike hemoglobin)', 'Eritrosit sedimantasyon hızı (ESH)', 'CRP', 'Valproik asit', 'Karbamazepin', 'Levetirasetam', 'Anti-asetilkolin reseptör antikoru', 'Total kolesterol', 'LDL kolesterol'],
    ['Beyin MR', 'Beyin BT', 'Servikal MR', 'Lomber MR', 'EEG', 'EMG (sinir iletim çalışması)', 'Karotis-vertebral Doppler USG'],
    ['Beyin cerrahisi konsültasyonu', 'Psikiyatri konsültasyonu', 'Fizik tedavi ve rehabilitasyon', 'Göz muayenesi (fundus)'],
  ),
  dahiliye: L(
    ['Tam kan sayımı (Hemogram)', 'Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'Kreatinin', 'eGFR (CKD-EPI)', 'AST (SGOT)', 'ALT (SGPT)', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'TSH', 'Ferritin', 'Vitamin B12', 'Albümin/kreatinin oranı (spot)', 'Tam idrar tetkiki (TİT)'],
    ['Batın USG', 'Akciğer grafisi (PA)', 'EKG (12 derivasyon)', 'Tiroid USG'],
    ['Kardiyoloji konsültasyonu', 'Endokrinoloji konsültasyonu', 'Gastroenteroloji konsültasyonu', 'Göz muayenesi (diyabetik retinopati taraması)'],
  ),
  psikiyatri: L(
    ['Tam kan sayımı (Hemogram)', 'TSH', 'Serbest T4 (sT4)', 'Vitamin B12', 'Folat (folik asit)', '25-OH Vitamin D', 'Lityum', 'Valproik asit', 'Kreatinin', 'ALT (SGPT)', 'Glukoz (açlık / AKŞ)', 'Total kolesterol', 'Trigliserid', 'Prolaktin', 'Uyuşturucu paneli (idrar, 10 madde)'],
    ['EKG (12 derivasyon)', 'Beyin MR', 'EEG'],
    ['Klinik psikolog değerlendirmesi (psikometrik test)', 'Nöroloji konsültasyonu', 'Dahiliye konsültasyonu', 'AMATEM / ÇAMATEM yönlendirmesi'],
  ),
  'genel-cerrahi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Glukoz (açlık / AKŞ)', 'Üre', 'Kreatinin', 'Sodyum (Na)', 'Potasyum (K)', 'AST (SGOT)', 'ALT (SGPT)', 'Amilaz', 'Lipaz', 'CEA', 'CA 19-9', 'Kan grubu ve Rh', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)'],
    ['Batın USG', 'Kontrastlı batın BT', 'Meme USG', 'Mamografi', 'Tiroid USG', 'Akciğer grafisi (PA)', 'Ayakta direkt batın grafisi'],
    ['Anestezi preoperatif değerlendirme', 'Gastroenteroloji konsültasyonu (endoskopi / kolonoskopi)', 'Tıbbi onkoloji konsültasyonu', 'Patoloji'],
  ),
  ortopedi: L(
    ['Tam kan sayımı (Hemogram)', 'CRP', 'Eritrosit sedimantasyon hızı (ESH)', 'Ürik asit', '25-OH Vitamin D', 'Kalsiyum (Ca)', 'Fosfor (P)', 'ALP (alkalen fosfataz)', 'Romatoid faktör (RF)', 'Protrombin zamanı (PT) / INR'],
    ['Diz grafisi (AP-lateral)', 'Lomber grafi', 'Omuz MR', 'Diz MR', 'Lomber MR', 'Kemik mineral yoğunluğu (DXA)', 'Kemik sintigrafisi'],
    ['Fizik tedavi ve rehabilitasyon', 'Romatoloji konsültasyonu', 'Anestezi preoperatif değerlendirme', 'Beyin cerrahisi konsültasyonu'],
  ),
  dermatoloji: L(
    ['Tam kan sayımı (Hemogram)', 'AST (SGOT)', 'ALT (SGPT)', 'Trigliserid', 'Total kolesterol', 'Kreatinin', 'β-hCG (kantitatif)', 'Ferritin', 'Çinko', 'Tırnak/deri kazıntısı direkt mikroskopi (KOH)', 'Mantar kültürü', 'IgE (total)', 'ANA (IFA)', 'Quantiferon TB Gold (IGRA)', 'HBsAg', 'Anti-HCV'],
    ['Dermoskopi fotoğraf kaydı', 'Deri biyopsisi (punch)', 'Yama testi', 'Akciğer grafisi (PA)'],
    ['Plastik cerrahi konsültasyonu', 'Romatoloji konsültasyonu', 'Patoloji'],
  ),
  'kulak-burun-bogaz': L(
    ['Tam kan sayımı (Hemogram)', 'Boğaz kültürü', 'ASO', 'CRP', 'IgE (total)', 'Spesifik IgE — inhalan panel', 'TSH', 'Protrombin zamanı (PT) / INR'],
    ['Saf ses odyometri', 'Timpanometri', 'Paranazal sinüs BT', 'Temporal kemik BT', 'İç kulak / internal akustik kanal MR', 'Boyun USG', 'Polisomnografi'],
    ['Odyolojik değerlendirme', 'Nöroloji konsültasyonu', 'Alerji ve immünoloji konsültasyonu', 'Anestezi preoperatif değerlendirme'],
  ),
  'goz-hastaliklari': L(
    ['Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'Tam kan sayımı (Hemogram)', 'Eritrosit sedimantasyon hızı (ESH)', 'CRP', 'HLA-B27', 'Anti-Toxoplazma IgG', 'VDRL / RPR', 'TSH', 'Anti-TPO'],
    ['Optik koherens tomografi (OCT)', 'Görme alanı (perimetri)', 'Fundus fotoğrafı', 'Fundus floresein anjiyografi', 'Biyometri (göz içi lens hesabı)', 'Kornea topografisi', 'Orbita MR'],
    ['Nöroloji konsültasyonu', 'Endokrinoloji konsültasyonu', 'Romatoloji konsültasyonu', 'Dahiliye konsültasyonu'],
  ),
  'kadin-hastaliklari-dogum': L(
    ['Tam kan sayımı (Hemogram)', 'Kan grubu ve Rh (gebelik)', 'İndirekt Coombs (gebelik)', 'β-hCG (kantitatif)', 'TSH', 'Glukoz (açlık / AKŞ)', 'OGTT 50 g (24-28. hafta)', 'TORCH paneli (Toxo/Rubella/CMV/HSV IgM-IgG)', 'FSH', 'LH', 'Estradiol (E2)', 'Prolaktin', 'AMH (Anti-Müllerian hormon)', 'HPV DNA + genotip', 'Grup B streptokok taraması (vajinal/rektal)', 'CA 125'],
    ['Obstetrik USG', 'Transvajinal USG', 'Ayrıntılı fetal anatomi USG', 'Doppler USG (umbilikal arter)', 'NST (nonstres test)', 'Meme USG', 'Mamografi'],
    ['Perinatoloji konsültasyonu', 'Genetik danışmanlık', 'Endokrinoloji konsültasyonu', 'Üreme endokrinolojisi / tüp bebek merkezi'],
  ),
  uroloji: L(
    ['Total PSA', 'Serbest PSA', 'Serbest/Total PSA oranı', 'Tam idrar tetkiki (TİT)', 'İdrar kültürü + antibiyogram', 'Kreatinin', 'Üre', 'Kalsiyum (Ca)', 'Ürik asit', '24 saatlik idrarda kalsiyum', '24 saatlik idrarda oksalat/sitrat', 'İdrar sitolojisi', 'Total testosteron', 'Semen analizi (spermogram)'],
    ['Üriner sistem USG', 'Ürodinami / üroflowmetri', 'Rezidü idrar USG', 'Kontrastsız BT (taş protokolü)', 'Multiparametrik prostat MR', 'Skrotal Doppler USG'],
    ['Nefroloji konsültasyonu', 'Tıbbi onkoloji konsültasyonu', 'Anestezi preoperatif değerlendirme'],
  ),
  radyoloji: L(
    ['Kreatinin', 'eGFR (CKD-EPI)', 'Protrombin zamanı (PT) / INR', 'Tam kan sayımı (Hemogram)'],
    ['Karşılaştırma için önceki görüntüleme (CD / PACS)', 'Kontrast madde öncesi böbrek fonksiyonu', 'USG eşliğinde biyopsi', 'İleri tetkik: MR', 'İleri tetkik: BT'],
    ['İsteyen hekime ek değerlendirme', 'Multidisipliner tümör konseyi', 'Patoloji'],
  ),
  anestezi: L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Glukoz (açlık / AKŞ)', 'Üre', 'Kreatinin', 'Sodyum (Na)', 'Potasyum (K)', 'AST (SGOT)', 'ALT (SGPT)', 'Kan grubu ve Rh', 'β-hCG (kantitatif)', 'Kan gazı (arteriyel)'],
    ['EKG (12 derivasyon)', 'Akciğer grafisi (PA)', 'Ekokardiyografi', 'Solunum fonksiyon testi'],
    ['Kardiyoloji konsültasyonu (preoperatif)', 'Göğüs hastalıkları konsültasyonu (preoperatif)', 'Dahiliye konsültasyonu (preoperatif)', 'Algoloji'],
  ),
  'acil-tip': L(
    ['Tam kan sayımı (Hemogram)', 'Troponin I (hs)', 'CK-MB (kütle)', 'D-Dimer', 'Kan gazı (arteriyel)', 'Laktat', 'Glukoz (açlık / AKŞ)', 'Üre', 'Kreatinin', 'Sodyum (Na)', 'Potasyum (K)', 'CRP', 'Prokalsitonin', 'Protrombin zamanı (PT) / INR', 'Etanol (kan)', 'Parasetamol düzeyi', 'Karboksihemoglobin', 'Gebelik testi (idrar)'],
    ['EKG (12 derivasyon)', 'Akciğer grafisi (PA)', 'Beyin BT', 'Batın USG (FAST)', 'BT anjiyografi (pulmoner)', 'Ekstremite grafisi'],
    ['İlgili branş konsültasyonu', 'Yoğun bakım değerlendirmesi', 'Ulusal Zehir Danışma Merkezi (114)'],
  ),
  'fizik-tedavi': L(
    ['Tam kan sayımı (Hemogram)', 'Eritrosit sedimantasyon hızı (ESH)', 'CRP', 'Romatoid faktör (RF)', 'Anti-CCP', 'HLA-B27', '25-OH Vitamin D', 'Kalsiyum (Ca)', 'Ürik asit', 'TSH'],
    ['Lomber MR', 'Servikal MR', 'Omuz USG', 'Kemik mineral yoğunluğu (DXA)', 'EMG (sinir iletim çalışması)', 'Sakroiliak eklem MR'],
    ['Fizyoterapist (seans programı)', 'Ortopedi konsültasyonu', 'Romatoloji konsültasyonu', 'Algoloji'],
  ),
  'enfeksiyon-hastaliklari': L(
    ['Tam kan sayımı (Hemogram)', 'CRP', 'Prokalsitonin', 'Kan kültürü (aerob/anaerob)', 'İdrar kültürü + antibiyogram', 'HBsAg', 'Anti-HBs', 'Anti-HBc total', 'HBV DNA (kantitatif)', 'Anti-HCV', 'HCV RNA (kantitatif)', 'Anti-HIV 1/2 (4. kuşak)', 'HIV RNA (kantitatif)', 'Brucella (Rose Bengal)', 'Brucella (Wright) aglütinasyon', 'Quantiferon TB Gold (IGRA)', 'Vankomisin'],
    ['Akciğer grafisi (PA)', 'Batın USG', 'Toraks BT', 'Ekokardiyografi (endokardit)'],
    ['Gastroenteroloji konsültasyonu (hepatit)', 'Göğüs hastalıkları konsültasyonu (tüberküloz)', 'Verem savaş dispanseri'],
  ),
  endokrinoloji: L(
    ['Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'İnsülin (açlık)', 'C-peptid', 'TSH', 'Serbest T4 (sT4)', 'Serbest T3 (sT3)', 'Anti-TPO', 'TSH reseptör antikoru (TRAb)', 'Kalsitonin', 'Parathormon (PTH)', 'Kalsiyum (Ca)', '25-OH Vitamin D', 'Kortizol (sabah 08:00)', 'ACTH', 'Prolaktin', 'IGF-1', 'Albümin/kreatinin oranı (spot)'],
    ['Tiroid USG', 'Tiroid ince iğne aspirasyon biyopsisi', 'Tiroid sintigrafisi', 'Hipofiz MR', 'Sürrenal BT', 'Kemik mineral yoğunluğu (DXA)'],
    ['Göz muayenesi (diyabetik retinopati taraması)', 'Diyetisyen', 'Genel cerrahi konsültasyonu (tiroid)', 'Nefroloji konsültasyonu'],
  ),
  gastroenteroloji: L(
    ['Tam kan sayımı (Hemogram)', 'AST (SGOT)', 'ALT (SGPT)', 'GGT', 'ALP (alkalen fosfataz)', 'Total bilirubin', 'Direkt bilirubin', 'Albümin', 'Protrombin zamanı (PT) / INR', 'Amilaz', 'Lipaz', 'Ferritin', 'Anti-tTG IgA', 'Total IgA', 'Gaitada kalprotektin', 'Gaitada gizli kan', 'H. pylori antijeni (gaita)', 'HBsAg', 'Anti-HCV'],
    ['Batın USG', 'Üst GİS endoskopi', 'Kolonoskopi', 'MR kolanjiyografi', 'Karaciğer elastografisi', 'Kontrastlı batın BT'],
    ['Genel cerrahi konsültasyonu', 'Enfeksiyon hastalıkları konsültasyonu (hepatit)', 'Diyetisyen', 'Patoloji'],
  ),
  nefroloji: L(
    ['Kreatinin', 'eGFR (CKD-EPI)', 'Sistatin C', 'Üre', 'Sodyum (Na)', 'Potasyum (K)', 'Kalsiyum (Ca)', 'Fosfor (P)', 'Parathormon (PTH)', '25-OH Vitamin D', 'Bikarbonat (HCO₃)', 'Tam kan sayımı (Hemogram)', 'Ferritin', 'Transferrin satürasyonu', 'Albümin/kreatinin oranı (spot)', 'Protein/kreatinin oranı (spot)', 'Tam idrar tetkiki (TİT)', 'Takrolimus'],
    ['Üriner sistem USG', 'Renal arter Doppler USG', 'Böbrek biyopsisi'],
    ['Üroloji konsültasyonu', 'Kardiyoloji konsültasyonu', 'Diyetisyen', 'Diyaliz / transplantasyon merkezi'],
  ),
  romatoloji: L(
    ['Tam kan sayımı (Hemogram)', 'Eritrosit sedimantasyon hızı (ESH)', 'CRP', 'Romatoid faktör (RF)', 'Anti-CCP', 'ANA (IFA)', 'ENA profili', 'Anti-dsDNA', 'ANCA (c-ANCA / p-ANCA)', 'Kompleman C3', 'Kompleman C4', 'HLA-B27', 'HLA-B51', 'Ürik asit', 'Kreatinin', 'ALT (SGPT)', 'FMF (MEFV) mutasyon paneli', 'Quantiferon TB Gold (IGRA)', 'HBsAg'],
    ['El-el bileği grafisi', 'Sakroiliak eklem MR', 'Eklem USG', 'Akciğer grafisi (PA)', 'Kemik mineral yoğunluğu (DXA)'],
    ['Göz muayenesi (üveit)', 'Fizik tedavi ve rehabilitasyon', 'Nefroloji konsültasyonu', 'Dermatoloji konsültasyonu'],
  ),
  onkoloji: L(
    ['Tam kan sayımı (Hemogram)', 'Kreatinin', 'eGFR (CKD-EPI)', 'AST (SGOT)', 'ALT (SGPT)', 'Total bilirubin', 'Albümin', 'LDH', 'Kalsiyum (Ca)', 'Magnezyum (Mg)', 'CEA', 'CA 125', 'CA 15-3', 'CA 19-9', 'Total PSA', 'AFP', 'TSH', 'HBsAg'],
    ['Toraks-batın BT', 'PET-BT', 'Beyin MR', 'Kemik sintigrafisi', 'Ekokardiyografi (kardiyotoksisite izlemi)', 'Mamografi'],
    ['Multidisipliner tümör konseyi', 'Radyasyon onkolojisi konsültasyonu', 'Palyatif bakım', 'Psiko-onkoloji'],
  ),
  'gogus-hastaliklari': L(
    ['Tam kan sayımı (Hemogram)', 'CRP', 'Kan gazı (arteriyel)', 'D-Dimer', 'IgE (total)', 'Spesifik IgE — inhalan panel', 'Eozinofil katyonik protein (ECP)', 'Balgam kültürü', 'Mikobakteri (ARB) boyama', 'Mikobakteri kültürü', 'Quantiferon TB Gold (IGRA)', 'Teofilin', 'Kotinin (idrar)'],
    ['Akciğer grafisi (PA)', 'Toraks BT', 'Yüksek çözünürlüklü toraks BT (HRCT)', 'Solunum fonksiyon testi', 'Bronkodilatör reversibilite testi', 'DLCO', '6 dakika yürüme testi', 'Polisomnografi'],
    ['Göğüs cerrahisi konsültasyonu', 'Kardiyoloji konsültasyonu', 'Sigara bırakma polikliniği', 'Pulmoner rehabilitasyon'],
  ),
  'gogus-cerrahisi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Kan gazı (arteriyel)', 'Kreatinin', 'Albümin', 'Kan grubu ve Rh', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)'],
    ['Toraks BT', 'PET-BT', 'Solunum fonksiyon testi', 'DLCO', 'Bronkoskopi', 'Akciğer grafisi (PA)'],
    ['Göğüs hastalıkları konsültasyonu', 'Anestezi preoperatif değerlendirme', 'Multidisipliner tümör konseyi', 'Patoloji'],
  ),
  'plastik-cerrahi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'Albümin', 'Kan grubu ve Rh', 'Yara kültürü', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)'],
    ['Standart klinik fotoğraf seti', 'Meme USG', 'Yumuşak doku USG', 'Alt ekstremite venöz Doppler USG'],
    ['Anestezi preoperatif değerlendirme', 'Dermatoloji konsültasyonu', 'Patoloji', 'Psikiyatri değerlendirmesi (elektif estetik öncesi)'],
  ),
  'beyin-cerrahisi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Sodyum (Na)', 'Potasyum (K)', 'Glukoz (açlık / AKŞ)', 'Kreatinin', 'Kan grubu ve Rh', 'Levetirasetam', 'Fenitoin'],
    ['Beyin MR (kontrastlı)', 'Beyin BT', 'Lomber MR', 'Servikal MR', 'BT anjiyografi (serebral)', 'EMG (sinir iletim çalışması)'],
    ['Nöroloji konsültasyonu', 'Anestezi preoperatif değerlendirme', 'Fizik tedavi ve rehabilitasyon', 'Radyasyon onkolojisi konsültasyonu'],
  ),
  'kalp-damar-cerrahisi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Fibrinojen', 'Kreatinin', 'eGFR (CKD-EPI)', 'Potasyum (K)', 'HbA1c (glike hemoglobin)', 'Troponin I (hs)', 'NT-proBNP', 'Kan grubu ve Rh', 'Anti-Xa (heparin düzeyi)'],
    ['Ekokardiyografi', 'Koroner anjiyografi', 'Karotis Doppler USG', 'Alt ekstremite arteriyel Doppler USG', 'Alt ekstremite venöz Doppler USG', 'BT anjiyografi (aort)', 'Solunum fonksiyon testi'],
    ['Kardiyoloji konsültasyonu', 'Anestezi preoperatif değerlendirme', 'Nefroloji konsültasyonu', 'Kardiyak rehabilitasyon'],
  ),
  'cocuk-cerrahisi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'CRP', 'Tam idrar tetkiki (TİT)', 'İdrar kültürü + antibiyogram', 'Kan grubu ve Rh', 'Sodyum (Na)', 'Potasyum (K)'],
    ['Batın USG', 'Üriner sistem USG', 'Skrotal Doppler USG', 'İnguinal bölge USG', 'Voiding sistoüretrografi (VCUG)', 'Ayakta direkt batın grafisi'],
    ['Çocuk anestezisi preoperatif değerlendirme', 'Çocuk ürolojisi konsültasyonu', 'Çocuk gastroenterolojisi konsültasyonu'],
  ),
  'aile-hekimligi': L(
    ['Tam kan sayımı (Hemogram)', 'Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Kreatinin', 'ALT (SGPT)', 'TSH', 'Vitamin B12', '25-OH Vitamin D', 'Ferritin', 'Tam idrar tetkiki (TİT)', 'Gaitada gizli kan', 'HPV DNA + genotip'],
    ['Mamografi', 'EKG (12 derivasyon)', 'Akciğer grafisi (PA)', 'Batın USG'],
    ['Dahiliye konsültasyonu', 'Kadın hastalıkları ve doğum konsültasyonu (servikal tarama)', 'Gastroenteroloji konsültasyonu (kolonoskopi taraması)', 'KETEM (kanser erken teşhis merkezi)'],
  ),
  'spor-hekimligi': L(
    ['Tam kan sayımı (Hemogram)', 'Ferritin', 'Demir', 'Vitamin B12', '25-OH Vitamin D', 'CK (kreatin kinaz)', 'TSH', 'Glukoz (açlık / AKŞ)', 'Total kolesterol', 'Tam idrar tetkiki (TİT)'],
    ['EKG (12 derivasyon)', 'Ekokardiyografi (sporcu taraması)', 'Efor testi', 'Kardiyopulmoner egzersiz testi', 'Diz MR', 'Kas-iskelet USG'],
    ['Kardiyoloji konsültasyonu', 'Ortopedi konsültasyonu', 'Fizik tedavi ve rehabilitasyon', 'Diyetisyen (sporcu beslenmesi)'],
  ),
  // ── Özel Branşlar — hekim dalları ─────────────────────────────────────────────────────────────
  'sac-ekimi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Glukoz (açlık / AKŞ)', 'Ferritin', 'TSH', 'Vitamin B12', '25-OH Vitamin D', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)'],
    ['Trikoskopi fotoğraf kaydı', 'Standart saç fotoğraf seti (ön, tepe, yan, ense)'],
    ['Dermatoloji konsültasyonu', 'Endokrinoloji konsültasyonu', 'Dahiliye konsültasyonu'],
  ),
  'estetik-cerrahi': L(
    ['Tam kan sayımı (Hemogram)', 'Protrombin zamanı (PT) / INR', 'aPTT (APTZ)', 'Glukoz (açlık / AKŞ)', 'Kreatinin', 'Albümin', 'Kan grubu ve Rh', 'β-hCG (kantitatif)', 'HBsAg', 'Anti-HCV', 'Anti-HIV 1/2 (4. kuşak)'],
    ['Standart klinik fotoğraf seti', 'Meme USG', 'Mamografi', 'EKG (12 derivasyon)', 'Akciğer grafisi (PA)'],
    ['Anestezi preoperatif değerlendirme', 'Psikiyatri değerlendirmesi (elektif estetik öncesi)', 'Kardiyoloji konsültasyonu (preoperatif)'],
  ),
  'medikal-estetik': L(
    ['Tam kan sayımı (Hemogram)', 'Glukoz (açlık / AKŞ)', 'β-hCG (kantitatif)', 'Ferritin'],
    ['Standart yüz fotoğraf seti', 'Yumuşak doku USG (dolgu öncesi / sonrası)'],
    ['Dermatoloji konsültasyonu', 'Plastik cerrahi konsültasyonu', 'Göz muayenesi (vasküler komplikasyon şüphesi — acil)'],
  ),
  'klinik-dermatoloji': L(
    ['Tam kan sayımı (Hemogram)', 'AST (SGOT)', 'ALT (SGPT)', 'Trigliserid', 'Total kolesterol', 'β-hCG (kantitatif)', 'Ferritin', '25-OH Vitamin D', 'Total testosteron', 'DHEA-SO4', 'Tırnak/deri kazıntısı direkt mikroskopi (KOH)'],
    ['Dermoskopi fotoğraf kaydı', 'Standart klinik fotoğraf seti', 'Deri biyopsisi (punch)'],
    ['Dermatoloji konsültasyonu (TUS)', 'Kadın hastalıkları ve doğum konsültasyonu (hormonal akne)', 'Endokrinoloji konsültasyonu'],
  ),
  longevity: L(
    ['Tam kan sayımı (Hemogram)', 'Glukoz (açlık / AKŞ)', 'HbA1c (glike hemoglobin)', 'İnsülin (açlık)', 'HOMA-IR', 'Total kolesterol', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Apolipoprotein B', 'Lipoprotein (a)', 'hs-CRP', 'Homosistein', 'Kreatinin', 'eGFR (CKD-EPI)', 'ALT (SGPT)', 'TSH', '25-OH Vitamin D', 'Vitamin B12', 'Ferritin'],
    ['Kemik mineral yoğunluğu (DXA)', 'Vücut kompozisyonu analizi', 'EKG (12 derivasyon)', 'Karotis intima-media kalınlığı USG'],
    ['Kardiyoloji konsültasyonu', 'Endokrinoloji konsültasyonu', 'Diyetisyen', 'Spor hekimliği'],
  ),
  // ── Özel Branşlar — müttefik meslekler: YALNIZ hekime yönlendirme (tetkik isteyemez) ─────────────────
  fizyoterapi: Y([
    'Hekim değerlendirmesine yönlendirme — Fiziksel tıp ve rehabilitasyon',
    'Hekim değerlendirmesine yönlendirme — Ortopedi',
    'Hekim değerlendirmesine yönlendirme — Nöroloji',
    'Kırmızı bayrak: acil hekim değerlendirmesi',
  ]),
  'klinik-psikolog': Y([
    'Hekim değerlendirmesine yönlendirme — Psikiyatri',
    'Hekim değerlendirmesine yönlendirme — Nöroloji',
    'Kriz: 112 / acil psikiyatri',
    'Sosyal hizmet yönlendirmesi',
  ]),
  diyetisyen: Y([
    'Hekim değerlendirmesine yönlendirme — Endokrinoloji',
    'Hekim değerlendirmesine yönlendirme — Dahiliye',
    'Hekim değerlendirmesine yönlendirme — Gastroenteroloji',
    'Yeme bozukluğu şüphesi: psikiyatri değerlendirmesi',
  ]),
  ergoterapi: Y([
    'Hekim değerlendirmesine yönlendirme — Fiziksel tıp ve rehabilitasyon',
    'Hekim değerlendirmesine yönlendirme — Çocuk nörolojisi / Nöroloji',
    'Hekim değerlendirmesine yönlendirme — Psikiyatri',
    'Düşme riski: hekim değerlendirmesi',
  ]),
  odyoloji: Y([
    'Hekim değerlendirmesine yönlendirme — Kulak burun boğaz',
    'Ani işitme kaybı: aynı gün KBB / acil',
    'Hekim değerlendirmesine yönlendirme — Nöroloji (vertigo)',
    'İşitme cihazı raporu için KBB değerlendirmesi',
  ]),
}

/** Müttefik meslek mi (tetkik isteyemez)? Liste yapısından değil, klinikDikey'in kendi kümesinden. */
export const ISTEM_MUTTEFIK: ReadonlySet<IstemBransi> = new Set<IstemBransi>(['fizyoterapi', 'klinik-psikolog', 'diyetisyen', 'ergoterapi', 'odyoloji'])

/**
 * Hekimin `users.specialty` değeri → kendi listesi. Çözülemeyen / boş → null (liste yok; asla başka branşın listesi değil).
 * Özel Branş slug'ı önce (klinikSlugCoz, çıplak "dermatoloji"yi TUS bırakır), sonra 30 tıp branşı (bransAnahtari).
 */
export function bransIstemleri(hamUzmanlik: string | null | undefined): { brans: IstemBransi; liste: BransIstemListesi } | null {
  const klinik = klinikSlugCoz(hamUzmanlik)
  if (klinik) return { brans: klinik, liste: BRANS_ISTEMLERI[klinik] }
  const tus = bransAnahtari(String(hamUzmanlik || '').trim().toLocaleLowerCase('tr-TR'))
  if (tus && Object.prototype.hasOwnProperty.call(BRANS_ISTEMLERI, tus)) return { brans: tus as IstemBransi, liste: BRANS_ISTEMLERI[tus as IstemBransi] }
  return null
}
