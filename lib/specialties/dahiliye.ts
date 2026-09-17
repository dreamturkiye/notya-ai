/**
 * İç Hastalıkları (dahiliye) registry wrapper. The chapter itself lives in specialties/dahiliye
 * (engines, prompts lock, DahiliyeHome) and was wired module by module without a profile; this file
 * gives the registry an honest entry so the Sağlığım module (ön anket) is declared, not hardcoded.
 */
import type { SpecialtyProfile } from './profile'
import { BASELINE_OLCUMLER, BASELINE_BELGELER } from './profile'

export const DAHILIYE_PROFILE: SpecialtyProfile = {
  key: 'dahiliye',
  etiket: 'İç Hastalıkları',
  resmiUnvan: 'İç Hastalıkları',

  olcumler: BASELINE_OLCUMLER,

  hesaplayicilar: [
    { id: 'score2', ad: 'SCORE2 / SCORE2-Diabetes / SCORE2-OP (yalnız doğrulanmış motor)', kaynak: 'ESC 2021/2023 — ehab309, ehad260, ehab312 ek tabloları', motor: 'specialties/dahiliye/engines/score2', deterministik: true },
    { id: 'ckd-kdigo', ad: 'KDIGO G×A evreleme', kaynak: 'KDIGO; TİHUD', motor: 'specialties/dahiliye/engines/ckd', deterministik: true },
  ],

  sekmeler: [{ id: 'dahiliye', etiket: 'Dahiliye', bilesen: 'DahiliyeHome', sira: 14 }],
  goruntu: null,
  belgeler: BASELINE_BELGELER,
  ekKaynaklar: ['specialties/dahiliye/engines/dahiliye.ts REF_ACIKLAMA (TİHUD, TEMD, Uzlaşı 2025, HYP, SGK)'],
  promptNotlari: ['Tam kilit specialties/dahiliye/prompts (DAH-PROMPTS-LOCK).'],
  specialistReview: [],

  // Ön anket (ev KB/glukoz/kilo → dahiliye_ev_kayitlari) — doctor specialty dahiliye; the anket API
  // additionally requires at least one dahiliye card on the patient. Partial: a Takip shortcut + one form.
  portal: [{
    id: 'dahiliye', nav: [{ key: 'on-anket', label: 'Ön anket', path: '/on-anket' }], bundleKeys: [], eligibility: 'combined',
    copyHints: ['Anket acil başvuru yerine geçmez; alarmda 112 metni.', 'Hastaya yorum/tanı dönmez.'],
    views: ['OnAnketPage'], derinlik: 'Partial',
  }],

  olgunluk: 'arastirma',
}
