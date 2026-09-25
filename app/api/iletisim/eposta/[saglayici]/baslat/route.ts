/**
 * NOTYA-ILETISIM-02 — "Gmail ile bağlan" / "Outlook ile bağlan": returns the provider's consent
 * page address. The browser cannot carry our Bearer header through a top-level navigation, so the
 * card POSTs here with it, then navigates to `url`. The doctor id is bound into the signed state;
 * the PKCE verifier + nonce stay in an encrypted httpOnly cookie on our origin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { encryptPII } from '@/lib/security/encryption'
import { KAPALI_MESAJI, saglayiciHazirMi, saglayiciMi, siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'
import { CEREZ_ADI, CEREZ_YOLU, DURUM_OMRU_MS, durumImzala, nonceUret, pkceUret } from '@/lib/iletisim/otomatik/eposta/durum'
import { yetkiAdresi } from '@/lib/iletisim/otomatik/eposta/saglayicilar'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { saglayici: string } }) {
  const s = params.saglayici
  if (!saglayiciMi(s)) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })
  if (!saglayiciHazirMi(s)) return NextResponse.json({ error: KAPALI_MESAJI }, { status: 503 })

  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata

  const { dogrulayici, meydanOkuma } = pkceUret()
  const nonce = nonceUret()
  const durum = durumImzala({ doktorId: oturum.user.id, saglayici: s, nonce })

  const yanit = NextResponse.json({ url: yetkiAdresi(s, { durum, meydanOkuma }) })
  yanit.headers.set('Cache-Control', 'no-store')
  yanit.cookies.set(CEREZ_ADI, encryptPII(JSON.stringify({ n: nonce, v: dogrulayici })), {
    httpOnly: true,
    secure: siteAdresi().startsWith('https://'),
    sameSite: 'lax', // must survive the top-level redirect back from Google/Microsoft
    path: CEREZ_YOLU,
    maxAge: Math.floor(DURUM_OMRU_MS / 1000),
  })
  return yanit
}
