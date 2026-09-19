/**
 * NOROLOJI-EXCEPTIONAL-01 — Nöroloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. İnme ünitesi / inpatient stroke HIS,
 * tanı kilidi ve uydurma doz bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/noroloji (engines, prompts lock, NorolojiHome, araçlar).
 * MIDAS bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const NOROLOJI_PROFILE: SpecialtyProfile = {
  key: 'noroloji',
  etiket: 'Nöroloji',
  resmiUnvan: 'Nöroloji',
  // Yetişkin ayaktan nöroloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'midas',
      ad: 'MIDAS migren engellilik bandı (karar desteği, tanı değil)',
      kaynak: 'MIDAS (Stewart ve ark.); TR klinik kullanım; TND',
      motor: 'specialties/noroloji/engines/migren',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'noroloji', etiket: 'Nöroloji', bilesen: 'NorolojiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/noroloji/engines/noroloji.ts REF_ACIKLAMA (TND, TBDHD, SB, SGK/SUT, TİTCK, MIDAS)'],
  promptNotlari: ['Tam kilit specialties/noroloji/prompts (NORO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, inme/TIA → 112.'],
  specialistReview: [
    { konu: 'MIDAS Türkçe madde metinleri', neden: 'Klinik kullanımda yerleşik TR ifadeler; uzman hekim sahada doğrulamalı.' },
    { konu: 'AED izlem lab aralıkları', neden: 'KÜB ve klinik pratik değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'İnme / TIA acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // NOROLOJI-EXCEPTIONAL-01 — "Nörolojimm" Strong. Nav yolu bilerek /norolojim.
  portal: [{
    id: 'norolojim',
    nav: [{ key: 'norolojim', label: 'Nörolojimm', path: '/norolojim' }],
    bundleKeys: ['noro'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Nörolojimm: hekimin belirlediği kontrol tarihi, form ve ilaç güvenlik hatırlatmaları — tanı, skor ve doz yok.',
      'Form hatırlatması "doldurmanız istenen form" dilinde; sonuç yorumu hekimdedir.',
      'Yüz kayması / konuşma bozukluğu / ani güç kaybında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['NorolojimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
