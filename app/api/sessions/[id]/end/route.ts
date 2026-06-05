
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz erişim" }, { status: 401 })
    }
    const token = authHeader.split(" ")[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
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
    await supabase.from("sessions").update({
      status: "processing",
      ended_at: new Date().toISOString(),
      transcript_cleaned: transcript,
      duration_seconds: body.duration_seconds || 0,
    }).eq("id", sessionId).eq("doctor_id", user.id)

    const specialty = context?.specialty || "genel"

    // Build specialty-aware system prompt
    const specialtyBooks: Record<string, string> = {
      pediatri: "Nelson Textbook of Pediatrics 22e + Harriet Lane Handbook 23e",
      kardiyoloji: "Braunwald\'s Heart Disease 12e + ESC Guidelines 2023",
      noroloji: "Adams & Victor\'s Principles of Neurology 12e + ESO Guidelines",
      psikiyatri: "Kaplan & Sadock 11e + DSM-5-TR + Stahl\'s Psychopharmacology",
      dahiliye: "Harrison\'s Principles of Internal Medicine 22e + Goldman-Cecil",
      ortopedi: "Campbell\'s Operative Orthopaedics + Rockwood & Green\'s Fractures",
      kadin_hastaliklari: "Williams Obstetrics 26e + Berek & Novak\'s Gynecology",
      genel_cerrahi: "Sabiston Textbook of Surgery 21e + Schwartz\'s Surgery",
      dermatoloji: "Fitzpatrick\'s Dermatology + Bologna Dermatology 5e",
      uroloji: "Campbell-Walsh-Wein Urology 12e + EAU Guidelines",
      onkoloji: "DeVita\'s Cancer 12e + NCCN Guidelines 2024",
      acil: "Tintinalli\'s Emergency Medicine 9e + Rosen\'s Emergency Medicine",
      genel: "Harrison\'s Principles 22e + Oxford Handbook of Clinical Medicine",
    }
    const books = specialtyBooks[specialty] || specialtyBooks["genel"]

    const systemPrompt = `Sen Notya AI klinik not asistanısın. ${specialty.toUpperCase()} uzmanısın.
Klinik akıl yürütmen şu altın standart kaynaklara dayanır: ${books}

Verilen transkripten SOAP notu çıkar. SADECE geçerli JSON döndür, başka hiçbir şey yazma:

{
  "soap": {
    "subjektif": "Hastanın şikayetleri",
    "objektif": "Fizik muayene bulguları",
    "degerlendirme": "Tanı ve değerlendirme",
    "plan": "Tedavi planı"
  },
  "anamnez": "Detaylı anamnez",
  "fizik_muayene": "Fizik muayene bulguları",
  "tani": "Ön tanı",
  "tedavi": "Tedavi planı",
  "ilaclar": [{"ad": "İlaç", "doz": "Doz", "kullanim": "Kullanım", "sure": "Süre"}],
  "icd10_codes": [{"code": "X00", "description": "Description", "description_tr": "Türkçe", "is_primary": true}],
  "kritik_bulgular": [],
  "takip_suresi": "Takip süresi",
  "ai_confidence": 0.92
}`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Muayene transkripti:\n\n${transcript}` }]
    })

    const rawText = response.content[0].type === "text" ? response.content[0].text : ""
    const cleanJson = rawText.replace(/```json\n?|\n?```/g, "").trim()
    const noteData = JSON.parse(cleanJson)

    // Save note
    const { data: note, error: noteError } = await supabase.from("notes").insert({
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
      ai_model: "claude-sonnet-4",
      ai_confidence: noteData?.ai_confidence || 0.9,
    }).select().single()

    if (noteError) throw new Error("Not kaydedilemedi: " + noteError.message)

    // Mark session complete
    await supabase.from("sessions").update({ status: "completed" }).eq("id", sessionId)

    return NextResponse.json({ success: true, data: { session_id: sessionId, note_id: note.id, note } })

  } catch (error: unknown) {
    console.error("[sessions/end]", error)
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
