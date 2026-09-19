/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuk Cerrahisi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN çocuk cerrahisi muayenehanesi / poliklinik.
 * Ameliyathane planlama / OR scheduling / full HIS, tanı kilidi ve uydurma doz KAPSAM DIŞI.
 *
 * Pediatri DEĞİL: SpecialtyKey `cocuk-cerrahisi`. Büyüme eğrileri / Neyzi / Hedef Boy
 * chapter içeriği olarak monte EDİLMEZ. Baş çevresi vitals'ta PEDIATRIK_BAGLAM her-zaman
 * ile kalır (ölçüm); büyüme studio / M-CHAT sekmeleri ozelBolumBransi ile kesilir.
 * Veli dili yaşa göre (veliDiliMi) — her branşta <18.
 *
 * Visibility: cocuk-cerrahisi only — NOT pediatri, NOT genel-cerrahi, NOT ortopedi.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER, PEDIATRIK_OLCUMLER } from './profile'

export const COCUK_CERRAHISI_PROFILE: SpecialtyProfile = {
  key: 'cocuk-cerrahisi',
  etiket: 'Çocuk Cerrahisi',
  resmiUnvan: 'Çocuk Cerrahisi',
  // Klinik bağlam: çocuk hastada baş çevresi vitals OK. Neyzi / büyüme studio / Hedef Boy chapter YOK.
  // Veli hitabı yaşa göre (veliDiliMi) — branştan bağımsız.
  pediatrikBaglam: 'her-zaman',

  olcumler: [...BASELINE_OLCUMLER, ...PEDIATRIK_OLCUMLER],

  hesaplayicilar: [
    {
      id: 'prepost-op-checklist',
      ad: 'Pre/post-op izlem checklist (karar desteği)',
      kaynak: 'Çocuk Cerrahisi Derneği / SB cerrahi güvenlik — tarih + madde; tanı/doz hekimde',
      motor: 'specialties/cocuk-cerrahisi/engines/prepost',
      deterministik: true,
    },
    {
      id: 'yara-dren-izlem',
      ad: 'Yara / dren izlem — pediatrik cerrahi ofis (karar desteği)',
      kaynak: 'Ayaktan yara/dren takip; enfeksiyon tanısı ve antibiyotik dozu hekimde',
      motor: 'specialties/cocuk-cerrahisi/engines/yaraDren',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'cocuk-cerrahisi', etiket: 'Çocuk Cerrahisi', bilesen: 'CocukCerrahisiHome', sira: 16 }],
  goruntu: {
    modaliteler: ['us', 'xray', 'bt', 'mri', 'foto'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / yara foto karar desteğidir; tanı ve doz yazılmaz. Hekim onayına tabi. Pediatri Neyzi/büyüme sızmaz.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/cocuk-cerrahisi/engines/cocuk-cerrahisi.ts REF_ACIKLAMA (ÇCD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: [
    'Tam kilit specialties/cocuk-cerrahisi/prompts (CC-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, akut karın/strangüle fıtık → 112, OR/HIS yok, Neyzi/Hedef Boy/büyüme chapter yok, veli dili yaşa göre.',
  ],
  specialistReview: [
    { konu: 'Pre/post-op checklist maddeleri ve kontrol aralıkları', neden: 'İşlem tipine göre değişir; Notya yalnız hekim işaretlerini tutar.' },
    { konu: 'Veli / yasal temsilci onam checklist (yaş)', neden: 'Yazılı onam klinik süreçtedir; liste hatırlatmadır. Reşit hastada veli maddesi açılmaz.' },
    { konu: 'Yara / dren pediatrik ofis izlem', neden: 'Enfeksiyon tanısı ve antibiyotik dozu hekim kararıdır.' },
    { konu: 'Acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // COCUK-CERRAHISI-EXCEPTIONAL-01 — "Çocuğumun Cerrahisi" Strong.
  portal: [{
    id: 'cocugumun-cerrahisi',
    nav: [{ key: 'cocugumun-cerrahisi', label: 'Çocuğumun Cerrahisi', path: '/cocugumun-cerrahisi' }],
    bundleKeys: ['cc'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Çocuğumun Cerrahisi: hekimin belirlediği kontrol / yara / işlem hatırlatmaları — tanı, skor ve doz yok.',
      'Veli / yasal temsilci dili hasta yaşına göredir; portal tanı yazmaz.',
      'Şiddetli karın ağrısı + ateş/kusma, sıkışmış fıtık veya ameliyat sonrası kötüleşmede portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['CocugumunCerrahisiView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
