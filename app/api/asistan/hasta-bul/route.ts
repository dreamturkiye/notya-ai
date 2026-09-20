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
import { hastaninSozunuCoz } from '@/lib/doktor/hastaCozumleyici'
import { hastaDosyasiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'

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
    const cozum = await hastaninSozunuCoz(supabase, doktorId, soz)
    if (cozum.tur === 'coklu') {
      const liste = cozum.adaylar.map((a, i) => `${i + 1}. ${a.ad}${a.dobMetin ? ` (d.t. ${a.dobMetin})` : ''} — ${a.ozet}`).join('. ')
      return NextResponse.json({
        sonuc: `${cozum.adaylar.length} hasta eşleşti, sırayla: ${liste}. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin.`,
        adaylar: cozum.adaylar.map((a, i) => ({ sira: i + 1, ad: a.ad, ozet: a.ozet })),
      })
    }
    if (cozum.tur === 'yok') {
      return NextResponse.json({ sonuc: `Bu soruya uyan hasta bulamadım Hocam. Ad, aşı, şikayet, tanı veya haftayla tekrar dener misiniz?` })
    }
    const dosya = await hastaDosyasiniDerle(supabase, doktorId, cozum.patientId)
    if (!dosya) return NextResponse.json({ sonuc: `${cozum.ad} için dosya bulamadım.` })
    // Sese okunacak metin — dosya zaten kısa/sınırlı derleniyor (hastaDosyasiniDerle)
    return NextResponse.json({ sonuc: `${cozum.ad} — dosya:\n${dosya}`, patientId: cozum.patientId, ad: cozum.ad })
  } catch (e) {
    console.error('[ses-hasta-bul]', e)
    return NextResponse.json({ sonuc: 'Dosyaya şu an ulaşamadım, kısa bir süre sonra tekrar deneyin.' })
  }
}
