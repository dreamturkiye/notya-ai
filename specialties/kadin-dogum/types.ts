export type VisitType =
  | 'gebe'
  | 'jinekoloji'
  | 'usg'
  | 'nst'
  | 'kolposkopi'
  | 'infertilite'
  | 'perinatoloji-sevk'
  | 'travay'
  | 'dogum'
  | 'lohusa'
  | 'acil'
  | 'gebe-okulu'
  | 'gorsel-analiz'
  | 'asistan-gozden-gecirme'

export type ClinicUnit =
  | 'genel-kd'
  | 'perinatoloji'
  | 'infertilite'
  | 'kolposkopi'
  | 'urojinekoloji'
  | 'jineonkoloji'
  | 'gebe-okulu'
  | 'travay-salon'

export type {
  KadinDogumPayload,
  FetusPlaceholder,
  ObstetricScore,
  AntiDDose,
  PediatriProbePayload,
} from './schema'
