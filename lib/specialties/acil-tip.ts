/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp registry girişi.
 *
 * Ürün kapsamı: ticari acil tıp / acil servis klinik akışı. Full ED bed board HIS,
 * yatış boarding HIS, tanı auto-lock, uydurma doz ve canlı Medula e-imza bu bölümün
 * birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/acil-tip (engines, prompts lock, AcilTipHome, araçlar).
 * Kardiyoloji STEMI / nöroloji İnme tile'ları bu chapter'a sızmaz — visibility: acil-tip only.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ACIL_TIP_PROFILE: SpecialtyProfile = {
  key: 'acil-tip',
  etiket: 'Acil Tıp',
  resmiUnvan: 'Acil Tıp',
  // Yetişkin / karma acil servis: baş çevresi / Neyzi / sağlam çocuk içeriği asla girmez.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'esi-triyaj',
      ad: 'ESI triyaj seviyesi (karar desteği, tanı değil)',
      kaynak: 'ESI / TATD · SB acil triaj — seviye hekim kilidinde',
      motor: 'specialties/acil-tip/engines/esi',
      deterministik: true,
    },
    {
      id: 'kritik-yol',
      ad: 'Kritik yol checklist (STEMI / inme / travma bayrak)',
      kaynak: 'TATD / SB kritik yol — bayrak karar desteği; tanı hekimde',
      motor: 'specialties/acil-tip/engines/kritikYol',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'acil', etiket: 'Acil Tıp', bilesen: 'AcilTipHome', sira: 16 }],
  goruntu: {
    modaliteler: ['xray', 'bt', 'us', 'ekg'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / EKG köprüsü zaman çizelgesidir; tanı yazılmaz. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/acil-tip/engines/acilTip.ts REF_ACIKLAMA (TATD, SB, ERC, ATLS, SGK)'],
  promptNotlari: ['Tam kilit specialties/acil-tip/prompts (ACIL-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, bed board/HIS yok, resus/hava yolu → hemen eylem.'],
  specialistReview: [
    { konu: 'ESI seviye etiketleri ve kaynak bayrakları', neden: 'Triyaj eşiği klinik bağlam gerektirir; Notya tanı yazmaz.' },
    { konu: 'Kritik yol checklist maddeleri (STEMI/inme/travma)', neden: 'Yol bayrağı karar desteğidir; tanı ve doz hekimde.' },
    { konu: 'Sevk / yatış paket taslağı', neden: 'Boarding HIS ve yatak panosu kapsam dışı; paket yalnız madde/tarih.' },
    { konu: 'Taburcu / acil sonrası portal dili', neden: 'ED hastalarında uzun portal döngüsü yok; hasta-güvenli hatırlatma.' },
  ],

  // ACIL-TIP-EXCEPTIONAL-01 — "Acil sonrası takip" Strong. Nav yolu bilerek /acil-sonrasi.
  portal: [{
    id: 'acil-sonrasi',
    nav: [{ key: 'acil-sonrasi', label: 'Acil sonrası takip', path: '/acil-sonrasi' }],
    bundleKeys: ['acilSonrasi'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Acil sonrası takip: hekimin belirlediği kontrol / taburcu hatırlatmaları — tanı, skor ve doz yok.',
      'ED hastalarında uzun portal döngüsü yoktur; Strong ama dürüst (kısa takip).',
      'Ani kötüleşme / nefes darlığı / göğüs ağrısı / bilinç değişikliğinde portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['AcilSonrasiView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
