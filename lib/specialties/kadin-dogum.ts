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
  ],

  sekmeler: [
    { id: 'gebelik-takibi', etiket: 'Gebelik Takibi', bilesen: 'HastaGebelik', sira: 12 },
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
    { konu: 'Fetal biyometri persentilleri', neden: 'Doğrulanmış açık referans tablosu gömülmeden hesaplanmıyor — hangi referans (Hadlock / INTERGROWTH-21st / TR serisi) kullanılacak?' },
    { konu: 'Anti-D zamanlaması ve dozu', neden: 'Rehber uyarısı var; klinik pratik ve SUT karşılığı doğrulanmalı.' },
    { konu: 'Gebe İzlem Kartı ve USG raporu formatları', neden: 'Belge tanımları var, basılı şablonlar henüz üretilmedi.' },
    { konu: 'Lohusa izlem ve jinekoloji (KETEM HPV/smear, menstrüel/kontrasepsiyon, menopoz)', neden: 'Henüz kurulmadı; kapsam ve öncelik hekimle belirlenecek.' },
    { konu: 'Sağlığım portalında "Gebeliğim" görünümü', neden: 'Planlandı, kurulmadı.' },
  ],

  olgunluk: 'arastirma',
}
