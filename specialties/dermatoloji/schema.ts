import { z, type Infer } from './z'

export const FITZPATRICK = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const
export const VISIT_TYPES = [
  'genel-poliklinik',
  'yandal',
  'islem',
  'fototerapi',
  'allerji-yama',
  'sac',
  'onkoloji-nevus',
  'yatis',
  'konsultasyon',
  'acil',
  'kozmetik',
  'gorsel-analiz',
  'asistan-gozden-gecirme',
] as const
export const CLINIC_UNITS = [
  'genel',
  'psoriasis',
  'fototerapi',
  'pediatrik',
  'sac',
  'kontakt-yama',
  'urtiker',
  'behcet-bagdokusu',
  'bullu',
  'cerrahi',
  'kozmetik',
  'nevus-tumor',
  'psikoderm',
] as const
export const PHOTO_KINDS = [
  'klinik_genel',
  'klinik_yakin',
  'dermoskopi_polarize',
  'dermoskopi_immersion',
  'dijital_harita',
  'islem_oncesi',
  'islem_sonrasi',
  'tedavi_hafta_n',
  'yama_d2',
  'yama_d4',
  'wood',
  'trichoscopy',
  'patoloji_makro',
] as const
export const VISION_TASKS = ['morfoloji', 'abcde_gozlem', 'degisim', 'dermoskopi_ipucu', 'yama_okuma'] as const
export const VISION_STATUS = ['draft', 'onayli', 'duzeltilmis', 'reddedildi'] as const
export const ACTOR = ['asistan', 'uzman'] as const
export const TBM_DEVICES = ['molemax', 'fotofinder', 'manual'] as const
export const BEDSIDE_RESULT = ['pos', 'neg', 'not_done'] as const
export const ADMISSION_REASONS = ['sjs_ten', 'eritrodermi', 'pemfigus', 'selulit', 'diger'] as const

export const patientDermSchema = z.object({
  fitzpatrick: z.enum(FITZPATRICK).optional(),
  occupation: z.string(),
  phototype: z.enum(FITZPATRICK).optional(),
  atopic: z.boolean(),
  family_atopy: z.boolean(),
  hla_b51: z.boolean().optional(),
  behcet_history: z.boolean().optional(),
})

export const lesionSchema = z.object({
  id: z.string().min(1),
  region: z.string().min(1),
  morphology: z.string().min(1),
  body_map_node: z.string().optional(),
  notes: z.string().optional(),
  documentId: z.string().optional(),
})

/** Pixels never live here — only the core hasta_goruntulemeler id. */
export const photoAssetSchema = z.object({
  id: z.string().min(1),
  coreImageId: z.string().min(1),
  kind: z.enum(PHOTO_KINDS),
  lesionId: z.string().min(1).nullable(),
  capturedAt: z.string().min(8),
  region: z.string().min(1),
  genital_consent: z.boolean(),
  pediatric_consent: z.boolean(),
  education_anonymized: z.boolean(),
  patient_share: z.boolean(),
  documentId: z.string().optional(),
})

export const PHOTO_DEVICES_SCHEMA = [
  'nb-uvb-311',
  'bb-uvb',
  'puva-oral',
  'puva-bath',
  'local-puva',
  'excimer-308',
  'uva1',
] as const

export const scoreSnapshotSchema = z.object({
  recorded_at: z.string().min(8),
  pasi: z.number().optional(),
  easi: z.number().optional(),
  dlqi: z.number().int().min(0).max(30).optional(),
  uas7: z.number().int().min(0).max(42).optional(),
  salt: z.number().min(0).max(100).optional(),
  pdai: z.number().optional(),
  /** DERM-EXCEPTIONAL-01 — bölge çalışma sayfası çıktıları */
  scorad: z.number().optional(),
  iga: z.number().int().min(0).max(4).optional(),
  bsa_pct: z.number().min(0).max(100).optional(),
  /** bölge dökümü (jsonb): { pasi: { bolgeler, bant, girdi }, ... } */
  ek: z.object({}).optional(),
})

export const ERITEM_YANITLARI = ['yok', 'minimal', 'agrili', 'bullu'] as const

