/**
 * NOTYA-ASI-STOK-BARKOD-01 — tek aksiyon uygulama: stok düş + muayeneye/karneye yaz + e-Nabız
 * hazır + isteğe bağlı fatura. Sekreter bu klinik kararı onaylayamaz — sadece hekim (karne onayı
 * ile aynı kural, ASI-KARNESI-01).
 * HASTA-IZOLASYON-01: patientId/sessionId/lotId lib/asi/stok/motor.ts içinde doktorId'ye kapsanmadan
 * kullanılmaz (hastaSahibiMi / seansSahibi / `.eq('doktor_id', doktorId)`).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { asiStokModuluAktifMiDoktor } from '@/lib/asi/stok/modul'
import { asiUygula, AsiStokHatasi } from '@/lib/asi/stok/motor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum
  if (!(await asiStokModuluAktifMiDoktor(supabase, doktorId))) {
    return NextResponse.json({ error: 'Aşı Stok ve Barkod Sistemi bu hekim/branş için açık değil.' }, { status: 403 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body?.patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!body.barkod && !body.lotId) return NextResponse.json({ error: 'barkod ya da lotId zorunludur.' }, { status: 400 })

  try {
    const sonuc = await asiUygula(supabase, doktorId, {
      barkod: body.barkod != null ? String(body.barkod) : undefined,
      lotId: body.lotId != null ? String(body.lotId) : undefined,
      patientId: String(body.patientId),
      sessionId: body.sessionId != null ? String(body.sessionId) : null,
      uygulamaBolgesi: body.uygulamaBolgesi != null ? String(body.uygulamaBolgesi) : null,
      faturayaEkle: body.faturayaEkle === true,
    })
    return NextResponse.json(sonuc)
  } catch (e) {
    if (e instanceof AsiStokHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[asi-stok/uygula]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Uygulama kaydedilemedi.' }, { status: 500 })
  }
}
