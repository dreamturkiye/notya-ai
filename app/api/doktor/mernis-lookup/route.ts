import { NextRequest, NextResponse } from 'next/server'
import {
  authDoctorFromBearer,
  loadIntegrationSecrets,
  type NviSecrets,
} from '@/lib/doktor/integrations'
import { lookupKimlikWithDoctorCreds } from '@/lib/nvi/kps'

export const dynamic = 'force-dynamic'

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
  const doctor = await authDoctorFromBearer(token)
  if (!doctor) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const tc = String((body as { tc?: string }).tc || '').replace(/\D/g, '')
  if (!tc || !validateTC(tc)) {
    return NextResponse.json({ error: 'Geçersiz TC Kimlik' }, { status: 400 })
  }

  const vault = await loadIntegrationSecrets<NviSecrets>(doctor.userId, 'nvi_kps')

  if (vault) {
    const result = await lookupKimlikWithDoctorCreds(tc, vault.secrets)
    if (result.ok) {
      return NextResponse.json({
        success: true,
        source: 'nvi_kps',
        populated: true,
        adSoyad: result.adSoyad,
        dogumTarihi: result.dogumTarihi || undefined,
        cinsiyet: result.cinsiyet || undefined,
        message: "NVI'dan bilgiler getirildi",
        nviConnected: true,
      })
    }
    return NextResponse.json({
      success: true,
      source: 'checksum',
      populated: false,
      verified: true,
      tc,
      nviConnected: true,
      reason: result.reason,
      message: result.message,
    })
  }

  // No doctor NVI credentials — checksum only.
  return NextResponse.json({
    success: true,
    source: 'checksum',
    populated: false,
    verified: true,
    tc,
    nviConnected: false,
    message:
      'TC Kimlik No doğrulandı. Ad Soyad için NVI hesabınızı Entegrasyonlar’dan bağlayın, kimlik kartı fotoğrafı çekin veya manuel girin.',
  })
}
