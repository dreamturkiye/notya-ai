/**
 * ASI-KARNESI-01 (C5) — Sağlığım › Aşı Karnesi › "PDF indir" / "Paylaş".
 *
 * Portal token + PIN kilidi (requirePortalUnlock) → YALNIZ o token'ın (hasta, doktor) çiftinin aşı kayıtları.
 * Token yok / süresi dolmuş → 404; PIN açılmamış → 401. Başka bir hastanın kaydı bu yoldan hiçbir kimlikle istenemez:
 * rota dışarıdan hasta kimliği ALMAZ, hasta ve doktor token satırından türetilir (HASTA-IZOLASYON-01).
 * İçerik ve şablon hekimin indirdiğiyle AYNI (lib/asi/karneSunucu + lib/asi/karnePdf). e-Nabız uyarısı PDF'te zorunlu.
 *
 * Kaan (2026-09-19): Notya bu karneyi e-postayla GÖNDERMEZ, adres sormaz, saklamaz. Aile PDF'i indirir; paylaşmak
 * isterse kendi cihazından (Web Share / kendi e-postası) yollar. Bu rota yalnız dosyayı döndürür.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { asiKarnesiVerisi } from '@/lib/asi/karneSunucu'
import { asiKarnesiDoluMu, asiKarnesiDosyaAdi } from '@/lib/asi/karneBelgesi'
import { asiKarnesiPdf } from '@/lib/asi/karnePdf'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })
  const sb = createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })

  const tok = await resolvePortalToken(sb, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })
  const kilit = requirePortalUnlock(req, params.token, tok)
  if (kilit) return kilit

  const karne = await asiKarnesiVerisi(sb, tok.doctor_id, tok.patient_id)
  if (!asiKarnesiDoluMu(karne)) return NextResponse.json({ error: 'Kayıtlı aşı yok.' }, { status: 404 })
  let pdf: Buffer
  try {
    pdf = await asiKarnesiPdf(karne)
  } catch (e) {
    console.error('[asi-karnesi] portal pdf', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PDF şu an oluşturulamadı. Birazdan yeniden deneyin.' }, { status: 500 })
  }
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; ${contentDispositionAd(asiKarnesiDosyaAdi(karne))}`,
      'Cache-Control': 'private, no-store',
    },
  })
}
