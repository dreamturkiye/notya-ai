/**
 * NOTYA-RANDEVU-V2 PR2 — Entegrasyonlar › Google Takvim (doctor only: it is the doctor's own Google account).
 * GET    → { hazir, bagli, durum, adres, tamAd, sonSenk }   hazir:false = feature dormant (no credentials) → card hidden
 * PATCH  { tamAd }                                         full patient name in event titles (default off, KVKK)
 * DELETE                                                   disconnect
 * Scoped by doktorOturum().user.id; the refresh token is never selected into a response.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { googleTakvimHazirMi } from '@/lib/randevu/v2/google/istemci'
import { baglantiGetir, baglantiyiKes, googleaGonder } from '@/lib/randevu/v2/google/senk'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!googleTakvimHazirMi()) return NextResponse.json({ hazir: false })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const b = await baglantiGetir(oturum.supabase, oturum.user.id)
  return NextResponse.json({
    hazir: true,
    bagli: !!b,
    durum: b?.durum ?? null,
    adres: b?.adres ?? null,
    tamAd: !!b?.tam_ad,
    sonSenk: b?.son_senk ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  if (!googleTakvimHazirMi()) return NextResponse.json({ error: 'Google Takvim henüz açık değil.' }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, user } = oturum
  const b = (await req.json().catch(() => ({}))) as { tamAd?: unknown }
  if (typeof b.tamAd !== 'boolean') return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  const { error } = await supabase.from('google_takvim_baglantilari').update({ tam_ad: b.tamAd, updated_at: new Date().toISOString() }).eq('doktor_id', user.id)
  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  // Re-title upcoming events now (soonest first, within ~20 s); later ones get the new title when next pushed.
  const { data: es } = await supabase.from('randevu_google_eslesme').select('randevu_id').eq('doktor_id', user.id).eq('durum', 'aktif')
    .gt('bitis', new Date().toISOString()).order('baslangic', { ascending: true }).limit(100)
  const son = Date.now() + 20_000
  for (const x of es || []) {
    if (Date.now() > son) break
    await googleaGonder(supabase, user.id, String(x.randevu_id), true)
  }
  return NextResponse.json({ tamAd: b.tamAd })
}

export async function DELETE(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  await baglantiyiKes(oturum.supabase, oturum.user.id)
  return NextResponse.json({ bagli: false })
}
