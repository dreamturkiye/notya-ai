/**
 * Deri ve Zührevi Hastalıklar live chapter.
 * Imaging axis + dual-sign Asistan live in specialties/dermatoloji; this file is the registry wrapper.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'
import { DERMATOLOJI_MANIFEST } from '../../specialties/dermatoloji/manifest'

export const DERMATOLOJI_PROFILE: SpecialtyProfile = {
  key: 'dermatoloji',
  etiket: 'Dermatoloji',
  resmiUnvan: 'Deri ve Zührevi Hastalıklar',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'pasi-easi',
      ad: 'PASI / EASI / DLQI skor kaydı',
      kaynak: 'PSOKİD 2025; TDD Atopik Dermatit 2018',
      motor: 'specialties/dermatoloji/engines/score-calculator',
      deterministik: true,
    },
    {
      id: 'gop-isotretinoin',
      ad: 'GÖP isotretinoin paket kontrolü',
      kaynak: 'TİTCK GÖP KÜB',
      motor: 'specialties/dermatoloji/engines/gop-isotretinoin',
      deterministik: true,
    },
    {
      id: 'yama-takvimi',
      ad: 'Kontakt yama D2/D4 takvimi',
      kaynak: 'TDD kontakt dermatit pratiği',
      motor: 'specialties/dermatoloji/engines/patch-calendar',
      deterministik: true,
    },
  ],

  sekmeler: [
    { id: 'deri-lezyon', etiket: 'Deri & Lezyon', bilesen: 'HastaDermatoloji', sira: 13 },
  ],

  goruntu: {
    modaliteler: ['foto', 'dermatoskopi'],
    zamanCizgisi: true,
    ayseSinir: DERMATOLOJI_MANIFEST.imagingCapabilities.asistanVision
      ? 'Tarama desteği, tanı değildir. Doktor onayı gerekir. Asistan taslak okur, uzman onaylar.'
      : 'Görüntü yorumu hekimindir.',
  },

  belgeler: [
    ...BASELINE_BELGELER,
    { id: 'pasi-karti', ad: 'PASI / skor kartı', format: 'rapor' },
  ],

  ekKaynaklar: [
    'Bolognia Dermatology 5 (2024) — gold',
    'Andrews Deri Hastalıkları 14 TR — clinic/atlas',
    'Temel Dermatoloji — ulusal TR',
    'PSOKİD 2025, TDD AD 2018, TUKMOS 2019, SUT 2026, GÖP KÜB',
  ],

  promptNotlari: [
    'Görüntü karar destegidir; tanı koymazsın. Dual-sign: asistan draft, uzman onay.',
    'PASI / Fitzpatrick / MED / GÖP specialty payload içindedir — çekirdek hasta kartına yazma.',
    'KETEM deri kanseri tarama programı değildir.',
  ],

  specialistReview: [
    { konu: 'Lezyon morfoloji sözlüğü', neden: 'Andrews/Bolognia TR karşılıkları hekimle kilitlenmeli.' },
    { konu: 'Biyolojik SUT eşikleri', neden: 'PSOKİD 2025 + SUT 2026 birlikte okunmalı; doz uydurulmaz.' },
  ],

  // SAGLIGIM-PORTAL-REGISTRY / DERM-EXCEPTIONAL-01 — Derim: foto eklendi, hekim tetikli hatırlatmalar
  // (β-hCG vadesi, fototerapi seansı, yama D2/D4, yara-dikiş-biyopsi kontrolü, TBSE), işlem ve seans tarihleri.
  // Başlıklar specialties/dermatoloji/engines/portal-derim (kod → sabit hasta-güvenli başlık) ile üretilir;
  // hekimin klinik görev metni hastaya taşınmaz. Tanı / morfoloji / skor / ilaç dozu yok
  // (.cursor/skills/specialty-hasta-portali).
  portal: [{
    id: 'dermatoloji',
    nav: [{ key: 'derim', label: 'Derim', path: '/derim' }],
    bundleKeys: ['deri'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Fotoğraf yüklendi bildirimi — tanı dili yok',
      'Hatırlatma başlıkları sabit hasta-güvenli metinlerdir; ilaç adı, skor ve doz yazılmaz',
      'Aylık kan testi (β-hCG) vadesi yalnız hekim tedaviyi başlattığında görünür',
      'Fototerapi seansı ve yama D2/D4 tarihleri kliniğin kendi kaydından; J/cm² ve alerjen sonucu yorumu yok',
      'Tüm vücut deri kontrolü (TBSE) vadesi hekimin girdiği son tarihten',
    ],
    views: ['DerimView'],
    // DERM-EXCEPTIONAL-01: hekim tetiklemeli hatırlatma + Derim Strong.
    // MD saha onayı (docs/DERM-MD-BETA.md) ve Boss yazılı onayı gelmeden uzman-dogrulandi YAZILMAZ.
    derinlik: 'Strong',
  }],

  // Bölüm derinliği klinik kullanıma hazır. Uzman doğrulaması bekliyor → beta-hazir.
  olgunluk: 'beta-hazir',
}
