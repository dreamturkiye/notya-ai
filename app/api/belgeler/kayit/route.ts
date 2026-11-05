/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — POST /api/belgeler/kayit: register what is about to be printed (CORE, every branch).
 *
 *   body { tur, kaynakId, hastaId?, ozet, gerekce? }  →  { durum: 'tamam', kunye } | { durum: 'gerekce_gerekli', kunye }
 *
 * Only the content HASH arrives (computed in the browser); the content never leaves the page. The doctor of the practice
 * (pratikOturum: the doctor, or staff acting for the doctor) owns the document. HASTA-IZOLASYON: a patient id is accepted
 * only when it is the doctor's own patient (hastaSahibiMi) — otherwise 404, the same answer as a patient that does not
 * exist. The doctor's title and name are read on the server (hekimAdi), never taken from the request. Rate-limited per
 * doctor (60 a minute: a print page registers once per content).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hekimAdi } from '@/lib/doktor/hekimAdi'
import { belgeKaydet, type Islev } from '@/lib/belge/sunucu'
import { belgeTuruMu } from '@/lib/belge/belge'
import { hizSiniri } from '@/lib/belge/hizSiniri'

export const dynamic = 'force-dynamic'

const SINIR = hizSiniri(60, 60_000)

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  if (!SINIR.izinli(doktorId)) return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
  const g = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!g || !belgeTuruMu(g.tur) || typeof g.kaynakId !== 'string' || typeof g.ozet !== 'string') {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }
  const hastaId = typeof g.hastaId === 'string' && g.hastaId ? g.hastaId : null
  if (hastaId && !(await hastaSahibiMi(supabase, doktorId, hastaId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const islev: Islev = (ad, a) => supabase.rpc(ad, { ...a, p_ulke: 'tr' })
  const sonuc = await belgeKaydet(islev, {
    doktorId, hastaId, tur: g.tur, kaynakId: g.kaynakId, ozet: g.ozet,
    hekim: (await hekimAdi(supabase, doktorId)) || 'Dr.',
    gerekce: typeof g.gerekce === 'string' ? g.gerekce : null,
  })
  if (sonuc.durum === 'gecersiz') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (sonuc.durum === 'hata') return NextResponse.json({ error: 'Belge numarası alınamadı.' }, { status: 500 })
  return NextResponse.json(sonuc, { headers: { 'Cache-Control': 'no-store' } })
}
