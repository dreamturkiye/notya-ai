
// ============================================================
// NOTYA ASISTAN — Action Executor
// Runs real actions in Supabase based on AI decisions
// ============================================================

import { createClient } from "@supabase/supabase-js"
import { address, type AddressableUser } from "@/lib/address"

export type ActionType =
  | "CREATE_PATIENT"
  | "UPDATE_SESSION"
  | "ADD_NOTE_CONTENT"
  | "ADD_PRESCRIPTION"
  | "SET_DIAGNOSIS"
  | "CREATE_SESSION"
  | "GENERATE_DOCUMENT"

export interface ActionRequest {
  type: ActionType
  doctorId: string
  data: Record<string, unknown>
  doctorProfile?: AddressableUser
}

export interface ActionResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export async function executeAction(
  action: ActionRequest,
  serviceKey: string
): Promise<ActionResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  switch (action.type) {

    case "CREATE_PATIENT": {
      const { name, age, gender, complaint } = action.data
      const { data, error } = await supabase
        .from("patients")
        .insert({
          doctor_id: action.doctorId,
          name_encrypted: String(name || "Bilinmiyor"),
          dob_encrypted: age ? `${new Date().getFullYear() - Number(age)}-01-01` : null,
          gender_encrypted: String(gender || "Belirtilmemiş"),
          notes_encrypted: complaint ? String(complaint) : null,
        })
        .select()
        .single()
      if (error) return { success: false, message: `Hasta oluşturulamadı: ${error.message}` }
      return {
        success: true,
        message: `${name || "Hasta"} kaydedildi`,
        data: { patient: data }
      }
    }

    case "CREATE_SESSION": {
      const { patientId, specialty, sessionType } = action.data
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          doctor_id: action.doctorId,
          patient_id: patientId as string || null,
          specialty: String(specialty || "genel"),
          session_type: String(sessionType || "muayene"),
          status: "recording",
          patient_consent_given: true,
          patient_consent_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) return { success: false, message: `Seans oluşturulamadı: ${error.message}` }
      return { success: true, message: "Seans başlatıldı", data: { session: data } }
    }

    case "ADD_NOTE_CONTENT": {
      const { sessionId, field, content } = action.data
      // Find or create note for this session
      let { data: note } = await supabase
        .from("notes")
        .select("id")
        .eq("session_id", String(sessionId))
        .eq("doctor_id", action.doctorId)
        .single()

      if (!note) {
        const { data: newNote, error } = await supabase
          .from("notes")
          .insert({ session_id: String(sessionId), doctor_id: action.doctorId, note_type: "soap" })
          .select().single()
        if (error) return { success: false, message: "Not oluşturulamadı" }
        note = newNote
      }

      const updateData: Record<string, unknown> = {}
      updateData[String(field)] = content
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase.from("notes").update(updateData).eq("id", note.id)
      if (error) return { success: false, message: "Not güncellenemedi" }
      return { success: true, message: "Not güncellendi", data: { noteId: note.id } }
    }

    case "ADD_PRESCRIPTION": {
      const { sessionId, drug, dose, frequency, duration } = action.data
      let { data: note } = await supabase
        .from("notes")
        .select("id, content_ilaclar")
        .eq("session_id", String(sessionId))
        .eq("doctor_id", action.doctorId)
        .single()

      if (!note) {
        const { data: newNote } = await supabase
          .from("notes")
          .insert({ session_id: String(sessionId), doctor_id: action.doctorId, note_type: "soap" })
          .select().single()
        note = newNote
      }

      const medications = (note?.content_ilaclar as unknown[]) || []
      medications.push({ ad: drug, doz: dose, kullanim: frequency, sure: duration })

      await supabase.from("notes")
        .update({ content_ilaclar: medications, updated_at: new Date().toISOString() })
        .eq("id", note.id)

      return { success: true, message: `${drug} ${dose} ${frequency} reçeteye eklendi`, data: { medications } }
    }

    case "SET_DIAGNOSIS": {
      const { sessionId, diagnosis, icd10, isPrimary } = action.data
      let { data: note } = await supabase
        .from("notes")
        .select("id, icd10_codes")
        .eq("session_id", String(sessionId))
        .eq("doctor_id", action.doctorId)
        .single()

      if (!note) {
        const { data: newNote } = await supabase
          .from("notes")
          .insert({ session_id: String(sessionId), doctor_id: action.doctorId, note_type: "soap" })
          .select().single()
        note = newNote
      }

      const codes = (note?.icd10_codes as unknown[]) || []
      codes.push({ code: icd10, description: diagnosis, description_tr: diagnosis, is_primary: isPrimary !== false })

      await supabase.from("notes")
        .update({
          content_degerlendirme: String(diagnosis),
          content_tani: String(diagnosis),
          icd10_codes: codes,
          updated_at: new Date().toISOString()
        })
        .eq("id", note.id)

      return { success: true, message: `Tanı eklendi: ${diagnosis} (${icd10})`, data: { icd10: codes } }
    }

    case "GENERATE_DOCUMENT": {
      const { type, sessionId, patientName } = action.data
      const referralHeader = address(
        action.doctorProfile || { firstName: 'Meslektaşım' },
        'referral'
      )
      const templates: Record<string, string> = {
        sevk: `SEVK MEKTUBU\n\n${referralHeader},\n\n${patientName || "Hastamız"} ileri tetkik ve tedavi amacıyla kliniğinize sevk edilmektedir.\n\nSaygılarımla.`,
        istirahat: `İSTİRAHAT RAPORU\n\n${patientName || "Hasta"} ${new Date().toLocaleDateString("tr-TR")} tarihinde muayene edilmiş olup ... gün istirahat uygundur.`,
        rapor: `TIBBİ RAPOR\n\n${patientName || "Hasta"} tarafından kliniğimize başvurulmuş, muayene ve tetkikler yapılmıştır.`,
      }
      const docContent = templates[String(type)] || templates.rapor
      return { success: true, message: `${type} belgesi hazırlandı`, data: { document: docContent, type } }
    }

    default:
      return { success: false, message: `Bilinmeyen eylem: ${action.type}` }
  }
}
