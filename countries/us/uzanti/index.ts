/** US-GAP-CLOSE — letter studio + honest visit export (no Medicare/MBS, no AU PMS vendors). */
import type { UlkeUzantisi } from '@/lib/ulke/uzanti/tipler'
import { enExportUzanti, enMektupUzanti } from '../../_dil/en/uzanti/mektup'

export const US_UZANTI: UlkeUzantisi = {
  mektup: enMektupUzanti({
    sevkAd: 'PCP letter',
    sevkAciklama: 'Update for the patient’s primary care physician',
  }),
  pmsEntegrasyon: enExportUzanti(),
}
