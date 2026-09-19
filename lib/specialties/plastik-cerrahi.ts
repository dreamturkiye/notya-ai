/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik Rekonstrüktif Estetik Cerrahi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. OR scheduling / full HIS,
 * tanı auto-lock ve uydurma doz bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/plastik-cerrahi (engines, prompts lock, PlastikHome, araçlar).
 * Yara/greft / foto / onam deterministik motordan gelir; KARAR DESTEĞİDİR.
 * Dermatoloji ve genel cerrahi bu chapter'a sızmaz — visibility: plastik-cerrahi only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const PLASTIK_CERRAHI_PROFILE: SpecialtyProfile = {
  key: 'plastik-cerrahi',
  etiket: 'Plastik Cerrahi',
  resmiUnvan: 'Plastik, Rekonstrüktif ve Estetik Cerrahi',
  // Yetişkin ayaktan plastik: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'yara-greft-izlem',
      ad: 'Yara / greft izlem (karar desteği, tanı değil)',
      kaynak: 'TPRECD klinik pratik — tarih/bölge; tanı hekimde',
      motor: 'specialties/plastik-cerrahi/engines/yara',
      deterministik: true,
    },
    {
      id: 'foto-zaman-cizgisi',
      ad: 'Foto zaman çizgisi köprü (AI tanı yok)',
      kaynak: 'TPRECD — tarih+etiket; morfoloji/skor yazılmaz',
      motor: 'specialties/plastik-cerrahi/engines/foto',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'plastik', etiket: 'Plastik', bilesen: 'PlastikHome', sira: 15 }],
  goruntu: {
    modaliteler: ['foto', 'us', 'xray', 'mri'],
    zamanCizgisi: true,
    ayseSinir: 'Klinik foto / görüntü karar desteğidir; tanı ve doz yazma. Hekim onayına tabi. PASI/derm skor sızmaz.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/plastik-cerrahi/engines/plastik.ts REF_ACIKLAMA (TPRECD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/plastik-cerrahi/prompts (PLASTIK-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, flep/hematom → 112, OR/HIS yok, derm skor sızmaz.'],
  specialistReview: [
    { konu: 'Pansuman / dikiş alma aralıkları', neden: 'Protokol üniteye göre değişir; Notya yalnız hekimin girdiği tarihleri tutar.' },
    { konu: 'Flep / greft acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
    { konu: 'Onam checklist maddeleri', neden: 'Yazılı onam ve KVKK foto izni klinik süreçtedir; liste hatırlatmadır.' },
    { konu: 'Estetik vs rekonstrüktif hasta dili', neden: 'Portal tanı/endikasyon yazmaz; genel yara/kontrol hatırlatması kullanılır.' },
  ],

  // PLASTIK-CERRAHI-EXCEPTIONAL-01 — "Yaram" Strong. Nav yolu bilerek /yaram.
  portal: [{
    id: 'yaram',
    nav: [{ key: 'yaram', label: 'Yaram', path: '/yaram' }],
    bundleKeys: ['plastik'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Yaram: hekimin belirlediği pansuman / dikiş / foto / kontrol hatırlatmaları — tanı, skor ve doz yok.',
      'Foto yüklendi / kontrol hatırlatması hasta-güvenli dilde; morfoloji ve tanı hekimdedir.',
      'Flep renk değişikliği / hematom / yüksek ateşte portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['YaramView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
