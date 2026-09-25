/**
 * NOTYA-ILETISIM-02 — Google/Microsoft send the doctor back here after the consent screen.
 * Always ends with a redirect to Ayarlar carrying a friendly `?eposta=<sonuc>`; never shows a
 * provider error page or a token. Register this exact URL at each provider
 * (https://www.notya.io/api/iletisim/eposta/google/donus, …/microsoft/donus).
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { ayarlaraDonus, saglayiciHazirMi, saglayiciMi, type BaglantiSonucu } from '@/lib/iletisim/otomatik/eposta/ayar'
import { ayniNonceMi, CEREZ_ADI, CEREZ_YOLU, durumDogrula } from '@/lib/iletisim/otomatik/eposta/durum'
import { baglantiGetir, baglantiKaydet } from '@/lib/iletisim/otomatik/eposta/depo'
import { iptalEt, kodTakas } from '@/lib/iletisim/otomatik/eposta/saglayicilar'

export const dynamic = 'force-dynamic'

function bitir(sonuc: BaglantiSonucu) {
  const yanit = NextResponse.redirect(ayarlaraDonus(sonuc), 303)
  yanit.headers.set('Cache-Control', 'no-store')
  yanit.cookies.set(CEREZ_ADI, '', { path: CEREZ_YOLU, maxAge: 0 })
  return yanit
}

function cerezOku(req: NextRequest): { n: string; v: string } | null {
  const ham = req.cookies.get(CEREZ_ADI)?.value
  if (!ham) return null
  try {
    const c = JSON.parse(decryptPII(ham)) as { n?: unknown; v?: unknown }
    return typeof c.n === 'string' && typeof c.v === 'string' ? { n: c.n, v: c.v } : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: { saglayici: string } }) {
  const s = params.saglayici
  if (!saglayiciMi(s)) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })
  if (!saglayiciHazirMi(s)) return bitir('kapali')

  const q = req.nextUrl.searchParams
  // access_denied = the doctor pressed Cancel / İptal on the consent screen.
  if (q.get('error')) return bitir(q.get('error') === 'access_denied' ? 'vazgecildi' : 'hata')

  const durum = durumDogrula(q.get('state'))
  const cerez = cerezOku(req)
  const kod = q.get('code')
  if (!durum || durum.s !== s || !cerez || !ayniNonceMi(durum.n, cerez.n) || !kod) return bitir('hata')

  try {
    const takas = await kodTakas(s, { kod, dogrulayici: cerez.v })
    if (!takas.ok) {
      console.warn('[iletisim/eposta] bağlantı kurulamadı', s, takas.hata)
      return bitir(takas.neden)
    }
    const sb = servisSupabase()
    const onceki = await baglantiGetir(sb, durum.d).catch(() => null)
    await baglantiKaydet(sb, {
      doktorId: durum.d,
      saglayici: s,
      adres: takas.adres,
      refreshTokenEncrypted: encryptPII(takas.yenilemeJetonu),
    })
    // Switching to a different mailbox: withdraw the old one's grant so it does not linger. Not for
    // the same account — Google revokes the whole grant, which would kill the token just saved.
    if (onceki && (onceki.saglayici !== s || onceki.adres !== takas.adres)) {
      try {
        const eski = decryptPII(onceki.refresh_token_encrypted)
        if (eski && eski !== takas.yenilemeJetonu) await iptalEt(onceki.saglayici, eski)
      } catch {}
    }
    return bitir('baglandi')
  } catch (e) {
    console.error('[iletisim/eposta] dönüş hatası', s, (e as Error).message)
    return bitir('hata')
  }
}
