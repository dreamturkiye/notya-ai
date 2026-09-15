import { z, type Infer } from './z'

export const FETUS_LABELS = ['A', 'B'] as const
export const FETUS_STATUSES = ['ongoing', 'demise', 'delivered', 'unknown'] as const
export const CS_INCISIONS = ['none', 'pfannenstiel', 'median', 'unknown'] as const
export const GA_LOCKS = ['sat', 'crl'] as const
export const PLURALITY = ['singleton', 'twins', 'higher'] as const
export const CHORIONICITY = ['di/di', 'mo/di', 'mo/mo'] as const
export const RH = ['D+', 'D-', 'unknown'] as const
export const IDC = ['positive', 'negative', 'unknown', 'not_tested'] as const
export const ANTI_D_REASONS = ['routine_28w', 'postpartum', 'bleed', 'procedure'] as const
export const RISK_CLASS = ['dusuk', 'orta', 'yuksek'] as const
export const EPISODE_STATUS = ['gebe', 'lohusa', 'kapandi'] as const
export const USG_KINDS = [
  'erken_tv',
  'nt_11_14',
  'ayrintili_18_22',
  'buyume',
  'doppler',
  'prezentasyon',
  '3d4d_hatira',
] as const
export const NST_CATEGORIES = ['I', 'II', 'III'] as const
export const VISION_STATUS = ['draft', 'uzman_onayli', 'red'] as const
export const VISION_USG_TASKS = ['erken_canlilik', 'nt_olcum', 'anomali_checklist', 'buyume_efw', 'doppler'] as const
export const ACTOR = ['asistan', 'uzman'] as const
export const CLINIC_UNITS = [
  'genel-kd',
  'perinatoloji',
  'infertilite',
  'kolposkopi',
  'urojinekoloji',
  'jineonkoloji',
  'gebe-okulu',
  'travay-salon',
] as const
export const VISIT_TYPES = [
  'gebe',
  'jinekoloji',
  'usg',
  'nst',
  'kolposkopi',
  'infertilite',
  'perinatoloji-sevk',
  'travay',
  'dogum',
  'lohusa',
  'acil',
  'gebe-okulu',
  'gorsel-analiz',
  'asistan-gozden-gecirme',
] as const

export const gaWeeksDaysSchema = z.object({
  weeks: z.number().int().min(0),
  days: z.number().int().min(0).max(6),
})

export const usgMeasurementsSchema = z.object({
  crl: z.number().optional(),
  nt: z.number().optional(),
  nb: z.number().optional(),
  bpd: z.number().optional(),
  hc: z.number().optional(),
  ac: z.number().optional(),
  fl: z.number().optional(),
  efw: z.number().optional(),
  afi: z.number().optional(),
  cervixMm: z.number().optional(),
  pi: z.number().optional(),
  ri: z.number().optional(),
  dv: z.number().optional(),
})

/** Core görüntüleme handle only — never pixels. */
export const usgStudySchema = z.object({
  id: z.string().min(1),
  coreImageId: z.string().min(1),
  dicomId: z.string().min(1).optional(),
  kind: z.enum(USG_KINDS),
  gaWeeksDays: gaWeeksDaysSchema,
  datingMethod: z.enum(GA_LOCKS),
  fetusId: z.enum(FETUS_LABELS),
  measurements: usgMeasurementsSchema,
  nonDiagnostic: z.boolean().optional(),
  kvkk_fetal_image_consent: z.boolean(),
  kvkk_nipt_karyotype_consent: z.boolean().optional(),
})

export const usgSeriesSchema = z.object({
  episodeId: z.string().min(1),
  datingMethod: z.enum(GA_LOCKS),
  studies: z.array(usgStudySchema),
})

export const nstStudySchema = z.object({
  id: z.string().min(1),
  recordedAt: z.string().min(8),
  ga: gaWeeksDaysSchema,
  category: z.enum(NST_CATEGORIES),
  durationMin: z.number().min(0),
  coreTraceId: z.string().min(1),
  toco: z.boolean(),
})

