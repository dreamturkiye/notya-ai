import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const DIYETISYEN_PROFILE = {
  key: 'diyetisyen',
  etiket: 'Diyetisyen',
  resmiUnvan: 'Diyetisyen',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'makro', ad: 'Makro bandı (karar desteği)', kaynak: 'TDD TBT + TEMD (hekim tanısı)', motor: 'specialties/diyetisyen/engines/diyet', deterministik: true },
  ],
  sekmeler: [{ id: 'diyetisyen', etiket: 'Beslenme', bilesen: 'DiyetisyenHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/diyetisyen/engines/diyet.ts'],
  promptNotlari: ['Tanı/takviye dozu yok; makro bandı hekim tanısına bağlı.'],
  specialistReview: [{ konu: 'Tıbbi beslenme endikasyonu', neden: 'Hekim tanısı olmadan TBT iddiası yok.' }],
  portal: [{
    id: 'beslenmem',
    nav: [{ key: 'beslenmem', label: 'Beslenmem', path: '/beslenmem' }],
    bundleKeys: ['diyet'],
    eligibility: 'doctor_specialty',
    copyHints: ['Kontrol tarihi — kalori hedefi yorumu, tanı yok.'],
    views: ['BeslenmemView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
