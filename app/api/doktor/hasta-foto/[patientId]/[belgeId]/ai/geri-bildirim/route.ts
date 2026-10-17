/**
 * FOTO-AI-01 — the doctor's answer to one item of an evaluation: Kabul / Düzelt / Reddet (doctor only).
 *   POST /api/doktor/hasta-foto/[patientId]/[belgeId]/ai/geri-bildirim   { gozlemAnahtari, karar, duzeltme? }
 * The learning feature is derived on the server from the stored evaluation; the client can only name an item that exists in it.
 * The correction text is stored encrypted; learning keeps counters only. Nothing here touches the clinical note.
 */
import { NextRequest } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { fotoAiAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, yanit } from '@/lib/doktor/fotoArsiv/rota'
import { aiBaglamYukle, geriBildirimIsle } from '@/lib/doktor/muayeneEk/foto/fotoServis'
import { kararMi } from '@/lib/doktor/muayeneEk/foto/ogrenme'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: { patientId: string; belgeId: string } | Promise<{ patientId: string; belgeId: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoAiAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { patientId, belgeId } = await ctx.params
  if (!idlerGecerli(patientId, belgeId)) return bulunamadi()
  const g = (await jsonGovde(req, 20_000)) as Record<string, unknown> | null
  if (!g || typeof g.gozlemAnahtari !== 'string' || g.gozlemAnahtari.length > 90 || !kararMi(g.karar)) return gecersiz('Geçersiz istek.')
  const c = await aiBaglamYukle(oturum.supabase, oturum.doktorId, patientId, belgeId)
  if (!c) return bulunamadi()
  try {
    const s = await geriBildirimIsle(c, { gozlemAnahtari: g.gozlemAnahtari, karar: g.karar, duzeltme: typeof g.duzeltme === 'string' ? g.duzeltme : null })
    if (s.durum === 'yok') return bulunamadi()
    if (s.durum === 'gecersiz') return gecersiz(s.mesaj)
    if (s.durum === 'hata') return yanit({ error: s.mesaj }, 500)
    try { await logFotoOlayi(oturum.user.id, 'geri_bildirim', belgeId, { patientId }, req) } catch { /* never blocks */ }
    return yanit(s)
  } catch (e) { return hataYaniti(e) }
}
