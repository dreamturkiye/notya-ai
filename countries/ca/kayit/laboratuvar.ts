/**
 * Laboratory units already stated for this pack. No panel and no numeric
 * reference range is added: none was read from a laboratory catalogue.
 */
import { CA_GIRDI } from '../ayarlar'

export const CA_LABORATUVAR = {
  birimler: CA_GIRDI.araclar.labBirimleri,
  paneller: [] as const,
  araliklar: [] as const,
}
