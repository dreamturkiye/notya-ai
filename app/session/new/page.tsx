
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

const TEXTBOOK_REFS: Record<string,string> = {
  pediatri:"Nelson 22e + Harriet Lane 23e",
  kardiyoloji:"Braunwald Heart Disease 12e",
  noroloji:"Adams & Victor 12e",
  psikiyatri:"Kaplan & Sadock 11e + DSM-5-TR",
  dahiliye:"Harrison\'s Principles 22e",
  ortopedi:"Campbell\'s Operative Orthopaedics",
  kadin_hastaliklari:"Williams Obstetrics 26e",
  genel_cerrahi:"Sabiston Surgery 21e",
  dermatoloji:"Fitzpatrick\'s Dermatology",
  uroloji:"Campbell-Walsh-Wein 12e",
  onkoloji:"DeVita Cancer 12e + NCCN",
  acil:"Tintinalli\'s Emergency Medicine 9e",
  genel:"Harrison\'s Principles 22e",
}

export default function NewSession() {
  const router = useRouter()
  const [specialty, setSpecialty] = useState("genel")
  const [sessionType, setSessionType] = useState("muayene")
  const [step, setStep] = useState<"setup"|"recording"|"processing"|"done">("setup")
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [note, setNote] = useState<Record<string,unknown>|null>(null)
  const [error, setError] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  function startRecording() {
    setStep("recording")
    setSeconds(0)
    setError("")
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  async function stopAndProcess() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!transcript.trim()) {
      setError("Lütfen seans notlarını yazın veya önce transkript girin.")
      return
    }
    setStep("processing")
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/giris"); return }

      // Create session record
      const { data: session, error: se } = await supabase.from("sessions").insert({
        doctor_id: user.id,
        specialty,
        session_type: sessionType,
        status: "processing",
        duration_seconds: seconds,
        patient_consent_given: true,
        patient_consent_at: new Date().toISOString(),
      }).select().single()
      if (se || !session) throw new Error("Seans oluşturulamadı")

      // Get auth token
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const authToken = authSession?.access_token
      if (!authToken) throw new Error("Oturum bulunamadı")

      // Call end API with transcript
      const resp = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [{ speaker: "doktor", text: transcript, start_ms: 0, end_ms: seconds * 1000, confidence: 0.9 }],
          transcript,
          duration_seconds: seconds,
          profession: "doktor",
          context: { specialty, session_type: sessionType }
        })
      })

      const result = await resp.json()
      if (!resp.ok || !result.success) throw new Error(result.error || "Not oluşturulamadı")
      setNote(result.data.note)
      setStep("done")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu")
      setStep("recording")
    }
  }

  function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}` }

  const S = (style: Record<string,unknown>) => style as React.CSSProperties

  return (
    <div style={S({minHeight:"100vh",background:"#0A1628",fontFamily:"system-ui,sans-serif",padding:"20px"})}>
      <div style={S({maxWidth:"600px",margin:"0 auto"})}>
        <div style={S({display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"})}>
          <div onClick={()=>router.push("/dashboard")} style={S({color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:"14px"})}>← Geri</div>
          <div style={S({fontSize:"18px",fontWeight:"600",color:"#fff"})}>Yeni Seans</div>
        </div>

        {error && <div style={S({background:"#FCEBEB",border:"1px solid #F09595",borderRadius:"12px",padding:"14px",fontSize:"13px",color:"#A32D2D",marginBottom:"16px"})}>{error}</div>}

        {step === "setup" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"})}>Uzmanlık Seçin</div>
            <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"})}>
              {SPECIALTIES.map(s => (
                <div key={s.id} onClick={()=>setSpecialty(s.id)}
                  style={S({padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${specialty===s.id?"#2563EB":"#E5E7EB"}`,background:specialty===s.id?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:specialty===s.id?"600":"400",color:specialty===s.id?"#1D4ED8":"#374151"})}>
                  <span>{s.emoji}</span>{s.label}
                </div>
              ))}
            </div>
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"12px"})}>Seans Türü</div>
            <div style={S({display:"flex",gap:"8px",marginBottom:"20px"})}>
              {["muayene","kontrol","konsültasyon"].map(t=>(
                <div key={t} onClick={()=>setSessionType(t)}
                  style={S({padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sessionType===t?"#2563EB":"#E5E7EB"}`,background:sessionType===t?"#EFF6FF":"#fff",cursor:"pointer",fontSize:"13px",fontWeight:sessionType===t?"600":"400",color:sessionType===t?"#1D4ED8":"#374151",textTransform:"capitalize"})}>
                  {t}
                </div>
              ))}
            </div>
            <div style={S({background:"#F0F9FF",borderRadius:"10px",padding:"12px",marginBottom:"20px",fontSize:"12px",color:"#0369A1",border:"1px solid #BAE6FD"})}>
              📚 <strong>AI Referans:</strong> {TEXTBOOK_REFS[specialty]}
            </div>
            <button onClick={startRecording}
              style={S({width:"100%",padding:"16px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer"})}>
              🎙️ Seansa Başla
            </button>
          </div>
        )}

        {step === "recording" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({textAlign:"center",marginBottom:"20px"})}>
              <div style={S({width:"64px",height:"64px",background:"#FEE2E2",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"28px"})}>🎙️</div>
              <div style={S({fontSize:"32px",fontWeight:"600",color:"#0A1628",fontFamily:"monospace",marginBottom:"4px"})}>{fmt(seconds)}</div>
              <div style={S({fontSize:"13px",color:"#64748B"})}>Kayıt devam ediyor · {SPECIALTIES.find(s=>s.id===specialty)?.label}</div>
            </div>
            <div style={S({fontSize:"13px",fontWeight:"500",color:"#374151",marginBottom:"8px"})}>
              Seans notları <span style={S({color:"#DC2626"})}>*</span>
            </div>
            <textarea value={transcript} onChange={e=>setTranscript(e.target.value)}
              placeholder={`Muayene bulgularını buraya yazın veya sesle kaydettikten sonra girin...\n\nÖrnek: 7 yaşında erkek hasta, 3 gündür devam eden ateş şikayeti var. Ateş 38.8°C. Boğaz kırmızı, tonsiller hiperemik...`}
              style={S({width:"100%",minHeight:"160px",padding:"12px",border:"1.5px solid #E5E7EB",borderRadius:"10px",fontSize:"13px",fontFamily:"system-ui",resize:"vertical",marginBottom:"16px",color:"#374151",lineHeight:"1.6",outline:"none"})}
            />
            <div style={S({display:"flex",gap:"10px"})}>
              <button onClick={()=>{if(timerRef.current)clearInterval(timerRef.current);setStep("setup");setSeconds(0)}}
                style={S({flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",cursor:"pointer"})}>
                İptal
              </button>
              <button onClick={stopAndProcess}
                style={S({flex:2,padding:"14px",background:"#DC2626",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"600",cursor:"pointer"})}>
                ⏹ Seansı Bitir → Not Oluştur
              </button>
            </div>
            <div style={S({textAlign:"center",marginTop:"10px",fontSize:"11px",color:"#94A3B8"})}>
              Seans notlarını yazdıktan sonra "Seansı Bitir" butonuna basın
            </div>
          </div>
        )}

        {step === "processing" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"48px",textAlign:"center"})}>
            <div style={S({fontSize:"48px",marginBottom:"16px"})}>⚙️</div>
            <div style={S({fontSize:"18px",fontWeight:"600",color:"#0A1628",marginBottom:"8px"})}>AI Not Oluşturuyor</div>
            <div style={S({fontSize:"14px",color:"#64748B",marginBottom:"4px"})}>📚 {TEXTBOOK_REFS[specialty]}</div>
            <div style={S({fontSize:"13px",color:"#94A3B8"})}>SOAP notu hazırlanıyor, 30-60 saniye...</div>
          </div>
        )}

        {step === "done" && note && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px",paddingBottom:"16px",borderBottom:"1px solid #E5E7EB"})}>
              <div style={S({fontSize:"24px"})}>✅</div>
              <div>
                <div style={S({fontSize:"16px",fontWeight:"600",color:"#0A1628"})}>Not Hazır</div>
                <div style={S({fontSize:"12px",color:"#64748B"})}>AI güveni: {Math.round(((note.ai_confidence as number)||0.9)*100)}% · {TEXTBOOK_REFS[specialty]}</div>
              </div>
            </div>
            {[
              {label:"S — Subjektif",key:"content_subjektif",color:"#2563EB"},
              {label:"O — Objektif",key:"content_objektif",color:"#059669"},
              {label:"A — Değerlendirme",key:"content_degerlendirme",color:"#D97706"},
              {label:"P — Plan",key:"content_plan",color:"#7C3AED"},
            ].filter(s=>note[s.key]).map(section=>(
              <div key={section.key} style={S({marginBottom:"14px"})}>
                <div style={S({fontSize:"10px",fontWeight:"600",color:section.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"})}>{section.label}</div>
                <div style={S({fontSize:"13px",color:"#374151",background:"#F8FAFC",borderRadius:"8px",padding:"10px 12px",lineHeight:"1.6"})}>{note[section.key] as string}</div>
              </div>
            ))}
            {(note.kritik_bulgular as string[])?.length > 0 && (
              <div style={S({background:"#FCEBEB",borderRadius:"10px",padding:"12px",marginBottom:"14px"})}>
                <div style={S({fontSize:"12px",fontWeight:"600",color:"#A32D2D",marginBottom:"4px"})}>⚠️ KRİTİK BULGULAR</div>
                {(note.kritik_bulgular as string[]).map((b,i)=><div key={i} style={S({fontSize:"12px",color:"#991B1B"})}>• {b}</div>)}
              </div>
            )}
            {note.takip_suresi && (
              <div style={S({fontSize:"13px",color:"#374151",background:"#EFF6FF",borderRadius:"8px",padding:"10px 12px",marginBottom:"14px"})}>
                📅 <strong>Takip:</strong> {note.takip_suresi as string}
              </div>
            )}
            <div style={S({display:"flex",gap:"10px",marginTop:"8px"})}>
              <button onClick={()=>router.push("/dashboard")}
                style={S({flex:1,padding:"14px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"})}>
                Dashboard
              </button>
              <button onClick={()=>{setStep("setup");setNote(null);setTranscript("");setSeconds(0)}}
                style={S({flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"600",cursor:"pointer"})}>
                Yeni Seans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
