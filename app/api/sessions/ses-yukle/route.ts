/**
 * NOTYA-SES-01 — Ses dosyası yükle → SOAP.
 * Doktor muayeneyi telefonda kaydettiyse ya da kayıt başlatmayı unuttuysa: dosyayı yükler,
 * ElevenLabs Scribe ile Türkçe transkript çıkarılır, aynı Ayşe Kaya SOAP motoru çalışır ve
 * not İnceleme kuyruğuna düşer. Ses dosyası, transkript alınır alınmaz depodan SİLİNİR
 * (KVKK — ham ses tutulmaz; klinik kayıt transkript ve nottur).
 * Dosya, istemciden doğrudan Supabase Storage'a (ses-kayitlari/{doktorId}/...) yüklenir;
 * bu route yalnız yolu alır — Vercel gövde limiti sorunsuz aşılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaDosyasiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'
import { soapNotuUret, stilOrnekleriDerle } from '@/lib/doktor/soapUret'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import { kritikAlarm } from '@/lib/alarm'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { path, patientId, specialty } = body as { path?: string; patientId?: string | null; specialty?: string }
  if (!path || !path.startsWith(`${doktorId}/`)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu.' }, { status: 400 })
  }

  // NOTYA-KOTA-01
  const kota = await aiKotaKullan(supabase, doktorId, 'soap')
  if (!kota.izin) return NextResponse.json({ error: KOTA_MESAJI }, { status: 429 })

  // 1) Sesi depodan al
  const { data: sesBlob, error: sesHata } = await supabase.storage.from('ses-kayitlari').download(path)
  if (sesHata || !sesBlob) {
    return NextResponse.json({ error: 'Ses dosyası okunamadı. Yüklemeyi tekrar deneyin.' }, { status: 400 })
  }

  // 2) ElevenLabs Scribe ile transkript (Türkçe)
  let transcript = ''
  try {
    const fd = new FormData()
    fd.append('model_id', 'scribe_v1')
    fd.append('language_code', 'tr')
    fd.append('file', sesBlob, 'muayene-kaydi')
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
      body: fd,
    })
    const veri = await r.json()
    if (!r.ok) {
      console.error('[ses-yukle] elevenlabs', JSON.stringify(veri).slice(0, 300))
      return NextResponse.json({ error: 'Ses çözümlenemedi. Dosya biçimini kontrol edip tekrar deneyin.' }, { status: 502 })
    }
    transcript = String(veri.text || '')
  } finally {
    // KVKK: ham ses transkript sonrası tutulmaz — başarı/başarısızlık fark etmeksizin sil
    try { await supabase.storage.from('ses-kayitlari').remove([path]) } catch { /* sessiz */ }
  }
  if (transcript.trim().length < 40) {
    return NextResponse.json({ error: 'Kayıtta yeterli konuşma bulunamadı.' }, { status: 400 })
  }

  const brans = specialty || 'genel'

  // 3) Seans kaydı oluştur
  const { data: seans, error: seansHata } = await supabase
    .from('sessions')
    .insert({
      doctor_id: doktorId,
      patient_id: patientId || null,
      specialty: brans,
      session_type: 'ses_yukleme',
      status: 'completed',
      transcript_cleaned: transcript,
    })
    .select('id')
    .single()
  if (seansHata || !seans) {
    console.error('[ses-yukle] seans', seansHata?.message)
    return NextResponse.json({ error: 'Seans kaydı oluşturulamadı.' }, { status: 500 })
  }

  // 4) Aynı Ayşe Kaya motoru: kimliksiz klinik bağlam + önceki plan sürekliliği + stil örnekleri
  let klinikBaglam = ''
  try {
    if (patientId) {
      const dosya = await hastaDosyasiniDerle(supabase, doktorId, String(patientId))
      if (dosya) klinikBaglam = dosya.split('## VİZİT GEÇMİŞİ')[0].slice(0, 4000)
      const { data: oncekiVizit } = await supabase
        .from('notes')
        .select('content_plan, content_tani, created_at, sessions!inner(patient_id)')
        .eq('sessions.patient_id', patientId)
        .not('approved_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
      const ov = oncekiVizit?.[0]
      if (ov?.content_plan) {
        const ovTarih = new Date(String(ov.created_at)).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
        klinikBaglam += `\n\nÖNCEKİ VİZİT PLANI (${ovTarih}${ov.content_tani ? ` — tanı: ${String(ov.content_tani).slice(0, 200)}` : ''}):\n${String(ov.content_plan).slice(0, 1200)}`
      }
    }
  } catch { /* bağlam kritik değil */ }

  let stilOrnekleri = ''
  try {
    const { data: oncekiNotlar } = await supabase
      .from('notes')
      .select('content_subjektif, content_plan')
      .eq('doctor_id', doktorId)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(2)
    if (oncekiNotlar?.length) stilOrnekleri = stilOrnekleriDerle(oncekiNotlar)
  } catch { /* stil kritik değil */ }

  // NOTYA-OGRENME-02: damıtılmış doktor tercihleri üretime girer
  let stilProfili = ''
  try {
    const { data: sp } = await supabase.from('doktor_stil_profilleri').select('profil').eq('doctor_id', doktorId).maybeSingle()
    stilProfili = String(sp?.profil || '')
  } catch { /* profil kritik değil */ }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const noteData = await soapNotuUret(anthropic, { transcript, specialty: brans, klinikBaglam, stilOrnekleri, stilProfili })

    const { data: note, error: noteError } = await supabase.from('notes').insert({
      session_id: seans.id,
      doctor_id: doktorId,
      note_type: 'soap',
      content_subjektif: noteData?.soap?.subjektif || null,
      content_objektif: noteData?.soap?.objektif || null,
      content_degerlendirme: noteData?.soap?.degerlendirme || null,
      content_plan: noteData?.soap?.plan || null,
      content_anamnez: noteData?.anamnez || null,
      content_fizik_muayene: noteData?.fizik_muayene || null,
      content_tani: noteData?.tani || null,
      content_tedavi: noteData?.tedavi || null,
      content_ilaclar: noteData?.ilaclar || null,
      icd10_codes: noteData?.icd10_codes || null,
      kritik_bulgular: noteData?.kritik_bulgular || null,
      takip_suresi: noteData?.takip_suresi || null,
      hasta_ozeti: noteData?.hasta_ozeti || null,
      basvuru_yakinmasi: noteData?.basvuruYakinmasi || null,
      vitaller: noteData?.vitaller || null,
      recete_onerisi: noteData?.receteOnerisi || null,
      alarm_bulgulari: noteData?.alarmBulgulari || null,
      ai_model: 'claude-sonnet-4-6',
      ai_confidence: noteData?.ai_confidence || 0.9,
      specialty: brans,
    }).select('id').single()
    if (noteError || !note) throw new Error(noteError?.message || 'not kaydedilemedi')

    return NextResponse.json({ success: true, noteId: note.id, sessionId: seans.id })
  } catch (e) {
    console.error('[ses-yukle] uretim', e)
    await kritikAlarm('ses-yukle uretim hatasi', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Not üretilemedi. Ses işlendi; İnceleme yerine tekrar deneyin ya da yöneticinize bildirin.' }, { status: 502 })
  }
}
