/**
 * PLAN-ONBOARDING-01 (Kaan, 2026-11-07) — has this account really finished onboarding? The fields the onboarding form
 * requires on a first save (lib/onboarding/profilDogrula.ts, ilkKayit), read back from the stored users row + auth
 * metadata. Used by PUT /api/users/trial: starting the trial no longer marks an account "onboarded" by itself — only an
 * account whose required answers are on record is marked. (Before this, a trial start set onboarding_completed for
 * anyone, so an account could reach the doctor app without name, mobile number or consent.)
 */
import { HEKIM_MESLEKLERI } from './kayitBransi'
import { kayitliBransVarMi } from './bransKapisi'
import { kvkkKayitliMi } from './kvkkOnay'
import { MESLEK_TURLERI } from './profilDogrula'

const dolu = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0

export type OnboardingSatiri = {
  profession_type?: unknown
  specialty?: unknown
  title?: unknown
  first_name?: unknown
  last_name?: unknown
  cep_telefonu?: unknown
  gender?: unknown
  addressing_preference?: unknown
  kvkk_consent_at?: unknown
}

/** The required field still missing first, or null when everything onboarding requires is on record. */
export function onboardingEksigi(satir: OnboardingSatiri | null | undefined, meta: Record<string, unknown> | null | undefined): string | null {
  const s = satir || {}
  const meslek = typeof s.profession_type === 'string' ? s.profession_type : ''
  if (!MESLEK_TURLERI.includes(meslek)) return 'profession_type'
  if (HEKIM_MESLEKLERI.includes(meslek) ? !kayitliBransVarMi(s.specialty) : !dolu(s.specialty)) return 'specialty'
  if (meslek === 'doktor' && !dolu(s.title)) return 'title'
  if (!dolu(s.first_name)) return 'first_name'
  if (!dolu(s.last_name)) return 'last_name'
  if (!dolu(s.cep_telefonu)) return 'cep_telefonu'
  if (!dolu(s.gender)) return 'gender'
  if (!dolu(s.addressing_preference)) return 'addressing_preference'
  if (!kvkkKayitliMi(s.kvkk_consent_at, meta)) return 'kvkk'
  return null
}

export const onboardingAlanlariTamamMi = (satir: OnboardingSatiri | null | undefined, meta: Record<string, unknown> | null | undefined): boolean =>
  onboardingEksigi(satir, meta) === null
