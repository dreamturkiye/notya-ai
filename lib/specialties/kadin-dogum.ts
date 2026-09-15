/**
 * NOTYA-KHD-01 — Kadın Hastalıkları ve Doğum chapter (research-built 2026-09-14, to be revised
 * with Dr. Gökhan Mamur, 3000+ deliveries). Sources: SB Doğum Öncesi Bakım Yönetim Rehberi
 * (2018), SB Lohusa İzlem Protokolü, SB Riskli Gebelikler Yönetim Rehberi, SB serviks kanseri
 * HPV bazlı tarama programı; TJOD (Türk Jinekoloji ve Obstetrik Derneği) kılavuzları (depth).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

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
  ],

  goruntu: {
    modaliteler: ['us', 'foto'],
    zamanCizgisi: true,
    ayseSinir: 'Obstetrik USG görüntüsünde yalnız görünen yapıları ve ölçüm değerlerini tarif edersin; gebelik yaşı, persentil veya anomali YORUMU yapmazsın — bunlar hekimindir.',
  },

  belgeler: [
    ...BASELINE_BELGELER,
    { id: 'gebe-izlem-karti', ad: 'Gebe İzlem Kartı (SB)', format: 'rapor' },
    { id: 'usg-raporu', ad: 'Obstetrik USG Raporu', format: 'rapor' },
    { id: 'dogum-raporu', ad: 'Doğum Raporu', format: 'rapor' },
  ],

  ekKaynaklar: [
    'T.C. SB HSGM — Doğum Öncesi Bakım Yönetim Rehberi (2018)',
    'T.C. SB — Lohusa İzlem Protokolü',
    'T.C. SB — Riskli Gebelikler Yönetim Rehberi',
    'T.C. SB — Serviks Kanseri Taramaları HPV Bazlı Program (KETEM)',
    'TJOD kılavuzları (derinlik)',
  ],

  promptNotlari: [
    'Gebelik haftası, TDT ve trimester sunucuda hesaplanır — kendin hesaplama, verilen değeri kullan.',
    'Gebelikte ilaç güvenliği: her reçete önerisinde gebelik/emzirme uyumunu belirt.',
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
  ],

  olgunluk: 'arastirma',
}
