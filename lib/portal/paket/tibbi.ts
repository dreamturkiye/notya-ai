/**
 * BRANS-PAKETI Phase 2 — the medical branş packages, keyed by specialty key (lib/doktor/specialties.ts).
 * Batch (a): pediatri, kadın hastalıkları-doğum, dermatoloji. A branş missing here has no package (paketBransi → null).
 */
import type { PaketModulTanimi } from '../bransPaketi'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { KD_PAKETI, PEDIATRI_PAKETI } from './tibbiCocukKadin'
import { DERMATOLOJI_PAKETI } from './tibbiDeri'

export const TIBBI_PAKETLER: Partial<Record<SpecialtyKey, readonly PaketModulTanimi[]>> = {
  pediatri: PEDIATRI_PAKETI,
  'kadin-hastaliklari-dogum': KD_PAKETI,
  dermatoloji: DERMATOLOJI_PAKETI,
}
