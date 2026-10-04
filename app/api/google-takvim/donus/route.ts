/**
 * NOTYA-RANDEVU-V2 PR2 — Google sends the doctor back here after the consent screen. Always ends with a redirect
 * to Entegrasyonlar carrying `?google=<sonuc>`; never shows a provider error or a token. Register this exact URL
 * in the Google Cloud console (…/api/google-takvim/donus).
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { ayniNonceMi, durumDogrula } from '@/lib/iletisim/otomatik/eposta/durum'
import { googleTakvimHazirMi, iptalEt, kodTakas } from '@/lib/randevu/v2/google/istemci'
import { entegrasyonlaraDonus, TAKVIM_CEREZI, TAKVIM_CEREZ_YOLU, TAKVIM_DURUM_TURU, type TakvimSonucu } from '@/lib/randevu/v2/google/baglan'
import { baglantiGetir, doktoruSenkle } from '@/lib/randevu/v2/google/senk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function bitir(sonuc: TakvimSonucu) {
  const y = NextResponse.redirect(entegrasyonlaraDonus(sonuc), 303)
  y.headers.set('Cache-Control', 'no-store')
  y.cookies.set(TAKVIM_CEREZI, '', { path: TAKVIM_CEREZ_YOLU, maxAge: 0 })
  return y
}

function cerezOku(req: NextRequest): { n: string; v: string } | null {
  const ham = req.cookies.get(TAKVIM_CEREZI)?.value
  if (!ham) return null
  try {
    const c = JSON.parse(decryptPII(ham)) as { n?: unknown; v?: unknown }
    return typeof c.n === 'string' && typeof c.v === 'string' ? { n: c.n, v: c.v } : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!googleTakvimHazirMi()) return bitir('kapali')
  const q = req.nextUrl.searchParams
  if (q.get('error')) return bitir(q.get('error') === 'access_denied' ? 'vazgecildi' : 'hata')
  const durum = durumDogrula(q.get('state'))
  const cerez = cerezOku(req)
  const kod = q.get('code')
  if (!durum || durum.s !== TAKVIM_DURUM_TURU || !cerez || !ayniNonceMi(durum.n, cerez.n) || !kod) return bitir('hata')
  try {
    const takas = await kodTakas(kod, cerez.v)
    if (!takas.ok) {
      console.warn('[google-takvim] bağlantı kurulamadı', takas.hata)
      return bitir(takas.neden)
    }
    const sb = servisSupabase()
    const onceki = await baglantiGetir(sb, durum.d)
    const { error } = await sb.from('google_takvim_baglantilari').upsert({
      doktor_id: durum.d,
      refresh_token_encrypted: encryptPII(takas.yenilemeJetonu),
      durum: 'bagli',
      takvim_id: 'primary',
      // A (re)connect starts a clean full sync; tam_ad keeps the doctor's earlier choice.
      sync_token: null, sayfa_jetonu: null, son_hata: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'doktor_id' })
    if (error) return bitir('hata')
    if (onceki) {
      try {
        const eski = decryptPII(onceki.refresh_token_encrypted)
        if (eski && eski !== takas.yenilemeJetonu) await iptalEt(eski)
      } catch { /* unreadable old token: nothing to revoke */ }
    }
    await doktoruSenkle(sb, durum.d, { bitis: Date.now() + 25_000 })
    return bitir('baglandi')
  } catch (e) {
    console.error('[google-takvim] dönüş hatası', (e as Error).message)
    return bitir('hata')
  }
}
