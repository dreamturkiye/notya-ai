/**
 * NOTYA-ULKE-01 — POST /api/ulke/kayit: create an account with an invitation code.
 *
 * Only where the country's pack switches `davetliKayit` on; anywhere else 404. The account is created HERE, on the
 * server, with the service role — the browser never calls the auth service's public sign-up, which must be switched
 * off in that country's Supabase project (docs/COUNTRY-PACK-UZBEKISTAN.md).
 *
 * Order, so that a failure leaves nothing behind:
 *   1. validate the body
 *   2. consume the code atomically (davet_kodu_kullan: right country, not expired, uses left)   → 400 KOD_GECERSIZ
 *   3. create the auth user, stamped with the deployment's country (app_metadata, not user-writable)
 *   4. write the users row with country and interface language
 *   on a failure in 3 or 4: remove what was created and give the use of the code back.
 *
 * Answers with machine codes only. An e-mail that already has an account gets the same answer as any other failure
 * to create one (no way to ask "is this address registered?").
 * E-mail is marked confirmed: the invitation is the verification, as for staff invitations (app/api/personel/kabul).
 */
import { NextRequest, NextResponse } from 'next/server'
import { ulkeServisSupabase } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { aktifUlke, ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { davetKoduBicimiGecerli, davetKoduHash } from '@/lib/ulke/davet'

export const dynamic = 'force-dynamic'

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const cevap = (govde: Record<string, unknown>, status: number) =>
  NextResponse.json(govde, { status, headers: { 'Cache-Control': 'no-store' } })

export const POST = sinirda('kayit POST', async (req: NextRequest) => {
  if (!ozellikAcik('davetliKayit')) return cevap({ code: 'NOT_FOUND' }, 404)

  const g = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const adSoyad = typeof g?.adSoyad === 'string' ? g.adSoyad.trim() : ''
  const eposta = typeof g?.eposta === 'string' ? g.eposta.trim().toLowerCase() : ''
  const sifre = typeof g?.sifre === 'string' ? g.sifre : ''
  const dilHam = typeof g?.dil === 'string' ? g.dil : ''
  if (!adSoyad || !eposta || !sifre || !g?.davetKodu) return cevap({ code: 'EKSIK_ALAN' }, 400)
  if (adSoyad.length < 2 || adSoyad.length > 120) return cevap({ code: 'EKSIK_ALAN' }, 400)
  if (eposta.length > 200 || !EPOSTA.test(eposta)) return cevap({ code: 'EPOSTA_GECERSIZ' }, 400)
  if (sifre.length < 8 || sifre.length > 200) return cevap({ code: 'SIFRE_KISA' }, 400)
  if (!davetKoduBicimiGecerli(g.davetKodu)) return cevap({ code: 'KOD_GECERSIZ' }, 400)
  // The interface language must be one this country has switched on; anything else is the country's default.
  const paket = ulkePaketi()
  const dil = (paket.acikDiller as readonly string[]).includes(dilHam) ? dilHam : paket.varsayilanDil

  const ulke = aktifUlke()
  const kodHash = davetKoduHash(g.davetKodu)
  const supabase = ulkeServisSupabase()

  const { data: alindi, error: kodHatasi } = await supabase.rpc('davet_kodu_kullan', { p_hash: kodHash, p_ulke: ulke })
  if (kodHatasi) return cevap({ code: 'OLUSTURULAMADI' }, 500)
  if (alindi !== true) return cevap({ code: 'KOD_GECERSIZ' }, 400)
  const koduGeriVer = async () => { try { await supabase.rpc('davet_kodu_iade', { p_hash: kodHash }) } catch { /* the code stays used: safe side */ } }

  const { data: yeni, error: hesapHatasi } = await supabase.auth.admin.createUser({
    email: eposta,
    password: sifre,
    email_confirm: true,
    app_metadata: { country: ulke },
    user_metadata: { full_name: adSoyad, ui_language: dil, davetli: true },
  })
  const userId = yeni?.user?.id
  if (hesapHatasi || !userId) {
    await koduGeriVer()
    return cevap({ code: 'OLUSTURULAMADI' }, 400)
  }

  const { error: satirHatasi } = await supabase
    .from('users')
    .upsert({ id: userId, email: eposta, full_name: adSoyad, country: ulke, ui_language: dil, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (satirHatasi) {
    try { await supabase.auth.admin.deleteUser(userId) } catch { /* reported below either way */ }
    await koduGeriVer()
    console.error('[ulke/kayit] users row could not be written', { ulke, kod: satirHatasi.code })
    return cevap({ code: 'OLUSTURULAMADI' }, 500)
  }

  return cevap({ ok: true }, 200)
})
