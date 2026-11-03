/** NZ-GAP-CLOSE — letter studio + honest visit export. */
import type { UlkeUzantisi } from '@/lib/ulke/uzanti/tipler'
import { enExportUzanti, enMektupUzanti } from '../../_dil/en/uzanti/mektup'

export const NZ_UZANTI: UlkeUzantisi = {
  mektup: enMektupUzanti({
    sevkAd: 'GP letter',
    sevkAciklama: 'Update for the patient’s usual GP',
  }),
  pmsEntegrasyon: enExportUzanti(),
}
