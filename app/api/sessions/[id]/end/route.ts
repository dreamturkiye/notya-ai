
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 })
    }
    const token = authHeader.split(" ")[1]
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Geçersiz token" }, { status: 401 })
    }

    const body = await req.json()
    const { segments, profession, context } = body
    const sessionId = params.id

    // Build transcript from segments or use raw text
    const transcript = segments
      ?.map((s: { speaker: string; text: string }) => `[${s.speaker?.toUpperCase() || "DOKTOR"}]: ${s.text}`)
      .join("\n") || body.transcript || "Transkript mevcut değil"

    // Update session as processing
    await getSupabase().from("sessions").update({
      status: "processing",
      ended_at: new Date().toISOString(),
      transcript_cleaned: transcript,
      duration_seconds: body.duration_seconds || 0,
    }).eq("id", sessionId).eq("doctor_id", user.id)

    // Mali müşavirlik path
    if (body.profession === 'muhasebeci' || context?.profession === 'muhasebeci') {
      const { generateAccountingNoteV2 } = await import('@/lib/ai/noteGenerator')
      const maliNote = await generateAccountingNoteV2(
        transcript,
        context?.service_type || 'genel',
        context?.görüşme_turu || body.session_type || 'müşteri_görüşmesi',
        { company_name: context?.company_name, vergi_no: context?.vergi_no, faaliyet_alani: context?.faaliyet_alani, tax_period: '2026' }
      )
      const { data: note, error: noteError } = await getSupabase().from('notes').insert({
        session_id: sessionId, doctor_id: user.id, note_type: 'mali_musavirlik',
        content_subjektif: JSON.stringify(maliNote.tespitler),
        content_degerlendirme: JSON.stringify(maliNote.yasal_dayanak),
        content_plan: JSON.stringify(maliNote.tavsiyeler),
        kritik_bulgular: maliNote.onemli_uyarilar,
        vergi_risk_skoru: maliNote.vergi_risk_skoru,
        görüşme_turu: maliNote.görüşme_turu,
        profession_type: 'mali_musavirlik',
        raw_note: JSON.stringify(maliNote),
        ai_model: 'claude-sonnet-4', ai_confidence: maliNote.ai_confidence,
      }).select().single()
      if (noteError) throw new Error('Mali not kaydedilemedi: ' + noteError.message)
      await getSupabase().from('sessions').update({ status: 'completed' }).eq('id', sessionId)
      return NextResponse.json({ success: true, data: { session_id: sessionId, note_id: note.id, note: maliNote } })
    }

    // Allied health path: fizyoterapi, diyetisyen, ergoterapi, odyoloji, psikolog
    // Bu meslek gruplari tani koyamaz - her kayit hekim tani referansi gerektirir (Yonetmelik 29 Mart 2025)
    const alliedHealthProfessions = ['fizyoterapi', 'diyetisyen', 'ergoterapi', 'odyoloji', 'psikolog']
    const alliedProfession = body.profession || context?.profession
    if (alliedHealthProfessions.includes(alliedProfession)) {
      const hekimTaniReferansi = context?.hekim_tani_referansi || null
      const hekimTaniTarihi = context?.hekim_tani_tarihi || null
      const hekimAdi = context?.hekim_adi || null
      const tedaviPlaniOzet = context?.tedavi_plani_ozet || null

      if (!hekimTaniReferansi || !hekimTaniReferansi.trim()) {
        return NextResponse.json({ success: false, error: 'Hekim tanısı referansı zorunludur - bu meslek grubu için tedavi kaydı oluşturulamaz' }, { status: 400 })
      }

      const alliedSystemPrompt = `Sen Notya AI klinik not asistanısın. Türkiye'de faaliyet gösteren ${alliedProfession} meslek grubu için çalışıyorsun.
SEN BİR HEKİM DEĞILSIN ve asla tanı koyamaz, tanı belirtemez veya tanı çağrışımı yapamazsın.
Sadece verilen hekim tanısı ve tedavi planı doğrultusunda bu seansta yapılanları yapılandır.

SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{
  "seans_notu": "Bu seansta yapılan uygulama ve müdahaleler",
  "ilerleme_notu": "Onceki seanslara göre hastanın ilerlemesi",
  "sonraki_adimlar": "Bir sonraki seans için plan",
  "ai_confidence": 0.9
}`

      const alliedUserMessage = `Seans transkripti:\n${transcript}\n\nMeslek: ${alliedProfession}\nHekim Tanısı: ${hekimTaniReferansi}\nHekim Adı: ${hekimAdi || 'Belirtilmedi'}\nTedavi Planı Özeti: ${tedaviPlaniOzet || 'Belirtilmedi'}`

      const alliedResponse = await getAnthropic().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: alliedSystemPrompt,
        messages: [{ role: 'user', content: alliedUserMessage }]
      })

      const alliedRawText = alliedResponse.content[0].type === 'text' ? alliedResponse.content[0].text : ''
      const alliedCleanJson = alliedRawText.replace(/```json\n?|\n?```/g, '').trim()
      const alliedNoteData = JSON.parse(alliedCleanJson)

      const { data: alliedNote, error: alliedNoteError } = await getSupabase().from('notes').insert({
        session_id: sessionId,
        doctor_id: user.id,
        note_type: alliedProfession,
        content_subjektif: alliedNoteData?.seans_notu || null,
        content_plan: alliedNoteData?.sonraki_adimlar || null,
        hekim_tani_referansi: hekimTaniReferansi,
        hekim_tani_tarihi: hekimTaniTarihi,
        hekim_adi: hekimAdi,
        tedavi_plani_ozet: tedaviPlaniOzet,
        ai_model: 'claude-sonnet-4-6',
        ai_confidence: alliedNoteData?.ai_confidence || 0.9,
      }).select().single()

      if (alliedNoteError) throw new Error('Seans notu kaydedilemedi: ' + alliedNoteError.message)

      await getSupabase().from('sessions').update({ status: 'completed' }).eq('id', sessionId)

      return NextResponse.json({ success: true, data: { session_id: sessionId, note_id: alliedNote.id, note: alliedNoteData } })
    }

    const specialty = context?.specialty || "genel"

    // NOTYA-SOAP-02: dünya standardı üretici — Ayşe Kaya personası + gürültü filtresi +
    // SGK doğrulamalı reçete önerisi + onaylı notlardan stil öğrenmesi, tek modülde
    // (lib/doktor/soapUret). Hastanın kimliği (TC/ad) modele ASLA gitmez; yalnız kimliksiz
    // klinik bağlam (yaş, alerji, sürekli ilaçlar) gider — alerji çelişkili öneri engellenir.
    const { soapNotuUret, stilOrnekleriDerle } = await import('@/lib/doktor/soapUret')

    let klinikBaglam = ''
    try {
      const { data: seansSatiri } = await getSupabase().from('sessions').select('patient_id').eq('id', sessionId).single()
      if (seansSatiri?.patient_id) {
        const { hastaDosyasiniDerle } = await import('@/lib/doktor/hastaDosyaDerleyici')
        const dosya = await hastaDosyasiniDerle(getSupabase(), user.id, String(seansSatiri.patient_id))
        if (dosya) klinikBaglam = dosya.split('## VİZİT GEÇMİŞİ')[0].slice(0, 4000)
        // NOTYA-SOAP-03: plan sürekliliği — son onaylı vizitin planı/tanısı bağlama eklenir,
        // yeni not önceki planın akıbetini değerlendirerek yazılır (izole not yerine devamlılık).
        const { data: oncekiVizit } = await getSupabase()
          .from('notes')
          .select('content_plan, content_tani, created_at, sessions!inner(patient_id)')
          .eq('sessions.patient_id', seansSatiri.patient_id)
          .not('approved_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
        const ov = oncekiVizit?.[0]
        if (ov?.content_plan) {
          const ovTarih = new Date(String(ov.created_at)).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })
          klinikBaglam += `\n\nÖNCEKİ VİZİT PLANI (${ovTarih}${ov.content_tani ? ` — tanı: ${String(ov.content_tani).slice(0, 200)}` : ''}):\n${String(ov.content_plan).slice(0, 1200)}`
        }
      }
    } catch { /* bağlam kritik değil — bağlamsız da not üretilir */ }

    let stilOrnekleri = ''
    try {
      const { data: oncekiNotlar } = await getSupabase()
        .from('notes')
        .select('content_subjektif, content_plan')
        .eq('doctor_id', user.id)
        .not('approved_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(2)
      if (oncekiNotlar?.length) stilOrnekleri = stilOrnekleriDerle(oncekiNotlar)
    } catch { /* stil örneği kritik değil */ }

    const noteData = await soapNotuUret(getAnthropic(), { transcript, specialty, klinikBaglam, stilOrnekleri })

    // Save note
    const { data: note, error: noteError } = await getSupabase().from("notes").insert({
      session_id: sessionId,
      doctor_id: user.id,
      note_type: "soap",
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
      ai_model: "claude-sonnet-4-6",
      ai_confidence: noteData?.ai_confidence || 0.9,
    }).select().single()

    if (noteError) throw new Error("Not kaydedilemedi: " + noteError.message)

    // Mark session complete
    await getSupabase().from("sessions").update({ status: "completed" }).eq("id", sessionId)

    return NextResponse.json({ success: true, data: { session_id: sessionId, note_id: note.id, note } })

  } catch (error: unknown) {
    console.error("[sessions/end]", error)
    // NOTYA-SEANS-05: ham API hataları (özellikle Anthropic kredi/limit JSON'u) doktora
    // asla gösterilmez — loglanır, kullanıcıya Türkçe ve eyleme dönük mesaj gider.
    const ham = error instanceof Error ? error.message : ""
    let msg = "Not oluşturulamadı. Lütfen tekrar deneyin — notlarınız kaybolmadı."
    if (/credit balance|billing|invalid_request_error.*credit/i.test(ham)) {
      msg = "Yapay zekâ servisi geçici olarak kullanılamıyor (hesap bakiyesi). Yönetici bilgilendirildi — notlarınız ekranda duruyor, kısa süre sonra 'Seansı Bitir'e tekrar basın."
    } else if (/rate_limit|429/i.test(ham)) {
      msg = "Sistem şu an yoğun. 30 saniye sonra 'Seansı Bitir'e tekrar basın — notlarınız kaybolmadı."
    } else if (/overloaded|529|503/i.test(ham)) {
      msg = "Yapay zekâ servisi geçici olarak yoğun. Birkaç dakika sonra tekrar deneyin — notlarınız kaybolmadı."
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
