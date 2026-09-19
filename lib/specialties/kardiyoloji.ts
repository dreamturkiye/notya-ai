/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji (kardiyoloji) registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Cath lab planlama, invaziv laboratuvar
 * HIS ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/kardiyoloji (engines, prompts lock, KardioHome, araçlar).
 * SCORE2 bandı deterministik ESC motorundan gelir; bant KARAR DESTEĞİDİR, tanı ve doz hekimdedir
 * (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const KARDIOLOJI_PROFILE: SpecialtyProfile = {
  key: 'kardiyoloji',
  etiket: 'Kardiyoloji',
  resmiUnvan: 'Kardiyoloji',
  // Erişkin ayaktan kardiyoloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'score2',
      ad: 'SCORE2 / KV risk bandı (karar desteği, tanı değil)',
      kaynak: 'ESC 2021 SCORE2 (ehab309) — Türkiye yüksek risk bölgesi; TKD / ESC klinik kullanım',
      motor: 'specialties/kardiyoloji/engines/score2',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'kardiyoloji', etiket: 'Kardiyoloji', bilesen: 'KardioHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/kardiyoloji/engines/kardiyoloji.ts REF_ACIKLAMA (TKD, ESC/TKD, SGK/SUT, SB, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/kardiyoloji/prompts (KARDIO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, göğüs ağrısı / bayılma → 112.'],
  specialistReview: [
    { konu: 'SCORE2 girdi alanları ve kova dili', neden: 'ESC tabloları doğrulanmış dahiliye motorundan gelir; kardiyoloji saha ifadeleri uzman hekim doğrulamalı.' },
    { konu: 'HT / KKY izlem kontrol listesi ve SGK kardiyo rapor şablonları', neden: 'SUT ve rapor mevzuatı değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Acil göğüs ağrısı / AKS yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // KARDIO-EXCEPTIONAL-01 — "Kalbim" Strong. Nav yolu bilerek /kalbim: dahiliye /takibim,
  // psikiyatri /ruhsagligim, KBB /kulaklarim yollarıyla çakışmaz.
  portal: [{
    id: 'kalbim',
    nav: [{ key: 'kalbim', label: 'Kalbim', path: '/kalbim' }],
    bundleKeys: ['kalp'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Kalbim: hekimin belirlediği kontrol tarihi, tansiyon/kalp izlem ve belge hatırlatmaları — tanı, risk skoru ve doz yok.',
      'Ölçüm hatırlatması "randevu" dilinde; sonuç yorumu hekimdedir.',
      'Göğüs baskısı, ani nefes darlığı veya bayılmada portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['KalbimView'],
    derinlik: 'Strong',
  }],

  // Ürün derinliği Strong + sentetik testler yeşil; uzman-dogrulandi için gerçek kardiyoloji
  // poliklinik haftası gerekir (docs/KARDIO-MD-BETA.md).
  olgunluk: 'beta-hazir',
}
