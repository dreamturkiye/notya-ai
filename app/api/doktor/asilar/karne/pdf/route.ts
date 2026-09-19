/**
 * ASI-KARNESI-01 (C7) — hasta dosyası › Aşılar › PDF indir / Paylaş / Yazdır (aile poliklinikte isterse hekim basıp verir).
 * Sağlığım'daki karneyle AYNI üretici ve AYNI içerik (lib/asi/karneSunucu + lib/asi/karnePdf) — ikinci şablon yok.
 *
 * pratikOturum: hekim ya da sekreteri (asilar GET ile aynı erişim); kapsam her zaman doktorId.
 * HASTA-IZOLASYON-01: patientId dışarıdan gelir → hastaSahibiMi, sonra her okuma (doktor, hasta) ile daraltılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { asiKarnesiVerisi } from '@/lib/asi/karneSunucu'
import { asiKarnesiDoluMu, asiKarnesiDosyaAdi } from '@/lib/asi/karneBelgesi'
import { asiKarnesiPdf } from '@/lib/asi/karnePdf'
import { contentDispositionAd } from '@/lib/vault/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const karne = await asiKarnesiVerisi(supabase, doktorId, patientId)
  if (!asiKarnesiDoluMu(karne)) return NextResponse.json({ error: 'Kayıtlı aşı yok.' }, { status: 404 })
  let pdf: Buffer
  try {
    pdf = await asiKarnesiPdf(karne)
  } catch (e) {
    console.error('[asi-karnesi] hekim pdf', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'PDF şu an oluşturulamadı.' }, { status: 500 })
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
