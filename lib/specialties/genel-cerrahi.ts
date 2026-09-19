/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi registry girişi.
 *
 * Ürün kapsamı: ticari AYAKTAN muayenehane / poliklinik. Ameliyathane planlaması, OR scheduling,
 * full surgical HIS, tanı kilidi ve uydurma doz bu bölümün birincil ürünü DEĞİLDİR.
 *
 * Pre-op / yara-dren / patoloji köprüsü KARAR DESTEĞİDİR; tanı hekimdedir.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const GENEL_CERRAHI_PROFILE: SpecialtyProfile = {
  key: 'genel-cerrahi',
  etiket: 'Genel Cerrahi',
  resmiUnvan: 'Genel Cerrahi',
  pediatrikBaglam: 'asla',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    {
      id: 'preop-checklist',
      ad: 'Pre-op checklist (karar desteği, tanı değil)',
      kaynak: 'SB ameliyathane güvenliği / TCD klinik pratik',
      motor: 'specialties/genel-cerrahi/engines/preop',
      deterministik: true,
    },
    {
      id: 'yara-dren',
      ad: 'Yara / dren izlem (karar desteği)',
      kaynak: 'TCD cerrahi alan izlem pratikleri',
      motor: 'specialties/genel-cerrahi/engines/yaraDren',
      deterministik: true,
    },
  ],

  sekmeler: [{ id: 'genel-cerrahi', etiket: 'Genel Cerrahi', bilesen: 'GenelCerrahiHome', sira: 14 }],
  goruntu: {
    modaliteler: ['us', 'bt', 'xray', 'mri'],
    zamanCizgisi: true,
    ayseSinir: 'Görüntü / patoloji notu karar desteğidir; tanı ve doz yazma. Hekim onayına tabi.',
  },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/genel-cerrahi/engines/genel-cerrahi.ts REF_ACIKLAMA (TCD, SB, TKRCD, UTACD, SGK/SUT, TİTCK)'],
  promptNotlari: ['Tam kilit specialties/genel-cerrahi/prompts (GC-PROMPTS-LOCK): uydurma doz yok, tanı hekim kilidinde, akut karın / GI kanama → 112, OR/HIS yok.'],
  specialistReview: [
    { konu: 'Pre-op checklist maddeleri ve antikoagülan planı', neden: 'İlaç kesme / köprüleme hekim sorumluluğunda; Notya yalnız checkbox tutar.' },
    { konu: 'Yara / dren izlem ve dikiş alma süreleri', neden: 'Klinik bağlama göre değişir; enfeksiyon tanısı hekimde.' },
    { konu: 'Patoloji rapor yorumu', neden: 'Belge köprüsü tanı yazmaz; patoloji sonucu hekim kilidinde.' },
    { konu: 'Acil triyaj bayrakları', neden: 'Ayaktan muayenehanede acil yönlendirme dili hekim onayı gerektirir.' },
  ],

  portal: [{
    id: 'ameliyatim',
    nav: [{ key: 'ameliyatim', label: 'Ameliyatım', path: '/ameliyatim' }],
    bundleKeys: ['gc'],
    eligibility: 'doctor_specialty',
    copyHints: [
      'Ameliyatım: hekimin belirlediği kontrol / işlem / yara hatırlatmaları — tanı, skor ve doz yok.',
      'Patoloji / görüntü hatırlatması "rapor takibi" dilinde; sonuç yorumu hekimdedir.',
      'Akut karın, bol kanama, sıkışmış fıtık veya ameliyat sonrası kötüleşmede portal mesajı beklenmez: 112 veya en yakın acil.',
    ],
    views: ['AmeliyatimView'],
    derinlik: 'Strong',
  }],

  olgunluk: 'beta-hazir',
}
