/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — the Türkiye build's WORDS AND SOURCES for the KD operator tools (antibiotic
 * prophylaxis, adnexal mass, FIGO / endometriosis classification, labour ward, hysteroscopy and ERAS, procedure consent
 * forms). Kadın hastalıkları ve doğum only. The arithmetic is lib/clinical/*; this file names its keys in Turkish.
 *
 * SOURCES FOR TÜRKİYE: no Turkish national text (TJOD / T.C. Sağlık Bakanlığı) could be verified for these tools in this
 * change, so each tool shows the international source it computes from, marked as such (OPEN-COMMITMENTS KD-OPERATOR-01,
 * owner Claude). Where a tool needs a country number, the number used here is named with its international source.
 */
import type { Kaynak } from '@/lib/doktor/cerrahiGuvenlikMetinleri'
import type { ProfilaksiParametreleri } from '@/lib/clinical/antibiyotikProfilaksi'
import type { OnamProseduru } from '@/lib/clinical/onamProsedurleri'

export const ULUSAL_YOK = 'Türkiye’ye özgü bir ulusal kılavuz metni bu sürümde doğrulanamadı; aşağıdaki uluslararası kaynak gösteriliyor.'

// ───────────────────────── antibiotic prophylaxis ─────────────────────────

/** International reference regimen (ACOG Practice Bulletins 199 and 195, 2018), labelled as such on screen and paper. */
export const TR_PROFILAKSI: ProfilaksiParametreleri = { sefazolin_g: 2, sefazolin_yuksek_g: 3, kilo_esigi_kg: 120, kilo_esigi_dahil: 1, azitromisin_mg: 500, klindamisin_mg: 900, gentamisin_mg_kg: 5, tekrar_saat: 4, tekrar_kan_ml: 1500 }
export const PROFILAKSI_KAYNAKLARI: Kaynak[] = [
  { kurum: 'American College of Obstetricians and Gynecologists', belge: 'Practice Bulletin No. 199, Use of prophylactic antibiotics in labor and delivery', yil: '2018', tur: 'uluslararasi' },
  { kurum: 'American College of Obstetricians and Gynecologists', belge: 'Practice Bulletin No. 195, Prevention of infection after gynecologic procedures', yil: '2018', tur: 'uluslararasi' },
  { kurum: 'Dünya Sağlık Örgütü (WHO)', belge: 'Sezaryende profilaktik antibiyotik önerisi (WHO recommendations for prevention and treatment of maternal peripartum infections)', yil: '2015', tur: 'uluslararasi' },
]
export const PROFILAKSI_ISLEM_ADI: Record<string, string> = { sezaryen: 'Sezaryen', histerektomi: 'Histerektomi', buyuk_jinekolojik: 'Diğer büyük jinekolojik cerrahi' }
export const ILAC_ADI: Record<string, string> = { sefazolin: 'Sefazolin IV', azitromisin: 'Azitromisin IV (eylemde / membran rüptüründe, plansız sezaryen)', klindamisin: 'Klindamisin IV', gentamisin: 'Gentamisin IV', metronidazol: 'Metronidazol IV' }
export const PROFILAKSI_UYARI_ADI: Record<string, string> = {
  ulusal_doz_yok: 'Ulusal kılavuz ajan ve doz belirtmiyor: kurumunuzun formülerindeki rejimi kaydedin.',
  alerji_rejimi_yok: 'Ağır beta-laktam alerjisi için kaynakta rejim yok: kurum formülerine göre.',
  gentamisin_kilo_hekim: 'Gentamisin kiloya göre hesaplandı; obezitede hesaplama ağırlığı ve yuvarlama hekimindir.',
  yuksek_kilo_dozu: 'Kilo eşiğinin üzerinde: yüksek sefazolin dozu.',
  tekrar_doz_sure: 'Süre eşiği aşıldı: tekrar doz gerekir.',
  tekrar_doz_kan: 'Kan kaybı eşiği aşıldı: tekrar doz gerekir.',
}

// ───────────────────────── adnexal mass ─────────────────────────

