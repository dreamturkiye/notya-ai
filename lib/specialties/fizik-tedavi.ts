/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Fiziksel Tıp ve Rehabilitasyon registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Tam hastane rehabilitasyon HIS,
 * tanı kilidi ve uydurma ilaç dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/fizik-tedavi (engines, prompts lock, FtrHome, araçlar).
 * VAS/ODI bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const FIZIK_TEDAVI_PROFILE: SpecialtyProfile = {
  key: 'fizik-tedavi',
  etiket: 'Fizik Tedavi',
  resmiUnvan: 'Fiziksel Tıp ve Rehabilitasyon',
  // Yetişkin ayaktan FTR: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'vas-odi',
      ad: 'VAS / ODI bandı (karar desteği, tanı değil)',
      kaynak: 'VAS klinik kullanım; ODI (Fairbank); TFTRD / TR klinik kullanım',
      motor: 'specialties/fizik-tedavi/engines/vasOdi',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'fizik-tedavi', etiket: 'FTR', bilesen: 'FtrHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/fizik-tedavi/engines/fizik-tedavi.ts REF_ACIKLAMA (TFTRD, SB, SGK/SUT, VAS, ODI)'],
  promptNotlari: ['Tam kilit specialties/fizik-tedavi/prompts (FTR-PROMPTS-LOCK): uydurma ilaç dozu yok, tanı hekim kilidinde, cauda/kırık → 112.'],
  specialistReview: [
    { konu: 'ODI Türkçe madde metinleri', neden: 'Klinik kullanımda yerleşik TR ifadeler; uzman hekim sahada doğrulamalı.' },
    { konu: 'SGK FTR seans üst sınırları ve rapor şablonları', neden: 'SUT ve rapor mevzuatı değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Cauda / enfeksiyon acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // FIZIK-TEDAVI-EXCEPTIONAL-01 — "FTR'm" Strong. Nav yolu bilerek /ftrm.
  portal: [{
    id: 'ftrm',
    nav: [{ key: 'ftrm', label: "FTR'm", path: '/ftrm' }],
    bundleKeys: ['ftr'],
    eligibility: 'doctor_specialty',
    copyHints: [
      "FTR'm: hekimin belirlediği kontrol tarihi, seans ve egzersiz hatırlatmaları — tanı, skor ve doz yok.",
      'Form hatırlatması "doldurmanız istenen form" dilinde; sonuç yorumu hekimdedir.',
      'Cauda / ilerleyici güç kaybı / ateşli bel ağrısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['FtrmView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
