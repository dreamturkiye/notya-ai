/**
 * Laboratory units already stated for this pack. No panel was read as a catalogue
 * on 14 October 2026, and no reference range is stored.
 */
import { AU_GIRDI } from '../ayarlar'

export const AU_LABORATUVAR = {
  birimler: AU_GIRDI.araclar!.labBirimleri,
  paneller: [] as readonly [],
  araliklar: [] as readonly [],
  okundu: '2026-10-14',
  not: 'The units are the ones already in the pack, each with the page named beside it in ayarlar.ts. No panel list and no numeric reference range was added.',
}