export const ADNEKS_KAYNAKLARI: Kaynak[] = [
  { kurum: 'International Ovarian Tumor Analysis (IOTA)', belge: 'Timmerman D ve ark. Simple ultrasound-based rules for the diagnosis of ovarian cancer. Ultrasound Obstet Gynecol 2008;31:681-690', yil: '2008', tur: 'uluslararasi' },
  { kurum: 'American College of Radiology', belge: 'O-RADS US v2022 risk sınıflaması (Strachowski LM ve ark., Radiology 2023)', yil: '2022', tur: 'uluslararasi' },
  { kurum: 'Jacobs I ve ark.', belge: 'Risk of malignancy index (RMI I), Br J Obstet Gynaecol 1990;97:922-929; eşik 200 (Jacobs 1990; RCOG Green-top Guideline No. 34)', yil: '1990', tur: 'uluslararasi' },
]
export const TR_RMI_ESIK = 200
export const IOTA_ADI: Record<string, string> = {
  b1_unilokuler: 'B1 Unilokuler kist', b2_solid_7mm_alti: 'B2 En büyük solid bileşen <7 mm', b3_akustik_golge: 'B3 Akustik gölge',
  b4_duzgun_multilokuler_10cm_alti: 'B4 Düzgün multilokuler tümör, en büyük çap <100 mm', b5_akim_yok: 'B5 Kan akımı yok (renk skoru 1)',
  m1_duzensiz_solid: 'M1 Düzensiz solid tümör', m2_asit: 'M2 Asit', m3_dort_papiller: 'M3 En az 4 papiller yapı',
  m4_duzensiz_multilokuler_solid_10cm: 'M4 Düzensiz multilokuler-solid tümör, en büyük çap ≥100 mm', m5_cok_guclu_akim: 'M5 Çok güçlü kan akımı (renk skoru 4)',
}
export const IOTA_SONUC_ADI: Record<string, string> = { benign: 'Benign (yalnız B bulguları)', malign: 'Malign (yalnız M bulguları)', belirsiz: 'Sonuçsuz (her ikisi veya hiçbiri): uzman ultrason / ileri değerlendirme' }
export const RMI_ADI: Record<string, string> = { multilokuler: 'Multilokuler kist', solid_alan: 'Solid alan', metastaz: 'Metastaz bulgusu', asit: 'Asit', bilateral: 'Bilateral lezyon' }
export const ORADS_LEZYON_ADI: Record<string, string> = { degerlendirilemedi: 'Değerlendirilemedi (teknik)', yok_fizyolojik: 'Lezyon yok / fizyolojik (folikül, korpus luteum ≤3 cm)', klasik_benign: 'Klasik benign lezyon (hemorajik kist, dermoid, endometrioma, paraovaryan, peritoneal inklüzyon kisti, hidrosalpinks)', unilokuler: 'Unilokuler kist', bilokuler: 'Bilokuler kist', multilokuler: 'Multilokuler kist', solid: 'Solid / solid görünümlü (≥%80 solid)' }
export const ORADS_ADI: Record<number, string> = { 0: 'O-RADS 0 — tamamlanmamış değerlendirme', 1: 'O-RADS 1 — fizyolojik', 2: 'O-RADS 2 — neredeyse kesin benign (<%1)', 3: 'O-RADS 3 — düşük risk (%1–<10)', 4: 'O-RADS 4 — orta risk (%10–<50)', 5: 'O-RADS 5 — yüksek risk (≥%50)' }
export const ADNEX_ADI: Record<string, string> = { yas: 'Yaş', ca125: 'Serum CA-125 (U/mL)', onkoloji_merkezi: 'Onkoloji merkezi', lezyon_en_buyuk_mm: 'Lezyonun en büyük çapı (mm)', solid_en_buyuk_mm: 'En büyük solid bileşen (mm)', on_lokulden_fazla: '10’dan fazla lokül', papiller_sayisi: 'Papiller yapı sayısı (0–4+)', akustik_golge: 'Akustik gölge', asit: 'Asit' }

// ───────────────────────── classification ─────────────────────────

