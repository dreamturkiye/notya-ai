/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Tam endoskopi suite / HIS,
 * tanı kilidi ve uydurma antiviral / PPI / biyolojik dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/gastroenteroloji (engines, prompts lock, GastroenterolojiHome, araçlar).
 * IBD/IBS skor ve HBV/HCV bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR.
 * Dahiliye FIB-4 / GGK araçları bu chapter'a sızmaz — visibility: gastroenteroloji only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const GASTROENTEROLOJI_PROFILE: SpecialtyProfile = {
  key: 'gastroenteroloji',
  etiket: 'Gastroenteroloji',
  resmiUnvan: 'Gastroenteroloji',
  // Yetişkin ayaktan gastroenteroloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'ibd-ibs-skor',
      ad: 'IBD / IBS skor takip (karar desteği, tanı değil)',
      kaynak: 'TGD IBD / IBS klinik kullanım',
      motor: 'specialties/gastroenteroloji/engines/ibdIbs',
      deterministik: true,
    },
    {
      id: 'hbv-hcv-izlem',
      ad: 'HBV / HCV izlem aralığı (karar desteği)',
      kaynak: 'TKAD / SB hepatit B/C izlem',
      motor: 'specialties/gastroenteroloji/engines/hbvHcv',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'gastroenteroloji', etiket: 'Gastroenteroloji', bilesen: 'GastroenterolojiHome', sira: 16 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/gastroenteroloji/engines/gastroenteroloji.ts REF_ACIKLAMA (TGD, TKAD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/gastroenteroloji/prompts (GASTRO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, GI kanama → 112, endoskopi HIS core değil.'],
  specialistReview: [
    { konu: 'IBD / IBS skor eşikleri', neden: 'TGD / Roma eşikleri ve klinik pratik değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'HBV / HCV izlem aralıkları', neden: 'Viral yük ve fibroz bağlamı hekim kararı; Notya antiviral doz yazmaz.' },
    { konu: 'GI acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // GASTROENTEROLOJI-EXCEPTIONAL-01 — "Sindirimim" Strong. Nav yolu bilerek /sindirimim.
  portal: [{
    id: 'sindirimim',
    nav: [{ key: 'sindirimim', label: 'Sindirimim', path: '/sindirimim' }],
    bundleKeys: ['gastro'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Sindirimim: hekimin belirlediği kontrol tarihi, takip formu / kan tahlili / endoskopi hatırlatmaları — tanı, skor ve doz yok.',
      'Takip formu hatırlatması "doldurmanız istenen form" dilinde; sonuç yorumu hekimdedir.',
      'Kanlı kusma / siyah dışkı / ani şiddetli karın ağrısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['SindirimimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
