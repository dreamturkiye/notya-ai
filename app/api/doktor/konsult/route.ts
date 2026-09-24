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
import { arsivsizAsilar, arsivsizIlaclar, arsivsizNotlar } from '@/lib/doktor/arsiv'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import { kritikAlarm } from '@/lib/alarm'
import { aiCagir, AiCagriHatasi, yanitMetni } from '@/lib/ai/cagir'
import { aracTanimlari, eylemKapali } from '@/core/eylemler/araclar'
import { toolUseOnerileri, kayitNiyetiMi } from '@/core/eylemler/oneri'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { EYLEM_ISTEM_BLOGU } from '@/core/eylemler/istem'
import { ayseUyariCumlesi } from '@/core/eylemler/ilacUyari'
import { bugunTRT } from '@/core/eylemler/types'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { bosluklariBul, boslukBlogu } from '@/core/eylemler/bosluk'
import { notAlanlariCoz, alerjiListe } from '@/lib/doktor/hastaKayitAlanlari'

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
7. Hastanın adını/kimliğini asla üretme — "hasta" de. Dosyada kimlik bilgisi zaten yoktur. (Onay kartındaki
   hasta adını sistem koyar, sen değil.)
8. Doğum tarihi ve diğer form başlıkları yalnız ilk kayıt formunda değil; epikriz, SOAP ve belgede
   de geçebilir. "DOSYADAN OKUNAN FORM BİLGİLERİ" bölümüne bak — form boş diye "bilinmiyor" deme.`

// NOTYA-EYLEM: the capability paragraph is the SAME text on every surface (core/eylemler/istem.ts).
// Appended to the cached constant block, so it costs nothing per turn.
const SISTEM_EYLEMLI = SISTEM + EYLEM_ISTEM_BLOGU

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

  // NOTYA-EYLEM: hasta kimliği ve branş SUNUCUDA çözülür — model çıktısından ASLA alınmaz (docs §2).
  // hastaOzetiGetir doctor_id ile kapsar, yani yabancı bir id burada null döner ve araç hiç sunulmaz.
  const hasta = eylemKapali() ? null : await hastaOzetiGetir(supabase, doktorId, patientId)
  const { data: hekim } = eylemKapali() ? { data: null } : await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const brans = bransAnahtari((hekim as { specialty?: string } | null)?.specialty)
  // Araçlar yalnız DOKTOR turunda sunulur (docs §5): belge metni güvenilmezdir, kendi başına
  // bir araç çağrısı tetikleyemez. Danış sekmesinde her istek zaten hekimin bir mesajıyla gelir.
  const sonMesajDoktorun = mesajlar[mesajlar.length - 1]?.rol !== 'asistan'
  const araclar = hasta && sonMesajDoktorun ? aracTanimlari({ brans, hasta }) : []

  // NOTYA-EYLEM P2 — proaktif boşluk teklifi. LLM'siz: derlenmiş dosya metni belgelerde aşı/ilaç/
  // alerji/ölçüm geçtiğini söylüyor ama yapılandırılmış kayıt boşsa, Ayşe İLK turda BİR KEZ teklif
  // eder. İkinci turdan sonra sessiz — dırdır eden asistan görmezden gelinir (core/eylemler/bosluk.ts).
  let boslukEk = ''
  if (araclar.length) {
    const [asiSay, ilacSay, hastaSatiri, notSatiri] = await Promise.all([
      arsivsizAsilar(supabase, 'id', { count: 'exact', head: true }).eq('doktor_id', doktorId).eq('patient_id', patientId),
      arsivsizIlaclar(supabase, 'id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('patient_id', patientId).eq('aktif', true),
      supabase.from('patients').select('notes_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
      arsivsizNotlar(supabase, 'vitaller, sessions!inner(patient_id)').eq('sessions.patient_id', patientId).not('vitaller', 'is', null).limit(1),
    ])
    const notAlanlari = notAlanlariCoz((hastaSatiri.data?.notes_encrypted as string | null) ?? null)
    const bosluklar = bosluklariBul(dosya, {
      asi: asiSay.count ?? 0,
      ilac: ilacSay.count ?? 0,
      alerjiVar: alerjiListe(notAlanlari).length > 0,
      olcumVar: Boolean(Array.isArray(notSatiri.data) ? notSatiri.data.length : notSatiri.data),
    })
    boslukEk = boslukBlogu(bosluklar, mesajlar.filter((m) => m.rol !== 'asistan').length)
  }

  // NOTYA-KOTA-01
  const kota = await aiKotaKullan(supabase, doktorId, 'konsult')
  if (!kota.izin) return NextResponse.json({ error: KOTA_MESAJI }, { status: 429 })

  const gecmis = mesajlar.slice(-20).map((m) => ({
    role: m.rol === 'asistan' ? ('assistant' as const) : ('user' as const),
    content: String(m.icerik || '').slice(0, 4000),
  }))
  const sonMetin = String(mesajlar[mesajlar.length - 1]?.icerik || '')
  // yazıver / kaydet → tool_choice any: model cannot narrate a refusal; card still needs the tap.
  const toolChoice = araclar.length && kayitNiyetiMi(sonMetin) ? ('any' as const) : undefined

  try {
    // NOTYA-MALIYET-01: hasta dosyası üzerinde klinik konsültasyon — GÜÇLÜ (klinik-analiz)
    let veri: Awaited<ReturnType<typeof aiCagir>>
    try {
      // prompt caching: aynı hastanın konsültasyonunda SISTEM + dosya her turda aynı → tek kırılma noktası dosyanın sonunda
      veri = await aiCagir({ gorev: 'klinik-analiz', maxTokens: 1500, doctorId: doktorId, system: [{ metin: araclar.length ? SISTEM_EYLEMLI : SISTEM }, { metin: `\n\n=== HASTA DOSYASI ===\n${dosya}`, onbellek: true }, { metin: boslukEk }], messages: gecmis, araclar, toolChoice })
    } catch (e) {
      if (!(e instanceof AiCagriHatasi)) throw e
      console.error('[konsult] anthropic', e.govde.slice(0, 300))
      let msg = 'Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.'
      if (/credit balance/i.test(e.govde)) msg = 'Yapay zekâ servisi geçici olarak kullanılamıyor (hesap bakiyesi). Yönetici bilgilendirildi.'
      else if (/rate_limit|overloaded/i.test(e.govde)) msg = 'Sistem şu an yoğun. Birkaç saniye sonra tekrar deneyin.'
      return NextResponse.json({ error: msg }, { status: 502 })
    }
    const cevap = yanitMetni(veri, '\n')

    // NOTYA-EYLEM: a tool_use block is a PROPOSAL, never a write. Each becomes an eylem_onerileri
    // taslak and comes back as a card; the record happens when the doctor taps (POST /api/doktor/eylem).
    // No tool_result round-trip: the card IS the result, and a second model call would cost a turn
    // to tell Ayşe something she must not claim anyway ("kaydedildi") before the doctor has acted.
    const oneriler = hasta
      ? await toolUseOnerileri(
          veri,
          { supabase, doktorId, hasta, brans, oneriId: '', bugunTRT: bugunTRT() },
          'danis',
          { brans, hasta },
          // NOTYA-EYLEM-31: Danış düz metin döndürür, bu yüzden Ayşe'nin uyarı cümlesi karta
          // deterministik olarak metinden seçilir — üç yüzeyde de kartta aynı satır çıksın diye.
          ayseUyariCumlesi(cevap)
        )
      : []
    return NextResponse.json({ cevap, oneriler, hasta: hasta ? { ad: hasta.ad, dogumTarihi: hasta.dogumTarihi } : null })
  } catch (e) {
    console.error('[konsult]', e)
    await kritikAlarm('konsult 502', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
  }
}
