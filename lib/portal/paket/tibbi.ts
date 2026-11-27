/**
 * BRANS-PAKETI Phase 2 — the medical branş packages, keyed by specialty key (lib/doktor/specialties.ts): all 30.
 * Batch (a): pediatri, kadın hastalıkları-doğum, dermatoloji. Batch (b): the other 27.
 */
import type { PaketModulTanimi } from '../bransPaketi'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { KD_PAKETI, PEDIATRI_PAKETI } from './tibbiCocukKadin'
import { DERMATOLOJI_PAKETI } from './tibbiDeri'
import {
  AILE_HEKIMLIGI_PAKETI, DAHILIYE_PAKETI, ENDOKRINOLOJI_PAKETI, ENFEKSIYON_PAKETI, GASTROENTEROLOJI_PAKETI, GOGUS_HASTALIKLARI_PAKETI,
  KARDIYOLOJI_PAKETI, NEFROLOJI_PAKETI, ONKOLOJI_PAKETI, ROMATOLOJI_PAKETI,
} from './tibbiIc'
import { NOROLOJI_PAKETI, PSIKIYATRI_PAKETI } from './tibbiNoroPsik'
import {
  ANESTEZI_PAKETI, BEYIN_CERRAHISI_PAKETI, COCUK_CERRAHISI_PAKETI, GENEL_CERRAHI_PAKETI, GOGUS_CERRAHISI_PAKETI, GOZ_PAKETI,
  KALP_DAMAR_CERRAHISI_PAKETI, KBB_PAKETI, ORTOPEDI_PAKETI, PLASTIK_CERRAHI_PAKETI, UROLOJI_PAKETI,
} from './tibbiCerrahi'
import { ACIL_TIP_PAKETI, FIZIK_TEDAVI_PAKETI, RADYOLOJI_PAKETI, SPOR_HEKIMLIGI_PAKETI } from './tibbiDiger'

export const TIBBI_PAKETLER: Record<SpecialtyKey, readonly PaketModulTanimi[]> = {
  pediatri: PEDIATRI_PAKETI,
  'kadin-hastaliklari-dogum': KD_PAKETI,
  dermatoloji: DERMATOLOJI_PAKETI,
  kardiyoloji: KARDIYOLOJI_PAKETI,
  dahiliye: DAHILIYE_PAKETI,
  endokrinoloji: ENDOKRINOLOJI_PAKETI,
  'aile-hekimligi': AILE_HEKIMLIGI_PAKETI,
  nefroloji: NEFROLOJI_PAKETI,
  gastroenteroloji: GASTROENTEROLOJI_PAKETI,
  romatoloji: ROMATOLOJI_PAKETI,
  'enfeksiyon-hastaliklari': ENFEKSIYON_PAKETI,
  onkoloji: ONKOLOJI_PAKETI,
  'gogus-hastaliklari': GOGUS_HASTALIKLARI_PAKETI,
  noroloji: NOROLOJI_PAKETI,
  psikiyatri: PSIKIYATRI_PAKETI,
  'genel-cerrahi': GENEL_CERRAHI_PAKETI,
  ortopedi: ORTOPEDI_PAKETI,
  'beyin-cerrahisi': BEYIN_CERRAHISI_PAKETI,
  'gogus-cerrahisi': GOGUS_CERRAHISI_PAKETI,
  'plastik-cerrahi': PLASTIK_CERRAHI_PAKETI,
  'kalp-damar-cerrahisi': KALP_DAMAR_CERRAHISI_PAKETI,
  uroloji: UROLOJI_PAKETI,
  'kulak-burun-bogaz': KBB_PAKETI,
  'goz-hastaliklari': GOZ_PAKETI,
  'cocuk-cerrahisi': COCUK_CERRAHISI_PAKETI,
  anestezi: ANESTEZI_PAKETI,
  'acil-tip': ACIL_TIP_PAKETI,
  radyoloji: RADYOLOJI_PAKETI,
  'fizik-tedavi': FIZIK_TEDAVI_PAKETI,
  'spor-hekimligi': SPOR_HEKIMLIGI_PAKETI,
}
