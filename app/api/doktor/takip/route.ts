/**
 * NOTYA-TAKIP-01 — GET /api/doktor/takip  (pratik: doktor + sekreter)
 *                 PATCH { id, islem: 'kapat' } — manuel close (aranıldı / iptal)
 *
 * Returns open follow-up cases after a light sync with gelmedi / sevkler / future appts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import {
  takipAcikListe,
  takipBaslik,
  takipKapatId,
  takipSenkronize,
  takipSirala,
  takipTuruMu,
} from '@/lib/doktor/takip'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  await takipSenkronize(supabase, doktorId)
  const bugun = bugunTrIso()
  const url = new URL(req.url)
  const tur = url.searchParams.get('tur')
  const turler = tur && takipTuruMu(tur) ? [tur] : undefined
  const liste = takipSirala(
    await takipAcikListe(supabase, doktorId, { turler, isimlerle: true, limit: 100 }),
    bugun,
  )

  return NextResponse.json({
    bugun,
    toplam: liste.length,
    ogeler: liste.map((t) => ({
      id: t.id,
      tur: t.tur,
      patientId: t.patientId,
      hastaAdi: t.hastaAdi || 'Hasta',
      baslik: takipBaslik(t, bugun),
      ozet: t.ozet,
      vade: t.vade,
      kosullu: t.kosullu,
      hedefYol: t.tur === 'konsultasyon'
        ? `/dashboard/doktor/hastalar/${t.patientId}`
        : t.tur === 'gelmedi'
          ? '/dashboard/doktor/randevular'
          : `/dashboard/doktor/randevular?yeni=1&hasta=${t.patientId}`,
      createdAt: t.createdAt,
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const b = (await req.json().catch(() => ({}))) as { id?: string; islem?: string }
  if (!b.id || b.islem !== 'kapat') {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }
  const ok = await takipKapatId(supabase, doktorId, String(b.id), 'manuel')
  if (!ok) return NextResponse.json({ error: 'Takip kapatılamadı.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