export const visionReadSchema = z.object({
  id: z.string().min(1),
  assetIds: z.array(z.string().min(1)),
  task: z.string().min(1),
  status: z.enum(VISION_STATUS),
  drafted_by: z.enum(ACTOR),
  approved_by: z.enum(ACTOR).nullable(),
  findings: z.string(),
  disclaimer: z.literal('Ölçüm ve tarama desteği, tanı değildir. Uzman onayı gerekir.'),
})

export const colpoImageSchema = z.object({
  id: z.string().min(1),
  coreImageId: z.string().min(1),
  capturedAt: z.string().min(8),
  kvkk_consent: z.boolean(),
})

export const hsgImageSchema = z.object({
  id: z.string().min(1),
  coreImageId: z.string().min(1),
  capturedAt: z.string().min(8),
  kvkk_consent: z.boolean(),
})

export const fetusSchema = z.object({
  label: z.enum(FETUS_LABELS),
  status: z.enum(FETUS_STATUSES),
  linked_newborn_patient_id: z.string().min(1).optional(),
})

export const obstetricScoreSchema = z.object({
  G: z.number().int().min(0),
  P: z.number().int().min(0),
  A: z.number().int().min(0),
  Y: z.number().int().min(0),
  D: z.number().int().min(0),
  E: z.number().int().min(0),
  prior_cs_count: z.number().int().min(0),
  prior_cs_incision: z.enum(CS_INCISIONS),
})

export const antiDSchema = z.object({
  date: z.string().min(8),
  week: z.number().min(0).max(45),
  dose_ug: z.number().min(0),
  reason: z.enum(ANTI_D_REASONS),
})

/**
 * Kadın-doğum episode payload. Stored in specialty_records.payload — never on core patients/visits.
 * SAT, NT, OGTT, Anti-D, G/P/A, CRL, EDD live here only.
 */
export const kadinDogumPayloadSchema = z.object({
  specialty: z.literal('kadin-dogum'),
  episode_id: z.string().min(1),
  mother_patient_id: z.string().min(1),
  fetuses: z.array(fetusSchema),
  obstetric_score: obstetricScoreSchema,
  sat: z.string().min(8).nullable(),
  edd_naegele: z.string().min(8).nullable(),
  edd_crl: z.string().min(8).nullable(),
  ga_locked: z.enum(GA_LOCKS),
  plurality: z.enum(PLURALITY),
  chorionicity: z.enum(CHORIONICITY).nullable(),
  ttts: z.boolean(),
  rh: z.enum(RH),
  idc_history: z.enum(IDC),
  anti_d: z.array(antiDSchema),
  risk_class: z.enum(RISK_CLASS),
  episode_status: z.enum(EPISODE_STATUS),
  lohusa_day: z.number().int().min(0).max(42).nullable(),
  visit_type: z.enum(VISIT_TYPES).optional(),
  unit: z.enum(CLINIC_UNITS).optional(),
  usg_series: usgSeriesSchema.optional(),
  nst_studies: z.array(nstStudySchema).optional(),
  vision_reads: z.array(visionReadSchema).optional(),
  colpo_images: z.array(colpoImageSchema).optional(),
  hsg_images: z.array(hsgImageSchema).optional(),
})

export type KadinDogumPayload = Infer<typeof kadinDogumPayloadSchema>
export type FetusPlaceholder = Infer<typeof fetusSchema>
export type ObstetricScore = Infer<typeof obstetricScoreSchema>
export type AntiDDose = Infer<typeof antiDSchema>
export type UsgStudyPayload = Infer<typeof usgStudySchema>
export type UsgSeriesPayload = Infer<typeof usgSeriesSchema>
export type NstStudyPayload = Infer<typeof nstStudySchema>
export type VisionRead = Infer<typeof visionReadSchema>
export type ColpoImage = Infer<typeof colpoImageSchema>
export type HsgImage = Infer<typeof hsgImageSchema>

/** GİDR / M-CHAT shaped record — used only to prove isolation. Not a pediatrics folder file. */
export const pediatriProbeSchema = z.object({
  specialty: z.literal('pediatri'),
  child_patient_id: z.string().min(1),
  gidr_basamak: z.string().min(1),
  mchat_cevaplar: z.object({}),
})

export type PediatriProbePayload = Infer<typeof pediatriProbeSchema>
