/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon Hastalıkları registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Hastane enfeksiyon kontrolü
 * full HIS, tanı kilidi ve uydurma antibiyotik dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/enfeksiyon-hastaliklari (engines, prompts lock, EnfeksiyonHome, araçlar).
 * Visibility: enfeksiyon-hastaliklari only — NOT dahiliye, NOT pediatri, NOT kardiyoloji, NOT göğüs.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ENFEKSIYON_HASTALIKLARI_PROFILE: SpecialtyProfile = {
  key: 'enfeksiyon-hastaliklari',
  etiket: 'Enfeksiyon Hastalıkları',
  resmiUnvan: 'Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji',
  // Yetişkin ayaktan enfeksiyon: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'atb-sure',
      ad: 'Antibiyotik süre sayacı (karar desteği, doz yok)',
      kaynak: 'SB Akılcı Antibiyotik Kullanımı; KLİMİK klinik pratik',
      motor: 'specialties/enfeksiyon-hastaliklari/engines/atbSure',
      deterministik: true,
    },
    {
      id: 'viral-izlem',
      ad: 'HIV / viral izlem vadeleri (karar desteği, tanı değil)',
      kaynak: 'SB HIV / viral hepatit klinik protokolleri; KLİMİK',
      motor: 'specialties/enfeksiyon-hastaliklari/engines/viralIzlem',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'enfeksiyon', etiket: 'Enfeksiyon', bilesen: 'EnfeksiyonHome', sira: 15 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/enfeksiyon-hastaliklari/engines/enfeksiyon.ts REF_ACIKLAMA (KLİMİK, SB Akılcı ATB, SB HIV/TB/hepatit, SGK/SUT)'],
  promptNotlari: ['Tam kilit specialties/enfeksiyon-hastaliklari/prompts (ENFEKSIYON-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, sepsis/menenjit → 112, hastane HIS core değil.'],
  specialistReview: [
    { konu: 'ATB süre / kontrol tarihleri', neden: 'Klinik süre hekim kararı; Notya doz veya rejim invent etmez.' },
    { konu: 'HIV / viral izlem aralıkları', neden: 'SB/KLİMİK eşikleri ve klinik pratik değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'İzolasyon / bildirim hatırlatmaları', neden: 'Bildirim yükümlülüğü ve izolasyon tipi hekim/kurum kararıdır; full HIS out.' },
    { konu: 'Enfeksiyon acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // ENFEKSIYON-EXCEPTIONAL-01 — "Enfeksiyon Takibim" Strong. Nav yolu bilerek /enfeksiyon-takibim.
  portal: [{
    id: 'enfeksiyon-takibim',
    nav: [{ key: 'enfeksiyon-takibim', label: 'Enfeksiyon Takibim', path: '/enfeksiyon-takibim' }],
    bundleKeys: ['enfeksiyon'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Enfeksiyon Takibim: hekimin belirlediği kontrol, izolasyon bitiş, ilaç süre ve kan tahlili hatırlatmaları — tanı, skor ve doz yok.',
      'Viral izlem hatırlatması "kan tahlili kontrolü" dilinde; sonuç yorumu hekimdedir.',
      'Yüksek ateş, bilinç değişikliği, boyun sertliği veya yaygın döküntüde portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['EnfeksiyonTakibimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
