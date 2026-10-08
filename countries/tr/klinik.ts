/**
 * NOTYA-UZ-MUAYENE-01 — Türkiye brings nothing through the clinical door (countries/active/klinik).
 * Its visit — live recording, transcription, the note engine — is the pre-split application's own pipeline
 * (app/api/sessions, lib/doktor/soapUret.ts), untouched and not routed through a pack. It moves here when that
 * surface is split (docs/COUNTRY-PACK-SPLIT-PLAN.md, phase 3).
 */
import type { UlkeKlinigi } from '@/lib/ulke/tipler'

export const TR_KLINIK: UlkeKlinigi | null = null
