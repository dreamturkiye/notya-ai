import { NextRequest, NextResponse } from 'next/server'
import type { PortalTokenRow } from '@/lib/portal/messages'
import { readUnlockCookie } from '@/lib/portal/pinAuth'

/**
 * Enforce PIN unlock on patient portal APIs.
 * Returns a NextResponse error if locked; otherwise null (caller continues).
 */
export function requirePortalUnlock(
  req: NextRequest,
  token: string,
  tok: PortalTokenRow
): NextResponse | null {
  if (!tok.pin_hash) {
    return NextResponse.json(
      {
        error:
          'Bu bağlantıda PIN yok. Güvenlik için doktorunuzdan yeni bir Sağlığım linki ve 6 haneli PIN isteyin.',
        code: 'legacy_no_pin',
        pinRequired: true,
      },
      { status: 403 }
    )
  }
  if (!readUnlockCookie(req, token)) {
    return NextResponse.json(
      { error: 'PIN gerekli', code: 'pin_required', pinRequired: true },
      { status: 401 }
    )
  }
  return null
}
