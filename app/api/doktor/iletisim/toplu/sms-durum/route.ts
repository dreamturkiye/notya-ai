/**
 * NETGSM-01 — which SMS channel will actually send, for the bulk-send screen. UNIVERSAL like the rest of
 * /toplu: doktor AND personel read it (pratikOturum, no sadeceDoktor) — it carries NO credential, only the
 * provider name, whether it is ready, the opt-out line that provider really supports, and (NetGSM only)
 * the remaining credit read live from the doctor's own NetGSM account.
 * GET → { saglayici: 'android_sms_gateway'|'netgsm'|null, hazir, etiket, vazgecSatiri, vazgecYakalanir, kredi? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { smsAyarGetir } from '@/lib/iletisim/sms/ayar'
import { netgsmKrediSorgula } from '@/lib/iletisim/sms/netgsm'
import { smsVazgecSatiri } from '@/lib/iletisim/toplu/sablonlar'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const ayar = await smsAyarGetir(supabase, doktorId)
  if (!ayar || !ayar.aktif) {
    return NextResponse.json({ saglayici: null, hazir: false, etiket: null, vazgecSatiri: smsVazgecSatiri(null), vazgecYakalanir: false })
  }
  if (ayar.saglayici === 'netgsm') {
    const k = await netgsmKrediSorgula(ayar)
    return NextResponse.json({
      saglayici: 'netgsm',
      hazir: true,
      etiket: `NetGSM hesabınız (başlık: ${ayar.baslik})`,
      vazgecSatiri: smsVazgecSatiri('netgsm'),
      vazgecYakalanir: false, // STOP replies are not captured automatically for NetGSM
      kredi: k.ok ? { deger: k.kredi } : { deger: null, hata: k.hata },
    })
  }
  return NextResponse.json({
    saglayici: 'android_sms_gateway',
    hazir: true,
    etiket: 'Android telefonunuz (kendi hattınız)',
    vazgecSatiri: smsVazgecSatiri('android_sms_gateway'),
    vazgecYakalanir: true,
  })
}
