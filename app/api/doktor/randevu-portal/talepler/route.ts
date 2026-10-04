/**
 * NOTYA-RANDEVU-V2 — patient appointment requests for the practice (doktor + sekreter: appointment logistics,
 * the secretary's scope as today).
 *
 * GET               → { acik, talepler } — open requests, escalated / past-due first. Never silently dropped.
 * GET ?slotlar=<id> → free times for "Başka saat öner" (same length as the request; the request itself excluded).
 * POST { id, islem: 'onayla' | 'oner' | 'reddet', baslangic? }
 *
 * HASTA-IZOLASYON: the request is resolved by id AND doktor_id (pratikOturum().doktorId) in one query inside
 * lib/randevu/v2/sunucu.ts; a foreign id is 404. Names are decrypted only for patients.doctor_id = doktorId.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { gunlereAyir } from '@/lib/randevu/v2/slot'
import { ayarGetir, isleriCalistir, musaitSlotlar, pratikIslem, talepListesi, type PratikIslemi } from '@/lib/randevu/v2/sunucu'

export const dynamic = 'force-dynamic'

const ISLEMLER: readonly PratikIslemi[] = ['onayla', 'oner', 'reddet']

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const slotIcin = new URL(req.url).searchParams.get('slotlar')
  if (slotIcin) {
    const { data: r } = await supabase.from('randevular').select('id, baslangic, bitis, durum')
      .eq('id', slotIcin).eq('doktor_id', doktorId).maybeSingle()
    if (!r || r.durum !== 'talep') return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 })
    const ayar = await ayarGetir(supabase, doktorId)
    const sure = Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / 60000))
    // The practice answers now, so its own minimum-notice rule does not hide today's free times.
    const slotlar = await musaitSlotlar(supabase, doktorId, { ...ayar, minBildirimSaat: 0 }, sure, Date.now(), r.id)
    if (!slotlar) return NextResponse.json({ error: 'Uygun saatler alınamadı.' }, { status: 500 })
    return NextResponse.json({ gunler: gunlereAyir(slotlar).slice(0, 14) })
  }

  const liste = await talepListesi(supabase, doktorId)
  if (!liste) return NextResponse.json({ error: 'Talepler alınamadı.' }, { status: 500 })
  return NextResponse.json(liste)
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol } = oturum

  const b = (await req.json().catch(() => ({}))) as { id?: string; islem?: string; baslangic?: string }
  const islem = String(b.islem || '') as PratikIslemi
  if (!b.id || !ISLEMLER.includes(islem)) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const s = await pratikIslem(supabase, { doktorId, randevuId: String(b.id), islem, baslangic: b.baslangic, yapan: rol, yapanId: user.id })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  // Tell the patient now rather than at the next cron tick (quiet hours still hold it until morning).
  await isleriCalistir(supabase, { randevuId: s.randevu.id, doktorId, limit: 5, bitis: Date.now() + 15_000 })
  return NextResponse.json({ ok: true, durum: s.randevu.durum, baslangic: s.randevu.baslangic })
}
