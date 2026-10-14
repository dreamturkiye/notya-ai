/**
 * Laboratory units already stated for this pack. No panel and no numeric
 * reference range is added: none was read from a laboratory catalogue.
 */
import { NZ_GIRDI } from '../ayarlar'

export const NZ_LABORATUVAR = {
  birimler: NZ_GIRDI.araclar.labBirimleri,
  paneller: [] as const,
  araliklar: [] as const,
}
