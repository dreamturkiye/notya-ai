import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const LONGEVITY_PROFILE = {
  key: 'longevity',
  etiket: 'Longevity & Wellness',
  resmiUnvan: 'Longevity & Wellness',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'infuzyon', ad: 'Sonraki seans vadesi', kaynak: 'SB IV güvenlik çerçevesi', motor: 'specialties/longevity/engines/long', deterministik: true },
  ],
  sekmeler: [{ id: 'longevity', etiket: 'Longevity', bilesen: 'LongevityHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/longevity/engines/long.ts'],
  promptNotlari: ['IV karışım/doz yok; reaksiyon → 112.'],
  specialistReview: [{ konu: 'IV içerik ve hormon', neden: 'Karışım ve doz hekimdedir.' }],
  portal: [{
    id: 'longevitim',
    nav: [{ key: 'longevitim', label: 'Planım', path: '/longevitim' }],
    bundleKeys: ['longevity'],
    eligibility: 'doctor_specialty',
    copyHints: ['Sonraki seans tarihi — protokol içeriği, doz, tanı yok.', 'IV reaksiyon: 112.'],
    views: ['LongevitimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
