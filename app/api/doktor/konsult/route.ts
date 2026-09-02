/**
 * NOTYA-KONSULT-01 — Doktor–asistan 1:1 klinik konsültasyon.
 *
 * Asistan burada randevu sekreteri değil, hastanın dosyasını ezbere bilen klinik
 * meslektaştır: vizit sayısı/özetleri, sürekli ilaçlar, özgeçmiş, görüntüleme geçmişi
 * gibi her soruya dosyadan cevap verir ve doktor yeni ilaç yazarken mevcut ilaçlarla
 * olası etkileşimleri PROAKTİF uyarır. Dosya her istekte taze derlenir (hastaDosyaDerleyici),
 * bu yüzden az önce eklenen not/ilaç da görünür.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaDosyasiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SISTEM = `Sen Ayşe, Notya'da doktorun klinik meslektaşı olan yapay zekâ asistanısın.
Aşağıda bu hastanın TAM dosyası var: ilk kayıt formu, tüm vizitlerin SOAP notları, sürekli
ilaçlar, aşılar, görüntüleme ve belgeler. Doktorla Türkçe, meslektaş tonunda ("Hocam" diye
hitap ederek), kısa ve öz konuş.

Kurallar:
1. YALNIZCA dosyadaki verilere dayan. Dosyada olmayan bilgiyi uydurma; "dosyada bu bilgi yok
   Hocam" de.
2. Vizit özetleri istenirse yoğun ve klinik anlamlı özetle — yaklaşık 1 dakikada okunacak
   uzunlukta: her vizit için tarih, geliş nedeni, bulgular, verilen tedavi, sonuç.
3. "Kaçıncı ziyaret" sorulursa dosyadaki toplam vizit sayısını ve tarih aralığını söyle.
4. İLAÇ ETKİLEŞİM UYARISI: Doktor yeni bir ilaçtan bahsederse, hastanın sürekli ilaçlarıyla
   bilinen olumsuz etkileşim ihtimalini kendiliğinden kontrol et ve varsa şu formatta uyar:
   "Hocam, hasta şu an X kullanıyor; Y ile birlikte ... riski olabilir." Emin değilsen
   "etkileşim kontrolü öneririm" de. Kesin farmakolojik hüküm verme.
5. Doktorun unutmuş olabileceği kritik dosya bilgilerini (alerji, kronik hastalık, önceki
   kritik bulgu) yeri geldiğinde kendiliğinden hatırlat.
6. Nihai klinik karar ve sorumluluk her zaman doktordadır; bunu gerektiğinde kibarca belirt.
7. Hastanın adını/kimliğini asla üretme — "hasta" de. Dosyada kimlik bilgisi zaten yoktur.`

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { patientId, mesajlar } = body as { patientId?: string; mesajlar?: { rol: string; icerik: string }[] }
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!Array.isArray(mesajlar) || mesajlar.length === 0) return NextResponse.json({ error: 'mesajlar zorunludur.' }, { status: 400 })

  const dosya = await hastaDosyasiniDerle(supabase, doktorId, patientId)
  if (!dosya) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const gecmis = mesajlar.slice(-20).map((m) => ({
    role: m.rol === 'asistan' ? ('assistant' as const) : ('user' as const),
    content: String(m.icerik || '').slice(0, 4000),
  }))

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `${SISTEM}\n\n=== HASTA DOSYASI ===\n${dosya}`,
        messages: gecmis,
      }),
    })
    const veri = await r.json()
    if (!r.ok) {
      console.error('[konsult] anthropic', JSON.stringify(veri).slice(0, 300))
      const ham = JSON.stringify(veri)
      let msg = 'Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.'
      if (/credit balance/i.test(ham)) msg = 'Yapay zekâ servisi geçici olarak kullanılamıyor (hesap bakiyesi). Yönetici bilgilendirildi.'
      else if (/rate_limit|overloaded/i.test(ham)) msg = 'Sistem şu an yoğun. Birkaç saniye sonra tekrar deneyin.'
      return NextResponse.json({ error: msg }, { status: 502 })
    }
    const cevap = (veri.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n')
    return NextResponse.json({ cevap })
  } catch (e) {
    console.error('[konsult]', e)
    return NextResponse.json({ error: 'Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
  }
}
