/**
 * NOTYA-INTAKE-02 — aşı hatırlatma. Günlük çalışır (vercel.json), sonraki_doz_tarihi önümüzdeki
 * 7 gün içinde olan ve henüz hatırlatılmamış aşı kayıtları için hastaya WhatsApp gönderir, ayrıca
 * doktor/sekreterin panelde görmesi için hatirlatma_gonderildi=true işaretler (dashboard widget
 * bu alanı okuyarak "yaklaşan aşılar" listesini gösterir).
 *
 * Pediatrik aşılarda (SB Ulusal Aşılama Takvimi) doz kaçırma birikimli sağlık riski taşır, bu
 * yüzden pencere geniş tutuldu (7 gün) — randevu hatırlatmasının 2-3 saatlik penceresinden
 * bilinçli olarak farklı, çünkü burada amaç "bugün hatırlat" değil "bu haftaki randevuya aşıyı da
 * ekleyebil" zamanlaması.
 */
import { NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { sendTwilioMessage } from '@/lib/doktor/twilioNotify'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz eri\u015fim.' }, { status: 401 })
  }

  const supabase = servisSupabase()
  const bugun = new Date().toISOString().slice(0, 10)
  const yediGunSonra = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: asilar, error } = await supabase
    .from('asilar')
    .select('id, patient_id, asi_adi, doz_no, kategori, sonraki_doz_tarihi')
    .eq('hatirlatma_gonderildi', false)
    .not('sonraki_doz_tarihi', 'is', null)
    .gte('sonraki_doz_tarihi', bugun)
    .lte('sonraki_doz_tarihi', yediGunSonra)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let gonderildi = 0
  let atlandi = 0
  const hatalar: string[] = []

  for (const a of asilar || []) {
    const { data: hasta } = await supabase
      .from('patients')
      .select('name_encrypted, phone_encrypted')
      .eq('id', a.patient_id)
      .maybeSingle()

    let telefon = ''
    let ad = 'Hastam\u0131z'
    try { if (hasta?.phone_encrypted) telefon = decrypt(hasta.phone_encrypted) || '' } catch { /* ignore */ }
    try { if (hasta?.name_encrypted) ad = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim() || ad } catch { /* ignore */ }

    if (!telefon) { atlandi++; continue }

    const dozMetni = a.doz_no ? ` (${a.doz_no}. doz)` : ''
    const mesaj = `Merhaba ${ad}, ${a.asi_adi}${dozMetni} a\u015f\u0131n\u0131z\u0131n zaman\u0131 yakla\u015f\u0131yor (${a.sonraki_doz_tarihi}). Randevu almak i\u00e7in klini\u011finizle ileti\u015fime ge\u00e7ebilirsiniz.`

    const sonuc = await sendTwilioMessage({ channel: 'whatsapp', toPhone: telefon, body: mesaj })
    await supabase.from('asilar').update({ hatirlatma_gonderildi: true }).eq('id', a.id)

    if (sonuc.ok) gonderildi++
    else hatalar.push(`${a.id}: ${sonuc.error}`)
  }

  return NextResponse.json({
    calisma_zamani: new Date().toISOString(),
    toplam: asilar?.length || 0,
    gonderildi,
    telefonsuz_atlandi: atlandi,
    hatalar,
  })
}
