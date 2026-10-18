import { NextRequest, NextResponse } from 'next/server'
import { klinikBaglam, tokenUret, yoneticiDegil } from '@/lib/klinik/katman/sunucu'
import { epostaDogrula, koltukMusaitMi } from '@/lib/klinik/katman/kurulum'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const baglam = await klinikBaglam(req)
  if ('hata' in baglam) return baglam.hata
  if (!baglam.klinik) return NextResponse.json({ error: 'Klinik yok.' }, { status: 404 })
  if (!baglam.yonetici) return yoneticiDegil()
  const g = await req.json().catch(() => null) as { email?: string } | null
  const hata = epostaDogrula(g?.email || '')
  if (hata) return NextResponse.json({ error: hata }, { status: 400 })
  const email = g!.email!.trim().toLowerCase()
  const bekleyen = await baglam.supabase
    .from('clinic_invitations')
    .select('id, expires_at')
    .eq('clinic_id', baglam.klinik.id)
    .eq('email', email)
    .is('accepted_at', null)
  if (bekleyen.error) return NextResponse.json({ error: 'Davetler okunamadı.' }, { status: 500 })
  const acik = (bekleyen.data || []).filter((d) => Date.parse(d.expires_at) > Date.now())
  if (acik.length) return NextResponse.json({ error: 'Bu e-posta için açık bir davet var.' }, { status: 409 })
  const tumu = await baglam.supabase
    .from('clinic_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', baglam.klinik.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
  if (!koltukMusaitMi({ kapasite: baglam.klinik.seat_count, kullanilan: baglam.klinik.seats_used, bekleyen: tumu.count || 0 })) {
    return NextResponse.json({ error: 'Satın alınan koltuk dolu.' }, { status: 409 })
  }
  const { ham, ozet } = tokenUret()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await baglam.supabase.from('clinic_invitations').insert({
    clinic_id: baglam.klinik.id,
    email,
    role: 'member',
    token_hash: ozet,
    invited_by: baglam.userId,
    expires_at: expires,
  })
  if (error) return NextResponse.json({ error: 'Davet yazılamadı.' }, { status: 500 })
  return NextResponse.json({ email, baglanti: `/klinik/davet?t=${ham}`, expiresAt: expires })
}
