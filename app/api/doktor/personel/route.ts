/**
 * NOTYA-RANDEVU-01 / NOTYA-SEKRETER-01 — personel (sekreter) yönetimi.
 * POST: ad + soyad (zorunlu) + e-posta → davet. ad_soyad görünen alan olarak tutulur.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { personelAdSoyadAyir, personelAdSoyadBirlesik, personelGorunenAd } from '@/lib/doktor/personelAd'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  // NOTYA-SEKRETER-01: ad/soyad yoksa (migration 119 öncesi) yalnız ad_soyad ile devam.
  let data: Array<Record<string, unknown>> | null = null
  const tam = await supabase
    .from('personel')
    .select('id, ad, soyad, ad_soyad, email, rol, aktif, davet_kabul_edildi_at, davet_expires_at, created_at')
    .eq('doktor_id', doktorId)
    .order('created_at', { ascending: false })

  if (tam.error) {
    const eski = await supabase
      .from('personel')
      .select('id, ad_soyad, email, rol, aktif, davet_kabul_edildi_at, davet_expires_at, created_at')
      .eq('doktor_id', doktorId)
      .order('created_at', { ascending: false })
    if (eski.error) return NextResponse.json({ error: 'Personel listesi alınamadı.' }, { status: 500 })
    data = (eski.data || []) as Array<Record<string, unknown>>
  } else {
    data = (tam.data || []) as Array<Record<string, unknown>>
  }

  return NextResponse.json({
    personel: (data || []).map((p) => {
      const adSoyadHam = p.ad_soyad != null ? String(p.ad_soyad) : ''
      const ayrik = personelAdSoyadAyir(adSoyadHam)
      const adHam = p.ad != null ? String(p.ad).trim() : ''
      const soyadHam = p.soyad != null ? String(p.soyad).trim() : ''
      const ad = adHam || ayrik.ad
      const soyad = soyadHam || ayrik.soyad
      return {
        id: String(p.id),
        ad,
        soyad,
        adSoyad: personelGorunenAd({ ad, soyad, adSoyad: adSoyadHam }),
        email: String(p.email ?? ''),
        rol: String(p.rol ?? 'sekreter'),
        aktif: Boolean(p.aktif),
        davetBeklemede: !p.davet_kabul_edildi_at,
        davetSuresiDoldu: !p.davet_kabul_edildi_at && p.davet_expires_at != null
          ? new Date(String(p.davet_expires_at)) < new Date()
          : false,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({})) as {
    ad?: string
    soyad?: string
    adSoyad?: string
    email?: string
  }
  const email = body.email
  let ad = String(body.ad || '').trim()
  let soyad = String(body.soyad || '').trim()
  if ((!ad || !soyad) && body.adSoyad?.trim()) {
    const a = personelAdSoyadAyir(body.adSoyad)
    if (!ad) ad = a.ad
    if (!soyad) soyad = a.soyad
  }
  if (!ad || !soyad || !email?.trim()) {
    return NextResponse.json({ error: 'Ad, soyad ve e-posta zorunludur.' }, { status: 400 })
  }
  const temizEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(temizEmail)) {
    return NextResponse.json({ error: 'Geçersiz e-posta.' }, { status: 400 })
  }

  const adSoyad = personelAdSoyadBirlesik(ad, soyad)
  const token = randomBytes(24).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const tamInsert = await supabase
    .from('personel')
    .insert({
      doktor_id: doktorId,
      ad,
      soyad,
      ad_soyad: adSoyad,
      email: temizEmail,
      davet_token_hash: tokenHash,
      davet_expires_at: expiresAt,
    })
    .select()
    .single()

  let data = tamInsert.data
  let error = tamInsert.error

  // Migration 119 yoksa yalnız ad_soyad ile kaydet (ad/soyad kolon hatası).
  if (error && /column .*ad/i.test(String(error.message || ''))) {
    const eski = await supabase
      .from('personel')
      .insert({
        doktor_id: doktorId,
        ad_soyad: adSoyad,
        email: temizEmail,
        davet_token_hash: tokenHash,
        davet_expires_at: expiresAt,
      })
      .select()
      .single()
    data = eski.data
    error = eski.error
  }

  if (error) {
    const mesaj = String(error.message || '').includes('duplicate')
      ? 'Bu e-posta için zaten bir davet var.'
      : 'Personel eklenemedi.'
    return NextResponse.json({ error: mesaj }, { status: 400 })
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.notya.io'
  return NextResponse.json({
    personel: { id: data!.id, ad, soyad, adSoyad: data!.ad_soyad, email: data!.email },
    davetLinki: `${site}/davet/personel/${token}`,
  })
}
