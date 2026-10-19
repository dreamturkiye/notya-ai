import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import type { KlinikKohortSatir } from '@/lib/klinik/klinikKayit'
import { kohortAcilBirlestir, type PlanAcilSatiri } from '@/lib/klinik/kohortAcil'
import { vadeKohort as sacVade } from '@/specialties/sac-ekimi/engines/kohort'
import { dosyaOncelik as sacDosya } from '@/specialties/sac-ekimi/engines/dosya'
import { vadeKohort as cerVade } from '@/specialties/estetik-cerrahi/engines/kohort'
import { dosyaOncelik as cerDosya } from '@/specialties/estetik-cerrahi/engines/dosya'
import { vadeKohort as estVade } from '@/specialties/medikal-estetik/engines/kohort'
import { dosyaOncelik as estDosya } from '@/specialties/medikal-estetik/engines/dosya'
import { vadeKohort as dermVade } from '@/specialties/klinik-dermatoloji/engines/kohort'
import { dosyaOncelik as dermDosya } from '@/specialties/klinik-dermatoloji/engines/dosya'
import { vadeKohort as longVade } from '@/specialties/longevity/engines/kohort'
import { dosyaOncelik as longDosya } from '@/specialties/longevity/engines/dosya'
import { vadeKohort as fizVade } from '@/specialties/fizyoterapi/engines/kohort'
import { dosyaOncelik as fizDosya } from '@/specialties/fizyoterapi/engines/dosya'
import { vadeKohort as psiVade } from '@/specialties/klinik-psikolog/engines/kohort'
import { dosyaOncelik as psiDosya } from '@/specialties/klinik-psikolog/engines/dosya'
import { vadeKohort as diyVade } from '@/specialties/diyetisyen/engines/kohort'
import { dosyaOncelik as diyDosya } from '@/specialties/diyetisyen/engines/dosya'
import { vadeKohort as ergVade } from '@/specialties/ergoterapi/engines/kohort'
import { dosyaOncelik as ergDosya } from '@/specialties/ergoterapi/engines/dosya'
import { vadeKohort as odyVade } from '@/specialties/odyoloji/engines/kohort'
import { dosyaOncelik as odyDosya } from '@/specialties/odyoloji/engines/dosya'

type VadeFn = (vadeler: Array<{ iso?: string; ad?: string }>, bugun: string) => Array<{ durum: 'gecikti' | 'bugun' | 'yaklasiyor'; ozet: string; vade: string }>
type DosyaFn = (acil: string | null, riza: boolean) => '112' | 'riza-eksik' | 'izlem'

const VADE: Record<KlinikYeniSlug, VadeFn> = {
  'sac-ekimi': sacVade,
  'estetik-cerrahi': cerVade,
  'medikal-estetik': estVade,
  'klinik-dermatoloji': dermVade,
  longevity: longVade,
  fizyoterapi: fizVade,
  'klinik-psikolog': psiVade,
  diyetisyen: diyVade,
  ergoterapi: ergVade,
  odyoloji: odyVade,
}

const DOSYA: Record<KlinikYeniSlug, DosyaFn> = {
  'sac-ekimi': sacDosya,
  'estetik-cerrahi': cerDosya,
  'medikal-estetik': estDosya,
  'klinik-dermatoloji': dermDosya,
  longevity: longDosya,
  fizyoterapi: fizDosya,
  'klinik-psikolog': psiDosya,
  diyetisyen: diyDosya,
  ergoterapi: ergDosya,
  odyoloji: odyDosya,
}

export type PlanKohortSatiri = PlanAcilSatiri & {
  slug?: string | null
  riza?: boolean | null
  vadeler?: Array<{ iso?: string; ad?: string }> | null
}

function slugMu(s: string): s is KlinikYeniSlug {
  return s in VADE
}

/** Dalın kendi kohortu. Bilinmeyen slug saça düşmez. */
export function ozelKohortBirlestir(
  satirlar: KlinikKohortSatir[],
  planlar: PlanKohortSatiri[],
  adlar: ReadonlyMap<string, string>,
  bugun: string,
): KlinikKohortSatir[] {
  const out = kohortAcilBirlestir(satirlar, planlar, adlar)
  const rizaVar = new Set(out.filter((s) => s.durum === 'riza-eksik').map((s) => s.patientId))
  const vadeVar = new Set(out.filter((s) => s.vade).map((s) => `${s.patientId}|${s.vade}`))
  for (const p of planlar) {
    const id = String(p.patient_id || '')
    const slug = String(p.slug || '')
    if (!id || !slugMu(slug)) continue
    const ad = adlar.get(id) || 'Hasta'
    if (DOSYA[slug](p.acil ?? null, p.riza !== false) === 'riza-eksik' && !rizaVar.has(id)) {
      out.push({ patientId: id, ad, durum: 'riza-eksik', ozet: 'Plan rızası eksik' })
      rizaVar.add(id)
    }
    for (const s of VADE[slug](p.vadeler || [], bugun)) {
      const anahtar = `${id}|${s.vade}`
      if (vadeVar.has(anahtar)) continue
      vadeVar.add(anahtar)
      out.push({ patientId: id, ad, durum: s.durum, ozet: s.ozet, vade: s.vade })
    }
  }
  return out
}
