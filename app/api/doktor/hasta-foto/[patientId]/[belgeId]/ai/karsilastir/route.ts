/**
 * FOTO-AI-01 — change detection between this photo and an earlier photo of the same patient (doctor only).
 *   GET  /api/doktor/hasta-foto/[patientId]/[belgeId]/ai/karsilastir?onceki=<belgeId>   stored comparison, no model call
 *   POST same URL  { onceki, gorsel, oncekiGorsel, yenile? }   the two downscaled derivatives
 * Both photos are proved against the patient AND the doctor; the previous photo of a foreign patient answers 404.
 */
import { NextRequest } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { fotoAiAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
import { aiBaglamYukle, gorselCoz, karsilastir, karsilastirmaOku } from '@/lib/doktor/muayeneEk/foto/fotoServis'
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
  const onceki = req.nextUrl.searchParams.get('onceki') || ''
  if (!idlerGecerli(patientId, belgeId, onceki)) return bulunamadi()
  const c = await aiBaglamYukle(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!c) return bulunamadi()
  return yanit(await karsilastirmaOku(c, onceki))
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoAiAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const govde = (await jsonGovde(req, 8_000_000)) as Record<string, unknown> | null
  if (!govde || typeof govde !== 'object') return gecersiz('Geçersiz istek.')
  if (!idlerGecerli(govde.onceki)) return bulunamadi()
  const sonraki = gorselCoz(govde.gorsel)
  if ('hata' in sonraki) return gecersiz(sonraki.hata)
  const onceki = gorselCoz(govde.oncekiGorsel)
  if ('hata' in onceki) return gecersiz(onceki.hata)
  const c = await aiBaglamYukle(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!c) return bulunamadi()
  try {
    const s = await karsilastir(c, { oncekiBelgeId: String(govde.onceki), onceki: onceki.gorsel, sonraki: sonraki.gorsel, yenile: govde.yenile === true })
    if (s.durum === 'yok') return bulunamadi()
    if (s.durum === 'tamam') {
      try { await logFotoOlayi(oturum.user.id, 'ai_karsilastirma', belgeId, { patientId, surum: s.uretim.surum, model: s.uretim.model, kaynak: s.uretim.kaynak }, req) } catch { /* never blocks */ }
    }
    return yanit(s, s.durum === 'kota' ? 429 : s.durum === 'hata' ? 502 : 200)
  } catch (e) { return hataYaniti(e) }
}