export const SINIFLAMA_KAYNAKLARI: Kaynak[] = [
  { kurum: 'FIGO', belge: 'Munro MG ve ark. FIGO PALM-COEIN classification of causes of AUB, Int J Gynecol Obstet 2011;113:3-13; 2018 revizyonu (leiomyom alt tipleri 0–8), Int J Gynecol Obstet 2018;143:393-408', yil: '2018', tur: 'uluslararasi' },
  { kurum: 'American Society for Reproductive Medicine', belge: 'Revised ASRM classification of endometriosis: 1996. Fertil Steril 1997;67:817-821', yil: '1996', tur: 'uluslararasi' },
  { kurum: 'Keckstein J ve ark.', belge: 'The #Enzian classification. Acta Obstet Gynecol Scand 2021;100:1165-1175', yil: '2021', tur: 'uluslararasi' },
]
export const PALM_ADI: Record<string, string> = { P: 'Polip', A: 'Adenomiyozis', L: 'Leiomyom', M: 'Malignite / hiperplazi' }
export const COEIN_ADI: Record<string, string> = { C: 'Koagülopati', O: 'Ovulatuar disfonksiyon', E: 'Endometriyal', I: 'İyatrojenik', N: 'Henüz sınıflanmamış' }
export const MYOM_TIP_ADI: Record<string, string> = {
  0: '0 — saplı intrakaviter', 1: '1 — submüköz, <%50 intramural', 2: '2 — submüköz, ≥%50 intramural', 3: '3 — endometriuma temas eden, %100 intramural', 4: '4 — intramural',
  5: '5 — subseröz, ≥%50 intramural', 6: '6 — subseröz, <%50 intramural', 7: '7 — saplı subseröz', 8: '8 — diğer (servikal, parazitik)',
  '2-5': '2-5 hibrit', '1-5': '1-5 hibrit', '2-6': '2-6 hibrit', '1-6': '1-6 hibrit',
}
export const MYOM_BAYRAK_ADI: Record<string, string> = {
  kavite_ile_iliskili: 'Kaviteyle ilişkili myom var (FIGO 0–2)', endometriuma_temas: 'Endometriuma temas eden myom var (FIGO 3)', transmural_hibrit: 'Transmural (hibrit) myom var',
  sapli_subseroz: 'Saplı subseröz myom var (FIGO 7)', servikal_veya_parazitik: 'Servikal veya parazitik myom var (FIGO 8)', tipi_bilinmeyen_var: 'Tipi seçilmemiş myom var (sayıma alınmadı)',
}

// ───────────────────────── labour ward ─────────────────────────

