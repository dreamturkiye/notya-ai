/**
 * NOTYA-ILETISIM-02 — the doctor's own mailbox connection.
 *   GET    → { acik, saglayicilar, baglanti } for the EpostaBaglan card (never the credential)
 *   DELETE → "Bağlantıyı kaldır": withdraw at the provider (Google), then forget it here
 * 503 with a calm Turkish line until the environment is configured.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decryptPII } from '@/lib/security/encryption'
import { hazirSaglayicilar, KAPALI_MESAJI } from '@/lib/iletisim/otomatik/eposta/ayar'
import { baglantiGetir, baglantiSil, type BaglantiOzeti } from '@/lib/iletisim/otomatik/eposta/depo'
import { iptalEt } from '@/lib/iletisim/otomatik/eposta/saglayicilar'

export const dynamic = 'force-dynamic'

const kapali = () => NextResponse.json({ acik: false, error: KAPALI_MESAJI }, { status: 503 })

export async function GET(req: NextRequest) {
  const saglayicilar = hazirSaglayicilar()
  if (saglayicilar.length === 0) return kapali()
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  try {
    const b = await baglantiGetir(oturum.supabase, oturum.user.id)
    const baglanti: BaglantiOzeti | null = b ? { saglayici: b.saglayici, adres: b.adres, durum: b.durum } : null
    return NextResponse.json({ acik: true, saglayicilar, baglanti }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Bağlantı bilgisi şu an okunamadı.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (hazirSaglayicilar().length === 0) return kapali()
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  try {
    const b = await baglantiGetir(oturum.supabase, oturum.user.id)
    if (!b) return NextResponse.json({ ok: true })
    let jeton = ''
    try {
      jeton = decryptPII(b.refresh_token_encrypted)
    } catch {}
    // Best effort: if the provider is unreachable we still forget the credential — without it and
    // our client secret nobody can use the grant, and the doctor asked for it to be gone.
    if (jeton) await iptalEt(b.saglayici, jeton)
    await baglantiSil(oturum.supabase, oturum.user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bağlantı şu an kaldırılamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
