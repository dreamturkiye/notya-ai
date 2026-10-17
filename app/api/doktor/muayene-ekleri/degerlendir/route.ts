/**
 * MUAYENE-EKLERI-01 — tek ekin değerlendirmesi (lab / görüntüleme / aşı / genel). Her zaman 200 + sonuç döner;
 * başarısızlık `durum: 'hata'` sonucudur (asla sessiz düşme, asla uydurma). `yeniden: true` açık yeniden değerlendirmedir.
 * Kimlik: sessionId + belgeId → baglamYukle (seans sahipliği + belge/hasta eşleşmesi).
 */
import { NextRequest, NextResponse } from 'next/server'
import { ekRotaOnKosul } from '@/lib/doktor/muayeneEk/rotaOn'
import { ekiDegerlendir } from '@/lib/doktor/muayeneEk/sunucu'
import { ekTuruMu } from '@/lib/doktor/muayeneEk/tipler'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    sessionId?: unknown; belgeId?: unknown; tur?: unknown; yeniden?: unknown; deid?: { mime?: unknown; base64?: unknown } | null
  } | null
  const on = await ekRotaOnKosul(req, body?.sessionId, body?.belgeId)
  if ('hata' in on) return on.hata
  if (!ekTuruMu(body?.tur)) return NextResponse.json({ error: 'Geçersiz tür.' }, { status: 400 })
  const deid = body?.deid && typeof body.deid.base64 === 'string' && body.deid.base64.length < 8_000_000
    ? { mime: String(body.deid.mime || 'image/jpeg'), base64: body.deid.base64 } : null
  const { sonuc, onbellekten } = await ekiDegerlendir(on.baglam, { tur: body.tur, yeniden: body?.yeniden === true, deid })
  return NextResponse.json({ sonuc, onbellekten }, { headers: { 'Cache-Control': 'private, no-store' } })
}
