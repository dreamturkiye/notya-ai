export type VisitType =
  | 'genel-poliklinik'
  | 'yandal'
  | 'islem'
  | 'fototerapi'
  | 'allerji-yama'
  | 'sac'
  | 'onkoloji-nevus'
  | 'yatis'
  | 'konsultasyon'
  | 'acil'
  | 'kozmetik'
  | 'gorsel-analiz'
  | 'asistan-gozden-gecirme'

export type ClinicUnit =
  | 'genel'
  | 'psoriasis'
  | 'fototerapi'
  | 'pediatrik'
  | 'sac'
  | 'kontakt-yama'
  | 'urtiker'
  | 'behcet-bagdokusu'
  | 'bullu'
  | 'cerrahi'
  | 'kozmetik'
  | 'nevus-tumor'
  | 'psikoderm'

export type {
  DermatolojiPayload,
  PatientDerm,
  Lesion,
  PhotoAsset,
  ImageSeries,
  BeforeAfterPair,
  VisionRead,
  TotalBodyMap,
  BedsideTest,
  PatchCourse,
  HairWorkup,
  BullousWorkup,
  BehcetCard,
  Admission,
  GopPack,
  ScoreSnapshot,
} from './schema'
