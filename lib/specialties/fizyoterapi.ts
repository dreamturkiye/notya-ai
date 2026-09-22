import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const FIZYOTERAPI_PROFILE = {
  key: 'fizyoterapi',
  etiket: 'Fizyoterapi',
  resmiUnvan: 'Fizyoterapi',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'icf', ad: 'ICF seans özeti (tanı değil)', kaynak: 'ICF + 29.03.2025', motor: 'specialties/fizyoterapi/engines/fizyo', deterministik: true },
    { id: 'seans', ad: 'Seans vadesi / tavan hatırlatma', kaynak: 'SGK seans çerçevesi (hak iddiası yok)', motor: 'specialties/fizyoterapi/engines/fizyo', deterministik: true },
  ],
  sekmeler: [{ id: 'fizyoterapi', etiket: 'Fizyoterapi', bilesen: 'FizyoterapiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/fizyoterapi/engines/fizyo.ts'],
  promptNotlari: ['Tanı koyma; hekim referansı zorunlu; cauda/göğüs → 112.'],
  specialistReview: [{ konu: 'Seans tavanı', neden: 'SGK metni değişir; hak iddia edilmez.' }],
  portal: [{
    id: 'fizyom',
    nav: [{ key: 'fizyom', label: 'Egzersizim', path: '/fizyom' }],
    bundleKeys: ['fizyo'],
    eligibility: 'doctor_specialty',
    copyHints: ['Seans / ev egzersizi tarihi — tanı, FTR skoru yok.', 'Cauda / göğüs: 112.'],
    views: ['FizyomView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
