/**
 * NOTYA-KHD-01 — Kadın Hastalıkları ve Doğum live chapter.
 * Clinic engines live in specialties/kadin-dogum (SAT/EDD in specialty payload only).
 * Ranking confirmed by Dr. Gökhan Mamur: ACOG pratik gold, DÖBYR yasal taban, Williams ders kitabı.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'
import { KADIN_DOGUM_MANIFEST } from '../../specialties/kadin-dogum/manifest'

export const KADIN_DOGUM_PROFILE: SpecialtyProfile = {
  key: 'kadin-hastaliklari-dogum',
  etiket: 'Kadın Hastalıkları ve Doğum',
  resmiUnvan: 'Kadın Hastalıkları ve Doğum',

  olcumler: [
    ...BASELINE_OLCUMLER,
    { anahtar: 'sonAdetTarihi', etiket: 'Son Adet Tarihi', birim: '' },
    { anahtar: 'fundusYuksekligi', etiket: 'Fundus Yüksekliği', birim: 'cm', kosul: 'gebe' },
  ],

  hesaplayicilar: [
    { id: 'gebelik-yasi', ad: 'Gebelik yaşı / TDT (Naegele, USG düzeltmeli)', kaynak: 'Naegele kuralı; SB DÖB Rehberi 2018', motor: 'lib/clinical/gebelik', deterministik: true },
    { id: 'sb-izlem-takvimi', ad: 'SB dört izlem takvimi + tarama/takviye maddeleri', kaynak: 'T.C. SB HSGM, Doğum Öncesi Bakım Yönetim Rehberi, 2018', motor: 'lib/clinical/gebelik', deterministik: true },
    { id: 'gebelik-uyarilari', ad: 'Rehber eşikli uyarılar (TA, proteinüri, FKA, Rh, postterm, gecikmiş izlem)', kaynak: 'SB DÖB + Riskli Gebelikler Yönetim Rehberi', motor: 'lib/clinical/gebelik', deterministik: true },
    { id: 'kilo-alim-hedefi', ad: 'Gebelik öncesi VKİ\'ye göre kilo alım hedefi', kaynak: 'SB/MEB DÖB modülü (IOM ile uyumlu)', motor: 'lib/clinical/gebelik', deterministik: true },
    { id: 'fetal-biyometri', ad: 'Fetal biyometri persentilleri (HC/BPD/AC/FL) + Hadlock EFW', kaynak: 'INTERGROWTH-21st (Papageorghiou ve ark., Lancet 2014) resmi tablolar, birebir gömülü; Hadlock 1985', motor: 'lib/clinical/fetalBiyometri', deterministik: true },
    { id: 'lohusa-takvimi', ad: 'SB lohusa izlem takvimi (24 saat → 42. gün)', kaynak: 'T.C. SB Doğum Sonu Bakım Yönetim Rehberi (2014/2018)', motor: 'lib/clinical/lohusaVeJinekoloji', deterministik: true },
    { id: 'ketem-taramalari', ad: 'KETEM tarama durumu (serviks HPV 30-65/5y, mamografi 40-69/2y, kolorektal 50-70/2y)', kaynak: 'T.C. SB Kanser Tarama Standartları', motor: 'lib/clinical/lohusaVeJinekoloji', deterministik: true },
    { id: 'genetik-tarama-kayit', ad: 'Genetik/kromozomal tarama kaydı (ikili/üçlü-dörtlü/NIPT/invaziv) — RİSK HESAPLAMAZ, yalnız laboratuvar sonucunu kaydeder', kaynak: 'FMF Türkçe eğitim materyali (terminoloji/pencere), SB DÖB Rehberi, TJOD/Perinatoloji pratiği', motor: 'lib/clinical/genetikTarama', deterministik: true },
  ],

  sekmeler: [
    { id: 'gebelik-takibi', etiket: 'Kadın Sağlığı & Gebelik', bilesen: 'HastaGebelik', sira: 12 },
    ...KADIN_DOGUM_MANIFEST.tabs.map((ad, i) => ({
      id: `kd-${ad.toLowerCase()}`,
      etiket: ad,
      bilesen: ad,
      sira: 20 + i,
    })),
  ],

  goruntu: {
    modaliteler: ['us', 'foto'],
    zamanCizgisi: true,
    ayseSinir: 'Obstetrik USG/NST taslağı ölçüm ve tarama destegidir, tanı değildir. Uzman onayı gerekir. ACOG fetal surveillance dili kullanılabilir.',
  },

  belgeler: [
    ...BASELINE_BELGELER,
    { id: 'gebe-izlem-karti', ad: 'Gebe İzlem Kartı (SB)', format: 'rapor' },
    { id: 'usg-raporu', ad: 'Obstetrik USG Raporu', format: 'rapor' },
    { id: 'dogum-raporu', ad: 'Doğum Raporu', format: 'rapor' },
  ],

  ekKaynaklar: [
    'ACOG Practice Bulletin / Committee Opinion / Clinical Consensus — TR hekim pratik gold (Dr. Gökhan Mamur)',
    'T.C. SB HSGM — Doğum Öncesi Bakım Yönetim Rehberi DÖBYR 2026 (Yayın No. 1402) — yasal taban',
    'Doğum Sonu Bakım Yönetim Rehberi',
    'Riskli Gebelikler Yönetim Rehberi',
    'Williams Obstetrik 26 (TR Tıraş/Çakıroğlu) — ders kitabı derinliği',
    'Berek & Novak 16–17 — jinekoloji',
    'Temel Kadın Hastalıkları ve Doğum Bilgisi 4 — TR wording',
    'specialties/kadin-dogum (SAT/EDD/USG/NST payload + dual calendar)',
  ],

  promptNotlari: [
    'Kaynak gösterirken Türk kaynağı önce (SB rehberleri, SUT/SGK, TJOD); ACOG TR hekimin pratikte izlediği klinik öneri. Yasal taban: DÖBYR. Ders kitabı: Williams.',
    'Kılavuz doküman numarası / yayın yılı hafızadan yazılmaz (Kaynak kilidi — specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar).',
    'Gebelik haftası, TDT ve trimester sunucuda hesaplanır — kendin hesaplama, verilen değeri kullan.',
    'ACOG ile DÖBYR çelişirse iki sütun göster: sb_required vs acog_recommended; birleştirme.',
    'SAT, NT, OGTT, Anti-D, CRL, EDD specialty payload içindedir — çekirdek hasta/vizit tipine yazma.',
    'Tehlike işaretleri (kanama, şiddetli baş ağrısı, görme bozukluğu, epigastrik ağrı, ödem, fetal hareket azalması) hastaya/aileye açıkça yazılır.',
  ],

  specialistReview: [
    { konu: 'Fetal biyometri referansı', neden: 'INTERGROWTH-21st seçildi (açık, resmi tablolar birebir). Türk ulusal referans yok; TMFTP pratiğinde Hadlock da yaygın — hangisi kalacak, hekim kararı. EFW için persentil tablosu gömülmedi (yalnız gram).' },
    { konu: 'Lohusa izlem gün pencereleri', neden: '2-5 / 13-17 / 30-42 gün pencereleri rehberin 2018 baskısıyla birebir doğrulanmalı; 24 saat ve 42. gün kesin.' },
    { konu: 'Anti-D zamanlaması ve dozu', neden: 'Rehber uyarısı var; klinik pratik ve SUT karşılığı doğrulanmalı.' },
    { konu: 'Obstetrik USG raporu ve doğum raporu', neden: 'Gebe İzlem Kartı içinde bölüm olarak var; ayrı resmi şablon gerekiyorsa hekimle biçim belirlenecek.' },
    { konu: 'Menopoz / kontrasepsiyon', neden: 'Danışmanlık çerçevesi ve yöntem kataloğu var (SB AP); klinik karar desteği (HT endikasyonu, yöntem seçimi algoritması) kurulmadı.' },
    { konu: 'Down sendromu/aneuploidi RİSK HESAPLAMASI (kasıtlı olarak kurulmadı)', neden: 'FMF/Astraia sertifikalı, laboratuvara özgü MoM kalibrasyonu gerektirir — bu uygulama yalnız laboratuvarın bildirdiği sonucu kaydeder. Hekim, kurumun kullandığı sertifikalı yazılımı (varsa) entegrasyon için belirtebilir.' },
    { konu: 'Ayşe gebelik haftası farkındalığı', neden: 'promptNotlari tanımlı, SOAP/persona katmanına henüz bağlanmadı (Wave 0 kablolaması ile).' },

    // Kaan'ın 2026-09-14 gece referans listesine (Williams/Berek&Novak/Temel KHD Bilgisi +
    // DÖBYR 2026) göre denetim — bölüm harfleri o listeyle eşleşir. Veri modeli genişletildi
    // (migration 023: D/E/sezaryen geçmişi/çoğul gebelik/risk sınıfı/ilk vizit lab/servikal
    // uzunluk/OGTT/GBS/tehlike işaretleri sütunları var) ama çoğu HENÜZ FORM ALANI OLARAK
    // BAĞLANMADI — bu gece zaman yetmedi, uydurmak yerine dürüstçe işaretlendi.
    { konu: 'A. Hasta modeli — veri sütunları var, form alanları eksik', neden: 'D (ölü doğum)/E (ektopik), önceki sezaryen sayısı/kesi tipi, çoğul gebelik tipi (dikoryonik/monokoryonik), risk sınıfı (düşük/orta/yüksek) migration 023 ile eklendi; başlangıç formuna henüz bağlanmadı.' },
    { konu: 'B. SB Risk Değerlendirme Formu', neden: 'risk_sinifi alanı var (doktor elle seçiyor) ama SB\'nin kendi resmi formunun kriterleri doğrulanıp kod haline getirilmedi.' },
    { konu: 'C. İlk vizit laboratuvar paneli', neden: 'ilk_vizit_lab jsonb sütunu var (hemogram/ferritin/TSH/HBsAg/HIV/VDRL/HCV/idrar kültür/açlık glukoz); form alanı yok.' },
    { konu: 'C. Eksik test alanları', neden: 'Nazal kemik (ikili test), servikal uzunluk (18-22hf USG), OGTT (24-28hf, yapılandırılmış), GBS kültür (35-37hf), Anti-D doz kaydı — veri modelinde/motorda var (nazalKemik, servikalUzunluk, ogtt, gbsKultur, antiDUygulamalari), form alanı yok. Kordosentez ve fetal eko invaziif test seçeneklerine eklendi.' },
    { konu: 'C. Erken gebelik (4-8 hf) takibi', neden: 'β-hCG seri + TVUSG ile canlılık/ektopik/abortus takibi kurulmadı — gebelik kaydı şu an yalnız SAT girilince başlıyor.' },
    { konu: 'C. Geç gebelik fetal iyilik testleri (28+ hf)', neden: 'NST, BPP, umbilikal/MCA Doppler kurulmadı.' },
    { konu: 'C. SUT kodları', neden: 'İkili (P.901.120) ve üçlü (P.904.090) kodları sabit olarak eklendi (lib/clinical/genetikTarama.ts SUT_KODLARI); belgelere henüz basılmıyor.' },
    { konu: 'D. USG görüntü/DICOM depolama', neden: 'Yalnız ölçüm JSON\'u kaydediliyor; gerçek görüntü galerisi, DICOM, e-Nabız/PACS gönderimi, çoğul gebelikte fetus A/B ayrı seri KURULMADI — uygulamanın genel hasta_goruntulemeler tablosu bu amaçla genişletilebilir, henüz yapılmadı.' },
    { konu: 'E. Gebelik aşı şeması (Td doz-sırası, Tdap 27-36hf, grip Eylül-Nisan) ve teratojen uyarı motoru', neden: 'Pediatri Aşılar modülünün gebelik karşılığı henüz yok; şu an yalnız izlem checklist metninde geçiyor, doz-sırası mantığı/hatırlatıcı kurulmadı.' },
    { konu: 'F. Obstetrik acil/risk modülleri (partograf, Bishop skoru, VTE risk skoru, HELLP/eklampsi algoritmaları, IUGR Doppler evreleme, omuz distosisi)', neden: 'KASITLI OLARAK KURULMADI — bunlar doğrulanmış klinik karar algoritmaları gerektirir, bu gece güvenle kaynaklanamadı. Denver II ile aynı ilke: doğrulanmış kaynak yoksa kod yazılmaz.' },
    { konu: 'G. Jinekoloji suiti (PCOS/infertilite/IVF sevk, ürojinekoloji/POP-Q, jinekolojik onkoloji triyaj CA-125/IOTA, cerrahi şablonlar, adölesan jinekoloji, gebe okulu kaydı)', neden: 'KETEM taraması + kontrasepsiyon + menopoz çerçevesi dışında bu bölüm hiç kurulmadı — kapsamı ve önceliği hekimle belirlenecek, muhtemelen ayrı bir "Jinekoloji Vizit" akışı gerektirir.' },
    { konu: 'H. Yasal/sistem entegrasyonu (e-Nabız gebe bildirimi, e-Doğum/Doğum Bildirim Sistemi, küretaj yasal evrak, iş göremezlik raporu)', neden: 'Gerçek devlet sistemi entegrasyonu gerektirir — API erişimimiz yok, taklit edilmedi.' },
    { konu: 'J. Pediatri köprüsü — YAPILDI, doğrulandı', neden: 'Canlı doğum zorunlu bebek kartı açar (029 dogum_olaylari + bebek_kartlari, anne_patient_id bağlı; gebelikler.yenidogan_patient_id). Taburcu paketi + NTP + izlem: lib/clinical/yenidogan, migration 036 (reuses 029 maddeler/yenidogan_tarama jsonb). specialties/pediatri donuk — Bebek kartı surface components/doktor/HastaBebekKarti.' },
  ],

  olgunluk: 'arastirma',
}