export const photoSessionSchema = z.object({
  date: z.string().min(8),
  device: z.enum(PHOTO_DEVICES_SCHEMA),
  j_cm2: z.number(),
  med_test: z.boolean().optional(),
  burn: z.boolean().optional(),
  sessionPhotoCoreImageId: z.string().optional(),
  /** DERM-EXCEPTIONAL-01 — ünite v2 alanları (doz adımı hekim protokolünden girilir) */
  seans_no: z.number().int().min(1).max(500).optional(),
  doz_adimi_pct: z.number().min(-100).max(100).optional(),
  eritem: z.enum(ERITEM_YANITLARI).optional(),
  kacirilan_gun: z.number().int().min(0).max(365).optional(),
  yanik_protokolu: z.object({}).optional(),
  not: z.string().optional(),
})

/** MED / MPD testi — cihaz başına, hekim okur ve girer. */
export const medKaydiSchema = z.object({
  date: z.string().min(8),
  device: z.enum(PHOTO_DEVICES_SCHEMA),
  deger: z.number(),
  birim: z.string().min(1),
  testPhotoCoreImageId: z.string().optional(),
  not: z.string().optional(),
})

/** Kozmetik işlem izlenebilirliği — yalnız kozmetik ünitesinde girilir. */
export const kozmetikIslemSchema = z.object({
  tur: z.string().min(1),
  tarih: z.string().min(8),
  bolge: z.string().min(1),
  urun: z.string().nullable(),
  lot_no: z.string().nullable(),
  son_kullanma: z.string().nullable(),
  test_spot: z.boolean(),
  komplikasyonlar: z.array(z.string()),
  komplikasyon_notu: z.string().nullable(),
})

export const seriesTimepointSchema = z.object({
  at: z.string().min(8),
  label: z.string().min(1),
  photoIds: z.array(z.string().min(1)),
})

export const imageSeriesSchema = z.object({
  id: z.string().min(1),
  lesionId: z.string().min(1),
  timepoints: z.array(seriesTimepointSchema),
})

export const beforeAfterPairSchema = z.object({
  id: z.string().min(1),
  lesionId: z.string().min(1),
  beforePhotoId: z.string().min(1),
  afterPhotoId: z.string().min(1),
  intervalDays: z.number().int().min(0),
  regionMatch: z.boolean(),
})

export const visionReadSchema = z.object({
  id: z.string().min(1),
  assetIds: z.array(z.string().min(1)),
  task: z.enum(VISION_TASKS),
  status: z.enum(VISION_STATUS),
  drafted_by: z.enum(ACTOR),
  approved_by: z.enum(ACTOR).nullable(),
  observations: z.string(),
  differentials: z.array(z.string()),
  next_step: z.string(),
  disclaimer: z.literal('Tarama desteği, tanı değildir. Doktor onayı gerekir.'),
})

export const totalBodyMapSchema = z.object({
  deviceHint: z.enum(TBM_DEVICES),
  nodeIds: z.array(z.string()),
  followUpMonths: z.number().int().min(1).max(12),
})

export const bedsideTestSchema = z.object({
  koh: z.enum(BEDSIDE_RESULT),
  wood: z.enum(BEDSIDE_RESULT),
  tzanck: z.enum(BEDSIDE_RESULT),
  pathergy: z.enum(BEDSIDE_RESULT),
  demodex: z.enum(BEDSIDE_RESULT),
  darkfield: z.enum(BEDSIDE_RESULT),
  nativeFungus: z.enum(BEDSIDE_RESULT),
})

export const patchCourseSchema = z.object({
  series: z.literal('european_baseline'),
  appliedAt: z.string().min(8),
  readD2: z.string().min(8).nullable(),
  readD4: z.string().min(8).nullable(),
  photoIds: z.array(z.string()),
  positives: z.array(z.string()),
})

export const hairWorkupSchema = z.object({
  trichogram: z.string().nullable(),
  trichoscopyPhotoIds: z.array(z.string()),
  saltScore: z.number().min(0).max(100).nullable(),
})

export const bullousWorkupSchema = z.object({
  nikolsky: z.boolean(),
  dif: z.boolean(),
  iif: z.boolean(),
  dsg1: z.number().nullable(),
  dsg3: z.number().nullable(),
  bp180: z.number().nullable(),
  pdai: z.number().min(0).nullable(),
})

export const behcetCardSchema = z.object({
  oral: z.boolean(),
  genital: z.boolean(),
  eye: z.boolean(),
  pathergy: z.boolean(),
  isgCriteriaMet: z.boolean(),
})

export const admissionSchema = z.object({
  reason: z.enum(ADMISSION_REASONS),
  wardConsult: z.boolean(),
})

