import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { STUDYO_KILIT as SAC } from '@/specialties/sac-ekimi/ui/sonuc'
import { STUDYO_KILIT as CER } from '@/specialties/estetik-cerrahi/ui/sonuc'
import { STUDYO_KILIT as EST } from '@/specialties/medikal-estetik/ui/sonuc'
import { STUDYO_KILIT as DERM } from '@/specialties/klinik-dermatoloji/ui/sonuc'
import { STUDYO_KILIT as LONG } from '@/specialties/longevity/ui/sonuc'
import { STUDYO_KILIT as FIZ } from '@/specialties/fizyoterapi/ui/sonuc'
import { STUDYO_KILIT as PSI } from '@/specialties/klinik-psikolog/ui/sonuc'
import { STUDYO_KILIT as DIY } from '@/specialties/diyetisyen/ui/sonuc'
import { STUDYO_KILIT as ERG } from '@/specialties/ergoterapi/ui/sonuc'
import { STUDYO_KILIT as ODY } from '@/specialties/odyoloji/ui/sonuc'

export const STUDYO_KOPYA: Record<KlinikYeniSlug, string> = {
  'sac-ekimi': SAC,
  'estetik-cerrahi': CER,
  'medikal-estetik': EST,
  'klinik-dermatoloji': DERM,
  longevity: LONG,
  fizyoterapi: FIZ,
  'klinik-psikolog': PSI,
  diyetisyen: DIY,
  ergoterapi: ERG,
  odyoloji: ODY,
}
