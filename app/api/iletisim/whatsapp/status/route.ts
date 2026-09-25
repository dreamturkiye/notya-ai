/**
 * NOTYA-ILETISIM-03 — WhatsApp bağlantı durumu (Ayarlar › İletişim kartındaki WhatsAppBaglan).
 * Ortam değişkenleri yoksa 503 + Türkçe mesaj: bileşen "Yakında" çizer.
 * Döner: bağlı mı, görünen numara, şablon durumu (sade) ve Embedded Signup için herkese açık
 * appId/configId. Anahtar ya da Meta kimlikleri tarayıcıya gitmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { GRAPH_SURUM, whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { baglantiOku, sablonlariGuncelle } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { sablonDurumlariniOku, sablonOzeti, SABLON_KODLARI } from '@/lib/iletisim/otomatik/whatsapp/sablonlar'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ayar = whatsappAyar()
  if (!ayar) return NextResponse.json({ error: YAKINDA_MESAJI, yakinda: true }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const kurulum = { appId: ayar.appId, configId: ayar.configId, graphSurum: GRAPH_SURUM }
  const b = await baglantiOku(supabase, user.id)
  if (!b) return NextResponse.json({ bagli: false, kurulum })

  let sablonlar = b.sablonlar
  // Onay bekleyen şablon varsa Meta'dan tazele (webhook kaçmış olabilir). Hata sessiz: eski durum gösterilir.
  if (SABLON_KODLARI.some((k) => sablonlar[k]?.durum !== 'APPROVED')) {
    const guncel = await sablonDurumlariniOku(b.wabaId, b.token).catch(() => null)
    if (guncel) {
      sablonlar = { ...sablonlar, ...guncel }
      await sablonlariGuncelle(supabase, user.id, sablonlar).catch(() => {})
    }
  }
  return NextResponse.json({ bagli: true, numara: b.gorunenNumara, sablon: sablonOzeti(sablonlar), kurulum })
}
