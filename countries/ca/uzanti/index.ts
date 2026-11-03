/** CA-GAP-CLOSE — letter studio + honest visit export. */
import type { UlkeUzantisi } from '@/lib/ulke/uzanti/tipler'
import { enExportUzanti, enMektupUzanti } from '../../_dil/en/uzanti/mektup'

export const CA_UZANTI: UlkeUzantisi = {
  mektup: enMektupUzanti({
    sevkAd: 'Family-physician letter',
    sevkAciklama: 'Update for the patient’s usual family physician',
  }),
  pmsEntegrasyon: enExportUzanti(),
}
