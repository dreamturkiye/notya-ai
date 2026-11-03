/**
 * AU-GAP-CLOSE-01/03 — letter studio + care-plan studio + MBS assist + PMS export pack. Fixed limits; client-safe.
 *
 * Letters, care plans and MBS suggestions are drafts for the doctor. Nothing is lodged with Medicare, sent to a PMS, or
 * shared with a patient from these routes. An unapproved note never produces any of them.
 */

/** Clinical letter kinds a pack may offer. Pack decides which are on. */
export const MEKTUP_TURLERI = ['gp', 'referral', 'patient'] as const
export type MektupHarfTuru = (typeof MEKTUP_TURLERI)[number]

/**
 * AU-GAP-CLOSE-03 — Medicare care-plan document kinds (draft only; never lodge).
 * gpmp = GP Management Plan · tca = Team Care Arrangements · ccmp = Chronic Condition Management Plan
 * mhcp = Mental Health Treatment Plan (GP or psychiatrist path — pack prompt decides wording).
 */
export const BAKIM_PLAN_TURLERI = ['gpmp', 'tca', 'ccmp', 'mhcp'] as const
export type BakimPlanTuru = (typeof BAKIM_PLAN_TURLERI)[number]

/** Union used by the shared draft API (`/api/ulke/not/mektup`). */
export const TUM_MEKTUP_TURLERI = [...MEKTUP_TURLERI, ...BAKIM_PLAN_TURLERI] as const
export type MektupTuru = (typeof TUM_MEKTUP_TURLERI)[number]

export const MEKTUP_AZAMI = 12_000
export const MBS_ONERI_AZAMI = 8
export const PMS_EXPORT_SURUM = 'au-pms-export-v2'

export const mektupTuruMu = (ham: unknown): ham is MektupTuru =>
  typeof ham === 'string' && (TUM_MEKTUP_TURLERI as readonly string[]).includes(ham)

export const bakimPlaniMi = (ham: unknown): ham is BakimPlanTuru =>
  typeof ham === 'string' && (BAKIM_PLAN_TURLERI as readonly string[]).includes(ham)

export const mektupHarfMi = (ham: unknown): ham is MektupHarfTuru =>
  typeof ham === 'string' && (MEKTUP_TURLERI as readonly string[]).includes(ham)
