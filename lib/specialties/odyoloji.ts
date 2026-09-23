import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ODYLOJI_PROFILE = {
  key: 'odyoloji',
  etiket: 'Odyoloji',
  resmiUnvan: 'Odyoloji',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'pta', ad: 'Saf ses eşik kaydı (tanı değil)', kaynak: 'TR odyoloji derneği / saf ses ortalaması', motor: 'specialties/odyoloji/engines/odyo', deterministik: true },
  ],
  sekmeler: [{ id: 'odyoloji', etiket: 'Odyoloji', bilesen: 'OdyolojiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['lib/klinik/klinikTurkishRefs.ts KLINIK_TURKISH_REFS.odyoloji (29.03.2025, TOKSUD, Odyologlar Derneği, SB tarama, SGK cihaz hekim raporu — KBB değil)'],
  promptNotlari: ['İşitme kaybı tanısı yok; ani kayıp → KBB acil.'],
  specialistReview: [{ konu: 'SUT cihaz', neden: 'Uzman hekim raporu zorunlu; marka/bedel yok.' }],
  portal: [{
    id: 'isitmem-odyoloji',
    nav: [{ key: 'isitmem-odyoloji', label: 'İşitme takibim', path: '/isitmem-odyoloji' }],
    bundleKeys: ['odyo'],
    eligibility: 'doctor_specialty',
    copyHints: ['Kontrol / cihaz ayarı tarihi — dB yorumu, tanı, marka yok.', 'Ani kayıp: KBB / 112.'],
    views: ['IsitmemOdyolojiView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
