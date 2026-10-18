'use client'
import type { ReactElement } from 'react'
import type { AracCikti, AracTanim } from '@/lib/klinik/ozelAracCalistir'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { SacTuval } from '@/specialties/sac-ekimi/ui/Tuval'
import { CerrahiTuval } from '@/specialties/estetik-cerrahi/ui/Tuval'
import { MedikalTuval } from '@/specialties/medikal-estetik/ui/Tuval'
import { DermTuval } from '@/specialties/klinik-dermatoloji/ui/Tuval'
import { LongTuval } from '@/specialties/longevity/ui/Tuval'
import { FizyoTuval } from '@/specialties/fizyoterapi/ui/Tuval'
import { PsikTuval } from '@/specialties/klinik-psikolog/ui/Tuval'
import { DiyetTuval } from '@/specialties/diyetisyen/ui/Tuval'
import { ErgoTuval } from '@/specialties/ergoterapi/ui/Tuval'
import { OdyoTuval } from '@/specialties/odyoloji/ui/Tuval'

export type OzelTuvalProps = { tanim: AracTanim; sonuc: AracCikti; bugun: string }

export const OZEL_TUVAL: Record<KlinikYeniSlug, (p: OzelTuvalProps) => ReactElement> = {
  'sac-ekimi': SacTuval,
  'estetik-cerrahi': CerrahiTuval,
  'medikal-estetik': MedikalTuval,
  'klinik-dermatoloji': DermTuval,
  longevity: LongTuval,
  fizyoterapi: FizyoTuval,
  'klinik-psikolog': PsikTuval,
  diyetisyen: DiyetTuval,
  ergoterapi: ErgoTuval,
  odyoloji: OdyoTuval,
}
