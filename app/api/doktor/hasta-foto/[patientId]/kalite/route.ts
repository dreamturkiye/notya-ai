/**
 * FOTO-AI-01 — pre-save photo quality gate (doctor only). The photo is NOT stored yet.
 *   POST /api/doktor/hasta-foto/[patientId]/kalite   { gorsel: <downscaled JPEG/PNG data URL> }
 * Answers blur / lighting / framing / scale-reference / region-identifiable plus "Çekimi yenileyin" when it is too poor.
 * Advisory only: when the gate cannot run the photo can still be saved. Nothing is cached or stored.
 */
import { NextRequest } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { fotoAiAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { bulunamadi, gecersiz, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
import { doktorBransAnahtari, gorselCoz, kaliteOnKontrol } from '@/lib/doktor/muayeneEk/foto/fotoServis'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type Ctx = { params: { patientId: string } | Promise<{ patientId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoAiAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { patientId } = await ctx.params
  if (!idlerGecerli(patientId)) return bulunamadi()
  const govde = (await jsonGovde(req, 4_000_000)) as Record<string, unknown> | null
  if (!govde || typeof govde !== 'object') return gecersiz('Geçersiz istek.')
  const g = gorselCoz(govde.gorsel)
  if ('hata' in g) return gecersiz(g.hata)
  if (!(await hastaSahibiMi(oturum.supabase, oturum.doktorId, patientId))) return bulunamadi()
  const brans = await doktorBransAnahtari(oturum.supabase, oturum.doktorId)
  const s = await kaliteOnKontrol(oturum.supabase, oturum.doktorId, brans, g.gorsel)
  try { await logFotoOlayi(oturum.user.id, 'ai_kalite', patientId, { patientId }, req) } catch { /* never blocks */ }
  return yanit(s, s.durum === 'kota' ? 429 : 200)
}
