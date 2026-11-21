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
import { modelSec } from '@/lib/ai/modeller'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaDosyasiniDerle } from '@/lib/doktor/hastaDosyaDerleyici'
import { soapNotuUret, stilOrnekleriDerle, type SoapOnerisi } from '@/lib/doktor/soapUret'
import { oneriyiArkaPlandaYaz } from '@/lib/doktor/oneriArkaPlan'
import { aiKotaKullan, KOTA_MESAJI } from '@/lib/doktor/hizLimiti'
import { kritikAlarm } from '@/lib/alarm'
import { hekimAdi, hekimBransi } from '@/lib/doktor/hekimAdi'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { protokolNumarasiAta } from '@/lib/doktor/protokolNo'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { path, patientId, specialty } = body as { path?: string; patientId?: string | null; specialty?: string }
  // NOTYA-SES-02 (Kaan, 2026-09-24): sessions.session_type has a DB check constraint allowing only
  // muayene/kontrol/konsültasyon/telesağlık -- this route always inserted the literal 'ses_yukleme',
  // which is none of those, so the insert below ALWAYS failed with a constraint violation and every
  // audio-file upload died with "Seans kaydı oluşturulamadı," regardless of anything else being
  // correct. The live-recording flow on this same page (app/session/new/page.tsx line ~349) already
  // sends the doctor's own Seans Türü selection; reusing that here instead of a made-up value.
  const SESSION_TYPE_IZIN = new Set(['muayene', 'kontrol', 'konsültasyon', 'telesağlık'])
  const sessionType = typeof body.sessionType === 'string' && SESSION_TYPE_IZIN.has(body.sessionType) ? body.sessionType : 'muayene'
  if (!path || !path.startsWith(`${doktorId}/`) || path.split('/').includes('..')) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu.' }, { status: 400 })
  }

  // NOTYA-GECMIS-MUAYENE-01: opsiyonel geçmiş tarih, sunucuda doğrulanır (bkz. sessions/[id]/end aynı kural).
  let gecmisTarihIso: string | null = null
  if (typeof body.tarih === 'string' && body.tarih) {
    const t = new Date(body.tarih)
    const onYilOnce = Date.now() - 10 * 365 * 86400000
    if (!Number.isNaN(t.getTime()) && t.getTime() < Date.now() && t.getTime() > onYilOnce) gecmisTarihIso = t.toISOString()
  }
  // HASTA-IZOLASYON-01: checked BEFORE the recording is read — a foreign patientId used to pull that
  // patient's last approved plan + diagnosis into this doctor's generated note.
  if (patientId && !(await hastaSahibiMi(supabase, doktorId, String(patientId)))) {
    return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  // NOTYA-KOTA-01
  const kota = await aiKotaKullan(supabase, doktorId, 'soap')
  if (!kota.izin) return NextResponse.json({ error: KOTA_MESAJI }, { status: 429 })

  // 1) Sesi depodan al
  const { data: sesBlob, error: sesHata } = await supabase.storage.from('ses-kayitlari').download(path)
  if (sesHata || !sesBlob) {
    return NextResponse.json({ error: 'Ses dosyası okunamadı. Yüklemeyi tekrar deneyin.' }, { status: 400 })
  }

  const brans = specialty || 'genel'

  // DIKTE-TIBBI-01 (KBB feedback, 2026-11-21): the doctor's personal terms + the branş lexicon, loaded once — they
  // bias Scribe (keyterms) and repair the transcript afterwards. Fails soft: empty lists, the upload goes on. Loaded
  // inside the try below so the raw audio is deleted in `finally` whatever happens here (KVKK).
  let kisisel: { duyulan: string; dogru: string }[] = []
  let keyterms: string[] = []

  // 2) ElevenLabs Scribe ile transkript (Türkçe)
  let transcript = ''
  try {
    try {
      const { kisiselSozlukYukle } = await import('@/lib/dikte/sunucu')
      kisisel = await kisiselSozlukYukle(supabase, doktorId)
      if (process.env.NOTYA_STT_ANAHTAR_TERIM !== '0') {
        const [{ dikteSozluguYukle }, { anahtarTerimler }] = await Promise.all([import('@/lib/dikte/sozluk'), import('@/lib/dikte/anahtarTerim')])
        keyterms = anahtarTerimler({ sozluk: await dikteSozluguYukle(brans), kisisel })
      }
    } catch { keyterms = [] }
    // DIKTE-TIBBI-01: keyterm biasing needs Scribe v2 (scribe_v2 / scribe_v2_medical / scribe_v3 — API reference,
    // 2026-11-21; +20 % on this transcription). NOTYA_STT_MODEL switches the model without a deploy. If the provider
    // refuses the request (4xx), ONE retry with the previous settings (scribe_v1, no keyterms) keeps uploads working.
    const scribe = (model: string, terimler: string[], ms: number) => {
      const fd = new FormData()
      fd.append('model_id', model)
      fd.append('language_code', 'tr')
      for (const t of terimler) fd.append('keyterms', t)
      fd.append('file', sesBlob, 'muayene-kaydi')
      return fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
        body: fd,
        // SAGLAMLIK-2026-10: asılı kalan STT, maxDuration (300 sn) boyunca fonksiyonu kilitlemesin;
        // aşım mevcut ağ-hatası yoluna düşer (502 + ham ses finally'de yine silinir).
        signal: AbortSignal.timeout(ms),
      })
    }
    const baslangic = Date.now()
    const model = (process.env.NOTYA_STT_MODEL || 'scribe_v2').trim()
    let r = await scribe(model, keyterms, 180_000)
    if (!r.ok && r.status >= 400 && r.status < 500 && r.status !== 401 && r.status !== 429) {
      console.error(`[ses-yukle] elevenlabs ${r.status} (${model}, ${keyterms.length} keyterms) — retrying with scribe_v1`)
      r = await scribe('scribe_v1', [], Math.max(20_000, 230_000 - (Date.now() - baslangic)))
    }
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

  // DIKTE-TIBBI-01 (b): deterministic medical repair before the note (no model call, a few ms). The recogniser's own
  // text is kept in sessions.transcript_raw.
  const { transkriptiDuzelt } = await import('@/lib/dikte/sunucu')
  const duzeltme = await transkriptiDuzelt(supabase, doktorId, brans, transcript, kisisel)
  const hamTranskript = transcript
  transcript = duzeltme.metin

  // NOTYA-PROTOKOL-NO-01: atomically reserved BEFORE the insert, then written into the SAME
  // insert() payload — same pattern as app/api/sessions/start/route.ts and
  // app/api/doktor/belgeler/analiz/onayla/route.ts. This route was a missed path (verification
  // pass, 2026-10): it inserted directly into `sessions` with no protokol number at all, so
  // every audio-upload muayene got a permanent NULL. A failure here fails the whole request
  // rather than silently creating a protokol_no-less muayene.
  const protokol = await protokolNumarasiAta(supabase, doktorId)
  if (!protokol) {
    return NextResponse.json({ error: 'Protokol numarası oluşturulamadı.' }, { status: 500 })
  }

  // 3) Seans kaydı oluştur
  const { data: seans, error: seansHata } = await supabase
    .from('sessions')
    .insert({
      doctor_id: doktorId,
      patient_id: patientId || null,
      specialty: brans,
      session_type: sessionType,
      status: 'completed',
      transcript_cleaned: transcript,
      transcript_raw: hamTranskript,
      protokol_no: protokol.protokolNo,
      protokol_scope_id: protokol.scopeId,
      ...(gecmisTarihIso ? { started_at: gecmisTarihIso } : {}),
    })
    .select('id')
    .single()
  if (seansHata || !seans) {
    console.error('[ses-yukle] seans', seansHata?.message)
    return NextResponse.json({ error: 'Seans kaydı oluşturulamadı.' }, { status: 500 })
  }

  // 4) Aynı Ayşe Kaya motoru: kimliksiz klinik bağlam + önceki plan sürekliliği + stil iskeleti (HASTA-KARISMA-01: içerik yok)
  let klinikBaglam = ''
  try {
    if (patientId) {
      const dosya = await hastaDosyasiniDerle(supabase, doktorId, String(patientId))
      if (dosya) klinikBaglam = dosya.split('## VİZİT GEÇMİŞİ')[0].slice(0, 4000)
      // NOTYA-ARSIV-01: arşivlenmiş muayene önceki vizit / stil örneği olarak kullanılmaz.
      const { data: oncekiVizit } = await arsivsizNotlar(supabase, 'content_plan, content_tani, created_at, sessions!inner(patient_id)')
        .eq('sessions.patient_id', patientId)
        .eq('doctor_id', doktorId)
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
    const { data: oncekiNotlar } = await arsivsizNotlar(supabase, 'content_subjektif, content_plan')
      .eq('doctor_id', doktorId)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(2)
    if (oncekiNotlar?.length) stilOrnekleri = stilOrnekleriDerle(oncekiNotlar)
  } catch { /* stil kritik değil */ }

  // NOTYA-OGRENME-03: meslektaş hafızası — stil profili + kesin klinik/üslup kayıtları
  let stilProfili = ''
  let doktorKurallari: { slug: string; satir: string }[] = []
  try {
    const { hafizaYukle, hafizaBloguNot } = await import('@/lib/doktor/hafiza')
    stilProfili = hafizaBloguNot(await hafizaYukle(supabase, doktorId))
    const { uygulanirKurallariYukle } = await import('@/lib/doktor/ogrenme/kuralKaydet')
    doktorKurallari = await uygulanirKurallariYukle(supabase, doktorId)
  } catch { /* profil kritik değil */ }

  try {
        // BRANS-ALAN-SIZMASI: hasta doğum tarihi yalnız karma-yaş branşında (aile/genel) pediatrik bağlam kararı için
    const { hastaDogumIso } = await import('@/lib/specialties/kapsamSunucu')
    const [doktorAdi, doktorBransi, dogumIso] = await Promise.all([hekimAdi(supabase, doktorId), hekimBransi(supabase, doktorId), hastaDogumIso(supabase, doktorId, patientId || null)])
    // NOTYA-NOT-HIZ-03: not gövdesi (A) hazır olunca döner; Ayşe'nin önerisi (B) ayrı sözle gelir.
    const oneri: { soz?: Promise<SoapOnerisi | null> } = {}
    const noteData = await soapNotuUret({ transcript, specialty: brans, klinikBaglam, stilOrnekleri, stilProfili, doktorKurallari, doktorAdi, doktorBransi, hastaDogumIso: dogumIso, doctorId: doktorId }, { oneriAyri: (soz) => { oneri.soz = soz } })
    // NOTYA-ASI-NOT-01: sessions/end ile aynı — yalnız bu vizitte uygulanan aşılar, vizit tarihiyle.
    let notAsilari: unknown[] = []
    try {
      const { muayeneAsilariniHazirla } = await import('@/lib/doktor/notAsiAktarim')
      notAsilari = await muayeneAsilariniHazirla(supabase, { doktorId, patientId: patientId ? String(patientId) : null, transcript, ham: noteData?.asilar, ziyaretIso: gecmisTarihIso })
    } catch (e) { console.error('[asi-not] ses-yukle', e) }

    const { data: note, error: noteError } = await supabase.from('notes').insert({
      session_id: seans.id,
      doctor_id: doktorId,
      note_type: 'soap',
      content_subjektif: noteData?.soap?.subjektif || null,
      content_objektif: noteData?.soap?.objektif || null,
      content_degerlendirme: noteData?.soap?.degerlendirme || null,
      content_plan: noteData?.soap?.plan || null,
      // NOTYA-AI-AYRIM-01: AI çıkarımı doktora özel, portala gitmez.
      ai_degerlendirme: noteData?.aiDegerlendirme || null,
      content_anamnez: noteData?.anamnez || null,
      content_fizik_muayene: noteData?.fizik_muayene || null,
      content_tani: noteData?.tani || null,
      content_tedavi: noteData?.tedavi || null,
      content_ilaclar: noteData?.ilaclar || null,
      content_asilar: notAsilari.length ? notAsilari : null,
      icd10_codes: noteData?.icd10_codes || null,
      kritik_bulgular: noteData?.kritik_bulgular || null,
      takip_suresi: noteData?.takip_suresi || null,
      hasta_ozeti: noteData?.hasta_ozeti || null,
      basvuru_yakinmasi: noteData?.basvuruYakinmasi || null,
      vitaller: noteData?.vitaller || null,
      recete_onerisi: noteData?.receteOnerisi || null,
      alarm_bulgulari: noteData?.alarmBulgulari || null,
      uygulanan_kurallar: noteData?.uygulananKurallar || [],
      ai_model: modelSec('soap').model, // NOTYA-MALIYET-01: etiket politikadan
      ai_confidence: noteData?.ai_confidence || 0.9,
      // NOTYA-SES-03 (Kaan, 2026-09-24): notes tablosunda specialty kolonu hiç yok — branch bilgisi
      // yalnız sessions.specialty'de tutulur, notes buraya sessions üzerinden join'lenir (approve
      // route'un kendi .select()'i de bunu doğrular: 'sessions(specialty, patient_id)'). Bu satır
      // olmayan bir kolona yazmaya çalışıyordu, INSERT HER ZAMAN "Could not find the 'specialty'
      // column of 'notes'" ile patlıyordu — ses başarıyla çözümlüyor, SOAP üretiliyor, ama not hiçbir
      // zaman kaydedilemiyordu. sessions.insert'te birkaç satır yukarıda zaten doğru yazılıyor.
      ...(gecmisTarihIso ? { created_at: gecmisTarihIso } : {}),
    }).select('id').single()
    if (noteError || !note) throw new Error(noteError?.message || 'not kaydedilemedi')
    if (patientId) {
      const { onbellekKirlet } = await import('@/lib/doktor/ogrenme/dosyaOnbellek')
      void onbellekKirlet(supabase, doktorId, String(patientId)).catch(() => { /* önbellek */ })
    }
    // NOTYA-NOT-HIZ-03: öneri arka planda sürer; bitince yalnız bu notun (id + doktor) boş öneri sütunlarını doldurur.
    if (oneri.soz) oneriyiArkaPlandaYaz(supabase, { noteId: String(note.id), doktorId, oneriSozu: oneri.soz, etiket: 'ses-yukle' })

    // HASTA-KARISMA-01 (2026-11-20): no memory learning from an uploaded recording. Scribe returns one undiarised block —
    // the parent's / patient's words ("Sadece anne sütü alıyor…") would be read as the DOCTOR's own statements and could
    // be stored as a doctor-level memory line that then goes into every other patient's note. The doctor teaches Ayşe
    // in chat and through corrections; never through a consultation transcript.

    return NextResponse.json({ success: true, noteId: note.id, sessionId: seans.id })
  } catch (e) {
    console.error('[ses-yukle] uretim', e)
    await kritikAlarm('Ses yükleme: not üretim hatası', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Not üretilemedi. Ses işlendi; İnceleme yerine tekrar deneyin ya da yöneticinize bildirin.' }, { status: 502 })
  }
}
