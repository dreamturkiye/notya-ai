/** GB letter drafts — British English; no Australian Medicare care-plan / MBS. */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import { enMektupGirdisi, enMektupTalimati } from '../../_dil/en/klinik/mektupTalimatlari'

export const gbMektupTalimati = (tur: MektupTuru) =>
  enMektupTalimati(tur, { dilEtiketi: 'British English', hekim: 'UK clinician', sevk: 'GP' })

export const gbMektupGirdisi = (tur: MektupTuru, icerik: NotIcerigi) => enMektupGirdisi(tur, icerik)
