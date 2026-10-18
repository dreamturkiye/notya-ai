import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, klinikHesabiniBagla, tokenOzet } from '@/lib/klinik/katman/sunucu'
import { koltukMusaitMi } from '@/lib/klinik/katman/kurulum'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (baglam.klinik) return NextResponse.json({ error: 'Bu hesap zaten bir kliniğe bağlı.' }, { status: 409 })
  const g = await req.json().catch(() => null) as { token?: string } | null
  const token = (g?.token || '').trim()
  if (token.length < 16) return NextResponse.json({ error: 'Davet bulunamadı.' }, { status: 404 })
  const davet = await baglam.supabase
    .from('clinic_invitations')
    .select('id, clinic_id, email, role, invited_by, expires_at, accepted_at')
    .eq('token_hash', tokenOzet(token))
    .maybeSingle()
  if (davet.error || !davet.data || davet.data.accepted_at || Date.parse(davet.data.expires_at) <= Date.now()) {
    return NextResponse.json({ error: 'Davet bulunamadı.' }, { status: 404 })
  }
  const klinik = await baglam.supabase.from('clinics').select('id, seat_count, seats_used, is_active').eq('id', davet.data.clinic_id).maybeSingle()
  if (klinik.error || !klinik.data?.is_active) return NextResponse.json({ error: 'Klinik bulunamadı.' }, { status: 404 })
  if (!koltukMusaitMi({ kapasite: klinik.data.seat_count, kullanilan: klinik.data.seats_used, bekleyen: 0 })) {
    return NextResponse.json({ error: 'Satın alınan koltuk dolu.' }, { status: 409 })
  }
  const yonetici = davet.data.role === 'admin'
  const uye = await baglam.supabase.from('clinic_members').insert({
    clinic_id: klinik.data.id,
    user_id: baglam.userId,
    role: yonetici ? 'admin' : 'member',
    koltuk: true,
    is_active: true,
    invited_by: davet.data.invited_by,
  })
  if (uye.error) return NextResponse.json({ error: 'Koltuk bağlanamadı.' }, { status: 409 })
  await baglam.supabase.from('clinics').update({ seats_used: klinik.data.seats_used + 1 }).eq('id', klinik.data.id)
  await baglam.supabase.from('clinic_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', davet.data.id)
  await klinikHesabiniBagla(baglam.supabase, baglam.userId, klinik.data.id, yonetici)
  return NextResponse.json({ klinikId: klinik.data.id })
}
