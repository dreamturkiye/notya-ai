import { NextRequest, NextResponse } from 'next/server'
import {
  authDoctorFromBearer,
  disconnectIntegration,
  getIntegrationStatus,
  type IntegrationProvider,
  type MedulaSecrets,
  type NviSecrets,
  upsertIntegrationSecrets,
} from '@/lib/doktor/integrations'

export const dynamic = 'force-dynamic'

function bearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

function isProvider(p: string): p is IntegrationProvider {
  return p === 'medula' || p === 'nvi_kps'
}

function validateTc(tc: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false
  const d = tc.split('').map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  if ((odd * 7 - even) % 10 !== d[9]) return false
  if ((d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10 !== d[10]) return false
  return true
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> | { provider: string } }
) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const doctor = await authDoctorFromBearer(token)
  if (!doctor) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const { provider: raw } = await Promise.resolve(ctx.params)
  if (!isProvider(raw)) {
    return NextResponse.json({ error: 'Geçersiz sağlayıcı' }, { status: 400 })
  }

  const status = await getIntegrationStatus(doctor.userId, raw)
  return NextResponse.json(status)
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> | { provider: string } }
) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const doctor = await authDoctorFromBearer(token)
  if (!doctor) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const { provider: raw } = await Promise.resolve(ctx.params)
  if (!isProvider(raw)) {
    return NextResponse.json({ error: 'Geçersiz sağlayıcı' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))

  try {
    if (raw === 'medula') {
      const hekimTc = String((body as MedulaSecrets).hekimTc || '').replace(/\D/g, '')
      const sifre = String((body as MedulaSecrets).sifre || '')
      const tesisKodu = String((body as MedulaSecrets).tesisKodu || '').trim() || undefined
      const sicilNo = String((body as MedulaSecrets).sicilNo || '').trim() || undefined
      if (!validateTc(hekimTc)) {
        return NextResponse.json({ error: 'Geçerli hekim TC Kimlik No gerekli' }, { status: 400 })
      }
      if (!sifre) {
        return NextResponse.json({ error: 'SGK kurumsal şifre zorunludur.' }, { status: 400 })
      }
      const status = await upsertIntegrationSecrets(doctor.userId, 'medula', {
        hekimTc,
        sifre,
        tesisKodu,
        sicilNo,
      })
      return NextResponse.json(status)
    }

    const username = String((body as NviSecrets).username || '').trim()
    const password = String((body as NviSecrets).password || '')
    if (!username || !password) {
      return NextResponse.json({ error: 'NVİ kullanıcı adı ve şifre zorunludur.' }, { status: 400 })
    }
    const status = await upsertIntegrationSecrets(doctor.userId, 'nvi_kps', {
      username,
      password,
    })
    return NextResponse.json(status)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kayıt başarısız'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> | { provider: string } }
) {
  const token = bearer(req)
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const doctor = await authDoctorFromBearer(token)
  if (!doctor) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  const { provider: raw } = await Promise.resolve(ctx.params)
  if (!isProvider(raw)) {
    return NextResponse.json({ error: 'Geçersiz sağlayıcı' }, { status: 400 })
  }

  await disconnectIntegration(doctor.userId, raw)
  return NextResponse.json({ ok: true, connected: false, provider: raw })
}
