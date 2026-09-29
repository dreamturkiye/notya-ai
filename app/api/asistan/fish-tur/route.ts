/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın (Fish yolu) BİR sesli turu. ElevenLabs yok.
 *
 * Tarayıcı bitmiş sözü yerel VAD + Fish ASR ile alır (lib/asistan/sozAlgilayici.ts → /api/asistan/fish-dinle),
 * söz başına bir nonce üretir ve buraya TEK istek yollar. Bu rota metnin nereden geldiğini bilmez. Burada tur kuralları ElevenLabs Custom LLM ucuyla ortak çekirdekten koşar
 * (lib/asistan/sesTuru.ts → ayseCevapla, kanal 'ses'); bitmiş her cümle bir NDJSON satırı olarak döner, tarayıcı
 * onu Fish'e okutur. Ekran biçimi yine ortak oturumdan /api/asistan/ses-ekran ile okunur.
 *
 * Tek model çağrısı: (doktor, oturum, nonce) anahtarı süreç içi kilitte (lib/asistan/turKilidi.ts). Aynı nonce ile
 * gelen ikinci istek modeli yeniden çağırmaz, aynı turun satırlarını alır. İstemci bağlantıyı bırakınca (doktor sözü
 * kesti) ya da aynı oturumda yeni bir söz gelince, sesi hâlâ akan tur iptal edilir — model akışı durur.
 *
 * Ölçüm: istek → ilk cümle (ilk_soz_ms) kilidin iş fonksiyonunda, tur başına BİR kez ses_kullanim'a + günlüğe.
 *
 * Satırlar: {"t":"soz","metin":…} · {"t":"veda"} · {"t":"hata","soz":…} · {"t":"bitti","iptal":bool}
 *
 * HASTA-IZOLASYON-01: doktor kendi Bearer jetonundan (doktorOturum); oturum id + doctor_id birlikte çözülür,
 * yabancı / bilinmeyen oturum 404 ve model çağrılmaz. Hasta kimliği istekten ALINMAZ — odak oturumun kendisindedir
 * (sayfa odağı /api/asistan/oturum-hasta ile, yine sahiplik kontrollü). Günlüğe klinik içerik yazılmaz.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum, servisSupabase } from '@/lib/doktor/serverAuth'
import { sesTurunuYurut } from '@/lib/asistan/sesTuru'
import { FISH_TUR_KILIDI, TurKilidi, type TurOlayi } from '@/lib/asistan/turKilidi'
import { fishUctanUcaAcik } from '@/lib/asistan/fishSes'
import { arkadaYaz, sesGecikmesiYaz } from '@/lib/asistan/sesKullanim'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const NONCE = /^[A-Za-z0-9_-]{8,80}$/
const UST_KARAKTER = 4000
const PERSONA = 'aysekaya'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const doktorId = user.id
  if (!fishUctanUcaAcik(PERSONA)) return NextResponse.json({ error: 'Ses hattı kapalı' }, { status: 409 })

  const govde = (await req.json().catch(() => ({}))) as { asistanSessionId?: unknown; nonce?: unknown; metin?: unknown }
  const asistanSessionId = String(govde.asistanSessionId || '').trim()
  const nonce = String(govde.nonce || '').trim()
  const metin = typeof govde.metin === 'string' ? govde.metin.replace(/\s+/g, ' ').trim().slice(0, UST_KARAKTER) : ''
  if (!asistanSessionId || !NONCE.test(nonce) || !metin) {
    return NextResponse.json({ error: 'asistanSessionId, nonce ve metin gerekli.' }, { status: 400 })
  }

  const { data: kayit } = await supabase
    .from('asistan_sessions')
    .select('id, active_context')
    .eq('id', asistanSessionId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!kayit) return NextResponse.json({ error: 'Asistan oturumu bulunamadı.' }, { status: 404 })
  const baglam = ((kayit as { active_context?: Record<string, unknown> }).active_context || {})
  const specialty = typeof baglam.specialty === 'string' && baglam.specialty ? baglam.specialty : 'pediatri'

  const bas = Date.now()
  const { yayin, birak } = FISH_TUR_KILIDI.al(TurKilidi.anahtar(doktorId, asistanSessionId, nonce), asistanSessionId, async (y, iptal) => {
    let ilk = true
    await sesTurunuYurut({
      supabase: () => servisSupabase(),
      doktorId, oturumId: asistanSessionId, specialty, patientId: null, personaId: PERSONA,
      mesaj: metin,
      yay: (t) => {
        if (ilk) {
          ilk = false
          arkadaYaz(sesGecikmesiYaz(supabase, doktorId, asistanSessionId, { ilk_soz_ms: Date.now() - bas }))
        }
        y.yayinla({ t: 'soz', metin: t.trim() })
      },
      veda: () => y.yayinla({ t: 'veda' }),
      iptal,
    })
  })

  const enc = new TextEncoder()
  let birakAbonelik: () => void = () => {}
  const akis = new ReadableStream<Uint8Array>({
    start(controller) {
      let kapali = false
      const kapat = () => {
        if (kapali) return
        kapali = true
        birakAbonelik()
        birak()
        try { controller.close() } catch { /* zaten kapandı */ }
      }
      req.signal?.addEventListener?.('abort', kapat, { once: true })
      birakAbonelik = yayin.dinle((o: TurOlayi) => {
        if (kapali) return
        try { controller.enqueue(enc.encode(`${JSON.stringify(o)}\n`)) } catch { kapat(); return }
        if (o.t === 'bitti' || o.t === 'hata') kapat()
      })
    },
    cancel() {
      // Tarayıcı okumayı bıraktı (doktor sözü kesti): bu abonelik düşer; son abone buysa tur iptal edilir.
      birakAbonelik()
      birak()
    },
  })

  return new Response(akis, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' },
  })
}
