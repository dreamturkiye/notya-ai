/**
 * MUAYENE-EKLERI-01 — yüklenen ekin türünü tahmin eder (sezgisel + gerekirse AI). Kimlik: sessionId + belgeId;
 * baglamYukle seans sahipliği + belge visit/hasta eşleşmesini doğrular (HASTA-IZOLASYON).
 */
import { NextRequest, NextResponse } from 'next/server'
import { ekRotaOnKosul } from '@/lib/doktor/muayeneEk/rotaOn'
import { belgeyiSiniflandir } from '@/lib/doktor/muayeneEk/sunucu'
import { ekTuruMu, type EkKaynak } from '@/lib/doktor/muayeneEk/tipler'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { sessionId?: unknown; belgeId?: unknown; kaynak?: unknown; ipucuTur?: unknown } | null
  const on = await ekRotaOnKosul(req, body?.sessionId, body?.belgeId)
  if ('hata' in on) return on.hata
  const kaynak: EkKaynak = body?.kaynak === 'kamera' || body?.kaynak === 'barkod' ? body.kaynak : 'dosya'
  try {
    const s = await belgeyiSiniflandir(on.baglam, kaynak, ekTuruMu(body?.ipucuTur) ? body.ipucuTur : null)
    return NextResponse.json({ siniflandirma: s })
  } catch {
    console.error('[muayene-ekleri] siniflandir basarisiz')
    return NextResponse.json({ error: 'Sınıflandırılamadı.' }, { status: 500 })
  }
}
