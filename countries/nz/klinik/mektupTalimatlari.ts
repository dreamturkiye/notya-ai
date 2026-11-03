/** NZ letter drafts — New Zealand English. */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import { enMektupGirdisi, enMektupTalimati } from '../../_dil/en/klinik/mektupTalimatlari'

export const nzMektupTalimati = (tur: MektupTuru) =>
  enMektupTalimati(tur, { dilEtiketi: 'New Zealand English', hekim: 'New Zealand clinician', sevk: 'GP' })

export const nzMektupGirdisi = (tur: MektupTuru, icerik: NotIcerigi) => enMektupGirdisi(tur, icerik)
