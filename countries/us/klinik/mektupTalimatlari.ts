/** US letter drafts from an approved note — American English; no Medicare care-plan / MBS. */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import { enMektupGirdisi, enMektupTalimati } from '../../_dil/en/klinik/mektupTalimatlari'

export const usMektupTalimati = (tur: MektupTuru) =>
  enMektupTalimati(tur, { dilEtiketi: 'American English', hekim: 'US clinician', sevk: 'primary care physician' })

export const usMektupGirdisi = (tur: MektupTuru, icerik: NotIcerigi) => enMektupGirdisi(tur, icerik)
