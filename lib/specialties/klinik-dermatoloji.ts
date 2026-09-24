import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const KLINIK_DERMATOLOJI_PROFILE = {
  key: 'klinik-dermatoloji',
  etiket: 'Dermatoloji (Klinik)',
  resmiUnvan: 'Dermatoloji (Klinik)',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'lazer', ad: 'Lazer seans vadesi', kaynak: 'TR ayaktan lazer bakım ritüeli', motor: 'specialties/klinik-dermatoloji/engines/derm', deterministik: true },
    { id: 'akne', ad: 'Akne bakım takvimi', kaynak: 'TR poliklinik bakım ritüeli (tanı değil)', motor: 'specialties/klinik-dermatoloji/engines/derm', deterministik: true },
  ],
  sekmeler: [{ id: 'klinik-dermatoloji', etiket: 'Klinik Dermatoloji', bilesen: 'KlinikDermHome', sira: 14 }],
  goruntu: { modaliteler: ['foto'], zamanCizgisi: true, ayseSinir: 'Lazer/akne foto karar desteği; tanı ve fluence hekimde. TUS Derim değil.' },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['lib/klinik/klinikTurkishRefs.ts KLINIK_TURKISH_REFS.klinik-dermatoloji (Ayakta Teşhis, TDD kozmetik, TİTCK lazer, SGK lazer iddia yok — TUS Derim değil)'],
  promptNotlari: ['Morfoloji/skor/ICD yok; TUS dermatoloji araçları açılmaz; 112.'],
  specialistReview: [{ konu: 'Lazer parametresi', neden: 'Fluence ve endikasyon hekimdedir.' }],
  portal: [{
    id: 'klinik-derim',
    nav: [{ key: 'klinik-derim', label: 'Bakımım', path: '/klinik-derim' }],
    bundleKeys: ['klinikDerm'],
    eligibility: 'doctor_specialty',
    copyHints: ['Seans ve bakım tarihleri — tanı, skor, fluence yok.', 'Kabarcık / görme / nefes: 112.'],
    views: ['KlinikDerimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
