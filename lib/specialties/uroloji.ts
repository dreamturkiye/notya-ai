/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane planlaması, cerrahi HIS
 * ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * IPSS / PSA bantları KARAR DESTEĞİDİR; tanı hekimdedir.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const UROLOJI_PROFILE: SpecialtyProfile = {
  key: 'uroloji',
  etiket: 'Üroloji',
  resmiUnvan: 'Üroloji',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'ipss',
      ad: 'IPSS-7 semptom şiddet bandı (karar desteği, tanı değil)',
      kaynak: 'International Prostate Symptom Score; TÜD klinik kullanım',
      motor: 'specialties/uroloji/engines/ipss',
      deterministik: true,
    },
    {
      id: 'psa',
      ad: 'PSA ng/mL izlem bandı (karar desteği, tanı değil)',
      kaynak: 'PSA izlem eşikleri; kanser tanısı değildir — hekim yorumu',
      motor: 'specialties/uroloji/engines/psa',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'uroloji', etiket: 'Üroloji', bilesen: 'UrolojiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/uroloji/engines/uroloji.ts REF_ACIKLAMA (TÜD, SB, SGK/SUT, TİTCK, IPSS, PSA)'],
  promptNotlari: ['Tam kilit specialties/uroloji/prompts (URO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, hematüri / retansiyon / torsiyon → 112.'],
  specialistReview: [
    { konu: 'IPSS madde çevirileri ve şiddet bant etiketleri', neden: 'Türkçe poliklinik ifadeleri uzman hekim sahada doğrulamalı.' },
    { konu: 'PSA izlem eşikleri ve hız yorumu', neden: 'Yaş / risk faktörü eşikleri değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Acil triyaj bayrakları (hematüri, retansiyon, torsiyon, priapizm)', neden: 'Acil sevk eşiği klinik bağlam gerektirir.' },
  ],

  portal: [{
    id: 'urolojim',
    nav: [{ key: 'urolojim', label: 'Ürolojimm', path: '/urolojim' }],
    bundleKeys: ['uro'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Ürolojimm: hekimin belirlediği kontrol tarihi ve hatırlatmalar — tanı, PSA sayı, IPSS skor ve doz yok.',
      'Test hatırlatması "randevu" dilinde; sonuç yorumu hekimdedir.',
      'İdrarda kan, idrar yapamama, yan ağrısı+ateş, torsiyon veya travmada portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['UrolojimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
