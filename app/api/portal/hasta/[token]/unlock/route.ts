import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import {
  clearUnlockCookie,
  isValidPortalPin,
  readUnlockCookie,
  setUnlockCookie,
  verifyPortalPin,
} from '@/lib/portal/pinAuth'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Status: whether this token needs a PIN and whether this browser is unlocked. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  const pinRequired = Boolean(tok.pin_hash)
  const unlocked = pinRequired ? readUnlockCookie(req, params.token) : true

  return NextResponse.json({
    pinRequired,
    unlocked,
    /** Legacy links without PIN — patient must ask doctor for a new link. */
    legacyNoPin: !tok.pin_hash,
  })
}

/** Unlock with 6-digit PIN; sets httpOnly session cookie (~12h). */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const client = sb()
  if (!client) return NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 })

  const tok = await resolvePortalToken(client, params.token)
  if (!tok) return NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 })

  if (!tok.pin_hash) {
    return NextResponse.json(
      {
        error:
          'Bu bağlantıda PIN yok. Güvenlik için doktorunuzdan yeni bir Sağlığım linki ve 6 haneli PIN isteyin.',
        code: 'legacy_no_pin',
      },
      { status: 403 }
    )
  }

  let body: { pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const pin = String(body.pin || '').trim()
  if (!isValidPortalPin(pin)) {
    return NextResponse.json({ error: 'PIN 6 haneli rakam olmalıdır.' }, { status: 400 })
  }

  if (!verifyPortalPin(pin, tok.pin_hash)) {
    return NextResponse.json({ error: 'PIN hatalı. Tekrar deneyin.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, unlocked: true })
  setUnlockCookie(res, params.token)
  return res
}

/** Optional logout — clear unlock cookie. */
export async function DELETE(_req: NextRequest, { params }: { params: { token: string } }) {
  const res = NextResponse.json({ ok: true })
  clearUnlockCookie(res)
  void params
  return res
}
