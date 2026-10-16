/**
 * NOTYA-HASTA-ILETISIMI-01 — bulk-send history. UNIVERSAL (doktor + personel). GET → last 50
 * campaigns with their recipient-level outcome counts; GET ?id=<kampanyaId> → full per-recipient log.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data: kampanya } = await supabase.from('hasta_iletisim_kampanyalari').select('*').eq('id', id).eq('doctor_id', doktorId).maybeSingle()
    if (!kampanya) return NextResponse.json({ error: 'Kampanya bulunamadı.' }, { status: 404 })
    const { data: aliciler } = await supabase
      .from('hasta_iletisim_kampanya_alicilari')
      .select('patient_id, kanal, durum, atlama_sebebi, hata, gonderildi_at')
      .eq('kampanya_id', id)
      .order('gonderildi_at', { ascending: false, nullsFirst: false })
    return NextResponse.json({ kampanya, aliciler: aliciler || [] })
  }

  const { data, error } = await supabase
    .from('hasta_iletisim_kampanyalari')
    .select('id, kanal, konu, govde, hedef_sayisi, durum, tetikleyici, created_at, tamamlanan_at, olusturan_rol')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: 'Geçmiş alınamadı.' }, { status: 500 })

  // Per-campaign outcome counts — one grouped query instead of N+1.
  const idler = (data || []).map((k) => k.id)
  const sayilar = new Map<string, { gonderildi: number; basarisiz: number; atlandi: number }>()
  if (idler.length > 0) {
    const { data: aliciSatirlari } = await supabase
      .from('hasta_iletisim_kampanya_alicilari')
      .select('kampanya_id, durum')
      .in('kampanya_id', idler)
    for (const r of aliciSatirlari || []) {
      const s = sayilar.get(r.kampanya_id) || { gonderildi: 0, basarisiz: 0, atlandi: 0 }
      if (r.durum === 'gonderildi') s.gonderildi++
      else if (r.durum === 'basarisiz') s.basarisiz++
      else if (r.durum === 'atlandi') s.atlandi++
      sayilar.set(r.kampanya_id, s)
    }
  }

  return NextResponse.json({
    kampanyalar: (data || []).map((k) => ({ ...k, sayilar: sayilar.get(k.id) || { gonderildi: 0, basarisiz: 0, atlandi: 0 } })),
  })
}
