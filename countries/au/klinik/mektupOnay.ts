/**
 * AU-GAP-CLOSE-02 — clinician sign-off register for letter / MBS model prompts.
 *
 * Same pattern as `countries/au/araclar/onaysizAciklar.ts`: prompts ship usable for drafting,
 * but this list is the worklist until a named Australian clinician has read them. Pack tests
 * hold the list to the prompt keys; bump `surum` when prompt text changes.
 */
export type MektupIcerikOnayi = {
  anahtar: 'mektup-gp' | 'mektup-referral' | 'mektup-patient' | 'mbs-oneri'
  /** Bump when the prompt text in mektupTalimatlari.ts changes. */
  surum: string
  /** Named clinician who signed the prompt off; null = nobody yet. */
  klinisyen: string | null
  onayTarihi: string | null
  bakilacak: string
}

export const AU_MEKTUP_ICERIK_ONAYLARI: readonly MektupIcerikOnayi[] = [
  {
    anahtar: 'mektup-gp',
    surum: '2026-11-02-v1',
    klinisyen: null,
    onayTarihi: null,
    bakilacak: 'GP letter prompt: Australian English, invent-nothing rule, placeholder identity, JSON-only answer shape.',
  },
  {
    anahtar: 'mektup-referral',
    surum: '2026-11-02-v1',
    klinisyen: null,
    onayTarihi: null,
    bakilacak: 'Referral letter prompt: urgency only when in the note, invent-nothing, JSON-only.',
  },
  {
    anahtar: 'mektup-patient',
    surum: '2026-11-02-v1',
    klinisyen: null,
    onayTarihi: null,
    bakilacak: 'Patient letter prompt: plain language, no scare wording, invent-nothing, JSON-only.',
  },
  {
    anahtar: 'mbs-oneri',
    surum: '2026-11-02-v1',
    klinisyen: null,
    onayTarihi: null,
    bakilacak: 'MBS suggest prompt: suggest-only / never lodge, invent-no-service, max 5 items, JSON-only.',
  },
]

export const mektupIcerikOnaysizMi = (): boolean =>
  AU_MEKTUP_ICERIK_ONAYLARI.some((x) => !x.klinisyen)
