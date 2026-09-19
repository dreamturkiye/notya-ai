/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN görüntüleme / raporlama. Full PACS / RIS / HIS,
 * AI otomatik tanı ve uydurma bulgu bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Bölüm dosyaları: specialties/radyoloji (engines, prompts lock, RadyolojiHome, araçlar).
 * Visibility: radyoloji only — NOT dahiliye, NOT onkoloji, NOT göğüs.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const RADYOLOJI_PROFILE: SpecialtyProfile = {
  key: 'radyoloji',
  etiket: 'Radyoloji',
  resmiUnvan: 'Radyoloji',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'tetkik-kuyruk',
      ad: 'Tetkik kuyruğu / öncelik (karar desteği)',
      kaynak: 'TRD klinik pratik — kuyruk; PACS/tanı hekimde',
      motor: 'specialties/radyoloji/engines/kuyruk',
      deterministik: true,
    },
    {
      id: 'birads-rapor',
      ad: 'Yapılandırılmış rapor taslağı (BI-RADS-style; otomatik tanı değil)',
      kaynak: 'ACR BI-RADS / TRD — kategori hekim seçer',
      motor: 'specialties/radyoloji/engines/rapor',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'radyo', etiket: 'Radyoloji', bilesen: 'RadyolojiHome', sira: 15 }],
  goruntu: {
    modaliteler: ['xray', 'bt', 'mri', 'us', 'mamografi'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / belge köprüsü zaman çizelgesidir; AI tanı ve uydurma bulgu yazılmaz. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/radyoloji/engines/radyoloji.ts REF_ACIKLAMA (TRD, SB, TAEK, SGK, ACR/TR)'],
  promptNotlari: ['Tam kilit specialties/radyoloji/prompts (RADYO-PROMPTS-LOCK): AI tanı yok, uydurma bulgu yok, PACS/RIS/HIS yok, BI-RADS hekim seçer, kritik → klinisyen/112.'],
  specialistReview: [
    { konu: 'BI-RADS kategori seçimi', neden: 'Otomatik tanı değildir; kategori ve rapor dili hekim sorumluluğunda.' },
    { konu: 'Kritik bulgu bildirim dili', neden: 'Tanı AI üretmez; hekim işaretler ve klinisyene bildirir.' },
    { konu: 'Kuyruk / öncelik etiketleri', neden: 'PACS/RIS yok; yalnız muayenehane kuyruk kaydı.' },
    { konu: 'Portal Tetkiklerim hasta dili', neden: 'Durum/tarih yalnız; BI-RADS sayı ve tanı sızmaz.' },
  ],

  portal: [{
    id: 'tetkiklerim',
    nav: [{ key: 'tetkiklerim', label: 'Tetkiklerim', path: '/tetkiklerim' }],
    bundleKeys: ['radyo'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Tetkiklerim: hekimin belirlediği tetkik / rapor / kontrol tarihleri — tanı, BI-RADS sayı ve AI bulgu yok.',
      'Durum etiketleri hasta-güvenli (Bekliyor / Çekildi / Rapor hazır); sonuç yorumu hekimdedir.',
      'Ciddi kontrast reaksiyonu veya çekim sırasında ani solunum / bilinç değişikliğinde portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['TetkiklerimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
