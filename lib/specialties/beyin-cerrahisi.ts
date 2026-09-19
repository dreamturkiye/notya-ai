/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin ve Sinir Cerrahisi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane OR / full HIS,
 * tanı kilidi ve uydurma AED dozu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/beyin-cerrahisi (engines, prompts lock, BeyinCerrahisiHome, araçlar).
 * Nöroloji Migren/İnme bu chapter'a sızmaz — visibility: beyin-cerrahisi only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const BEYIN_CERRAHISI_PROFILE: SpecialtyProfile = {
  key: 'beyin-cerrahisi',
  etiket: 'Beyin Cerrahisi',
  resmiUnvan: 'Beyin ve Sinir Cerrahisi',
  // Yetişkin ayaktan nöroşirürji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'postop-checklist',
      ad: 'Nöro post-op checklist (karar desteği)',
      kaynak: 'TND klinik pratik — post-op izlem; tanı/doz hekimde',
      motor: 'specialties/beyin-cerrahisi/engines/postop',
      deterministik: true,
    },
    {
      id: 'bilinc-izlem',
      ad: 'Nöbet / bilinç izlem (tarih/bayrak; doz değil)',
      kaynak: 'TND / SB — bilinç izlemi; AED dozu hekimde',
      motor: 'specialties/beyin-cerrahisi/engines/bilinc',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'beyin', etiket: 'Beyin Cerrahisi', bilesen: 'BeyinCerrahisiHome', sira: 15 }],
  goruntu: {
    modaliteler: ['bt', 'mri', 'xray'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / belge köprüsü zaman çizelgesidir; tanı yazılmaz. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/beyin-cerrahisi/engines/beyin.ts REF_ACIKLAMA (TND, SB, SGK, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/beyin-cerrahisi/prompts (BC-PROMPTS-LOCK): uydurma AED doz yok, tanı hekim kilidinde, OR/HIS yok, ani bilinç → 112.'],
  specialistReview: [
    { konu: 'Post-op checklist maddeleri', neden: 'Cerrahi protokol ve ilaç dozu hekim sorumluluğunda; Notya yalnız madde/tarih tutar.' },
    { konu: 'Nöbet/bilinç bayrak dili', neden: 'Tanı ve AED doz hekim kararı; bayrak yalnızca izlem hatırlatması.' },
    { konu: 'Görüntü belge köprüsü', neden: 'Tanı yorumu hekimde; köprü yalnız tarih/etiket/belge id.' },
    { konu: 'Nöroşirürji acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // BEYIN-CERRAHISI-EXCEPTIONAL-01 — "Beyin Cerrahisi takibi" Strong. Nav yolu bilerek /beyin-takibi.
  portal: [{
    id: 'beyin-takibi',
    nav: [{ key: 'beyin-takibi', label: 'Beyin Cerrahisi takibi', path: '/beyin-takibi' }],
    bundleKeys: ['beyin'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Beyin Cerrahisi takibi: hekimin belirlediği kontrol / post-op / görüntü hatırlatmaları — tanı, skor ve doz yok.',
      'Görüntü ve belge hatırlatması hasta-güvenli dilde; sonuç yorumu hekimdedir.',
      'Ani bilinç kaybı / yeni güçsüzlük / yara sızıntısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['BeyinTakibiView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
