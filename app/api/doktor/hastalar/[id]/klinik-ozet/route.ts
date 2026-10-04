/**
 * NOTYA-OZET-CIFT-01 — Genel Özet + Son muayene özetini yeniden hesapla.
 * POST: onay sonrası veya Özet sekmesi boşsa istemci yeniler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaKlinikOzetleriGuncelle } from '@/lib/doktor/hastaKlinikOzet'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const patientId = params.id
  if (!patientId) return NextResponse.json({ error: 'Hasta id gerekli' }, { status: 400 })

  const sonuc = await hastaKlinikOzetleriGuncelle(supabase, user.id, patientId)
  if (!sonuc) return NextResponse.json({ error: 'Özetler güncellenemedi.' }, { status: 500 })
  return NextResponse.json({
    genel_ozet: sonuc.genelOzet,
    son_muayene_ozeti: sonuc.sonMuayeneOzeti,
  })
}
