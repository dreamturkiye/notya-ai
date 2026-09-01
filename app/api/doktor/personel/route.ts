/**
 * NOTYA-RANDEVU-01 — personel (sekreter) yönetimi. Doktor hesabından erişilir — bir sekreter
 * kendi yetkilerini veya diğer personeli göremez/değiştiremez (sadeceDoktor guard).
 *
 * POST creates the invite row and returns a ONE-TIME plaintext link
 * (/davet/personel/<token>) for the doctor to share manually — WhatsApp, SMS, in person. This
 * deliberately does not send email: Supabase's mail sender is dev-grade and rate-limited (see
 * docs/OPEN-COMMITMENTS.md), so a feature that depended on it would silently fail the same way
 * doctor signup does. Sharing a link the doctor already has in hand needs no mail step at all.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const { data, error } = await supabase
    .from('personel')
    .select('id, ad_soyad, email, rol, aktif, davet_kabul_edildi_at, davet_expires_at, created_at')
    .eq('doktor_id', doktorId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Personel listesi alınamadı.' }, { status: 500 })
  return NextResponse.json({
    personel: (data || []).map((p) => ({
      id: p.id,
      adSoyad: p.ad_soyad,
      email: p.email,
      rol: p.rol,
      aktif: p.aktif,
      davetBeklemede: !p.davet_kabul_edildi_at,
      davetSuresiDoldu: !p.davet_kabul_edildi_at && p.davet_expires_at ? new Date(p.davet_expires_at) < new Date() : false,
    })),
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { adSoyad, email } = body as { adSoyad?: string; email?: string }
  if (!adSoyad?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Ad soyad ve e-posta zorunludur.' }, { status: 400 })
  }
  const temizEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(temizEmail)) {
    return NextResponse.json({ error: 'Geçersiz e-posta.' }, { status: 400 })
  }

  const token = randomBytes(24).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 gün

  const { data, error } = await supabase
    .from('personel')
    .insert({
      doktor_id: doktorId,
      ad_soyad: adSoyad.trim(),
      email: temizEmail,
      davet_token_hash: tokenHash,
      davet_expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    const mesaj = String(error.message || '').includes('duplicate')
      ? 'Bu e-posta için zaten bir davet var.'
      : 'Personel eklenemedi.'
    return NextResponse.json({ error: mesaj }, { status: 400 })
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://notya-ai.vercel.app'
  return NextResponse.json({
    personel: { id: data.id, adSoyad: data.ad_soyad, email: data.email },
    davetLinki: `${site}/davet/personel/${token}`,
  })
}
