/**
 * GERI-CAGIRMA-01 — GET the recall list. CORE (every branş): doktor + personel (pratikOturum), like the bulk
 * messaging screen. The list is computed on demand from the branş's existing due/overdue tool and the doctor's own
 * follow-up dates (lib/geriCagirma/kaynak.ts), cached per doctor for a few minutes, paged for the screen.
 *
 * GET ?kaynak=<tool key>&sayfa=<n>&boyut=<n>&yenile=1
 *   → { kurulu, toplam, sayfa, boyut, adaylar[], gruplar[], disarida, beklemeGun, kanalSayilari, baglantiSayisi,
 *       sablonlar, whatsapp }
 * Opening the list also refreshes the stored counters (attribution + "can be recalled now").
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { adaylariTopla } from '@/lib/geriCagirma/kaynak'
import { whatsappKotaBilgisi } from '@/lib/geriCagirma/gonder'
import { sayaclariYenile } from '@/lib/geriCagirma/sayac'
import { mesajKur, SABLON_ANAHTARLARI, TR_SABLON_METINLERI } from '@/lib/geriCagirma/sablonlar'
import { ATIF_PENCERESI_GUN, type GeriCagirmaAdayi } from '@/lib/geriCagirma/tipler'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BOYUT_UST = 200
const BAGLANTI_YER_TUTUCU = '‹kişiye özel randevu bağlantısı›'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const p = req.nextUrl.searchParams
  const kaynak = String(p.get('kaynak') || '').slice(0, 60)
  const sayfa = Math.max(1, Math.floor(Number(p.get('sayfa')) || 1))
  const boyut = Math.min(BOYUT_UST, Math.max(10, Math.floor(Number(p.get('boyut')) || 100)))

  const { liste, doktorAdi } = await adaylariTopla(supabase, doktorId, { taze: p.get('yenile') === '1' })
  if (!liste.kurulu) return NextResponse.json({ kurulu: false, toplam: 0, sayfa: 1, boyut, adaylar: [], gruplar: [], disarida: liste.disarida, beklemeGun: liste.beklemeGun })

  // Stored counters follow what the doctor is looking at (attribution + the home card's "N can be recalled now").
  await sayaclariYenile(supabase, doktorId, { cagrilabilir: liste.adaylar.length }).catch(() => false)

  const suzulmus: GeriCagirmaAdayi[] = kaynak ? liste.adaylar.filter((a) => a.nedenler.some((n) => n.kaynak === kaynak)) : liste.adaylar
  const gruplar = new Map<string, { anahtar: string; etiket: string; kaynak: string; sayi: number }>()
  const kanalSayilari = { whatsapp: 0, sms: 0, eposta: 0, gonderici_yok: 0, izin_yok: 0 }
  let baglantiSayisi = 0
  for (const a of suzulmus) {
    for (const n of a.nedenler) {
      const g = gruplar.get(n.anahtar) || { anahtar: n.anahtar, etiket: n.etiket, kaynak: n.kaynak, sayi: 0 }
      g.sayi++
      gruplar.set(n.anahtar, g)
    }
    if (a.kanal) kanalSayilari[a.kanal]++
    else kanalSayilari[a.izin === 'gonderici_yok' ? 'gonderici_yok' : 'izin_yok']++
    if (a.baglanti && a.kanal && a.kanal !== 'whatsapp') baglantiSayisi++
  }
  const whatsapp = kanalSayilari.whatsapp > 0 ? await whatsappKotaBilgisi(supabase, doktorId) : null
  let whatsappMetni: string | null = null
  if (kanalSayilari.whatsapp > 0) {
    // The EXACT approved template body that a WhatsApp recipient receives (no free text is ever sent there).
    const { SABLONLAR } = await import('@/lib/iletisim/otomatik/whatsapp/sablonlar')
    whatsappMetni = SABLONLAR.genel_bildirim.govde.replace('{{1}}', '‹hasta adı›').replace('{{2}}', doktorAdi || '‹doktor adı›')
  }
  const sablonlar = SABLON_ANAHTARLARI.map((anahtar) => ({
    anahtar,
    etiket: TR_SABLON_METINLERI.etiket[anahtar],
    baglantili: mesajKur(anahtar, { hastaAdi: '‹hasta adı›', doktorAdi, link: BAGLANTI_YER_TUTUCU }).metin,
    baglantisiz: mesajKur(anahtar, { hastaAdi: '‹hasta adı›', doktorAdi, link: null }).metin,
  }))
  const bas = (sayfa - 1) * boyut
  return NextResponse.json({
    kurulu: true, toplam: suzulmus.length, sayfa, boyut,
    adaylar: suzulmus.slice(bas, bas + boyut),
    gruplar: [...gruplar.values()].sort((a, b) => b.sayi - a.sayi),
    disarida: liste.disarida, beklemeGun: liste.beklemeGun, uretildi: liste.uretildi,
    kanalSayilari, baglantiSayisi, sablonlar, whatsapp, whatsappMetni, atifPenceresiGun: ATIF_PENCERESI_GUN,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
