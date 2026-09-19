/**
 * ONKOLOJI-EXCEPTIONAL-01 — Tıbbi Onkoloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Eczane kemoterapi doz motoru,
 * tanı/evre kilidi, uydurma doz ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/onkoloji (engines, prompts lock, OnkolojiHome, araçlar).
 * Kür sayacı / toksisite listesi deterministik motordan gelir; KARAR DESTEĞİDİR.
 * Dahiliye WOW bu chapter'a sızmaz — visibility: onkoloji only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ONKOLOJI_PROFILE: SpecialtyProfile = {
  key: 'onkoloji',
  etiket: 'Onkoloji',
  resmiUnvan: 'Tıbbi Onkoloji',
  // Yetişkin ayaktan tıbbi onkoloji: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'kur-sayac',
      ad: 'Tedavi döngü / kür sayacı (karar desteği, doz değil)',
      kaynak: 'TTOD klinik pratik — kür takibi; doz hekimde',
      motor: 'specialties/onkoloji/engines/kur',
      deterministik: true,
    },
    {
      id: 'toksisite-liste',
      ad: 'Toksisite kontrol listesi (karar desteği)',
      kaynak: 'TTOD güvenlik izlemi — grade/tanı hekimde',
      motor: 'specialties/onkoloji/engines/toksisite',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'onkoloji', etiket: 'Onkoloji', bilesen: 'OnkolojiHome', sira: 15 }],
  goruntu: {
    modaliteler: ['bt', 'mri', 'us', 'foto'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / PET-BT / patoloji notu karar desteğidir; tanı, evre ve doz yazma. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/onkoloji/engines/onkoloji.ts REF_ACIKLAMA (TTOD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/onkoloji/prompts (ONKO-PROMPTS-LOCK): uydurma doz yok, tanı/evre hekim kilidinde, febril nötropeni → 112, Medula e-imza yok.'],
  specialistReview: [
    { konu: 'Kür aralıkları ve protokol etiketleri', neden: 'Protokol seçimi ve doz hekim/eczane sorumluluğunda; Notya yalnız tarih/sayı tutar.' },
    { konu: 'Toksisite grade ve doz değişikliği', neden: 'CTCAE grade ve doz azaltma hekim kararı; liste yalnızca hatırlatma.' },
    { konu: 'SUT endikasyon metni', neden: 'Güncel SUT maddesi ve canlı Medula hekim/entegrasyon; taslak karar desteğidir.' },
    { konu: 'Onkoloji acil yönlendirme metinleri', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // ONKOLOJI-EXCEPTIONAL-01 — "Tedavim" Strong. Nav yolu bilerek /tedavim.
  portal: [{
    id: 'tedavim',
    nav: [{ key: 'tedavim', label: 'Tedavim', path: '/tedavim' }],
    bundleKeys: ['onko'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Tedavim: hekimin belirlediği kontrol / tedavi günü / yan etki hatırlatmaları — tanı, evre, skor ve doz yok.',
      'Kan tahlili ve görüntü hatırlatması hasta-güvenli dilde; sonuç yorumu hekimdedir.',
      'Febril nötropeni / spinal bası / şiddetli nefes darlığında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['TedavimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
