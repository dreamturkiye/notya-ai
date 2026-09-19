/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aile Hekimliği registry girişi.
 *
 * Ürün kapsamı: ticari BİRİNCİ BASAMAK / aile hekimliği muayenehanesi. Tam ulusal AHIS,
 * tanı kilidi ve uydurma doz bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/aile-hekimligi (engines, prompts lock, AileHome, araçlar).
 * Aşı/tarama ve kronik izlem vadeleri karar desteğidir (brans-alan-sizmasi + doz kilidi).
 * pediatrikBaglam: cocuk-hastada — Baş Çevresi yalnız bilinen çocuk hastada; yetişkinde sızmaz.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER, PEDIATRIK_OLCUMLER } from './profile'

export const AILE_HEKIMLIGI_PROFILE: SpecialtyProfile = {
  key: 'aile-hekimligi',
  etiket: 'Aile Hekimliği',
  resmiUnvan: 'Aile Hekimliği',
  // Karma pratik: çocuk hastada pediatrik ölçümler açılır; yetişkinde Baş Çevresi / Neyzi asla.
  // 18 yaş altı hastada veli / yasal temsilci dili yaşa göre ayrıca açılır (veliDiliMi — VELI-YASAL-ONAM).
  pediatrikBaglam: 'cocuk-hastada',

  // cocuk-hastada: profil PEDIATRIK_OLCUMLER taşır; notOlcumleri / bransKapsami pediatrikBaglamMi ile süzer
  // (yetişkinde Baş Çevresi sızmaz). BASELINE alone left children without baş çevresi (brans-sizmasi).
  olcumler: [...BASELINE_OLCUMLER, ...PEDIATRIK_OLCUMLER],

  hesaplayicilar: [
    {
      id: 'asi-tarama-paket',
      ad: 'Aşı / tarama paketi vade hatırlatması (karar desteği)',
      kaynak: 'SB Ulusal Aşılama Takvimi + SB birinci basamak tarama rehberleri; TAHUD',
      motor: 'specialties/aile-hekimligi/engines/asiTarama',
      deterministik: true,
    },
    {
      id: 'kronik-paket',
      ad: 'Kronik paket (DM/HT) izlem vadesi (karar desteği, doz yok)',
      kaynak: 'SB Aile Hekimliği kronik hastalık protokolleri; TAHUD',
      motor: 'specialties/aile-hekimligi/engines/kronik',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'aile-hekimligi', etiket: 'Aile Hekimliği', bilesen: 'AileHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/aile-hekimligi/engines/aile.ts REF_ACIKLAMA (TAHUD, SB, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/aile-hekimligi/prompts (AILE-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, göğüs ağrısı / inme bayrağı → 112.'],
  specialistReview: [
    { konu: 'Aşı/tarama paket listesi ve varsayılan aralıklar', neden: 'SB takvim ve tarama aralıkları değişir; hekim güncel uygulamayı teyit eder.' },
    { konu: 'Kronik DM/HT izlem görevleri', neden: 'Protokol aralıkları ve lab paneli hekim saha pratiğine göre doğrulanmalı.' },
    { konu: 'Sevk / acil yönlendirme metinleri', neden: 'Birinci basamakta acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  // AILE-HEKIMLIGI-EXCEPTIONAL-01 — "Sağlık Paketim" Strong. Nav yolu bilerek /saglik-paketim.
  portal: [{
    id: 'saglik-paketim',
    nav: [{ key: 'saglik-paketim', label: 'Sağlık Paketim', path: '/saglik-paketim' }],
    bundleKeys: ['aile'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Sağlık Paketim: hekimin belirlediği kontrol, aşı/tarama ve kronik takip hatırlatmaları — tanı, skor ve doz yok.',
      'Hatırlatmalar "randevu" dilinde; sonuç yorumu hekimdedir.',
      'Göğüs ağrısı / ani nefes darlığı / bilinç değişikliğinde portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['SaglikPaketimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