export const DOGUMHANE_KAYNAKLARI: Kaynak[] = [
  { kurum: 'Bishop EH', belge: 'Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268', yil: '1964', tur: 'uluslararasi' },
  { kurum: 'Dünya Sağlık Örgütü (WHO)', belge: 'Robson Classification: Implementation Manual', yil: '2017', tur: 'uluslararasi' },
  { kurum: 'NICE', belge: 'NG192 Caesarean birth (aciliyet kategorileri 1–4; karar–doğum hedefi kategori 1: 30 dk, kategori 2: 75 dk) — uluslararası referans', yil: '2021', tur: 'uluslararasi' },
  { kurum: 'Dünya Sağlık Örgütü (WHO)', belge: 'Doğum sonu kanama tanımı (24 saatte ≥500 mL; ağır ≥1000 mL) ve doğum sonu kan kaybının değerlendirilmesi ile tedavi paketi önerileri', yil: '2023', tur: 'uluslararasi' },
  { kurum: 'El Ayadi AM, Nathan HL ve ark.', belge: 'Şok indeksi eşikleri 0,9 / 1,4 / 1,7. PLoS ONE 2016;11(2):e0148729', yil: '2016', tur: 'uluslararasi' },
  { kurum: 'American College of Obstetricians and Gynecologists', belge: 'Committee Opinion No. 794, Quantitative blood loss in obstetric hemorrhage', yil: '2019', tur: 'uluslararasi' },
  { kurum: 'Eunice Kennedy Shriver NICHD MFMU Network', belge: 'Grobman WA ve ark. SSVD hesaplayıcısı (ırk ve etnisite olmadan), Am J Obstet Gynecol 2021;225:664.e1-7 — resmi hesaplayıcıda hesaplanır', yil: '2021', tur: 'uluslararasi' },
]
export const TR_ACILIYET_HEDEF_DK: Record<string, number> = { 1: 30, 2: 75 }
export const TR_PPH_ESIKLERI = [500, 1000]
export const PPH_EVRE_ADI = ['Doğum sonu kanama eşiğinin altında', 'Doğum sonu kanama (≥500 mL)', 'Ağır doğum sonu kanama (≥1000 mL)']
export const BISHOP_ADI: Record<string, Record<string, string>> = {
  aciklik: { kapali: 'Kapalı (0)', '1_2': '1–2 cm (1)', '3_4': '3–4 cm (2)', '5_ustu': '≥5 cm (3)' },
  silinme: { '0_30': '%0–30 (0)', '40_50': '%40–50 (1)', '60_70': '%60–70 (2)', '80_ustu': '≥%80 (3)' },
  istasyon: { eksi3: '−3 (0)', eksi2: '−2 (1)', eksi1_0: '−1 / 0 (2)', arti1_2: '+1 / +2 (3)' },
  kivam: { sert: 'Sert (0)', orta: 'Orta (1)', yumusak: 'Yumuşak (2)' },
  pozisyon: { posterior: 'Posterior (0)', orta: 'Orta (1)', anterior: 'Anterior (2)' },
}
export const BISHOP_BILESEN_ADI: Record<string, string> = { aciklik: 'Açıklık', silinme: 'Silinme', istasyon: 'Fetal baş seviyesi', kivam: 'Kıvam', pozisyon: 'Serviks pozisyonu' }
export const ROBSON_ADI: Record<number, string> = {
  1: 'Nullipar, tekil baş, ≥37 hafta, spontan eylem', 2: 'Nullipar, tekil baş, ≥37 hafta, indüksiyon (2a) veya eylem öncesi sezaryen (2b)',
  3: 'Multipar (önceki sezaryen yok), tekil baş, ≥37 hafta, spontan eylem', 4: 'Multipar (önceki sezaryen yok), tekil baş, ≥37 hafta, indüksiyon (4a) veya eylem öncesi sezaryen (4b)',
  5: 'Önceki sezaryen, tekil baş, ≥37 hafta', 6: 'Nullipar, tekil makat', 7: 'Multipar, tekil makat (önceki sezaryen dahil)',
  8: 'Çoğul gebelik (önceki sezaryen dahil)', 9: 'Tekil transvers / oblik (önceki sezaryen dahil)', 10: 'Tekil baş, <37 hafta (önceki sezaryen dahil)',
}
export const ACILIYET_ADI: Record<string, string> = {
  1: 'Kategori 1 — kadının veya fetüsün yaşamına anında tehdit', 2: 'Kategori 2 — anında yaşamı tehdit etmeyen maternal / fetal bozulma',
  3: 'Kategori 3 — bozulma yok, erken doğum gerekli', 4: 'Kategori 4 — kadına ve ekibe uygun zamanda',
}
export const SOK_ADI: Record<string, string> = { normal: '0,9 altı (doğum sonu normal üst sınırın altında)', esik_0_9: '≥0,9 — yakın izlem / sevk eşiği', esik_1_4: '≥1,4 — acil müdahale eşiği', esik_1_7: '≥1,7 — olumsuz sonuç olasılığı yüksek' }
export const PAKET_ADI: Record<string, string> = { olcum: 'Kan kaybı ölçülüyor (kalibre örtü / tartım)', masaj: 'Uterus masajı', uterotonik: 'Uterotonik ilaç', traneksamik_asit: 'Traneksamik asit', iv_sivi: 'IV sıvı', muayene_eskalasyon: 'Muayene ve gerekirse üst basamağa çağrı' }
export const VBAC_ADI: Record<string, string> = { yas: 'Yaş', boy_cm: 'Boy (cm)', gebelik_oncesi_kilo_kg: 'Gebelik öncesi kilo (kg)', obstetrik_oyku: 'Obstetrik öykü', arrest_endikasyonu: 'Önceki sezaryen endikasyonu: eylem duraklaması (arrest)', tedavili_kronik_hipertansiyon: 'Tedavi gören kronik hipertansiyon' }
export const VBAC_OYKU_ADI: Record<string, string> = { onceki_vbac: 'Önceki sezaryen sonrası vajinal doğum (SSVD) var', yalniz_sezaryen_oncesi_vajinal: 'Yalnız sezaryen öncesi vajinal doğum var', vajinal_dogum_yok: 'Vajinal doğum yok' }

// ───────────────────────── hysteroscopy and ERAS ─────────────────────────

