
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { PERSONAS, getPersonaForSpecialty, buildSystemPrompt, type PersonaId, type SpecialtyId } from "@/lib/asistan/personaEngine"
import { quickClassify, extractPatientData, extractPrescriptionData } from "@/lib/asistan/intentParser"
import { executeAction } from "@/lib/asistan/actionExecutor"
import { searchDrug, calculatePediatricDose, checkInteractions } from "@/lib/asistan/turkishDrugs"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Yetkisiz" }, { status: 401 })
    }
    const { data: { user } } = await getSupabase().auth.getUser(authHeader.split(" ")[1])
    if (!user) return NextResponse.json({ success: false, error: "Geçersiz token" }, { status: 401 })

    const body = await req.json()
    const {
      message,
      asistanSessionId,
      patientId,
      sessionId,
      specialty = "genel",
      personaId: requestedPersona,
    } = body

    // Load doctor profile for Hocam addressing
    const { data: doctorRow } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    const doctorProfile = toAddressableUser(doctorRow as DoctorProfile | null)

    // Load doctor preferences
    const { data: prefs } = await supabase
      .from("doctor_preferences")
      .select("*")
      .eq("doctor_id", user.id)
      .single()

    // Load or create asistan session
    let asistanSession: Record<string, unknown> | null = null
    if (asistanSessionId) {
      const { data } = await supabase
        .from("asistan_sessions")
        .select("*")
        .eq("id", asistanSessionId)
        .eq("doctor_id", user.id)
        .single()
      asistanSession = data
    }

    if (!asistanSession) {
      const personaId: PersonaId = requestedPersona ||
        prefs?.preferred_persona ||
        getPersonaForSpecialty(specialty as SpecialtyId)
      const { data } = await supabase
        .from("asistan_sessions")
        .insert({
          doctor_id: user.id,
          patient_id: patientId || null,
          session_id: sessionId || null,
          persona_id: personaId,
          messages: [],
          active_context: { specialty, currentPatientId: patientId }
        })
        .select().single()
      asistanSession = data
    }

    const personaId = (asistanSession?.persona_id as PersonaId) || "elifsahin"
    const persona = PERSONAS[personaId]

    // Load current patient if any
    let currentPatient = null
    const contextPatientId = (asistanSession?.active_context as Record<string, unknown>)?.currentPatientId || patientId
    if (contextPatientId) {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("id", contextPatientId)
        .single()
      currentPatient = data
    }

    // Build conversation history
    const messages: { role: string; content: string }[] = (asistanSession?.messages as { role: string; content: string }[]) || []

    // Quick classify intent for faster response
    const quickIntent = quickClassify(message)
    let augmentedMessage = message

    // Add drug context if prescription intent
    if (quickIntent === "ADD_PRESCRIPTION") {
      const prescData = extractPrescriptionData(message)
      if (prescData.drugName) {
        const drugs = searchDrug(String(prescData.drugName))
        if (drugs.length > 0) {
          augmentedMessage += `

[SİSTEM BAĞLAMI: İlaç bilgisi - ${JSON.stringify(drugs[0])}]`
        }
      }
    }

    // Build system prompt with learning context
    const systemPrompt = buildSystemPrompt(persona, prefs, currentPatient, doctorProfile)

    // Call Claude with full conversation history
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content
        })),
        { role: "user", content: augmentedMessage }
      ]
    })

    const rawResponse = response.content[0].type === "text" ? response.content[0].text : ""

    // Parse AI response
    let aiData: { speech: string; action: Record<string, unknown> | null; proactiveWarning: string | null }
    try {
      const cleanJson = rawResponse.replace(/```[a-z]*/g, "").replace(/```/g, "").trim()
      aiData = JSON.parse(cleanJson)
    } catch {
      // If not JSON, treat as plain speech
      aiData = { speech: rawResponse, action: null, proactiveWarning: null }
    }

    // Execute action if AI decided to
    let actionResult = null
    if (aiData.action) {
      actionResult = await executeAction(
        {
          type: aiData.action.type as never,
          doctorId: user.id,
          data: (aiData.action.data as Record<string, unknown>) || {},
          doctorProfile,
        },
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Update asistan session context if patient was created
      if (aiData.action.type === "CREATE_PATIENT" && actionResult.data?.patient) {
        await getSupabase().from("asistan_sessions")
          .update({
            patient_id: (actionResult.data.patient as Record<string, unknown>).id,
            active_context: {
              ...(asistanSession?.active_context as Record<string, unknown> || {}),
              currentPatientId: (actionResult.data.patient as Record<string, unknown>).id,
              patientName: (actionResult.data.patient as Record<string, unknown>).name_encrypted
            }
          })
          .eq("id", asistanSession?.id)
      }
    }

    // Update conversation history
    const updatedMessages = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: aiData.speech }
    ].slice(-20) // Keep last 20 messages (10 exchanges)

    await getSupabase().from("asistan_sessions")
      .update({ messages: updatedMessages })
      .eq("id", asistanSession?.id)

    // Log action for learning
    await getSupabase().from("asistan_actions").insert({
      doctor_id: user.id,
      asistan_session_id: asistanSession?.id,
      action_type: quickIntent || "GENERAL_CHAT",
      input_text: message,
      ai_response: aiData.speech,
      action_data: aiData.action || {}
    })

    // Update session count in preferences
    if (!prefs) {
      await getSupabase().from("doctor_preferences").insert({
        doctor_id: user.id,
        sessions_completed: 1,
        last_session_at: new Date().toISOString()
      })
    } else {
      await getSupabase().from("doctor_preferences").update({
        sessions_completed: (prefs.sessions_completed || 0) + 1,
        last_session_at: new Date().toISOString()
      }).eq("doctor_id", user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        speech: aiData.speech,
        proactiveWarning: aiData.proactiveWarning,
        action: aiData.action,
        actionResult,
        asistanSessionId: asistanSession?.id,
        personaId,
        personaName: persona.name,
      }
    })

  } catch (error) {
    console.error("[asistan/chat]", error)
    return NextResponse.json({ success: false, error: "Asistan yanıt veremedi" }, { status: 500 })
  }
}
