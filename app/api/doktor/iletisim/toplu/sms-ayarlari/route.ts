/**
 * NOTYA-HASTA-ILETISIMI-01 — the doctor's own SMS-gateway connection. Doctor-only to configure
 * (sadeceDoktor), same as the Gmail/Outlook/WhatsApp Business connection screens — personel can USE
 * the channel via /toplu/gonder but does not manage credentials.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { smsAyarGoruntu, smsAyarKaydet, SmsAyarHatasi, smsAyarGetir, smsSaglayiciAdi } from '@/lib/iletisim/sms/ayar'
import { androidGatewayBaglantiTest } from '@/lib/iletisim/sms/androidGateway'
import { netgsmBaglantiTest } from '@/lib/iletisim/sms/netgsm'
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

  const body = (await req.json().catch(() => null)) as { tabanUrl?: string; kullaniciAdi?: string; sifre?: string | null; gonderenNumara?: string | null; aktif?: boolean; test?: boolean; saglayici?: string; netgsmKullaniciKodu?: string; netgsmSifre?: string | null; netgsmBaslik?: string } | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  try {
    const saglayici = smsSaglayiciAdi(body.saglayici)
    await smsAyarKaydet(supabase, doktorId, {
      saglayici,
      netgsmKullaniciKodu: body.netgsmKullaniciKodu || '',
      netgsmSifre: body.netgsmSifre ?? null,
      netgsmBaslik: body.netgsmBaslik || '',
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
    // NetGSM has no inbound mechanism wired (STOP replies are not captured) — no webhook secret to issue.
    if (saglayici === 'android_sms_gateway' && !mevcut?.webhook_sirri_encrypted) {
      webhookSirriYeni = generateSecureToken(24)
      await supabase.from('iletisim_sms_ayarlari').update({ webhook_sirri_encrypted: encryptPII(webhookSirriYeni) }).eq('doctor_id', doktorId)
    }

    let baglantiTest: { ok: boolean; hata?: string; uyari?: string; kredi?: number | null; baslikOnayli?: boolean | null } | null = null
    if (body.test) {
      const ayar = await smsAyarGetir(supabase, doktorId)
      if (ayar?.saglayici === 'netgsm') {
        // Non-sending check (approved sender names + credit). No SMS is sent by a test.
        const sonuc = await netgsmBaglantiTest(ayar)
        baglantiTest = sonuc.ok ? { ok: true, uyari: sonuc.uyari, kredi: sonuc.kredi, baslikOnayli: sonuc.baslikOnayli } : { ok: false, hata: sonuc.hata }
      } else if (ayar) {
        const sonuc = await androidGatewayBaglantiTest(ayar)
        baglantiTest = sonuc.ok ? { ok: true } : { ok: false, hata: sonuc.hata }
      }
    }
    const ayarGoruntu = await smsAyarGoruntu(supabase, doktorId)
    return NextResponse.json({
      ayar: ayarGoruntu,
      baglantiTest,
      webhookSirriYeni,
      webhookUrl: saglayici === 'android_sms_gateway' ? `https://www.notya.io/api/iletisim/sms/webhook/${doktorId}` : null,
    })
  } catch (e) {
    if (e instanceof SmsAyarHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[sms-ayarlari]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }
}