export const HISTEROSKOPI_KAYNAKLARI: Kaynak[] = [
  { kurum: 'AAGL', belge: 'Practice Report: Practice guidelines for the management of hysteroscopic distending media. J Minim Invasive Gynecol 2013;20:137-148 (sağlıklı: hipotonik 1000 mL, izotonik 2500 mL; yaşlı / eşlik eden hastalık: hipotonik 750 mL; kardiyovasküler hastalık: izotonik 750 mL)', yil: '2013', tur: 'uluslararasi' },
  { kurum: 'ERAS Society', belge: 'Nelson G ve ark. Guidelines for perioperative care in gynecologic/oncology: 2019 update. Int J Gynecol Cancer 2019;29:651-668', yil: '2019', tur: 'uluslararasi' },
  { kurum: 'ERAS Society', belge: 'Sezaryen ERAS önerileri: Wilson RD ve ark. 2018 (1. bölüm), Caughey AB ve ark. 2018 (2. bölüm), Macones GA ve ark. 2019 (3. bölüm), Am J Obstet Gynecol', yil: '2018–2019', tur: 'uluslararasi' },
]
export const SIVI_BANT_ADI: Record<string, string> = { sinir_alti: 'Sınırın altında', sinira_yakin: 'Sınıra yaklaşıyor (≥%75): işlemi sonlandırmaya hazırlanın', sinir_asildi: 'Sınır aşıldı: işlemi sonlandırın, elektrolit ve sıvı durumunu değerlendirin' }
export const ERAS_ADI: Record<string, string> = {
  preop_bilgilendirme: 'Ameliyat öncesi bilgilendirme ve danışmanlık', sigara_alkol_birakma: 'Sigara ve alkol bırakma (en az 4 hafta)', anemi_degerlendirme: 'Ameliyat öncesi anemi değerlendirme ve düzeltme',
  kati_6s_sivi_2s: 'Katı gıda 6 saat, berrak sıvı 2 saat öncesine kadar', karbonhidrat_yukleme: 'Ameliyat öncesi karbonhidrat yüklemesi', karbonhidrat_icecegi: 'Ameliyat öncesi karbonhidrat içeceği',
  rutin_bagirsak_hazirligi_yok: 'Rutin bağırsak hazırlığı yok', uzun_etkili_sedatif_yok: 'Uzun etkili sedatif premedikasyon yok', vte_profilaksisi: 'VTE profilaksisi',
  antibiyotik_ve_klorheksidin_alkol: 'Antibiyotik profilaksisi ve klorheksidin-alkol cilt hazırlığı', bulanti_kusma_profilaksisi: 'Çok yönlü bulantı-kusma profilaksisi', kisa_etkili_anestezi: 'Kısa etkili anestezi ajanları',
  normotermi: 'Normotermi', hedefe_yonelik_sivi: 'Hedefe yönelik / dengeli sıvı', minimal_invaziv_tercih: 'Uygunsa minimal invaziv cerrahi', rutin_nazogastrik_ve_dren_yok: 'Rutin nazogastrik tüp ve dren yok',
  opioid_koruyucu_multimodal_analjezi: 'Opioid koruyucu çok yönlü analjezi', erken_beslenme_24s: 'İlk 24 saatte erken beslenme', glukoz_kontrolu: 'Kan şekeri kontrolü', erken_sonda_cikarma_24s: 'İdrar sondasının 24 saat içinde çıkarılması',
  erken_mobilizasyon: 'Erken mobilizasyon', uyum_denetimi: 'Protokol uyum denetimi', antenatal_bilgilendirme: 'Doğum öncesi bilgilendirme', antibiyotik_insizyon_oncesi: 'Antibiyotik cilt kesisinden önce',
  klorheksidin_alkol_cilt: 'Klorheksidin-alkol cilt hazırlığı', eylemde_vajinal_hazirlik: 'Eylemdeyse vajinal antiseptik hazırlık', normovolemi: 'Normovolemi', rejyonel_anestezi: 'Rejyonel anestezi',
  gecikmis_kordon_klempi: 'Gecikmiş kordon klempi', ten_tene_temas: 'Ten tene temas', erken_oral_alim: 'Erken oral alım', erken_sonda_cikarma: 'İdrar sondasının erken çıkarılması',
  vte_risk_degerlendirmesi: 'VTE risk değerlendirmesi', taburculuk_planlamasi: 'Taburculuk planlaması',
}

// ───────────────────────── consent forms ─────────────────────────

