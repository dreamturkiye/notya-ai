/** CA letter drafts — Canadian English. */
import type { NotIcerigi } from '@/lib/ulke/tipler'
import type { MektupTuru } from '@/lib/ulke/mektup/sabitler'
import { enMektupGirdisi, enMektupTalimati } from '../../_dil/en/klinik/mektupTalimatlari'

export const caMektupTalimati = (tur: MektupTuru) =>
  enMektupTalimati(tur, { dilEtiketi: 'Canadian English', hekim: 'Canadian clinician', sevk: 'family physician' })

export const caMektupGirdisi = (tur: MektupTuru, icerik: NotIcerigi) => enMektupGirdisi(tur, icerik)
