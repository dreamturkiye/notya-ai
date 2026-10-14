/**
 * Laboratory catalogue. Units already recorded in the tools folder are listed again by reference.
 * No panel and no reference range is stored: no national panel list was opened on 14 October 2026.
 */
import { UZ_LAB_BIRIM_KAYNAKLARI } from '../uygulama/araclar/birimler'

export const UZ_LAB_PANELLERI: readonly [] = []

export const UZ_LAB_KATALOG = {
  okundu: '2026-10-14',
  paneller: UZ_LAB_PANELLERI,
  birimler: UZ_LAB_BIRIM_KAYNAKLARI,
  not: 'No national laboratory catalogue was opened. The units above are the ones already stated beside their documents. No reference range is stored.',
}
