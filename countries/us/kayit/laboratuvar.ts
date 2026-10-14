/**
 * Laboratory units already stated for this pack. No panel and no numeric
 * reference range is added: none was read from a laboratory catalogue.
 */
import { US_GIRDI } from '../ayarlar'

export const US_LABORATUVAR = {
  birimler: US_GIRDI.araclar.labBirimleri,
  paneller: [] as const,
  araliklar: [] as const,
}
