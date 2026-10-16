/** MUAYENE-EKLERI-01 — hekim türü seçti/onayladı ("Bu nedir?"): kasa kategorisi + hekim bazlı öğrenme. */
import { NextRequest, NextResponse } from 'next/server'
import { ekRotaOnKosul } from '@/lib/doktor/muayeneEk/rotaOn'
import { turuKaydet } from '@/lib/doktor/muayeneEk/sunucu'
import { ekTuruMu, type EkKaynak } from '@/lib/doktor/muayeneEk/tipler'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { sessionId?: unknown; belgeId?: unknown; tur?: unknown; onceki?: unknown; kaynak?: unknown } | null
  const on = await ekRotaOnKosul(req, body?.sessionId, body?.belgeId)
  if ('hata' in on) return on.hata
  if (!ekTuruMu(body?.tur)) return NextResponse.json({ error: 'Geçersiz tür.' }, { status: 400 })
  const kaynak: EkKaynak = body?.kaynak === 'kamera' || body?.kaynak === 'barkod' ? body.kaynak : 'dosya'
  try {
    const r = await turuKaydet(on.baglam, kaynak, body.tur, ekTuruMu(body?.onceki) ? body.onceki : null)
    return NextResponse.json({ tamam: true, ...r })
  } catch {
    console.error('[muayene-ekleri] tur kaydi basarisiz')
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }
}
