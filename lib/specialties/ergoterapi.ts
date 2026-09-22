import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const ERGOTERAPI_PROFILE: SpecialtyProfile = {
  key: 'ergoterapi',
  etiket: 'Ergoterapi',
  resmiUnvan: 'Ergoterapi',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'gya', ad: 'GYA odak özeti (tanı değil)', kaynak: 'TR Ergoterapi Derneği / ICF', motor: 'specialties/ergoterapi/engines/ergo', deterministik: true },
  ],
  sekmeler: [{ id: 'ergoterapi', etiket: 'Ergoterapi', bilesen: 'ErgoterapiHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/ergoterapi/engines/ergo.ts'],
  promptNotlari: ['Tanı yok; Neyzi/baş çevresi sızmaz.'],
  specialistReview: [{ konu: 'Ekipman sınıfı', neden: 'Rapor hekim imzasına bağlıdır.' }],
  portal: [{
    id: 'ergom',
    nav: [{ key: 'ergom', label: 'Günlük programım', path: '/ergom' }],
    bundleKeys: ['ergo'],
    eligibility: 'doctor_specialty',
    copyHints: ['Seans / ev programı tarihi — tanı ve Neyzi yok.'],
    views: ['ErgomView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
