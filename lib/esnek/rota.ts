/**
 * ESNEK-MUAYENE-B — prologue of the doctor-only Phase B routes (app/api/doktor/esnek/*): practice session, doctor only
 * (sadeceDoktor), every query scoped by doktorId (hasta-izolasyon).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor, type PratikOturum } from '@/lib/doktor/pratikOturum'

export async function hekimIstegi(req: NextRequest): Promise<PratikOturum | { hata: NextResponse }> {
  const o = await pratikOturum(req)
  if ('hata' in o) return o
  const engel = sadeceDoktor(o)
  if (engel) return { hata: engel }
  return o
}

export const json = (veri: unknown, durum = 200) => NextResponse.json(veri, { status: durum })
export const uuidMu = (x: unknown): x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)
