import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import { yetkiDogrula, type YetkiSatiri } from '@/lib/klinik/katman/yetki'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { satirlar?: YetkiSatiri[] } | null
  const satirlar = g?.satirlar || []
  const hata = yetkiDogrula(satirlar)
  if (hata) return NextResponse.json({ error: hata }, { status: 400 })
  const yaz = satirlar.map((s) => ({
    clinic_id: baglam.klinik!.id, rol: s.rol, modul: s.modul, oku: s.oku, yaz: s.yaz, sil: s.sil,
  }))
  const { error } = await baglam.supabase.from('clinic_yetkileri').upsert(yaz)
  if (error) return NextResponse.json({ error: 'Yetkiler kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
