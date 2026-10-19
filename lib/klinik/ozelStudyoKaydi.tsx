'use client'
import type { ReactNode } from 'react'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { SacStudyo } from '@/specialties/sac-ekimi/ui/Studyo'
import { CerrahiStudyo } from '@/specialties/estetik-cerrahi/ui/Studyo'
import { MedikalStudyo } from '@/specialties/medikal-estetik/ui/Studyo'
import { DermStudyo } from '@/specialties/klinik-dermatoloji/ui/Studyo'
import { LongStudyo } from '@/specialties/longevity/ui/Studyo'
import { FizyoStudyo } from '@/specialties/fizyoterapi/ui/Studyo'
import { PsikStudyo } from '@/specialties/klinik-psikolog/ui/Studyo'
import { DiyetStudyo } from '@/specialties/diyetisyen/ui/Studyo'
import { ErgoStudyo } from '@/specialties/ergoterapi/ui/Studyo'
import { OdyoStudyo } from '@/specialties/odyoloji/ui/Studyo'

export type OzelStudyoCerceve = (p: { route: string; children: ReactNode }) => ReactNode

export const OZEL_STUDYO: Record<KlinikYeniSlug, OzelStudyoCerceve> = {
  'sac-ekimi': SacStudyo,
  'estetik-cerrahi': CerrahiStudyo,
  'medikal-estetik': MedikalStudyo,
  'klinik-dermatoloji': DermStudyo,
  longevity: LongStudyo,
  fizyoterapi: FizyoStudyo,
  'klinik-psikolog': PsikStudyo,
  diyetisyen: DiyetStudyo,
  ergoterapi: ErgoStudyo,
  odyoloji: OdyoStudyo,
}
