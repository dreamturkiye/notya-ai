/**
 * NOTYA-RANDEVU-01 — davet doğrulama. Public (no auth) — the accept page needs to show
 * "Dr. X'in muayenehanesine sekreter olarak davet edildiniz" before the invitee has any account.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const supabase = servisSupabase()

  const { data: davet } = await supabase
    .from('personel')
    .select('id, ad_soyad, email, davet_expires_at, davet_kabul_edildi_at, doktor_id')
    .eq('davet_token_hash', tokenHash)
    .maybeSingle()

  if (!davet) return NextResponse.json({ error: 'Davet bulunamadı.' }, { status: 404 })
  if (davet.davet_kabul_edildi_at) return NextResponse.json({ error: 'Bu davet zaten kullanılmış.' }, { status: 400 })
  if (davet.davet_expires_at && new Date(davet.davet_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Davetin süresi dolmuş. Doktorunuzdan yeni bir davet isteyin.' }, { status: 400 })
  }

  const { data: doktor } = await supabase
    .from('users')
    .select('first_name, last_name, title')
    .eq('id', davet.doktor_id)
    .maybeSingle()

  const doktorAdi = doktor
    ? [doktor.title, doktor.first_name, doktor.last_name].filter(Boolean).join(' ')
    : 'Doktor'

  return NextResponse.json({ adSoyad: davet.ad_soyad, email: davet.email, doktorAdi })
}
