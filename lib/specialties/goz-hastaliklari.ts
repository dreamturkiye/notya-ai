/**
 * Göz Hastalıkları registry wrapper. SAGLIGIM-PORTAL-REGISTRY step: the portal module is declared first
 * so göz practices stop inheriting pediatri/KD/dahiliye bolt-ons; the chapter (specialties/goz-hastaliklari)
 * fills the rest of this profile.
 */
import type { SpecialtyProfile } from './profile'
import { baselineProfile } from './profile'

export const GOZ_PROFILE: SpecialtyProfile = {
  ...baselineProfile('goz-hastaliklari', 'Göz Hastalıkları', 'Göz Hastalıkları'),
  portal: [{
    id: 'gozlerim', nav: [], bundleKeys: ['goz'], eligibility: 'doctor_specialty',
    copyHints: ['Görme keskinliği / göz içi basıncı yalnız klinikte kaydedilen sayı olarak; yorum yok.', 'Ani görme kaybı / ağrı / ışık çakması → 112 veya muayenehane, portal mesajı değil.'],
    views: ['GozlerimView'], derinlik: 'Thin',
  }],
}
