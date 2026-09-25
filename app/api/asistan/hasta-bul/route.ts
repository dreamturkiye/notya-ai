/**
 * NOTYA-SES-HASTA-01 — Sesli Ayşe için hasta çözümleme (Kaan 2026-09-14).
 *
 * Gökhan'ın raporu: "Ayşe Hocam bana fırça attı, dosyalara giremiyorum diyor" — sesli Ayşe
 * gerçekten hasta dosyasına erişemiyordu. Yazılı sohbette bu zaten çözülmüştü
 * (lib/doktor/hastaCozumleyici.ts + hastaDosyasiniDerle) ama sesli oturuma hiç bağlanmamıştı;
 * ElevenLabs ConvAI'nin gerçek zamanlı bir "hastanın dosyasına bak" aracı yoktu.
 *
 * Bu uç, ElevenLabs "client tool" olarak agent'a tanımlanır (bkz. scripts/_el-tool-kur.mts);
 * doktor konuşurken bir hasta ismi geçtiğinde agent bu aracı çağırır, tarayıcı (doktorun kendi
 * oturum belirteciyle) bu API'yi çağırır, sonuç sese dönüştürülüp okunur. Aynı yetki sınırları:
 * yalnız o doktorun kendi hastaları, TC/şifreli veri asla ham dönmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { cozumKonus, hastaninSozunuCoz } from '@/lib/doktor/hastaCozumleyici'
import { hastaDosyaPaketiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'
import { dosyaSoruCevap, kartSoyle } from '@/lib/doktor/hastaDosyaKart'
import { kimlikSorusunuCevapla } from '@/lib/doktor/kimlikSorusu'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as { isim?: string; hastaAdi?: string }
  const soz = String(body.isim || body.hastaAdi || '').trim()
  if (!soz) return NextResponse.json({ sonuc: 'Hasta adını anlayamadım, tekrar söyler misiniz?' })

  try {
    // NOTYA-BETA-0925: kimlik / iletişim sorusu → değerler yalnız `ekran` ile tarayıcıya (sesli sayfa bunu sohbet
    // balonuna yazar); ElevenLabs ajanına giden `sonuc` değer taşımaz — kimlik bilgisi hiçbir model bağlamına girmez.
    const kimlik = await kimlikSorusunuCevapla(supabase, doktorId, soz, null)
    if (kimlik) {
      return NextResponse.json({
        sonuc: kimlik.model,
        ekran: kimlik.ekran,
        ...(kimlik.hasta ? { patientId: kimlik.hasta.id, ad: kimlik.hasta.ad } : {}),
      })
    }
    const cozum = await hastaninSozunuCoz(supabase, doktorId, soz)
    const konus = cozumKonus(cozum)
    if (cozum.tur === 'coklu') {
      return NextResponse.json({
        sonuc: konus || 'Birden fazla hasta bulundu. Hangisini istiyorsunuz?',
        adaylar: cozum.adaylar.map((a, i) => ({ sira: i + 1, ad: a.ad, ozet: a.ozet })),
        sayi: cozum.adaylar.length,
      })
    }
    if (cozum.tur === 'yok') {
      return NextResponse.json({ sonuc: konus || 'Bu filtrelere uyan hasta yok Hocam. Yaş, hafta, gelme nedeni, tanı veya adla tekrar dener misiniz?' })
    }
    const paket = await hastaDosyaPaketiniDerle(supabase, doktorId, cozum.patientId)
    if (!paket) return NextResponse.json({ sonuc: `${cozum.ad} için dosya bulamadım.` })
    const kesin = dosyaSoruCevap(soz, paket.kart)
    return NextResponse.json({
      sonuc: `${cozum.ad}. ${kesin || kartSoyle(paket.kart)}`,
      patientId: cozum.patientId,
      ad: cozum.ad,
    })
  } catch (e) {
    console.error('[ses-hasta-bul]', e)
    return NextResponse.json({ sonuc: 'Dosyaya şu an ulaşamadım, kısa bir süre sonra tekrar deneyin.' })
  }
}
