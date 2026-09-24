import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const SAC_EKIMI_PROFILE = {
  key: 'sac-ekimi',
  etiket: 'Saç Ekimi',
  resmiUnvan: 'Saç Ekimi',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'greft', ad: 'Donör greft bandı (karar desteği)', kaynak: 'SB uygulayıcı sertifikası + TPRECD', motor: 'specialties/sac-ekimi/engines/sac', deterministik: true },
    { id: 'yikama', ad: 'Yıkama / kontrol takvimi', kaynak: 'TR ayaktan saç ekimi bakım ritüeli', motor: 'specialties/sac-ekimi/engines/sac', deterministik: true },
  ],
  sekmeler: [{ id: 'sac-ekimi', etiket: 'Saç Ekimi', bilesen: 'SacEkimiHome', sira: 14 }],
  goruntu: { modaliteler: ['foto'], zamanCizgisi: true, ayseSinir: 'Saç fotoğrafı karar desteğidir; greft sayısı ve tanı hekimde.' },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['lib/klinik/klinikTurkishRefs.ts KLINIK_TURKISH_REFS.sac-ekimi (SB sertifika, TPRECD, EPCD, Ayakta Teşhis, SGK iddia yok)'],
  promptNotlari: ['Greft/doz uydurma yok; nekroz/anafilaksi → 112.'],
  specialistReview: [
    { konu: 'Greft bandı ve hairline', neden: 'Donor kapasite ve çizgi hekim / uygulayıcı kararıdır.' },
  ],
  portal: [{
    id: 'sacim',
    nav: [{ key: 'sacim', label: 'Saçım', path: '/sacim' }],
    bundleKeys: ['sac'],
    eligibility: 'doctor_specialty',
    copyHints: ['Yıkama ve kontrol tarihleri — greft, tanı, ilaç yok.', 'Kızarıklık+ateş veya nefes darlığında portal beklenmez: 112.'],
    views: ['SacimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
