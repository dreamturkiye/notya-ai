/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. CGM cihaz entegrasyonu,
 * tanı kilidi ve uydurma insülin dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/endokrinoloji (engines, prompts lock, EndokrinolojiHome, araçlar).
 * HbA1c/TSH bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR.
 * Dahiliye DM araçları bu chapter'a sızmaz — visibility: endokrinoloji only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ENDOKRINOLOJI_PROFILE: SpecialtyProfile = {
  key: 'endokrinoloji',
  etiket: 'Endokrinoloji',
  resmiUnvan: 'Endokrinoloji ve Metabolizma Hastalıkları',
  // Yetişkin ayaktan endokrinoloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'hba1c-izlem',
      ad: 'HbA1c izlem aralığı (karar desteği, tanı değil)',
      kaynak: 'TEMD Diyabetes Mellitus Tanı-Tedavi-İzlem Kılavuzu',
      motor: 'specialties/endokrinoloji/engines/labIzlem',
      deterministik: true,
    },
    {
      id: 'dxa-tekrar',
      ad: 'DXA tekrar aralığı (karar desteği)',
      kaynak: 'TEMD Osteoporoz ve Metabolik Kemik Hastalıkları Kılavuzu',
      motor: 'specialties/endokrinoloji/engines/dxa',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'endokrinoloji', etiket: 'Endokrinoloji', bilesen: 'EndokrinolojiHome', sira: 15 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/endokrinoloji/engines/endokrinoloji.ts REF_ACIKLAMA (TEMD DM/Tiroid/OP, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/endokrinoloji/prompts (ENDO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, ciddi hipoglisemi/DKA → 112, CGM core değil.'],
  specialistReview: [
    { konu: 'HbA1c / TSH izlem aralıkları', neden: 'TEMD eşikleri ve klinik pratik değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'DXA tekrar aralıkları', neden: 'Risk bandı hekim kararı; T-skor yorumu Notya üretmez.' },
    { konu: 'Endokrin acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // ENDOKRINOLOJI-EXCEPTIONAL-01 — "Hormonlarım" Strong. Nav yolu bilerek /hormonlarim.
  portal: [{
    id: 'hormonlarim',
    nav: [{ key: 'hormonlarim', label: 'Hormonlarım', path: '/hormonlarim' }],
    bundleKeys: ['endo'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Hormonlarım: hekimin belirlediği kontrol tarihi, kan tahlili / kemik testi / rejim hatırlatmaları — tanı, skor ve doz yok.',
      'Lab hatırlatması "kan tahlili kontrolü" dilinde; sonuç yorumu hekimdedir.',
      'Ciddi hipoglisemi / DKA / tiroid fırtınasında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['HormonlarimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
