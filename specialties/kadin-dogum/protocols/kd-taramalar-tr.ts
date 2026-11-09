/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Türkiye kuralları ve kaynakları (Kadın Hastalıkları ve Doğum'a özgü).
 * Motor: lib/clinical/kdTaramalar.ts (yedi dalda birebir aynı). Bu dosya YALNIZ Türkiye'nin sayılarını ve kaynak
 * metinlerini taşır. Her sayı aşağıda adı geçen ve 2026-11-09'da AÇILIP OKUNAN kaynaktan alınmıştır; kaynağın
 * söylemediği bir sayı `null` bırakılır (motor o durumda "aralık yok" der, uydurmaz).
 *
 * KAYNAKLAR (okunan sayfa ve öneri numarası ile):
 *  ATA_2017  Alexander EK ve ark. 2017 Guidelines of the American Thyroid Association for the Diagnosis and Management of
 *            Thyroid Disease During Pregnancy and the Postpartum. Thyroid 2017;27(3):315-389.
 *            - Öneri 26: popülasyona ve trimestere özgü TSH aralığı; yoksa benzer popülasyon/benzer test; o da yoksa
 *              "an upper reference limit of ~4.0 mU/L may be used".
 *            - Soru 2 metni: 1. trimesterde alt sınır ~0,4 mU/L, üst sınır ~0,5 mU/L düşürülür; tipik hastada üst sınır
 *              4,0 mU/L; "beginning with the late first trimester, weeks 7-12, with a gradual return towards the
 *              non-pregnant range in the 2nd and 3rd trimesters" (2.–3. trimester için SAYI VERİLMEZ).
 *            - Öneri 2: serbest T4 için yönteme ve trimestere özgü aralık (yedek sayı yok).
 *            - Öneri 33: LT4 alan hipotiroidide TSH ~4 haftada bir orta gebeliğe kadar ve 30. hafta civarında en az bir kez.
 *            - Öneri 37: doğumdan sonra gebelik öncesi doza dönüş; ~6. hafta tiroid fonksiyon testi.
 *            - Öneri 48a: Graves/hipertiroidide FT4/TT4 ve TSH ~4 haftada bir. Öneri 52: TRAb erken gebelik; yüksekse veya
 *              ATİ sürüyorsa 18–22. hafta; 18–22'de yüksekse veya 3. trimesterde ATİ varsa 30–34. hafta.
 *            - Öneri 11: ötiroid, antikor pozitif gebede TSH gebelik doğrulanınca ve orta gebeliğe kadar 4 haftada bir.
 *            - Öneri 96–97: ilk vizitte sözlü sorgu; 11 risk faktöründe TSH (TIROID_RISK_FAKTORLERI).
 *            Okunan kopya: endoinfo.ru/guidelines/thy_pregn2017.pdf.
 *  TEMD_2023 Türkiye Endokrinoloji ve Metabolizma Derneği, Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu, 7. baskı, Mayıs 2023
 *            (file.temd.org.tr). Bölüm 23 Gebelik ve Hipotiroidi (s. 287–290), Bölüm 24 Gebelik ve Hipertiroidi (s. 291–296):
 *            - Öneri 23A: "Gebe bir kadın ilk defa başvurduğunda tiroid hastalığı için tarama yapması gereklidir." (evrensel)
 *            - Öneri 23D: gebelik öncesi ve 1. trimesterde TSH <2,5 mU/L, 2. ve 3. trimesterde <3 mU/L tutulmalıdır (tedavi hedefi).
 *            - s. 288: ilk 24 haftada takip dört haftada bir; doğumdan sonra gebelik öncesi doza dönüş; postpartum 6. hafta TSH.
 *            - s. 295: hipertiroidide maternal tiroid testleri 2–4 haftada bir.
 *            - s. 8: gebelikte tiroid testleri trimestere özel referans değerleriyle yorumlanır.
 *  WHO_HPV_2022  Dünya Sağlık Örgütü, "WHO updates recommendations on HPV vaccination schedule", 20 Aralık 2022 (who.int):
 *            9–14 yaş kız: bir veya iki doz; 15–20 yaş: bir veya iki doz; 21 yaş üstü: 6 ay arayla iki doz; bağışıklığı
 *            baskılanmış (HIV dahil): en az iki, mümkünse üç doz.
 *  SB_ASI_2020  T.C. Sağlık Bakanlığı, Ulusal Çocukluk Dönemi Aşılama Takvimi (2020), asi.saglik.gov.tr broşürü: HPV YOK.
 *            Güncel (2026) resmî takvim bu oturumda resmî kaynaktan AÇILAMADI (asi.saglik.gov.tr erişim listesinde değil);
 *            basın (bianet, 12 Ocak 2026) programın başlamadığını yazıyor — resmî kaynak olmadığı için kural yapılmadı.
 *            docs/OPEN-COMMITMENTS.md KD-TARAMA-01b.
 *  SB_SMA_2023  T.C. Sağlık Bakanlığı, "Evlilik Öncesi SMA Taraması 2 Yılda 1 Milyonu Aşkın Kişiye Ulaştı", 18 Eylül 2023
 *            (saglik.gov.tr/TR-99556): 27 Aralık 2021'den beri 81 ilde, aile hekimliklerince, ücretsiz; tek eş taşıyıcıysa
 *            "diğerinin de sessiz taşıyıcı olma ihtimaline karşı, Tıbbi Genetik Uzmanına yönlendirilerek"; danışma "doğum
 *            öncesi veya tüp bebek aşılama öncesi tanı testi gibi seçenekleri içermektedir"; "gebelik döneminde de, talep
 *            eden çiftlere tarama testi uygulanıyor."
 *  DSM5TR    American Psychiatric Association, DSM-5-TR (2022), Premenstrüel Disforik Bozukluk (ICD-10-CM N94.3) — kriter
 *            yapısı PsychDB'de okundu (2026-11-09; DSM-5 metni, TR revizyonunda PMDD kriterleri değişmedi). Kriter metni
 *            buraya alınmadı; maddeler Notya'nın kendi Türkçesiyle yazıldı.
 *  DRSP      Endicott J, Nee J, Harrison W. Daily Record of Severity of Problems (DRSP): reliability and validity. Arch Womens
 *            Ment Health 2006;9:41-49. Okunan form: "© pending, Jean Endicott, Ph.D. and Wilma Harrison, M.D."; ticari
 *            kullanım izni metni YOK → DRSP KULLANILMADI; Notya'nın özgün günlüğü kuruldu (KD-TARAMA-01d).
 *  ACOG_PMD  ACOG Clinical Practice Guideline No. 7, Management of Premenstrual Disorders (2023), American Family Physician
 *            özeti (Arnold MJ, AFP 2024;110(6):647-650) üzerinden okundu: SSRI (luteal faz veya sürekli), kombine oral
 *            kontraseptif, bilişsel davranışçı terapi, ağır belirtilerde add-back ile GnRH agonisti. Uluslararası kaynak.
 */
import type { HpvKurali, TiroidKurali } from '@/lib/clinical/kdTaramalar'

export type KdKaynak = { kod: string; ad: string; ulusal: boolean }

export const KD_TARAMA_KAYNAKLARI: Readonly<Record<string, KdKaynak>> = {
  ATA_2017: { kod: 'ATA_2017', ad: 'American Thyroid Association 2017 gebelik ve postpartum tiroid kılavuzu (Thyroid 2017;27:315-389)', ulusal: false },
  TEMD_2023: { kod: 'TEMD_2023', ad: 'TEMD Tiroid Hastalıkları Tanı ve Tedavi Kılavuzu, 7. baskı (2023), Bölüm 23–24', ulusal: true },
  WHO_HPV_2022: { kod: 'WHO_HPV_2022', ad: 'DSÖ HPV aşı şeması güncellemesi (20 Aralık 2022)', ulusal: false },
  SB_ASI_2020: { kod: 'SB_ASI_2020', ad: 'T.C. Sağlık Bakanlığı Ulusal Çocukluk Dönemi Aşılama Takvimi (2020) — HPV yer almıyor', ulusal: true },
  SB_SMA_2023: { kod: 'SB_SMA_2023', ad: 'T.C. Sağlık Bakanlığı, Evlilik Öncesi SMA Taşıyıcılık Taraması (18 Eylül 2023 duyurusu)', ulusal: true },
  DSM5TR: { kod: 'DSM5TR', ad: 'APA DSM-5-TR (2022), Premenstrüel Disforik Bozukluk — kriter yapısı', ulusal: false },
  ACOG_PMD: { kod: 'ACOG_PMD', ad: 'ACOG Klinik Uygulama Kılavuzu No. 7, Premenstrüel Bozuklukların Yönetimi (2023)', ulusal: false },
}

/**
 * Türkiye: aralık yedeği ATA 2017 (Türk kılavuzu sayı vermiyor; TEMD s. 8 yalnız "trimestere özel referans" der),
 * tedavi hedefi ve izlem sıklığı TEMD 2023, ek 30. hafta noktası ve TRAb pencereleri ATA 2017.
 */
export const TR_TIROID_KURALI: TiroidKurali = {
  kaynak: 'ATA_2017+TEMD_2023',
  t1AltDusus: 0.4, // ATA 2017, Soru 2 metni
  t1UstDusus: 0.5, // ATA 2017, Soru 2 metni
  t1BaslangicHafta: 7, // ATA 2017: "beginning with the late first trimester, weeks 7-12"
  t23GebelikDisi: false, // ATA 2017: 2.–3. trimesterde "gradual return" — sayı yok
  sabitUst: 4.0, // ATA 2017, Öneri 26 (üçüncü madde)
  sabitBasHafta: 7, // ATA 2017, Soru 2 metni (geç 1. trimesterden itibaren)
  sabitSonHafta: 13, // 1. trimesterin sonu (lib/clinical/gebelik.ts ile aynı kesim); 2.–3. trimester için ATA sayı vermez
  hedefT1Ust: 2.5, // TEMD 2023, Öneri 23D
  hedefT23Ust: 3, // TEMD 2023, Öneri 23D
  hedefAltYari: false,
  hipoAralikHafta: 4, // TEMD 2023 s. 288; ATA 2017 Öneri 33
  hipoSonHafta: 24, // TEMD 2023 s. 288: "ilk 24 haftalık dönemde"
  hipoEkHafta: 30, // ATA 2017 Öneri 33: "at least once near 30 weeks gestation"
  postpartumHafta: 6, // TEMD 2023 s. 288; ATA 2017 Öneri 37
  hiperAralikHafta: 4, // ATA 2017 Öneri 48a (TEMD s. 295: 2–4 hafta)
  trabPencereleri: [[18, 22], [30, 34]], // ATA 2017 Öneri 52b/52e ve 52f
  antikorAralikHafta: 4, // ATA 2017 Öneri 11
  antikorSonHafta: 20, // ATA 2017 Öneri 11: "through mid-pregnancy" (40 haftanın ortası)
  tarama: 'evrensel', // TEMD 2023 Öneri 23A
  riskFaktorleri: [],
}

/**
 * Türkiye: ulusal HPV programı resmî kaynaktan doğrulanamadı (SB_ASI_2020'de yok) → şema DSÖ 2022 (uluslararası, böyle
 * etiketlenir). Aralık yalnız DSÖ'nün söylediği yerde: 21 yaş üstü iki doz, 6 ay ara.
 */
export const TR_HPV_KURALI: HpvKurali = {
  kaynak: 'WHO_HPV_2022',
  satirlar: [
    { yasAlt: 0, yasUst: null, immun: 'baskilanmis', dozlar: [2, 3] },
    { yasAlt: 9, yasUst: 14, immun: 'normal', dozlar: [1, 2] },
    { yasAlt: 15, yasUst: 20, immun: 'normal', dozlar: [1, 2] },
    { yasAlt: 21, yasUst: null, immun: 'normal', dozlar: [2], araliklar: [{ doz: 2, enAzAy: 6 }] },
  ],
}

export const TR_HPV_ULUSAL_DURUM =
  'Ulusal program: T.C. Sağlık Bakanlığı 2020 çocukluk dönemi aşı takviminde HPV yer almıyor. Güncel resmî takvim bu sürümde resmî kaynaktan doğrulanamadı; HPV aşısı ulusal program aşısı olarak işaretlenmez. Şema: DSÖ 2022 (uluslararası).'

export const TR_SMA_PROGRAM =
  'T.C. Sağlık Bakanlığı Evlilik Öncesi SMA Taşıyıcılık Taraması: 27 Aralık 2021\'den beri 81 ilde, aile hekimliklerince ve ücretsiz. Gebelik döneminde talep eden çiftlere de tarama testi uygulanır. Tek eş taşıyıcı çıkarsa diğer eş, sessiz taşıyıcılık olasılığına karşı Tıbbi Genetik uzmanına yönlendirilir; genetik danışma doğum öncesi tanı ve tüp bebekte preimplantasyon tanı seçeneklerini içerir. (saglik.gov.tr, 18 Eylül 2023)'

/** PMDD yönetim seçenekleri — hekimin seçtiği metin; doz YOK (ACOG CPG No. 7, uluslararası). */
export const TR_PMDD_YONETIM: Readonly<Record<string, string>> = {
  ssri_surekli: 'SSRI — sürekli kullanım (doz ve ilaç hekimin)',
  ssri_luteal: 'SSRI — yalnız luteal fazda (doz ve ilaç hekimin)',
  kombine_oral_kontraseptif: 'Kombine oral kontraseptif (preparat hekimin; WHO MEC kapısı Jinekoloji modülünde)',
  bilissel_davranisci_terapi: 'Bilişsel davranışçı terapi (yönlendirme)',
  gnrh_agonist_addback: 'Ağır belirtilerde GnRH agonisti + add-back (uzman kararı)',
}
