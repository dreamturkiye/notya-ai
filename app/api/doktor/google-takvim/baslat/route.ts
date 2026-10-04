/**
 * NOTYA-RANDEVU-V2 PR2 — "Google Takvim'i bağla": returns Google's consent address. Same round trip as the
 * e-mail connect (NOTYA-ILETISIM-02): the doctor id is bound into a signed state; the PKCE verifier + nonce stay
 * in an encrypted httpOnly cookie on our origin, checked in /api/google-takvim/donus.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptPII } from '@/lib/security/encryption'
import { siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'
import { DURUM_OMRU_MS, durumImzala, nonceUret, pkceUret } from '@/lib/iletisim/otomatik/eposta/durum'
import { googleTakvimHazirMi, yetkiAdresi } from '@/lib/randevu/v2/google/istemci'
import { TAKVIM_CEREZI, TAKVIM_CEREZ_YOLU, TAKVIM_DURUM_TURU } from '@/lib/randevu/v2/google/baglan'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!googleTakvimHazirMi()) return NextResponse.json({ error: 'Google Takvim henüz açık değil.' }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata

  const { dogrulayici, meydanOkuma } = pkceUret()
  const nonce = nonceUret()
  const durum = durumImzala({ doktorId: oturum.user.id, saglayici: TAKVIM_DURUM_TURU, nonce })
  const yanit = NextResponse.json({ url: yetkiAdresi({ durum, meydanOkuma }) })
  yanit.headers.set('Cache-Control', 'no-store')
  yanit.cookies.set(TAKVIM_CEREZI, encryptPII(JSON.stringify({ n: nonce, v: dogrulayici })), {
    httpOnly: true,
    secure: siteAdresi().startsWith('https://'),
    sameSite: 'lax',
    path: TAKVIM_CEREZ_YOLU,
    maxAge: Math.floor(DURUM_OMRU_MS / 1000),
  })
  return yanit
}
