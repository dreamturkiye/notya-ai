/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane / full OR HIS,
 * tanı kilidi, uydurma doz ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * gogus-hastaliklari (pulmonoloji) ayrı branş: CAT/mMRC/GOLD/inhaler/Akciğerlerim BURAYA SIZMAZ.
 *
 * Bölüm dosyaları: specialties/gogus-cerrahisi (engines, prompts lock, GogusCerrahiHome, araçlar).
 * Pre-op / tüp-yara / patoloji köprü karar desteğidir; tanı ve doz hekimde.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const GOGUS_CERRAHISI_PROFILE: SpecialtyProfile = {
  key: 'gogus-cerrahisi',
  etiket: 'Göğüs Cer.',
  resmiUnvan: 'Göğüs Cerrahisi',
  // Yetişkin ayaktan toraks cerrahisi: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'preop-solunum',
      ad: 'Pre-op solunum checklist (karar desteği, tanı değil)',
      kaynak: 'TGCD / SB toraks cerrahi hazırlık — checklist; tanı hekimde',
      motor: 'specialties/gogus-cerrahisi/engines/preop',
      deterministik: true,
    },
    {
      id: 'tup-yara-izlem',
      ad: 'Toraks tüp / yara izlem (karar desteği)',
      kaynak: 'TGCD tüp torakostomi / yara izlem pratik — tanı hekimde',
      motor: 'specialties/gogus-cerrahisi/engines/tupYara',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'gogus-cerrahisi', etiket: 'Göğüs Cerrahisi', bilesen: 'GogusCerrahiHome', sira: 15 }],
  goruntu: {
    modaliteler: ['xray', 'bt', 'mri'],
    zamanCizgisi: true,
    ayseSinir: 'Toraks görüntüsü / patoloji notu karar desteğidir; tanı, evre ve doz yazma. Hekim onayına tabi. OR planı üretme.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/gogus-cerrahisi/engines/gogus-cerrahisi.ts REF_ACIKLAMA (TGCD, SB, TTD cerrahi, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/gogus-cerrahisi/prompts (GC-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, tansiyon pnömotoraks / masif hemotoraks → 112, OR/HIS yok, CAT/mMRC/Akciğerlerim sızıntısı yok.'],
  specialistReview: [
    { konu: 'Pre-op solunum checklist maddeleri', neden: 'SFT / anestezi hazırlık hekim/anestezi sorumluluğunda; Notya yalnız checklist tutar.' },
    { konu: 'Toraks tüp çekim / yara izlem tarihleri', neden: 'Çekim kararı ve enfeksiyon yönetimi hekimdedir; liste hatırlatmadır.' },
    { konu: 'Patoloji köprü dili', neden: 'Tanı / ICD portala ve araç özetine yazılmaz; yalnız "rapor hazır" tarihleri.' },
    { konu: 'Toraks acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // GOGUS-CERRAHISI-EXCEPTIONAL-01 — "Göğüs Cerrahisi takibi" Strong. Nav yolu bilerek /gogus-cerrahisi-takibim.
  portal: [{
    id: 'gogus-cerrahisi-takibim',
    nav: [{ key: 'gogus-cerrahisi-takibim', label: 'Göğüs Cerrahisi takibi', path: '/gogus-cerrahisi-takibim' }],
    bundleKeys: ['gogusCerrahi'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Göğüs Cerrahisi takibi: hekimin belirlediği kontrol, tüp/yara ve patoloji rapor hatırlatmaları — tanı, skor ve doz yok.',
      'CAT/mMRC / inhaler / Akciğerlerim bu modülde yoktur (gogus-hastaliklari ayrı branş).',
      'Ani nefes darlığı, tek taraflı göğüs ağrısı veya bol kanlı balgamda portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['GogusCerrahiTakibimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
