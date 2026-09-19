/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kalp ve Damar Cerrahisi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane / full OR HIS,
 * tanı kilidi, uydurma antikoagülan dozu ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * kardiyoloji ayrı branş: SCORE2 / Kalbim / HT-KKY BURAYA SIZMAZ (ve tersi).
 *
 * Bölüm dosyaları: specialties/kalp-damar-cerrahisi (engines, prompts lock, KalpDamarHome, araçlar).
 * Pre-op / greft-yara / antikoag vade karar desteğidir; tanı ve doz hekimde.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const KALP_DAMAR_CERRAHISI_PROFILE: SpecialtyProfile = {
  key: 'kalp-damar-cerrahisi',
  etiket: 'Kalp Damar Cer.',
  resmiUnvan: 'Kalp ve Damar Cerrahisi',
  // Yetişkin ayaktan kalp-damar cerrahisi: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'preop-risk',
      ad: 'Pre-op risk checklist (karar desteği, tanı değil)',
      kaynak: 'TKDCD / SB perioperatif hazırlık — checklist; tanı hekimde',
      motor: 'specialties/kalp-damar-cerrahisi/engines/preop',
      deterministik: true,
    },
    {
      id: 'greft-yara-izlem',
      ad: 'Greft / yara izlem (karar desteği)',
      kaynak: 'Türk Damar Cerrahisi / TKDCD greft-yara izlem pratik — tanı hekimde',
      motor: 'specialties/kalp-damar-cerrahisi/engines/greftYara',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'kalp-damar', etiket: 'Kalp Damar Cerrahisi', bilesen: 'KalpDamarHome', sira: 15 }],
  goruntu: {
    modaliteler: ['eko', 'bt', 'ekg', 'us', 'xray'],
    zamanCizgisi: true,
    ayseSinir: 'Damar / kalp görüntüsü karar desteğidir; tanı, evre ve doz yazma. Hekim onayına tabi. OR planı üretme. SCORE2 üretme.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/kalp-damar-cerrahisi/engines/kalp-damar.ts REF_ACIKLAMA (TKDCD, SB, Türk Damar, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/kalp-damar-cerrahisi/prompts (KDC-PROMPTS-LOCK): uydurma antikoagülan doz yok, tanı hekim kilidinde, akut ekstremite iskemisi → 112, OR/HIS yok, SCORE2/Kalbim sızıntısı yok.'],
  specialistReview: [
    { konu: 'Pre-op risk checklist maddeleri', neden: 'Anestezi / kardiyak risk hekim sorumluluğunda; Notya yalnız checklist tutar.' },
    { konu: 'Greft / yara izlem tarihleri', neden: 'Revizyon kararı ve enfeksiyon yönetimi hekimdedir; liste hatırlatmadır.' },
    { konu: 'Antikoagülan vade dili', neden: 'Doz ve INR hedef portala ve araç özetine yazılmaz; yalnız tarihler.' },
    { konu: 'Vasküler acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — "Damar Cerrahisi takibi" Strong. Nav yolu bilerek /damar-cerrahisi-takibi.
  // Kalbim (kardiyoloji) bu modüle bağlanmaz.
  portal: [{
    id: 'damar-cerrahisi-takibi',
    nav: [{ key: 'damar-cerrahisi-takibi', label: 'Damar Cerrahisi takibi', path: '/damar-cerrahisi-takibi' }],
    bundleKeys: ['damarCerrahisi'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Damar Cerrahisi takibi: hekimin belirlediği kontrol, greft/yara ve ilaç izlem hatırlatmaları — tanı, SCORE2 ve doz yok.',
      'SCORE2 / Kalbim / HT-KKY bu modülde yoktur (kardiyoloji ayrı branş).',
      'Ani soğuk ekstremite, greft bölgesinde bol kanama veya yırtıcı göğüs/sırt ağrısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['DamarCerrahisiTakibiView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
