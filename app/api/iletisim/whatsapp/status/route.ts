/**
 * NOTYA-ILETISIM-03 / WHATSAPP-API-01 — WhatsApp bağlantı durumu (Ayarlar › İletişim kartındaki WhatsAppBaglan).
 *
 * Ortam değişkenleri yoksa 503 + Türkçe mesaj: bileşen "kurulum bekleniyor" durumunu çizer (asla sahte "bağlı" değil).
 * Döner: bağlı mı, görünen numara/ad, şablon durumları, kalite puanı, mesaj sınırı (tier), son 24 saat kullanımı,
 * (Klinik/Hastane planlarında) bu ay kullanımı ve tahmini Meta ücreti, okunmamış yanıt sayısı ve Embedded Signup için
 * herkese açık appId/configId. Erişim anahtarı ya da Meta kimlikleri tarayıcıya gitmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { GRAPH_SURUM, whatsappAyar, YAKINDA_MESAJI } from '@/lib/iletisim/otomatik/whatsapp/ayar'
import { baglantiOku, baglantiSorunu, sablonlariGuncelle } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { buAy, son24Saat, tierEtiketi, tierLimiti, TR_UTILITY_USD } from '@/lib/iletisim/otomatik/whatsapp/kota'
import { saglikTazele } from '@/lib/iletisim/otomatik/whatsapp/saglik'
import { SABLON_ADI, SABLON_KODLARI, sablonDurumlariniOku, sablonOzeti } from '@/lib/iletisim/otomatik/whatsapp/sablonlar'

export const dynamic = 'force-dynamic'

const FATURALI_PLANLAR = ['klinik', 'hastane']

export async function GET(req: NextRequest) {
  const ayar = whatsappAyar()
  if (!ayar) return NextResponse.json({ error: YAKINDA_MESAJI, yakinda: true }, { status: 503 })
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const kurulum = { appId: ayar.appId, configId: ayar.configId, graphSurum: GRAPH_SURUM }
  const b = await baglantiOku(supabase, user.id)
  if (!b) {
    const sorun = await baglantiSorunu(supabase, user.id).catch(() => null)
    return NextResponse.json({ bagli: false, kurulum, ...(sorun ? { sorun } : {}) })
  }

  let sablonlar = b.sablonlar
  // Onay bekleyen şablon varsa Meta'dan tazele (webhook kaçmış olabilir). Hata sessiz: eski durum gösterilir.
  if (SABLON_KODLARI.some((k) => sablonlar[k]?.durum !== 'APPROVED')) {
    const guncel = await sablonDurumlariniOku(b.wabaId, b.token).catch(() => null)
    if (guncel) {
      sablonlar = { ...sablonlar, ...guncel }
      await sablonlariGuncelle(supabase, user.id, sablonlar).catch(() => {})
    }
  }
  // Kalite puanı + mesaj sınırı (en çok saatte bir Meta'ya sorulur). Süresi dolmuş anahtar burada da yakalanır.
  const saglik = await saglikTazele(supabase, b).catch(() => null)
  if (saglik?.durum === 'token_gecersiz') {
    return NextResponse.json({ bagli: false, kurulum, sorun: 'WhatsApp bağlantısının süresi dolmuş. Lütfen yeniden bağlayın.' })
  }
  const tier = saglik?.durum === 'guncel' ? saglik.tier : b.tier
  const kalite = saglik?.durum === 'guncel' ? saglik.kalite : b.kalite

  const { data: plan } = await supabase.from('users').select('subscription_tier').eq('id', user.id).maybeSingle()
  const faturali = FATURALI_PLANLAR.includes(String(plan?.subscription_tier || ''))
  const [son24, ay, yeni] = await Promise.all([
    son24Saat(supabase, user.id),
    faturali ? buAy(supabase, user.id) : Promise.resolve(null),
    supabase.from('whatsapp_yanitlar').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id).eq('durum', 'yeni'),
  ])
  // WHATSAPP-CANCEL-01: the doctor's "result ready" switch (migration 170). Own connection row only; absent column → off.
  const sonuc = await supabase.from('doktor_whatsapp_baglantilari').select('sonuc_bildirimi_acik').eq('doctor_id', user.id).eq('durum', 'bagli').maybeSingle()
  return NextResponse.json({
    bagli: true,
    sonucBildirimi: !sonuc.error && (sonuc.data as { sonuc_bildirimi_acik?: boolean } | null)?.sonuc_bildirimi_acik === true,
    numara: b.gorunenNumara,
    ad: b.gorunenAd,
    sablon: sablonOzeti(sablonlar),
    sablonlar: SABLON_KODLARI.map((k) => ({ kod: k, ad: SABLON_ADI[k], durum: sablonlar[k]?.durum || 'YOK' })),
    kalite,
    limit: tierLimiti(tier),
    limitEtiketi: tierEtiketi(tier),
    kullanim: {
      son24Saat: son24,
      ...(faturali && ay != null ? { buAy: ay, tahminiUsd: Math.round(ay * TR_UTILITY_USD * 10000) / 10000 } : {}),
    },
    yeniYanit: yeni.error ? 0 : yeni.count ?? 0,
    kvkkOnay: !!b.kvkkOnayAt,
    kurulum,
  })
}