/** GÖP pack lives on the specialty payload — never on core patient types. */
export const gopPackSchema = z.object({
  two_contraception: z.boolean(),
  hcg_iso: z.string().min(8).nullable(),
  hcg_negative: z.boolean(),
  cycle_day: z.number().nullable(),
  rx_days: z.number(),
  start_iso: z.string().min(8),
})

/**
 * Dermatology episode payload. Stored in specialty_records.payload.
 * PASI, Fitzpatrick, MED, GÖP, dermoscopy, ImageSeries live here only — never on core types.
 * Photos are coreImageId handles into hasta_goruntulemeler. Never pixels. Never auto-delete.
 */
export const dermatolojiPayloadSchema = z.object({
  specialty: z.literal('dermatoloji'),
  episode_id: z.string().min(1),
  patient_id: z.string().min(1),
  visit_type: z.enum(VISIT_TYPES),
  unit: z.enum(CLINIC_UNITS),
  patient_derm: patientDermSchema,
  lesions: z.array(lesionSchema),
  photos: z.array(photoAssetSchema),
  image_series: z.array(imageSeriesSchema),
  before_after: z.array(beforeAfterPairSchema),
  vision_reads: z.array(visionReadSchema),
  total_body_map: totalBodyMapSchema.nullable(),
  bedside_tests: z.array(bedsideTestSchema),
  patch_courses: z.array(patchCourseSchema),
  hair_workup: hairWorkupSchema.nullable(),
  bullous_workup: bullousWorkupSchema.nullable(),
  behcet_card: behcetCardSchema.nullable(),
  admission: admissionSchema.nullable(),
  gop: gopPackSchema.optional(),
  score_snapshots: z.array(scoreSnapshotSchema).optional(),
  phototherapy_sessions: z.array(photoSessionSchema).optional(),
  last_tbse_iso: z.string().min(8).nullable().optional(),
  acitretin_ban: z.boolean().optional(),
  tb_screen: z.boolean().optional(),
  hbv_screen: z.boolean().optional(),
  bzbh_kind: z.string().optional(),
  ugly_duckling: z.boolean().optional(),
  psa_joint: z.boolean().optional(),
  /** DERM-EXCEPTIONAL-01 */
  med_kayitlari: z.array(medKaydiSchema).optional(),
  kozmetik_islemler: z.array(kozmetikIslemSchema).optional(),
  /** hekimin elle işaretlediği acil kırmızı bayrak kodları */
  acil_isaretleri: z.array(z.string()).optional(),
  /** hekimin kilitlediği tedavi basamağı: { psoriasis?: string; atopi?: string } */
  basamak_kilidi: z.object({}).optional(),
})

export type DermatolojiPayload = Infer<typeof dermatolojiPayloadSchema>
export type PatientDerm = Infer<typeof patientDermSchema>
export type Lesion = Infer<typeof lesionSchema>
export type PhotoAsset = Infer<typeof photoAssetSchema>
export type ImageSeries = Infer<typeof imageSeriesSchema>
export type BeforeAfterPair = Infer<typeof beforeAfterPairSchema>
export type VisionRead = Infer<typeof visionReadSchema>
export type TotalBodyMap = Infer<typeof totalBodyMapSchema>
export type BedsideTest = Infer<typeof bedsideTestSchema>
export type PatchCourse = Infer<typeof patchCourseSchema>
export type HairWorkup = Infer<typeof hairWorkupSchema>
export type BullousWorkup = Infer<typeof bullousWorkupSchema>
export type BehcetCard = Infer<typeof behcetCardSchema>
export type Admission = Infer<typeof admissionSchema>
export type GopPack = Infer<typeof gopPackSchema>
export type ScoreSnapshot = Infer<typeof scoreSnapshotSchema>
export type PhotoSessionPayload = Infer<typeof photoSessionSchema>
export type MedKaydiPayload = Infer<typeof medKaydiSchema>
export type KozmetikIslemPayload = Infer<typeof kozmetikIslemSchema>

/** Isolation probes — do not import other specialty folders into production code. */
export const pediatriProbeSchema = z.object({
  specialty: z.literal('pediatri'),
  child_patient_id: z.string().min(1),
  gidr_basamak: z.string().min(1),
  mchat_cevaplar: z.object({}),
})

export const kadinDogumProbeSchema = z.object({
  specialty: z.literal('kadin-dogum'),
  mother_patient_id: z.string().min(1),
  sat: z.string().min(8).nullable(),
  edd_naegele: z.string().min(8).nullable(),
})
