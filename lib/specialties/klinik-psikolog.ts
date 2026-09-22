import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const KLINIK_PSIKOLOG_PROFILE: SpecialtyProfile = {
  key: 'klinik-psikolog',
  etiket: 'Klinik Psikoloji',
  resmiUnvan: 'Klinik Psikoloji',
  pediatrikBaglam: 'asla',
  olcumler: BASELINE_OLCUMLER,
  hesaplayicilar: [
    { id: 'seans', ad: 'Seans çerçevesi (tanı değil)', kaynak: 'TPD etik + 29.03.2025', motor: 'specialties/klinik-psikolog/engines/psikolog', deterministik: true },
  ],
  sekmeler: [{ id: 'klinik-psikolog', etiket: 'Klinik Psikoloji', bilesen: 'KlinikPsikologHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/klinik-psikolog/engines/psikolog.ts'],
  promptNotlari: ['Tıbbi tanı ve reçete yok; kriz → 112.'],
  specialistReview: [{ konu: 'Kriz eşiği', neden: 'Klinik bağlam; sevk kararı uzmandadır.' }],
  portal: [{
    id: 'seanslarim',
    nav: [{ key: 'seanslarim', label: 'Görüşmelerim', path: '/seanslarim' }],
    bundleKeys: ['klinikPsik'],
    eligibility: 'doctor_specialty',
    copyHints: ['Sonraki görüşme tarihi — tanı, ölçek yorumu, ilaç yok.', 'Kriz: 112.'],
    views: ['SeanslarimView'],
    derinlik: 'Strong',
  }],
  olgunluk: 'beta-hazir',
}
