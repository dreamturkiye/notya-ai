/**
 * NOTYA-KONSULT-03 — SOAP üzerinde Ayşe ile 1:1 konsültasyon + sesli/yazılı düzenleme.
 *
 * Doktor İnceleme'de notu açar ve Ayşe'yle konuşur: "prognoz ne olur?", "planı kısalt",
 * "5 gün sonra kontrole çağıralım", "sekreter yarın arasın". Ayşe:
 *  - meslektaş tonunda cevap verir (not + kimliksiz dosya bağlamıyla),
 *  - istenen SOAP alanlarının yeni tam metnini döndürür (ekranda taslağa işlenir;
 *    KALICI kayıt yalnız doktor Onayla dediğinde olur → not_duzenlemeleri'ne loglanır,
 *    Ayşe'nin öğrenme verisi budur),
 *  - kontrol randevusu / takip araması ÖNERİR — takvime yazan, doktorun ekrandaki onayıdır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaDosyasiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import { kritikAlarm } from '@/lib/alarm'
import Anthropic from '@anthropic-ai/sdk'
import { hafizaYukle, hafizaBloguSohbet, seansIsle, ogrenmeyeDeger, sohbettenOgren } from '@/lib/doktor/hafiza'
import { NOT_YENIDEN_DEGERLENDIR_ISTEK } from '@/lib/doktor/notYenidenDegerlendir'
import { notKapsamiGetir } from '@/lib/specialties/kapsamSunucu'
import { vitalleriKapsamaGoreSuz } from '@/lib/specialties/kapsam'
import { notKonsultSistemParcalari } from '@/lib/doktor/notKonsultPromptu'
import { aiCagir, AiCagriHatasi, yanitMetni } from '@/lib/ai/cagir'
import { aracTanimlari, eylemKapali } from '@/core/eylemler/araclar'
import { toolUseOnerileri, kayitNiyetiMi } from '@/core/eylemler/oneri'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { EYLEM_ISTEM_BLOGU } from '@/core/eylemler/istem'
import { bugunTRT } from '@/core/eylemler/types'
import { ayseUyariCumlesi } from '@/core/eylemler/ilacUyari'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { cekBlokSil } from '@/lib/doktor/muayeneCekListesi'
import { notAsilariniTemizle } from '@/lib/doktor/notAsilari'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface Mesaj { rol: string; icerik: string }

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { noteId, taslak, mesajlar } = body as {
    noteId?: string
    taslak?: { subjektif?: string; objektif?: string; degerlendirme?: string; plan?: string; basvuruYakinmasi?: string; vitaller?: Record<string, string>; alarmBulgulari?: string[]; hastaOzeti?: string; ilaclar?: unknown[]; asilar?: unknown[]; icdKodlari?: unknown[]; receteOnerisi?: unknown[]; aiDegerlendirme?: string }
    mesajlar?: Mesaj[]
  }
  if (!noteId || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return NextResponse.json({ error: 'noteId ve mesajlar zorunludur.' }, { status: 400 })
  }

  const { data: not } = await supabase
    .from('notes')
    .select('id, session_id, icd10_codes, recete_onerisi, alarm_bulgulari, kritik_bulgular, vitaller, basvuru_yakinmasi, hasta_ozeti, sessions(specialty, patient_id)')
    .eq('id', noteId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!not) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })

  const seans = Array.isArray(not.sessions) ? not.sessions[0] : not.sessions

  // NOTYA-KOTA-01
  const kota = await aiKotaKullan(supabase, doktorId, 'konsult')
  if (!kota.izin) return NextResponse.json({ error: KOTA_MESAJI }, { status: 429 })
  let klinikBaglam = ''
  try {
    if (seans?.patient_id) {
      const dosya = await hastaDosyasiniDerle(supabase, doktorId, String(seans.patient_id))
      if (dosya) klinikBaglam = dosya.split('## VİZİT GEÇMİŞİ')[0].slice(0, 3000)
    }
  } catch { /* bağlam kritik değil */ }

  // NOTYA-OGRENME-03: Ayşe'ye Danış da aynı meslektaş hafızasını okur
  let hafizaBlogu = ''
  try { hafizaBlogu = hafizaBloguSohbet(await hafizaYukle(supabase, doktorId)) } catch { /* hafıza kritik değil */ }

  // NOTYA-CEK-DOGRULA-02: ÇEK LİSTESİ bloğu deterministiktir — modele gösterilmez (kopyalamasın), yanıtından da silinir.
  if (taslak && typeof taslak.aiDegerlendirme === 'string') taslak.aiDegerlendirme = cekBlokSil(taslak.aiDegerlendirme)

  const trtBugun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  // BRANS-ALAN-SIZMASI: hitap (hasta/veli), vital anahtarları ve persentil kuralı notun branş kapsamından
  const kapsam = await notKapsamiGetir(supabase, { doctorId: doktorId, seansBransi: seans?.specialty ?? null, patientId: seans?.patient_id ? String(seans.patient_id) : null })
  const sistem = notKonsultSistemParcalari({ kapsam, trtBugun, taslak, not, klinikBaglam, hafizaBlogu })

  // NOTYA-EYLEM: hasta SUNUCUDA çözülür — notun seansındaki patient_id, doctor_id ile kapsanmış olarak.
  const eylemHastasi = eylemKapali() ? null : await hastaOzetiGetir(supabase, doktorId, seans?.patient_id ? String(seans.patient_id) : null)
  const eylemBransi = bransAnahtari(seans?.specialty) ?? kapsam.brans
  const araclar = eylemHastasi ? aracTanimlari({ brans: eylemBransi, hasta: eylemHastasi }) : []

  const gecmis = mesajlar.slice(-16).map((m) => ({
    role: m.rol === 'asistan' ? ('assistant' as const) : ('user' as const),
    content: String(m.icerik || '').slice(0, 3000),
  }))
  const sonMetin = String(mesajlar[mesajlar.length - 1]?.icerik || '')
  const toolChoice = araclar.length && kayitNiyetiMi(sonMetin) ? ('any' as const) : undefined

  try {
    // NOTYA-MALIYET-01: SOAP üzerinde klinik danışma + düzenleme — GÜÇLÜ (klinik-analiz)
    let ham: string
    let yanit: Awaited<ReturnType<typeof aiCagir>> | null = null
    try {
      // prompt caching: kimlik/yetenekler/alan anahtarları (branş kapsamı başına sabit) önbellekli; tarih, taslak, dosya, hafıza arkasından
      yanit = await aiCagir({ gorev: 'klinik-analiz', doctorId: doktorId, system: [{ metin: sistem.sabit + (araclar.length ? EYLEM_ISTEM_BLOGU : ''), onbellek: true }, { metin: `\n${sistem.degisken}` }], messages: gecmis, araclar, toolChoice })
      // yanitMetni yalnız text bloklarını birleştirir — tool_use blokları JSON zarfını bozmaz.
      ham = yanitMetni(yanit)
    } catch (e) {
      if (!(e instanceof AiCagriHatasi)) throw e
      console.error('[not-konsult] anthropic', e.govde.slice(0, 300))
      return NextResponse.json({ error: 'Ayşe şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
    }
    const temiz = ham.replace(/```json\n?|\n?```/g, '').trim()
    let sonuc: { cevap?: string; duzenlemeler?: Record<string, unknown>; eylemler?: unknown[] }
    // Kaan/Gökhan (2026-09-10): model bazen JSON'u düz metnin içine gömüyor → ilk {...} bloğunu çıkar
    try { sonuc = JSON.parse(temiz) } catch {
      const m = temiz.match(/\{[\s\S]*\}/)
      try { sonuc = m ? JSON.parse(m[0]) : { cevap: temiz } } catch { sonuc = { cevap: temiz } }
    }
    // Anahtar normalizasyonu: İngilizce/varyant anahtarlar → beklenen Türkçe anahtarlar
    const ESLE: Record<string, string> = { subjective: 'subjektif', s: 'subjektif', objective: 'objektif', o: 'objektif', assessment: 'degerlendirme', a: 'degerlendirme', degerlendirme: 'degerlendirme', plan: 'plan', p: 'plan', vitals: 'vitaller', vitaller: 'vitaller', alarm: 'alarmBulgulari', alarm_bulgulari: 'alarmBulgulari', alarmbulgulari: 'alarmBulgulari', hasta_ozeti: 'hastaOzeti', hastaozeti: 'hastaOzeti', veliOzeti: 'hastaOzeti', basvuru_yakinmasi: 'basvuruYakinmasi', basvuruyakinmasi: 'basvuruYakinmasi' }
    const dzHam = (sonuc.duzenlemeler && typeof sonuc.duzenlemeler === 'object' ? sonuc.duzenlemeler : {}) as Record<string, unknown>
    const dz: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(dzHam)) { const hedef = ESLE[k] || ESLE[k.toLowerCase()] || k; dz[hedef] = v }
    // BRANS-ALAN-SIZMASI: pediatrik olmayan notta model pediatrik ölçüm (baş çevresi) öneremez
    if (dz.vitaller && typeof dz.vitaller === 'object') dz.vitaller = vitalleriKapsamaGoreSuz(dz.vitaller, kapsam)
    if (typeof dz.aiDegerlendirme === 'string') dz.aiDegerlendirme = cekBlokSil(dz.aiDegerlendirme)
    // NOTYA-ASI-NOT-01: aşı listesi düzenlemesi sunucuda temizlenir (ad normalize, doz 1–12, tarih ISO; boş satır atılır).
    if ('asilar' in dz) { if (Array.isArray(dz.asilar)) dz.asilar = notAsilariniTemizle(dz.asilar); else delete dz.asilar }
    sonuc.duzenlemeler = dz
    if (typeof sonuc.cevap === 'string' && sonuc.cevap.trim().startsWith('{')) sonuc.cevap = 'Düzenlemeyi ekrana işledim Hocam.'
    // NOTYA-EYLEM: tool_use → taslak öneri. Hiçbir şey yazılmadı; hekim kartta onaylayacak.
    const eylemOnerileri = eylemHastasi
      ? await toolUseOnerileri(
          (yanit ?? {}) as { content?: unknown },
          { supabase, doktorId, hasta: eylemHastasi, brans: eylemBransi, oneriId: '', bugunTRT: bugunTRT() },
          'not',
          { brans: eylemBransi, hasta: eylemHastasi },
          // NOTYA-EYLEM-31: not içi kutu da düz metin döndürür; Ayşe'nin uyarı cümlesi karta aynı
          // deterministik seçimle taşınır, böylece üç yüzey de aynı kartı gösterir.
          ayseUyariCumlesi(String(sonuc.cevap || '')),
        )
      : []
    // Araç çağırıp hiç metin yazmadıysa hekim boş baloncuk görmesin.
    const cevap = String(sonuc.cevap || '') || (eylemOnerileri.length ? 'Kartı hazırladım Hocam — onaylarsanız dosyaya işlenir.' : '')

    // NOTYA-OGRENME-03: bu kutu da bir doktor–Ayşe sohbetidir (Dr. Gökhan'ın aslında kullandığı yüzey) —
    // yalnız yazılı sohbette öğrenip burada öğrenmemek hafızayı doktorun gerçekte hiç kullanmadığı tek
    // ekrana bağlıyordu. Otomatik yeniden-değerlendirme tetiklemesi (sistem mesajı) öğrenmeye girmez.
    if (sonMetin !== NOT_YENIDEN_DEGERLENDIR_ISTEK) {
      try {
        await seansIsle(supabase, doktorId, 'sohbet')
        if (ogrenmeyeDeger(sonMetin)) {
          await sohbettenOgren(getAnthropic(), supabase, doktorId, [
            ...gecmis.slice(-4),
            { role: 'assistant', content: cevap },
          ])
        }
      } catch (e) { console.error('[hafiza] not-konsult', e) }
    }

    return NextResponse.json({
      cevap,
      duzenlemeler: sonuc.duzenlemeler && typeof sonuc.duzenlemeler === 'object' ? sonuc.duzenlemeler : {},
      eylemler: Array.isArray(sonuc.eylemler) ? sonuc.eylemler : [],
      eylemOnerileri,
      eylemHastasi: eylemHastasi ? { ad: eylemHastasi.ad, dogumTarihi: eylemHastasi.dogumTarihi } : null,
      patientId: seans?.patient_id || null,
    })
  } catch (e) {
    console.error('[not-konsult]', e)
    await kritikAlarm('not-konsult 502', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Ayşe şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
  }
}
