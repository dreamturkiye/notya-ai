import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// MERNiS / e-Devlet TC lookup
// PRODUCTION: Requires institutional NVI (KPS) access — not available in this environment.
// CURRENT: Validates TC checksum only. Does NOT invent name/DOB/gender.
// Real integration: SOAP to https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx

function validateTC(tc: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false
  const d = tc.split('').map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  if ((odd * 7 - even) % 10 !== d[9]) return false
  if ((d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10 !== d[10]) return false
  return true
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }
  const token = auth.slice(7)

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const tc = String((body as { tc?: string }).tc || '').replace(/\D/g, '')
  if (!tc || !validateTC(tc)) {
    return NextResponse.json({ error: 'Geçersiz TC Kimlik' }, { status: 400 })
  }

  // Optional: institutional NVI credentials (when Notya has gov partnership).
  const mernisEnabled =
    process.env.MERNIS_ENABLED === 'true' && Boolean(process.env.MERNIS_API_URL)

  if (mernisEnabled) {
    // Placeholder for future real integration — keep response shape stable for the client.
    try {
      const upstream = await fetch(process.env.MERNIS_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MERNIS_API_KEY || ''}`,
        },
        body: JSON.stringify({ tc }),
        cache: 'no-store',
      })
      if (upstream.ok) {
        const raw = (await upstream.json()) as Record<string, unknown>
        const ad = String(raw.ad || raw.firstName || '')
        const soyad = String(raw.soyad || raw.lastName || '')
        const adSoyad = String(raw.adSoyad || `${ad} ${soyad}`.trim())
        const dogumTarihi = String(raw.dogumTarihi || raw.birthDate || '')
        const cinsiyet = String(raw.cinsiyet || raw.gender || '')
        if (adSoyad) {
          return NextResponse.json({
            success: true,
            source: 'mernis',
            populated: true,
            adSoyad,
            dogumTarihi: dogumTarihi || undefined,
            cinsiyet: cinsiyet || undefined,
            message: "MERNİS'ten bilgiler getirildi",
          })
        }
      }
    } catch (e) {
      console.error('MERNIS upstream failed', e)
    }
  }

  // Demo / no institutional access: TC checksum OK, no personal data available.
  return NextResponse.json({
    success: true,
    source: 'checksum',
    populated: false,
    verified: true,
    tc,
    // Explicitly omit adSoyad/dogumTarihi/cinsiyet so the client does not fake a fill.
    message:
      'TC Kimlik No doğrulandı. Ad Soyad, doğum tarihi ve cinsiyeti lütfen manuel girin. (MERNİS kişi sorgusu kurumsal NVI erişimi gerektirir)',
  })
}
