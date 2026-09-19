/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefroloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Tam diyaliz makinesi HIS,
 * tanı kilidi ve uydurma ESA dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/nefroloji (engines, prompts lock, NefrolojiHome, araçlar).
 * eGFR/KDIGO bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR.
 * Dahiliye CKD araçları bu chapter'a sızmaz — visibility: nefroloji only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const NEFROLOJI_PROFILE: SpecialtyProfile = {
  key: 'nefroloji',
  etiket: 'Nefroloji',
  resmiUnvan: 'Nefroloji',
  // Yetişkin ayaktan nefroloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'egfr-kdigo',
      ad: 'eGFR / KDIGO ısı haritası (karar desteği, tanı değil)',
      kaynak: 'Türk Nefroloji Derneği · KDIGO uyarlaması',
      motor: 'specialties/nefroloji/engines/egfr',
      deterministik: true,
    },
    {
      id: 'anemi-ckd',
      ad: 'Anemi-CKD izlem aralığı (karar desteği; ESA dozu yok)',
      kaynak: 'TND / KDIGO anemi ilkeleri — doz hekimde',
      motor: 'specialties/nefroloji/engines/anemi',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'nefroloji', etiket: 'Nefroloji', bilesen: 'NefrolojiHome', sira: 15 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/nefroloji/engines/nefroloji.ts REF_ACIKLAMA (TND, SB KBH/diyaliz, KDIGO uyarlama, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/nefroloji/prompts (NEF-PROMPTS-LOCK): uydurma ESA dozu yok, tanı hekim kilidinde, hiperkalemi/aşırı sıvı → 112, diyaliz makinesi HIS core değil.'],
  specialistReview: [
    { konu: 'KDIGO G×A izlem aralıkları', neden: 'TND uyarlaması ve klinik pratik değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Anemi-CKD / ESA karar eşikleri', neden: 'Hb bandı karar desteği; ESA dozu Notya üretmez.' },
    { konu: 'Nefro acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // NEFROLOJI-EXCEPTIONAL-01 — "Böbreklerim" Strong. Nav yolu bilerek /bobreklerim.
  portal: [{
    id: 'bobreklerim',
    nav: [{ key: 'bobreklerim', label: 'Böbreklerim', path: '/bobreklerim' }],
    bundleKeys: ['nef'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Böbreklerim: hekimin belirlediği kontrol tarihi, kan tahlili / diyaliz seans / anemi hatırlatmaları — tanı, skor ve doz yok.',
      'Lab hatırlatması "kan tahlili kontrolü" dilinde; eGFR sayısı ve KDIGO evresi portala geçmez.',
      'Ani nefes darlığı, göğüs ağrısı, şiddetli halsizlik veya bilinç bulanıklığında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['BobreklerimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
