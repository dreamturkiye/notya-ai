/**
 * PSIK-EXCEPTIONAL-01 — Ruh Sağlığı ve Hastalıkları (psikiyatri) registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Kapalı servis, istemsiz yatış yönetimi,
 * adli psikiyatri kurul işlemleri bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/psikiyatri (engines, prompts lock, PsikiyatriHome, araçlar).
 * Ölçekler (PHQ-9 / GAD-7 / CGI) deterministik motorlardan gelir; şiddet bandı KARAR DESTEĞİDİR,
 * DSM-5-TR tanısı ve ilaç/doz kararı hekimdedir (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const PSIKIYATRI_PROFILE: SpecialtyProfile = {
  key: 'psikiyatri',
  etiket: 'Psikiyatri',
  resmiUnvan: 'Ruh Sağlığı ve Hastalıkları',
  // Yetişkin ayaktan psikiyatri: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    { id: 'phq9', ad: 'PHQ-9 depresyon şiddeti (karar desteği, tanı değil)', kaynak: 'Kroenke & Spitzer PHQ-9; TR geçerlilik (Sarı ve ark.); TPD klinik kullanım', motor: 'specialties/psikiyatri/engines/phq9', deterministik: true },
    { id: 'gad7', ad: 'GAD-7 yaygın anksiyete şiddeti (karar desteği, tanı değil)', kaynak: 'Spitzer ve ark. GAD-7; TR geçerlilik (Konkan ve ark.); TPD klinik kullanım', motor: 'specialties/psikiyatri/engines/gad7', deterministik: true },
  ],

  sekmeler: [{ id: 'psikiyatri', etiket: 'Psikiyatri', bilesen: 'PsikiyatriHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/psikiyatri/engines/psikiyatri.ts REF_ACIKLAMA (TPD, DSM-5-TR, SGK/SUT, SB)'],
  promptNotlari: ['Tam kilit specialties/psikiyatri/prompts (PSIK-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, özkıyım → 112/acil.'],
  specialistReview: [
    { konu: 'PHQ-9 / GAD-7 Türkçe madde metinleri', neden: 'Klinik kullanımda yerleşik TR ifadeler; uzman hekim sahada doğrulamalı.' },
    { konu: 'Yeşil / turuncu reçete ve psikotrop rapor kontrol listesi', neden: 'SUT ve reçete mevzuatı değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Risk / güvenlik akışı metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // PSIK-EXCEPTIONAL-01 — "Ruh Sağlığım" Strong. Nav yolu bilerek /ruhsagligim: dahiliye Takibim'in
  // /takibim yolu ile çakışmaz (her modülün yolu tekil).
  portal: [{
    id: 'psikiyatri',
    nav: [{ key: 'ruhsagligim', label: 'Ruh Sağlığım', path: '/ruhsagligim' }],
    bundleKeys: ['psik'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Ruh Sağlığım: hekimin belirlediği kontrol tarihi, ölçek ve ilaç hatırlatmaları — tanı, skor ve doz yok.',
      'Ölçek hatırlatması "doldurmanız istenen form" dilinde; sonuç yorumu hekimdedir.',
      'Kendine zarar / yaşamı sonlandırma düşüncesinde portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['RuhSagligimView', 'TakibimPsikView'],
    derinlik: 'Strong',
  }],

  // Ürün derinliği Strong + sentetik testler yeşil; uzman-dogrulandi için gerçek psikiyatri
  // poliklinik haftası gerekir (docs/PSIK-MD-BETA.md).
  olgunluk: 'beta-hazir',
}
