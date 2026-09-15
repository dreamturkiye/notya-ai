/**
 * NOTYA-BLE-01 — device readings (Cihaz Köprüsü).
 * POST: record one or more device readings (audit row per reading). The clinical value is NOT written
 *       to notes.vitaller here — the client puts it in the vitals editor and the doctor approves the note,
 *       so the approve endpoint keeps owning vitaller + the learning log ("not onayı = ölçüm onayı").
 * GET:  ?hastaId= → the patient's device readings, newest first (dosya panel).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import type { NotyaOlcum } from '@/core/bluetooth/types'

export const dynamic = 'force-dynamic'

const TURLER = new Set(['ates', 'tansiyon', 'nabiz', 'spo2', 'kilo', 'glukoz'])
const TRANSPORTLAR = new Set(['webbluetooth', 'ioswebble', 'manuel'])

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = (await req.json().catch(() => null)) as { hastaId?: string; notId?: string | null; transport?: string; olcumler?: NotyaOlcum[]; uyumsuz?: { cihazAdi?: string; hata?: string } } | null
  if (!body?.hastaId) return NextResponse.json({ error: 'Hasta seçimi zorunludur' }, { status: 400 })

  // Hasta bu doktorun mu?
  const { data: hasta } = await supabase.from('patients').select('id').eq('id', body.hastaId).eq('doctor_id', user.id).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })

  // Uyumsuz cihaz raporu (standart profil yok) — ölçüm olmadan da kaydedilir, uyumluluk listesi için.
  if (body.uyumsuz) {
    await supabase.from('cihaz_uyumsuzluk_raporlari').insert({ doctor_id: user.id, cihaz_adi: body.uyumsuz.cihazAdi || null, hata: (body.uyumsuz.hata || '').slice(0, 500) })
    return NextResponse.json({ ok: true })
  }

  const olcumler = (body.olcumler || []).filter((o) => o && TURLER.has(o.tur) && typeof o.deger === 'string')
  if (!olcumler.length) return NextResponse.json({ error: 'Ölçüm yok' }, { status: 400 })
  const transport = TRANSPORTLAR.has(body.transport || '') ? body.transport! : 'webbluetooth'

  const satirlar = olcumler.map((o) => ({
    doctor_id: user.id,
    patient_id: body.hastaId,
    note_id: body.notId || null,
    tur: o.tur,
    deger: o.deger,
    birim: o.birim,
    ayrinti: o.ayrinti || {},
    kaynak: o.kaynak || 'ble',
    transport,
    profil: o.profil || null,
    cihaz: o.cihaz || {},
    ham_hex: o.hamHex || null,
    olcum_zamani: o.olcumZamani || null,
    onaylandi: true, // doktor onay kartında "Nota ekle" dedi — bu uç yalnız o anda çağrılır
  }))
  const { data, error } = await supabase.from('cihaz_olcumleri').insert(satirlar).select('id')
  if (error) return NextResponse.json({ error: 'Ölçüm kaydedilemedi' }, { status: 500 })

  // Hatırlanan cihaz (seri no varsa)
  const c = olcumler[0].cihaz
  if (c?.seriNo) {
    await supabase.from('doktor_cihazlar').upsert(
      { doctor_id: user.id, cihaz_adi: c.ad || null, uretici: c.uretici || null, model: c.model || null, seri_no: c.seriNo, profil: olcumler[0].profil || null, son_kullanim: new Date().toISOString() },
      { onConflict: 'doctor_id,seri_no' }
    )
  }
  return NextResponse.json({ ok: true, ids: (data || []).map((r) => r.id) })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const hastaId = req.nextUrl.searchParams.get('hastaId')
  if (!hastaId) return NextResponse.json({ error: 'hastaId gerekli' }, { status: 400 })
  const { data, error } = await supabase
    .from('cihaz_olcumleri')
    .select('id, note_id, tur, deger, birim, ayrinti, belge_id, kaynak, transport, profil, cihaz, olcum_zamani, alindi, onaylandi')
    .eq('doctor_id', user.id).eq('patient_id', hastaId)
    .order('alindi', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: 'Ölçümler alınamadı' }, { status: 500 })
  return NextResponse.json({ olcumler: data || [] })
}
