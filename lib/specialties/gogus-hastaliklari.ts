/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs Hastalıkları (gogus-hastaliklari) registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Tam SFT cihaz entegrasyonu,
 * tanı auto-lock, uydurma doz ve göğüs cerrahisi / toraks OR (gogus-cerrahisi ayrı branş) KAPSAM DIŞI.
 *
 * Bölüm dosyaları: specialties/gogus-hastaliklari (engines, prompts lock, GogusHome, araçlar).
 * CAT/mMRC/GOLD grubu deterministik motordan gelir; KARAR DESTEĞİDİR (brans-alan-sizmasi + doz kilidi).
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const GOGUS_HASTALIKLARI_PROFILE: SpecialtyProfile = {
  key: 'gogus-hastaliklari',
  etiket: 'Göğüs',
  resmiUnvan: 'Göğüs Hastalıkları',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'cat-mmrc-gold',
      ad: 'CAT / mMRC ve GOLD ABE grubu (karar desteği, tanı değil)',
      kaynak: 'GOLD mMRC/CAT eşikleri; TTD klinik kullanım',
      motor: 'specialties/gogus-hastaliklari/engines/catMmrc',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'gogus', etiket: 'Göğüs', bilesen: 'GogusHome', sira: 15 }],
  goruntu: {
    modaliteler: ['xray', 'bt'],
    zamanCizgisi: false,
    ayseSinir: 'Akciğer görüntüsü karar desteğidir; pnömoni / kitle / pnömotoraks tanısı koyma. Toraks cerrahisi planı önerme.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/gogus-hastaliklari/engines/gogus.ts REF_ACIKLAMA (TTD, GOLD, GINA, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/gogus-hastaliklari/prompts (GOGUS-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, masif hemoptizi / hipoksi → 112. gogus-cerrahisi sızıntısı yok.'],
  specialistReview: [
    { konu: 'CAT madde çevirileri ve mMRC etiketleri', neden: 'Türkçe klinik kullanım TTD/GOLD ile uyumlu olmalı; uzman hekim sahada doğrulamalı.' },
    { konu: 'USOT / nebulizatör SUT kontrol listesi', neden: 'SUT ve medikal malzeme mevzuatı değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Astım/KOAH aksiyon planı hasta dili', neden: 'Yeşil/sarı/kırmızı bölge metinleri doz içermemeli; uzman onaylar.' },
  ],

  portal: [{
    id: 'akcigerlerim',
    nav: [{ key: 'akcigerlerim', label: 'Akciğerlerim', path: '/akcigerlerim' }],
    bundleKeys: ['akciger'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Akciğerlerim: hekimin belirlediği kontrol tarihi, solunum testi ve inhaler teknik hatırlatmaları — tanı, CAT/mMRC skoru ve doz yok.',
      'Test hatırlatması "randevu" dilinde; sonuç yorumu hekimdedir.',
      'Bol kanlı balgam, belirgin nefes darlığı veya ani göğüs ağrısında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['AkcigerlerimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
