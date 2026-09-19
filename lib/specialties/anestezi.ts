/**
 * ANESTEZI-EXCEPTIONAL-01 — Anesteziyoloji ve Reanimasyon registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN / poliklinik pre-op değerlendirme. Ameliyathane OR
 * anestezi makinesi HIS, tanı kilidi ve uydurma ilaç dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/anestezi (engines, prompts lock, AnesteziHome, araçlar).
 * Genel cerrahi / göğüs cerrahisi bu chapter'a sızmaz — visibility: anestezi only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ANESTEZI_PROFILE: SpecialtyProfile = {
  key: 'anestezi',
  etiket: 'Anestezi',
  resmiUnvan: 'Anesteziyoloji ve Reanimasyon',
  // Yetişkin ayaktan anestezi: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'asa-preop',
      ad: 'ASA / pre-op checklist (karar desteği)',
      kaynak: 'TARD / ASA — pre-op değerlendirme; tanı/doz hekimde',
      motor: 'specialties/anestezi/engines/asa',
      deterministik: true,
    },
    {
      id: 'hava-yolu-notu',
      ad: 'Hava yolu notu (bayrak/tarih; doz değil)',
      kaynak: 'TARD zor havayolu — teknik/doz hekimde',
      motor: 'specialties/anestezi/engines/havaYolu',
      deterministik: true,
    },
    {
      id: 'postop-agri',
      ad: 'Post-op ağrı izlem (skor; mg doz değil)',
      kaynak: 'TARD perioperatif ağrı — doz hekimde',
      motor: 'specialties/anestezi/engines/agri',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'anestezi', etiket: 'Anestezi', bilesen: 'AnesteziHome', sira: 15 }],
  goruntu: {
    modaliteler: ['xray', 'bt', 'us'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / belge köprüsü zaman çizelgesidir; tanı yazılmaz. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/anestezi/engines/anestezi.ts REF_ACIKLAMA (TARD, SB, SGK, TİTCK, ASA)'],
  promptNotlari: ['Tam kilit specialties/anestezi/prompts (ANESTEZI-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, OR anestezi makinesi HIS yok, zor hava yolu/anafilaksi → 112.'],
  specialistReview: [
    { konu: 'ASA/pre-op checklist maddeleri', neden: 'Anestezi planı ve ilaç dozu hekim sorumluluğunda; Notya yalnız madde/tarih tutar.' },
    { konu: 'Hava yolu bayrak dili', neden: 'Tanı ve entübasyon tekniği hekim kararı; bayrak yalnızca izlem hatırlatması.' },
    { konu: 'Post-op ağrı skoru', neden: 'Analjezik doz hekimde; skor yalnız izlem.' },
    { konu: 'Anestezi acil yönlendirme metinleri', neden: 'Ayaktan / poliklinikte acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // ANESTEZI-EXCEPTIONAL-01 — "Anestezi Öncesi" Strong. Nav yolu bilerek /anestezi-oncesi.
  portal: [{
    id: 'anestezi-oncesi',
    nav: [{ key: 'anestezi-oncesi', label: 'Anestezi Öncesi', path: '/anestezi-oncesi' }],
    bundleKeys: ['anestezi'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Anestezi Öncesi: hekimin belirlediği kontrol / pre-op / hava yolu hatırlatmaları — tanı, skor yorumu ve doz yok.',
      'Açlık ve ilaç listesi hatırlatması hasta-güvenli dilde; talimat hekimdedir.',
      'Zor nefes alma / ciddi alerji / ani göğüs ağrısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['AnesteziOncesiView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
