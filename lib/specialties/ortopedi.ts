/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi ve Travmatoloji registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane planlaması, OR scheduling,
 * cerrahi HIS ve canlı Medula e-imza bu bölümün birincil ürünü DEĞİLDİR.
 *
 * VAS / fonksiyon bantları KARAR DESTEĞİDİR; tanı hekimdedir.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ORTOPEDI_PROFILE: SpecialtyProfile = {
  key: 'ortopedi',
  etiket: 'Ortopedi ve Travmatoloji',
  resmiUnvan: 'Ortopedi ve Travmatoloji',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'vas-fonksiyon',
      ad: 'VAS + mini fonksiyon şiddet bandı (karar desteği, tanı değil)',
      kaynak: 'VAS 0–10; mini fonksiyon 4×0–4; TOTBİD klinik kullanım',
      motor: 'specialties/ortopedi/engines/vasFonksiyon',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'ortopedi', etiket: 'Ortopedi', bilesen: 'OrtopediHome', sira: 14 }],
  goruntu: {
    modaliteler: ['xray', 'mri', 'bt', 'us'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü yorumu ve tanı hekimindir; Notya kırık tipi / kaynama tanısı yazmaz.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/ortopedi/engines/ortopedi.ts REF_ACIKLAMA (TOTBİD, SB, SGK/SUT, TİTCK, VAS)'],
  promptNotlari: ['Tam kilit specialties/ortopedi/prompts (ORTO-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, kompartman / NV / açık kırık → 112.'],
  specialistReview: [
    { konu: 'VAS / fonksiyon madde çevirileri ve şiddet bant etiketleri', neden: 'Türkçe poliklinik ifadeleri uzman hekim sahada doğrulamalı.' },
    { konu: 'Kırık / alçı / ortez izlem kilometre taşları', neden: 'Yük verme ve alçı alma süreleri klinik bağlama göre değişir.' },
    { konu: 'Acil triyaj bayrakları (kompartman, NV, açık kırık, septik, kauda)', neden: 'Acil sevk eşiği klinik bağlam gerektirir.' },
  ],

  portal: [{
    id: 'eklemlerim',
    nav: [{ key: 'eklemlerim', label: 'Eklemlerim', path: '/eklemlerim' }],
    bundleKeys: ['eklem'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Eklemlerim: hekimin belirlediği kontrol tarihi ve hatırlatmalar — tanı, VAS sayı, skor ve doz yok.',
      'Alçı / görüntü hatırlatması "randevu" dilinde; sonuç yorumu hekimdedir.',
      'Kompartman, NV kayıp, açık kırık, ateşli eklem veya kauda bulgularında portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['EklemlerimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
