import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const MEDIKAL_ESTETIK_PROFILE = {
  key: 'medikal-estetik',
  etiket: 'Medikal Estetik',
  resmiUnvan: 'Medikal Estetik',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'soguma', ad: 'Onam / soğuma kaydı', kaynak: 'Ayakta Teşhis yönetmeliği', motor: 'specialties/medikal-estetik/engines/estetik', deterministik: true },
    { id: 'takvim', ad: 'İşlem sonrası kontrol takvimi', kaynak: 'TR medikal estetik bakım ritüeli', motor: 'specialties/medikal-estetik/engines/estetik', deterministik: true },
  ],
  sekmeler: [{ id: 'medikal-estetik', etiket: 'Medikal Estetik', bilesen: 'MedikalEstetikHome', sira: 14 }],
  goruntu: { modaliteler: ['foto'], zamanCizgisi: true, ayseSinir: 'Önce/sonra foto karar desteği; doz ve tanı hekimde.' },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/medikal-estetik/engines/estetik.ts'],
  promptNotlari: ['Ünite/mL uydurma yok; vasküler oklüzyon → 112.'],
  specialistReview: [{ konu: 'Hyaluronidaz ve ünite', neden: 'Komplikasyon ve doz hekimdedir.' }],
  portal: [{
    id: 'estetik-bakimim',
    nav: [{ key: 'estetik-bakimim', label: 'Bakımım', path: '/estetik-bakimim' }],
    bundleKeys: ['medikalEstetik'],
    eligibility: 'doctor_specialty',
    copyHints: ['Bakım tarihleri — ürün, ünite, tanı yok.', 'Görme kaybı / livedo: 112.'],
    views: ['EstetikBakimimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
