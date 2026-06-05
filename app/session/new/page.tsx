
"use client"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const SPECIALTIES = [
  {id:"genel",label:"Genel Pratisyen",emoji:"👨‍⚕️"},
  {id:"pediatri",label:"Pediatri",emoji:"🧒"},
  {id:"kardiyoloji",label:"Kardiyoloji",emoji:"❤️"},
  {id:"noroloji",label:"Nöroloji",emoji:"🧠"},
  {id:"psikiyatri",label:"Psikiyatri",emoji:"💭"},
  {id:"dahiliye",label:"Dahiliye",emoji:"🩺"},
  {id:"ortopedi",label:"Ortopedi",emoji:"🦴"},
  {id:"kadin_hastaliklari",label:"Kadın Doğum",emoji:"👶"},
  {id:"genel_cerrahi",label:"Genel Cerrahi",emoji:"🔪"},
  {id:"dermatoloji",label:"Dermatoloji",emoji:"🌿"},
  {id:"uroloji",label:"Üroloji",emoji:"💊"},
  {id:"onkoloji",label:"Onkoloji",emoji:"🎗️"},
  {id:"acil",label:"Acil Tıp",emoji:"🚨"},
]

export default function NewSession() {
  const router = useRouter()
  const [specialty, setSpecialty] = useState("genel")
  const [sessionType, setSessionType] = useState("muayene")
  const [step, setStep] = useState<"setup"|"recording"|"processing"|"done">("setup")
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [note, setNote] = useState<Record<string,unknown>|null>(null)
  const [error, setError] = useState("")
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(1000)
      mediaRef.current = mr
      setStep("recording")
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setError("Mikrofon erişimi reddedildi. Lütfen mikrofon iznini verin.")
    }
  }

  async function stopRecording() {
    if (!mediaRef.current) return
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    setStep("processing")
    await processSession()
  }

  async function processSession() {
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/giris"); return }

      // Create session
      const { data: session, error: se } = await supabase
        .from("sessions")
        .insert({ doctor_id: user.id, specialty, session_type: sessionType, status: "processing", duration_seconds: seconds, patient_consent_given: true, patient_consent_at: new Date().toISOString() })
        .select().single()
      if (se || !session) throw new Error("Seans oluşturulamadı: " + se?.message)

      // Transcribe
      let finalTranscript = transcript
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const formData = new FormData()
        formData.append("file", blob, "audio.webm")
        formData.append("model", "whisper-1")
        formData.append("language", "tr")
        const { data: { session: s } } = await supabase.auth.getSession()
        const resp = await fetch("/api/voice/transcribe", { method: "POST", headers: { "Authorization": "Bearer " + s?.access_token }, body: formData })
        const td = await resp.json()
        finalTranscript = td.text || finalTranscript
        setTranscript(finalTranscript)
      }

      // Generate note via AI
      const { data: { session: s2 } } = await supabase.auth.getSession()
      const resp2 = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + s2?.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ segments: [{ speaker: "doktor", text: finalTranscript, start_ms: 0, end_ms: seconds*1000, confidence: 0.9 }], profession: "doktor", context: { specialty, session_type: sessionType } })
      })
      const result = await resp2.json()
      if (result.success) {
        setNote(result.data.note)
        setStep("done")
      } else throw new Error(result.error)

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Not oluşturulamadı")
      setStep("recording")
    }
  }

  function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}` }

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",fontFamily:"system-ui,sans-serif",padding:"20px"}}>
      <div style={{maxWidth:"600px",margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <div onClick={()=>router.push("/dashboard")} style={{color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:"14px"}}>← Geri</div>
          <div style={{fontSize:"18px",fontWeight:"600",color:"#fff"}}>Yeni Seans</div>
        </div>

        {error && (
          <div style={{background:"#FCEBEB",border:"1px solid #F09595",borderRadius:"12px",padding:"14px",fontSize:"13px",color:"#A32D2D",marginBottom:"16px"}}>{error}</div>
        )}

        {/* SETUP */}
        {step === "setup" && (
          <div style={{background:"#fff",borderRadius:"20px",padding:"24px"}}>
            <div style={{fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"}}>Uzmanlık Seçin</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"}}>
              {SPECIALTIES.map(s => (
                <div
                  key={s.id}
                  onClick={()=>setSpecialty(s.id)}
                  style={{padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${specialty===s.id?"#2563EB":"#E5E7EB"}`,background:specialty===s.id?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:specialty===s.id?"600":"400",color:specialty===s.id?"#1D4ED8":"#374151",transition:"all .15s"}}>
                  <span>{s.emoji}</span>{s.label}
                </div>
              ))}
            </div>
            <div style={{fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"12px"}}>Seans Türü</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
              {["muayene","kontrol","konsültasyon"].map(t=>(
                <div key={t} onClick={()=>setSessionType(t)} style={{padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sessionType===t?"#2563EB":"#E5E7EB"}`,background:sessionType===t?"#EFF6FF":"#fff",cursor:"pointer",fontSize:"13px",fontWeight:sessionType===t?"600":"400",color:sessionType===t?"#1D4ED8":"#374151",textTransform:"capitalize"}}>{t}</div>
              ))}
            </div>
            <div style={{background:"#F8FAFC",borderRadius:"12px",padding:"14px",marginBottom:"20px",fontSize:"12px",color:"#64748B",lineHeight:"1.6"}}>
              📚 <strong>Textbook AI:</strong> {specialty==="pediatri"?"Nelson + Harriet Lane":specialty==="kardiyoloji"?"Braunwald Heart Disease 12e":specialty==="noroloji"?"Adams & Victor 12e":specialty==="psikiyatri"?"Kaplan & Sadock + DSM-5-TR":specialty==="dahiliye"?"Harrison's Principles 22e":"UpToDate + Harrison's"} referanslarına dayalı not üretimi
            </div>
            <button
              onClick={startRecording}
              style={{width:"100%",padding:"16px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
              🎙️ Kayda Başla
            </button>
            <div style={{textAlign:"center",marginTop:"12px",fontSize:"11px",color:"#94A3B8"}}>Mikrofon erişimi gereklidir · KVKK uyumlu kayıt</div>
          </div>
        )}

        {/* RECORDING */}
        {step === "recording" && (
          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",textAlign:"center"}}>
            <div style={{width:"80px",height:"80px",background:"#FEE2E2",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"32px",animation:"pulse 1.5s ease-in-out infinite"}}>
              🎙️
            </div>
            <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
            <div style={{fontSize:"36px",fontWeight:"600",color:"#0A1628",fontVariantNumeric:"tabular-nums",fontFamily:"monospace",marginBottom:"8px"}}>{fmt(seconds)}</div>
            <div style={{fontSize:"14px",color:"#64748B",marginBottom:"8px"}}>Kayıt devam ediyor</div>
            <div style={{fontSize:"12px",color:"#94A3B8",marginBottom:"32px"}}>
              {SPECIALTIES.find(s=>s.id===specialty)?.emoji} {SPECIALTIES.find(s=>s.id===specialty)?.label} · {sessionType}
            </div>
            <textarea
              value={transcript} onChange={e=>setTranscript(e.target.value)}
              placeholder="Seans notlarını manuel yazabilir veya sesle kaydedebilirsiniz..."
              style={{width:"100%",minHeight:"100px",padding:"12px",border:"1px solid #E5E7EB",borderRadius:"10px",fontSize:"13px",fontFamily:"system-ui",resize:"vertical",marginBottom:"20px",color:"#374151"}}
            />
            <button
              onClick={stopRecording}
              style={{width:"100%",padding:"16px",background:"#DC2626",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer"}}>
              ⏹ Seansı Bitir
            </button>
          </div>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div style={{background:"#fff",borderRadius:"20px",padding:"40px",textAlign:"center"}}>
            <div style={{fontSize:"48px",marginBottom:"16px",animation:"spin 2s linear infinite"}}>⚙️</div>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            <div style={{fontSize:"18px",fontWeight:"600",color:"#0A1628",marginBottom:"8px"}}>AI Not Oluşturuyor</div>
            <div style={{fontSize:"14px",color:"#64748B"}}>Textbook referansları işleniyor, SOAP notu hazırlanıyor...</div>
          </div>
        )}

        {/* DONE */}
        {step === "done" && note && (
          <div style={{background:"#fff",borderRadius:"20px",padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
              <div style={{fontSize:"24px"}}>✅</div>
              <div>
                <div style={{fontSize:"16px",fontWeight:"600",color:"#0A1628"}}>Not Hazır</div>
                <div style={{fontSize:"13px",color:"#64748B"}}>AI güveni: {Math.round(((note.ai_confidence as number)||0.9)*100)}%</div>
              </div>
            </div>
            {[
              {label:"S — Subjektif",key:"content_subjektif",color:"#3B82F6"},
              {label:"O — Objektif",key:"content_objektif",color:"#059669"},
              {label:"A — Değerlendirme",key:"content_degerlendirme",color:"#D97706"},
              {label:"P — Plan",key:"content_plan",color:"#7C3AED"},
            ].filter(s=>note[s.key]).map(section=>(
              <div key={section.key} style={{marginBottom:"14px"}}>
                <div style={{fontSize:"10px",fontWeight:"600",color:section.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"}}>{section.label}</div>
                <div style={{fontSize:"13px",color:"#374151",background:"#F8FAFC",borderRadius:"8px",padding:"10px 12px",lineHeight:"1.6"}}>{note[section.key] as string}</div>
              </div>
            ))}
            {(note.kritik_bulgular as string[])?.length > 0 && (
              <div style={{background:"#FCEBEB",borderRadius:"10px",padding:"12px",marginBottom:"14px"}}>
                <div style={{fontSize:"12px",fontWeight:"600",color:"#A32D2D",marginBottom:"4px"}}>⚠️ KRİTİK BULGULAR</div>
                {(note.kritik_bulgular as string[]).map((b,i)=><div key={i} style={{fontSize:"12px",color:"#991B1B"}}>• {b}</div>)}
              </div>
            )}
            <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
              <button onClick={()=>router.push("/dashboard")} style={{flex:1,padding:"14px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
                Dashboard'a Dön
              </button>
              <button onClick={()=>{setStep("setup");setNote(null);setTranscript("");setSeconds(0)}} style={{flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
                Yeni Seans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
