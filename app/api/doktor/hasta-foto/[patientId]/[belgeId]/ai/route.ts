/**
 * FOTO-AI-01 — decision-support evaluation of ONE clinical photo (doctor only; NOTYA_FOTO_AI=off closes it).
 *   GET  /api/doktor/hasta-foto/[patientId]/[belgeId]/ai    the stored evaluation, WITHOUT calling the model
 *   POST /api/doktor/hasta-foto/[patientId]/[belgeId]/ai    { gorsel: <downscaled JPEG/PNG data URL>, bolgeIpucu?, yenile? }
 * The answer is a decision-support aid, never a diagnosis, and is never written into the signed note. The image that
 * reaches the model is a downscaled, metadata-stripped derivative; results are cached by original-image hash + prompt version.
 */
import { NextRequest } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { fotoAiAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { bolgeIdMi } from '@/lib/doktor/fotoArsiv/bolgeler'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
import { aiBaglamYukle, FOTO_AI_ROTA_SURESI_SN, gorselCoz, tekDegerlendir, tekDegerlendirmeOku } from '@/lib/doktor/muayeneEk/foto/fotoServis'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

type Ctx = { params: { patientId: string; belgeId: string } | Promise<{ patientId: string; belgeId: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!fotoAiAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const c = await aiBaglamYukle(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!c) return bulunamadi()
  return yanit(await tekDegerlendirmeOku(c, belgeId))
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoAiAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const govde = (await jsonGovde(req, 4_000_000)) as Record<string, unknown> | null
  if (!govde || typeof govde !== 'object') return gecersiz('Geçersiz istek.')
  const g = gorselCoz(govde.gorsel)
  if ('hata' in g) return gecersiz(g.hata)
  const c = await aiBaglamYukle(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!c) return bulunamadi()
  try {
    const bolgeIpucu = bolgeIdMi(govde.bolgeIpucu) ? govde.bolgeIpucu : null
    const s = await tekDegerlendir(c, { turev: g.gorsel, bolgeIpucu, yenile: govde.yenile === true })
    if (s.durum === 'yok') return bulunamadi()
    if (s.durum === 'tamam') {
      try { await logFotoOlayi(oturum.user.id, 'ai_degerlendirme', belgeId, { patientId, surum: s.gorunum.uretim.surum, model: s.gorunum.uretim.model, kaynak: s.gorunum.uretim.kaynak }, req) } catch { /* never blocks */ }
    }
    return yanit(s, s.durum === 'kota' ? 429 : s.durum === 'hata' ? 502 : 200)
  } catch (e) { return hataYaniti(e) }
}
