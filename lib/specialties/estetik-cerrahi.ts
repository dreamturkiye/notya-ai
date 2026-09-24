import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ESTETIK_CERRAHI_PROFILE = {
  key: 'estetik-cerrahi',
  etiket: 'Estetik & Plastik Cerrahi',
  resmiUnvan: 'Estetik & Plastik Cerrahi',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'soguma', ad: 'Elektif onam / soğuma', kaynak: 'Ayakta Teşhis + elektif cerrahi soğuma', motor: 'specialties/estetik-cerrahi/engines/cerrahi', deterministik: true },
    { id: 'postop', ad: 'Ameliyat sonrası bakım takvimi', kaynak: 'TR ayaktan estetik cerrahi izlem ritüeli', motor: 'specialties/estetik-cerrahi/engines/cerrahi', deterministik: true },
  ],
  sekmeler: [{ id: 'estetik-cerrahi', etiket: 'Estetik Cerrahi', bilesen: 'EstetikCerrahiHome', sira: 14 }],
  goruntu: { modaliteler: ['foto'], zamanCizgisi: true, ayseSinir: 'Önce/sonra foto karar desteği; kesi ve tanı hekimde. TUS Yaram değil.' },
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['lib/klinik/klinikTurkishRefs.ts KLINIK_TURKISH_REFS.estetik-cerrahi (Ayakta Teşhis, TPRECD, EPCD, SB cerrahi güvenlik, SGK kozmetik iddia yok)'],
  promptNotlari: ['OR HIS / implant seçimi yok; TUS plastik araçları açılmaz; emboli → 112.'],
  specialistReview: [{ konu: 'Teknik ve endikasyon', neden: 'Ameliyat kararı hekimdedir.' }],
  portal: [{
    id: 'estetik-ameliyatim',
    nav: [{ key: 'estetik-ameliyatim', label: 'Ameliyat bakımım', path: '/estetik-ameliyatim' }],
    bundleKeys: ['estetikCerrahi'],
    eligibility: 'doctor_specialty',
    copyHints: ['Pansuman ve kontrol tarihleri — kesi, implant, tanı yok.', 'Nefes darlığı / kanama: 112.'],
    views: ['EstetikAmeliyatimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
