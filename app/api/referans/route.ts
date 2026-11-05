/**
 * REFERANS-01 (Kaan, 2026-11-05) — the doctor referral programme (CORE, every branch).
 *
 *   GET   → { kod, adres, davet, odeyen, verilen, son12ay, bekleyen, sinir }   the doctor's own code (made on first use)
 *                                                                             and counts; never another doctor's data
 *   POST  { kod? }  → { sonuc }   record the code this account signed up with (body, or the account's sign-up metadata).
 *                                 Never refuses or changes the account: an unknown or own code is simply not recorded.
 *
 * Doctor only. The reward itself is granted by the Stripe webhook on the referred doctor's first paid invoice.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { referansAdresi, referansKaydet, referansKoduAl, referansOzeti, type ReferansIslevi } from '@/lib/billing/referans'
import { hizSiniri } from '@/lib/belge/hizSiniri'

export const dynamic = 'force-dynamic'
const SINIR = hizSiniri(20, 60_000)

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const islev: ReferansIslevi = (ad, a) => supabase.rpc(ad, { ...a, p_ulke: 'tr' })
  const kod = await referansKoduAl(islev, doktorId)
  const ozet = await referansOzeti(islev, doktorId)
  if (!kod || !ozet) return NextResponse.json({ error: 'Davet kodu alınamadı.' }, { status: 500 })
  const koken = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  return NextResponse.json({ ...ozet, kod, adres: referansAdresi(koken, '/kayit', kod) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  if (!SINIR.izinli(doktorId)) return NextResponse.json({ sonuc: 'hata' }, { status: 429 })
  const g = (await req.json().catch(() => ({}))) as { kod?: unknown }
  let kod = g?.kod
  if (!kod) {
    const { data } = await supabase.auth.admin.getUserById(doktorId)
    kod = (data?.user?.user_metadata as { ref_kodu?: unknown } | undefined)?.ref_kodu
  }
  const islev: ReferansIslevi = (ad, a) => supabase.rpc(ad, { ...a, p_ulke: 'tr' })
  const sonuc = await referansKaydet(islev, kod, doktorId)
  return NextResponse.json({ sonuc }, { headers: { 'Cache-Control': 'no-store' } })
}
