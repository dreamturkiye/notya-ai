/**
 * NOTYA-HASTA-ILETISIMI-01 — the doctor's own SMS-gateway connection. Doctor-only to configure
 * (sadeceDoktor), same as the Gmail/Outlook/WhatsApp Business connection screens — personel can USE
 * the channel via /toplu/gonder but does not manage credentials.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { smsAyarGoruntu, smsAyarKaydet, SmsAyarHatasi, smsAyarGetir } from '@/lib/iletisim/sms/ayar'
import { androidGatewayBaglantiTest } from '@/lib/iletisim/sms/androidGateway'
import { encryptPII, generateSecureToken } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const ayar = await smsAyarGoruntu(oturum.supabase, oturum.doktorId)
  return NextResponse.json({ ayar })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum

  const body = (await req.json().catch(() => null)) as { tabanUrl?: string; kullaniciAdi?: string; sifre?: string | null; gonderenNumara?: string | null; aktif?: boolean; test?: boolean } | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  try {
    await smsAyarKaydet(supabase, doktorId, {
      tabanUrl: body.tabanUrl || '',
      kullaniciAdi: body.kullaniciAdi || '',
      sifre: body.sifre ?? null,
      gonderenNumara: body.gonderenNumara ?? null,
      aktif: !!body.aktif,
    })
    // Issue the inbound-webhook (STOP/DUR) shared secret once, if this doctor does not have one yet.
    // Returned in plaintext ONLY on the call that creates it — paste into the gateway app's webhook
    // header config (X-Notya-Webhook-Secret) and the "STOP/DUR" URL below; never stored in plaintext.
    const { data: mevcut } = await supabase.from('iletisim_sms_ayarlari').select('webhook_sirri_encrypted').eq('doctor_id', doktorId).maybeSingle()
    let webhookSirriYeni: string | null = null
    if (!mevcut?.webhook_sirri_encrypted) {
      webhookSirriYeni = generateSecureToken(24)
      await supabase.from('iletisim_sms_ayarlari').update({ webhook_sirri_encrypted: encryptPII(webhookSirriYeni) }).eq('doctor_id', doktorId)
    }

    let baglantiTest: { ok: boolean; hata?: string } | null = null
    if (body.test) {
      const ayar = await smsAyarGetir(supabase, doktorId)
      if (ayar) {
        const sonuc = await androidGatewayBaglantiTest(ayar)
        baglantiTest = sonuc.ok ? { ok: true } : { ok: false, hata: sonuc.hata }
      }
    }
    const ayarGoruntu = await smsAyarGoruntu(supabase, doktorId)
    return NextResponse.json({
      ayar: ayarGoruntu,
      baglantiTest,
      webhookSirriYeni,
      webhookUrl: `https://www.notya.io/api/iletisim/sms/webhook/${doktorId}`,
    })
  } catch (e) {
    if (e instanceof SmsAyarHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[sms-ayarlari]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }
}
