/**
 * ESNEK-MUAYENE-A — shared route prologue for app/api/doktor/el-notu/*: practice session (doctor or staff, scoped by
 * doktorId — hasta-izolasyon) + the doctor's El Notu preferences + the in-route permission decision.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, type PratikOturum } from '@/lib/doktor/pratikOturum'
import { ayarYukle, elNotuErisimi, type ElNotuAyari } from './sunucu'

export type ElNotuIstegi = PratikOturum & { ayar: ElNotuAyari; aktor: { userId: string; rol: PratikOturum['rol'] } }

export async function elNotuIstegi(req: NextRequest, eylem: 'hazirla' | 'kesinlestir' | 'doktor'): Promise<ElNotuIstegi | { hata: NextResponse }> {
  const o = await pratikOturum(req)
  if ('hata' in o) return o
  if (eylem === 'doktor' && o.rol !== 'doktor') return { hata: NextResponse.json({ error: 'Bu işlem yalnızca doktor hesabı içindir.' }, { status: 403 }) }
  const ayar = await ayarYukle(o.supabase, o.doktorId)
  if (eylem !== 'doktor') { const red = elNotuErisimi(o.rol, ayar, eylem); if (red) return { hata: red } }
  return { ...o, ayar, aktor: { userId: o.user.id, rol: o.rol } }
}

export const json = (veri: unknown, durum = 200) => NextResponse.json(veri, { status: durum })
export const uuidMu = (x: unknown): x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)
