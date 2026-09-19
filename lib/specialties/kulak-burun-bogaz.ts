/**
 * KBB-EXCEPTIONAL-01 — Kulak Burun Boğaz Hastalıkları (kulak-burun-bogaz) registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane planlaması, cerrahi HIS ve
 * koklear implant cerrahi iş akışı bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/kulak-burun-bogaz (engines, prompts lock, KbbHome, araçlar).
 * Odyometri PTA bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR, işitme kaybı tanısı ve
 * kayıp tipi (iletim / sensorinöral / mikst) hekimdedir (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const KULAK_BURUN_BOGAZ_PROFILE: SpecialtyProfile = {
  key: 'kulak-burun-bogaz',
  etiket: 'KBB',
  resmiUnvan: 'Kulak Burun Boğaz Hastalıkları',
  // Erişkin + çocuk karışık ayaktan KBB pratiği: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'odyometri-pta',
      ad: 'Odyometri saf ses ortalaması (PTA) bandı (karar desteği, tanı değil)',
      kaynak: 'Yerleşik odyolojik şiddet sınıflaması (0,5/1/2/4 kHz hava yolu ortalaması); TKBBD klinik kullanım',
      motor: 'specialties/kulak-burun-bogaz/engines/odyometri',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'kbb', etiket: 'KBB', bilesen: 'KbbHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/kulak-burun-bogaz/engines/kbb.ts REF_ACIKLAMA (TKBBD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/kulak-burun-bogaz/prompts (KBB-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, ani işitme kaybı / kanama / hava yolu → 112.'],
  specialistReview: [
    { konu: 'Otoskopi ve burun muayenesi bulgu listeleri', neden: 'Türkçe muayene ifadeleri poliklinikte yerleşiktir; uzman hekim sahada doğrulamalı.' },
    { konu: 'İşitme cihazı ve odyolojik tetkik SUT kontrol listesi', neden: 'SUT ve medikal malzeme mevzuatı değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Vestibüler manevra kayıt alanları ve santral şüphesi işaretleri', neden: 'Manevra uygulama ve santral ayrım kararı hekim onayı gerektirir.' },
  ],

  // KBB-EXCEPTIONAL-01 — "Kulaklarım" Strong. Nav yolu bilerek /kulaklarim: dahiliye /takibim,
  // psikiyatri /ruhsagligim ve göz /gozlerim yollarıyla çakışmaz (her modülün yolu tekil).
  portal: [{
    id: 'kulaklarim',
    nav: [{ key: 'kulaklarim', label: 'Kulaklarım', path: '/kulaklarim' }],
    bundleKeys: ['kulak'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Kulaklarım: hekimin belirlediği kontrol tarihi, işitme testi ve işlem hatırlatmaları — tanı, dB değeri ve doz yok.',
      'Test hatırlatması "randevu" dilinde; sonuç yorumu hekimdedir.',
      'Ani işitme kaybı, durmayan burun kanaması veya nefes darlığında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['KulaklarimView'],
    derinlik: 'Strong',
  }],

  // Ürün derinliği Strong + sentetik testler yeşil; uzman-dogrulandi için gerçek KBB
  // poliklinik haftası gerekir (docs/KBB-MD-BETA.md).
  olgunluk: 'beta-hazir',
}
