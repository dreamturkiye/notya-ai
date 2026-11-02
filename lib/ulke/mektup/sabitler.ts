/**
 * AU-GAP-CLOSE-01 — letter studio + MBS assist + PMS export pack. Fixed limits; client-safe.
 *
 * Letters and MBS suggestions are drafts for the doctor. Nothing is lodged with Medicare, sent to a PMS, or
 * shared with a patient from these routes. An unapproved note never produces any of them.
 */

/** Letter kinds a pack may offer. Pack decides which are on. */
export const MEKTUP_TURLERI = ['gp', 'referral', 'patient'] as const
export type MektupTuru = (typeof MEKTUP_TURLERI)[number]

export const MEKTUP_AZAMI = 12_000
export const MBS_ONERI_AZAMI = 8
export const PMS_EXPORT_SURUM = 'au-pms-export-v1'

export const mektupTuruMu = (ham: unknown): ham is MektupTuru =>
  typeof ham === 'string' && (MEKTUP_TURLERI as readonly string[]).includes(ham)