export const ONAM_KAYNAKLARI: Kaynak[] = [
  { kurum: 'T.C. Sağlık Bakanlığı', belge: 'Hasta Hakları Yönetmeliği (Resmî Gazete 01.08.1998, sayı 23420): bilgilendirme ve rıza', yil: '1998', tur: 'ulusal' },
  { kurum: 'Royal College of Obstetricians and Gynaecologists', belge: 'Consent Advice serisi (risklerin sınıflanması: ciddi ve sık riskler) — yapı için uluslararası referans', yil: '2008–2009', tur: 'uluslararasi' },
]
export const ONAM_PROSEDUR: Record<OnamProseduru, { ad: string; aciklama: string; yararlar: string; alternatifler: string }> = {
  sezaryen: { ad: 'Sezaryen', aciklama: 'Bebeğin karın duvarı ve rahimdeki kesiyle doğurtulması; genellikle bölgesel (spinal / epidural), gerekirse genel anestezi altında.', yararlar: 'Endikasyona göre anne ve / veya bebek için doğumun güvenli ve zamanında gerçekleşmesi.', alternatifler: 'Durumunuza göre vajinal doğum (sezaryen sonrası vajinal doğum dahil) veya bekleme; hekiminiz sizinle konuştu.' },
  tlh: { ad: 'Total laparoskopik histerektomi', aciklama: 'Rahmin (rahim ağzıyla birlikte) laparoskopiyle alınması; yumurtalık ve tüplerin durumu ayrıca konuşulur.', yararlar: 'Endikasyona yönelik tedavi; açık cerrahiye göre daha küçük kesiler.', alternatifler: 'İlaç tedavisi, rahim içi araç, endometriyal ablasyon, myomektomi, vajinal veya açık histerektomi, bekleme.' },
  tah: { ad: 'Total abdominal histerektomi', aciklama: 'Rahmin karın kesisiyle alınması; yumurtalık ve tüplerin durumu ayrıca konuşulur.', yararlar: 'Endikasyona yönelik kesin tedavi.', alternatifler: 'İlaç tedavisi, rahim içi araç, ablasyon, myomektomi, laparoskopik veya vajinal histerektomi, bekleme.' },
  vajinal_histerektomi: { ad: 'Vajinal histerektomi', aciklama: 'Rahmin vajen yoluyla, karın kesisi olmadan alınması.', yararlar: 'Endikasyona yönelik tedavi; karın kesisi yok.', alternatifler: 'Pesser, pelvik taban egzersizleri, rahmi koruyan onarım, laparoskopik veya açık histerektomi, bekleme.' },
  lap_myomektomi: { ad: 'Laparoskopik myomektomi', aciklama: 'Myomların rahim korunarak laparoskopiyle çıkarılması.', yararlar: 'Myoma bağlı şikâyetlerin azalması, rahmin korunması.', alternatifler: 'İlaç tedavisi, uterin arter embolizasyonu, açık myomektomi, histerektomi, bekleme.' },
  abdominal_myomektomi: { ad: 'Abdominal myomektomi', aciklama: 'Myomların rahim korunarak karın kesisiyle çıkarılması.', yararlar: 'Myoma bağlı şikâyetlerin azalması, rahmin korunması.', alternatifler: 'İlaç tedavisi, uterin arter embolizasyonu, laparoskopik myomektomi, histerektomi, bekleme.' },
  tanisal_laparoskopi: { ad: 'Tanısal laparoskopi', aciklama: 'Göbekten ve alt karından küçük kesilerle karın ve pelvisin kamerayla incelenmesi; gerekirse biyopsi veya boya testi.', yararlar: 'Şikâyetin nedeninin görülmesi; uygunsa aynı seansta tedavi.', alternatifler: 'Görüntüleme ile izlem, ilaç tedavisi, bekleme.' },
  lap_over_kistektomi: { ad: 'Laparoskopik over kistektomi', aciklama: 'Yumurtalık kistinin, yumurtalık korunarak laparoskopiyle çıkarılması.', yararlar: 'Kistin tedavisi ve doku tanısı; yumurtalığın korunması.', alternatifler: 'Ultrasonla izlem, açık cerrahi, yumurtalığın alınması.' },
  lap_endometriozis: { ad: 'Laparoskopik endometriozis cerrahisi', aciklama: 'Endometriozis odaklarının ve yapışıklıkların laparoskopiyle çıkarılması veya yakılması.', yararlar: 'Ağrının azalması, doğurganlığın desteklenmesi, doku tanısı.', alternatifler: 'İlaç (hormonal) tedavi, ağrı tedavisi, yardımcı üreme teknikleri, bekleme.' },
  histeroskopi: { ad: 'Histeroskopi (tanısal / operatif)', aciklama: 'Rahim içinin vajen ve rahim ağzından ince bir kamerayla incelenmesi; gerekirse polip, myom veya yapışıklığın alınması.', yararlar: 'Rahim içinin doğrudan görülmesi ve aynı seansta tedavi.', alternatifler: 'Ultrason / salin infüzyon sonografisi, endometriyal örnekleme, bekleme.' },
  dc_kuretaj: { ad: 'Dilatasyon ve küretaj', aciklama: 'Rahim ağzının genişletilerek rahim içinden doku alınması.', yararlar: 'Tanı için doku elde edilmesi veya kanamanın tedavisi.', alternatifler: 'Ofis tipi endometriyal örnekleme, histeroskopi, ilaç tedavisi, bekleme.' },
  vakum_aspirasyon: { ad: 'Vakum aspirasyon (rahim boşaltma)', aciklama: 'Gebelik dokusunun vakumla rahimden boşaltılması.', yararlar: 'Rahmin güvenli biçimde boşaltılması.', alternatifler: 'İlaçla tedavi, bekleme (uygunsa).' },
  kolposkopi_leep: { ad: 'Kolposkopi, biyopsi ve LEEP / LLETZ', aciklama: 'Rahim ağzının büyüteçle incelenmesi, gerekirse biyopsi ve anormal bölgenin elektrikli tel halkayla çıkarılması.', yararlar: 'Hücre değişikliklerinin tanısı ve tedavisi; kanser gelişiminin önlenmesi.', alternatifler: 'İzlem (uygunsa), diğer tedavi yöntemleri (koni biyopsi, ablasyon).' },
  ria: { ad: 'Rahim içi araç (RİA) takılması', aciklama: 'Doğum kontrolü veya tedavi için rahim içine araç yerleştirilmesi.', yararlar: 'Uzun etkili, geri dönüşlü doğum kontrolü / tedavi.', alternatifler: 'Diğer doğum kontrol yöntemleri (hap, implant, enjeksiyon, bariyer, kalıcı yöntemler).' },
  labioplasti: { ad: 'Labioplasti', aciklama: 'İç dudakların (labia minora) cerrahi olarak küçültülmesi veya şekillendirilmesi.', yararlar: 'Fiziksel yakınmaların azalması.', alternatifler: 'Ameliyatsız izlem, danışmanlık, bekleme.' },
  perineoplasti: { ad: 'Perineoplasti / kolporafi', aciklama: 'Perine ve vajen girişinin cerrahi onarımı.', yararlar: 'Sarkma veya doğum hasarına bağlı yakınmaların azalması.', alternatifler: 'Pelvik taban egzersizleri, pesser, bekleme.' },
}
export const ONAM_RISK_ADI: Record<string, string> = {
  abdominal_yola_gecis: 'Karın yoluyla ameliyata geçilmesi', agri: 'Ağrı', agri_suregenligi: 'Ağrının sürmesi', agri_yorgunluk: 'Ağrı ve yorgunluk', akinti: 'Akıntı', asimetri_revizyon: 'Asimetri ve düzeltme ameliyatı gereksinimi',
  bagirsak_mesane_damar_yaralanmasi: 'Bağırsak, mesane veya büyük damar yaralanması', bagirsak_rezeksiyonu_stoma: 'Bağırsak rezeksiyonu ve geçici / kalıcı stoma', bagirsak_yaralanmasi: 'Bağırsak yaralanması',
  bebekte_kesi_cizigi: 'Bebekte cilt çiziği', beklenmeyen_malignite: 'Beklenmeyen kanser saptanması', ciddi_kanama: 'Ciddi kanama', disparoni: 'İlişkide ağrı', disparoni_gecici: 'Geçici ilişki ağrısı',
  duzensiz_kanama: 'Düzensiz kanama', ekspulsiyon: 'Aracın düşmesi / yer değiştirmesi', ektopik_gebelik: 'Gebelik olursa dış gebelik', endometrit: 'Rahim iç zarı enfeksiyonu', enfeksiyon: 'Enfeksiyon',
  giris_basarisizligi: 'Karına / rahme girilememesi ve işlemin tamamlanamaması', hastalik_tekrari: 'Hastalığın tekrarlaması', his_degisikligi: 'His değişikliği', histerektomi: 'Rahmin alınması (histerektomi) gerekmesi',
  idrar_sikligi_bosaltim_guclugu: 'Sık idrar veya idrar boşaltma güçlüğü', idrar_yolu_enfeksiyonu: 'İdrar yolu enfeksiyonu', intrauterin_yapisiklik: 'Rahim içi yapışıklık', kalinti_doku_tekrar_islem: 'Kalıntı doku ve tekrar işlem gereksinimi',
  kanama: 'Kanama', kanama_hematom: 'Kanama / hematom', kanama_transfuzyon: 'Kanama ve kan nakli gereksinimi', karin_sislik_agri: 'Karında şişkinlik ve ağrı', kist_tekrari: 'Kistin tekrarlaması', kramp_agri: 'Kramp tarzı ağrı',
  laparotomiye_gecis: 'Açık ameliyata (laparotomi) geçilmesi', mesane_disfonksiyonu: 'Mesane işlev bozukluğu', mesane_ureter_yaralanmasi: 'Mesane veya üreter yaralanması', myom_tekrari: 'Myomların yeniden oluşması',
  olum_cok_nadir: 'Ölüm (çok nadir)', omuz_agrisi: 'Omuz ağrısı', ooforektomi: 'Yumurtalığın alınması gerekmesi', over_rezervinde_azalma: 'Yumurtalık rezervinde azalma', pelvik_abse_enfeksiyon: 'Pelvik apse / enfeksiyon',
  pelvik_enfeksiyon: 'Pelvik enfeksiyon', rektum_yaralanmasi: 'Rektum yaralanması', servikal_darlik: 'Rahim ağzı darlığı', servikal_yaralanma: 'Rahim ağzı yaralanması', sislik_agri: 'Şişlik ve ağrı',
  sivi_yuklenmesi: 'Sıvı yüklenmesi / elektrolit bozukluğu', sonraki_gebelikte_erken_dogum: 'Sonraki gebelikte erken doğum riskinde artış', sonraki_gebelikte_plasenta_anomalisi: 'Sonraki gebelikte plasenta yerleşim anomalisi (previa / akreta)',
  sonraki_gebelikte_ruptur: 'Sonraki gebelikte rahim yırtılması', tekrar: 'Yakınmanın tekrarlaması', tekrar_tedavi: 'Tekrar tedavi gereksinimi', trokar_yeri_fitigi: 'Kesi yerinde fıtık', ureter_yaralanmasi: 'Üreter yaralanması',
  uterus_perforasyonu: 'Rahim delinmesi (perforasyon)', vajen_kafi_ayrilmasi: 'Vajen kubbesinin ayrılması', vte: 'Bacak veya akciğerde pıhtı (tromboemboli)', yapisiklik: 'Yapışıklık', yara_ayrilmasi: 'Yara ayrılması',
  yara_enfeksiyonu: 'Yara enfeksiyonu', yara_morarma_enfeksiyon: 'Yarada morarma veya enfeksiyon', yeniden_ameliyat: 'Yeniden ameliyat gereksinimi', yeniden_basvuru: 'Hastaneye yeniden başvuru',
}
export const ONAM_EK_ISLEM_ADI: Record<string, string> = {
  bagirsak_cerrahisi_ayri_onam: 'Bağırsak cerrahisi (ayrı onamla)', bagirsak_mesane_onarimi: 'Bağırsak / mesane onarımı', biyopsi: 'Biyopsi', cikarma_icin_histeroskopi: 'Çıkarmak için histeroskopi',
  ek_eksizyon: 'Ek eksizyon', gorulen_hastaligin_tedavisi: 'Görülen hastalığın aynı seansta tedavisi', histerektomi: 'Histerektomi', islemin_ertelenmesi: 'İşlemin ertelenmesi', kan_transfuzyonu: 'Kan nakli',
  laparoskopi: 'Laparoskopi', laparotomi: 'Laparotomi (açık ameliyat)', laparotomi_veya_laparoskopi: 'Laparotomi veya laparoskopi', ooforektomi: 'Yumurtalığın alınması', over_tup_cikarilmasi: 'Yumurtalık / tüplerin alınması',
  revizyon: 'Düzeltme ameliyatı', tekrar_islem: 'Tekrar işlem', tup_ligasyonu_ayri_onam: 'Tüp ligasyonu (ayrı onamla)',
}
