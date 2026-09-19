/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. İnfüzyon süiti HIS,
 * tanı kilidi ve uydurma biyolojik doz bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/romatoloji (engines, prompts lock, RomatolojiHome, araçlar).
 * DAS28/BASDAI bandı deterministik motordan gelir; bant KARAR DESTEĞİDİR.
 * Ortopedi/FTR araçları bu chapter'a sızmaz — visibility: romatoloji only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ROMATOLOJI_PROFILE: SpecialtyProfile = {
  key: 'romatoloji',
  etiket: 'Romatoloji',
  resmiUnvan: 'Romatoloji',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'das28-basdai',
      ad: 'DAS28 / BASDAI (karar desteği, tanı değil)',
      kaynak: 'EULAR/ACR pratik yorumu · TRD',
      motor: 'specialties/romatoloji/engines/das28Basdai',
      deterministik: true,
    },
    {
      id: 'biyolojik-sut',
      ad: 'Biyolojik SUT kontrol listesi',
      kaynak: 'SGK SUT — güncel madde hekim doğrular',
      motor: 'specialties/romatoloji/engines/biyolojikSut',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'romatoloji', etiket: 'Romatoloji', bilesen: 'RomatolojiHome', sira: 15 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/romatoloji/engines/romatoloji.ts REF_ACIKLAMA (TRD, SB, SGK/SUT, EULAR/ACR, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/romatoloji/prompts (ROMA-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, septik artrit → 112, infüzyon HIS core değil.'],
  specialistReview: [
    { konu: 'DAS28 / BASDAI eşikleri', neden: 'EULAR/TRD pratik eşikleri değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Biyolojik SUT maddeleri', neden: 'SUT metni güncellenir; Notya madde numarası kilitlemez.' },
    { konu: 'Romatoloji acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  portal: [{
    id: 'romatizmam',
    nav: [{ key: 'romatizmam', label: 'Romatizmam', path: '/romatizmam' }],
    bundleKeys: ['roma'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Romatizmam: hekimin belirlediği kontrol tarihi, kan tahlili / eklem takip / belge hatırlatmaları — tanı, skor ve doz yok.',
      'Lab hatırlatması "kan tahlili kontrolü" dilinde; sonuç yorumu hekimdedir.',
      'Ateşli sıcak eklem / ani nefes darlığında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['RomatizmamView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
