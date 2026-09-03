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

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Mesaj { rol: string; icerik: string }

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { noteId, taslak, mesajlar } = body as {
    noteId?: string
    taslak?: { subjektif?: string; objektif?: string; degerlendirme?: string; plan?: string }
    mesajlar?: Mesaj[]
  }
  if (!noteId || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return NextResponse.json({ error: 'noteId ve mesajlar zorunludur.' }, { status: 400 })
  }

  const { data: not } = await supabase
    .from('notes')
    .select('id, session_id, icd10_codes, recete_onerisi, alarm_bulgulari, kritik_bulgular, vitaller, basvuru_yakinmasi, sessions(specialty, patient_id)')
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

  const trtBugun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const sistem = `Sen Ayşe Kaya — Notya'nın klinik uzmanı. Doktor, AZ ÖNCE üretilen SOAP notunu seninle birlikte gözden geçiriyor. Türkçe, meslektaş tonunda ("Hocam"), kısa ve öz konuş.

YETENEKLERİN:
1. KONSULT: prognoz, tedavi planı, kontrol zamanlaması gibi sorulara nottaki ve dosyadaki verilere dayanarak cevap ver. Dosyada olmayanı uydurma.
2. DÜZENLEME: doktor bir bölümü değiştirmeni isterse (ekle, çıkar, kısalt, yeniden yaz) ilgili alanların YENİ TAM METNİNİ "duzenlemeler" içinde döndür — YALNIZ değişmesi istenen alanları döndür, diğerlerini hiç koyma. Düzenlemeyi cevapta bir cümleyle özetle.
3. EYLEM ÖNERİSİ: kontrol randevusu ya da takip araması kararlaştırılıyorsa "eylemler" listesine ekle (tarih YYYY-MM-DD, saat HH:MM — TRT; kim: doktor|sekreter). Eylemi SEN gerçekleştiremezsin; doktor ekranda onaylayınca sistem takvime yazar — bunu bil ve "onaylarsanız takvime eklerim" de.

Bugün (TRT): ${trtBugun}. Nihai klinik karar ve sorumluluk her zaman doktorundur.

MEVCUT SOAP TASLAĞI (doktorun ekranındaki güncel hali):
S: ${taslak?.subjektif || ''}
O: ${taslak?.objektif || ''}
A: ${taslak?.degerlendirme || ''}
P: ${taslak?.plan || ''}

NOT EKLERİ: Vitaller: ${JSON.stringify(not.vitaller || {})} | ICD önerileri: ${JSON.stringify(not.icd10_codes || [])} | Reçete önerisi: ${JSON.stringify(not.recete_onerisi || [])} | Alarm bulguları: ${JSON.stringify(not.alarm_bulgulari || [])}
${klinikBaglam ? `\nHASTANIN KİMLİKSİZ DOSYA BAĞLAMI:\n${klinikBaglam}` : ''}

SADECE geçerli JSON döndür:
{"cevap":"...","duzenlemeler":{},"eylemler":[]}
duzenlemeler yalnız değişen alanları içerir ({"plan":"..."} gibi); eylemler öğeleri {"tur":"kontrol_randevu"|"takip_aramasi","tarih":"YYYY-MM-DD","saat":"HH:MM","kim":"doktor"|"sekreter","aciklama":"..."} biçimindedir.`

  const gecmis = mesajlar.slice(-16).map((m) => ({
    role: m.rol === 'asistan' ? ('assistant' as const) : ('user' as const),
    content: String(m.icerik || '').slice(0, 3000),
  }))

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, system: sistem, messages: gecmis }),
    })
    const veri = await r.json()
    if (!r.ok) {
      console.error('[not-konsult] anthropic', JSON.stringify(veri).slice(0, 300))
      return NextResponse.json({ error: 'Ayşe şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
    }
    const ham = (veri.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('')
    const temiz = ham.replace(/```json\n?|\n?```/g, '').trim()
    let sonuc: { cevap?: string; duzenlemeler?: Record<string, string>; eylemler?: unknown[] }
    try { sonuc = JSON.parse(temiz) } catch { sonuc = { cevap: temiz } }
    return NextResponse.json({
      cevap: String(sonuc.cevap || ''),
      duzenlemeler: sonuc.duzenlemeler && typeof sonuc.duzenlemeler === 'object' ? sonuc.duzenlemeler : {},
      eylemler: Array.isArray(sonuc.eylemler) ? sonuc.eylemler : [],
      patientId: seans?.patient_id || null,
    })
  } catch (e) {
    console.error('[not-konsult]', e)
    await kritikAlarm('not-konsult 502', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Ayşe şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 502 })
  }
}
