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
})

export type KadinDogumPayload = Infer<typeof kadinDogumPayloadSchema>
export type FetusPlaceholder = Infer<typeof fetusSchema>
export type ObstetricScore = Infer<typeof obstetricScoreSchema>
export type AntiDDose = Infer<typeof antiDSchema>

/** GİDR / M-CHAT shaped record — used only to prove isolation. Not a pediatrics folder file. */
export const pediatriProbeSchema = z.object({
  specialty: z.literal('pediatri'),
  child_patient_id: z.string().min(1),
  gidr_basamak: z.string().min(1),
  mchat_cevaplar: z.object({}),
})

export type PediatriProbePayload = Infer<typeof pediatriProbeSchema>
