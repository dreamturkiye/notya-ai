"use client"
export const dynamic = "force-dynamic"
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

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string
  start(): void; stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionEvent extends Event {
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } }
}

export default function NewSession() {
  const router = useRouter()
  const [specialty, setSpecialty] = useState("genel")
  const [sessionType, setSessionType] = useState("muayene")
  const [step, setStep] = useState<"setup"|"recording"|"processing"|"done">("setup")
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [note, setNote] = useState<Record<string,unknown>|null>(null)
  const [error, setError] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance|null>(null)
  const transcriptRef = useRef("")  // Keep ref in sync for speech callbacks
  const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Keep ref in sync with state
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  function startTimer() {
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function toggleVoice() {
    if (isRecordingVoice) {
      recognitionRef.current?.stop()
      setIsRecordingVoice(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Safari kullanın."); return }

    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = "tr-TR"

    r.onresult = (e: SpeechRecognitionEvent) => {
      let newText = ""
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) newText += e.results[i][0].transcript + " "
      }
      if (newText.trim()) {
        // Append to existing transcript
        const updated = (transcriptRef.current + " " + newText).trim()
        transcriptRef.current = updated
        setTranscript(updated)
      }
    }

    r.onerror = () => setIsRecordingVoice(false)
    r.onend = () => setIsRecordingVoice(false)

    recognitionRef.current = r
    r.start()
    setIsRecordingVoice(true)
  }

  async function processSession() {
    stopTimer()
    if (!transcript.trim()) {
      setError("Lütfen önce muayene notlarını yazın veya sesle kaydedin.")
      return
    }
    setStep("processing")
    setError("")

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/giris"); return }

      const { data: session, error: se } = await supabase.from("sessions").insert({
        doctor_id: user.id, specialty, session_type: sessionType,
        status: "processing", duration_seconds: seconds,
        patient_consent_given: true, patient_consent_at: new Date().toISOString(),
      }).select().single()
      if (se || !session) throw new Error("Seans oluşturulamadı: " + se?.message)

      const { data: { session: authSession } } = await (async () => { const raw = localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||''); return raw ? { data: { session: JSON.parse(raw) } } : { data: { session: null } } })()
      const authToken = authSession?.access_token
      if (!authToken) throw new Error("Oturum bulunamadı")

      const resp = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [{ speaker: "doktor", text: transcript, start_ms: 0, end_ms: seconds*1000, confidence: 0.9 }],
          transcript, duration_seconds: seconds, profession: "doktor",
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
  const S = (s: Record<string,unknown>) => s as React.CSSProperties

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
                  style={S({padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sessionType===t?"#2563EB":"#E5E7EB"}`,background:sessionType===t?"#EFF6FF":"#fff",cursor:"pointer",fontSize:"13px",fontWeight:sessionType===t?"600":"400",color:sessionType===t?"#1D4ED8":"#374151"})}>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={()=>{setStep("recording");startTimer()}}
              style={S({width:"100%",padding:"16px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer"})}>
              🎙️ Seansa Başla
            </button>
          </div>
        )}

        {step === "recording" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({textAlign:"center",marginBottom:"20px"})}>
              <div style={S({width:"64px",height:"64px",background:isRecordingVoice?"#FEE2E2":"#EFF6FF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"28px"})}>🎙️</div>
              <div style={S({fontSize:"32px",fontWeight:"600",color:"#0A1628",fontFamily:"monospace",marginBottom:"4px"})}>{fmt(seconds)}</div>
              <div style={S({fontSize:"13px",color:"#64748B"})}>Kayıt devam ediyor · {SPECIALTIES.find(s=>s.id===specialty)?.label}</div>
            </div>

            {/* Voice recording button */}
            <div style={S({display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"14px"})}>
              <button onClick={toggleVoice}
                style={S({padding:"10px 20px",background:isRecordingVoice?"#DC2626":"#2563EB",color:"#fff",border:"none",borderRadius:"20px",fontSize:"13px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"})}>
                {isRecordingVoice ? "⏹ Sesi Durdur" : "🎤 Sesle Dikte Et"}
              </button>
              {isRecordingVoice && <span style={S({fontSize:"12px",color:"#DC2626",animation:"pulse 1s infinite"})}>● Dinliyor...</span>}
            </div>

            <div style={S({fontSize:"13px",fontWeight:"500",color:"#374151",marginBottom:"8px"})}>
              Seans notları <span style={S({color:"#DC2626"})}>*</span>
              <span style={S({fontSize:"11px",color:"#94A3B8",marginLeft:"8px",fontWeight:"400"})}>Sesle veya yazarak girin</span>
            </div>
            <textarea value={transcript} onChange={e=>setTranscript(e.target.value)}
              placeholder={"Muayene bulgularını buraya yazın...\n\nÖrnek: 7 yaşında erkek hasta, 3 gündür devam eden ateş şikayeti var. Ateş 38.8°C. Boğaz kırmızı, tonsiller hiperemik..."}
              style={S({width:"100%",minHeight:"180px",padding:"12px",border:"1.5px solid #E5E7EB",borderRadius:"10px",fontSize:"13px",fontFamily:"system-ui",resize:"vertical",marginBottom:"16px",color:"#374151",lineHeight:"1.6",outline:"none"})}
            />
            <div style={S({display:"flex",gap:"10px"})}>
              <button onClick={()=>{stopTimer();recognitionRef.current?.stop();setStep("setup");setSeconds(0);setTranscript("")}}
                style={S({flex:1,padding:"14px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:"10px",fontSize:"14px",cursor:"pointer"})}>
                İptal
              </button>
              <button onClick={processSession}
                style={S({flex:2,padding:"14px",background:transcript.trim()?"#DC2626":"#94A3B8",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:"600",cursor:transcript.trim()?"pointer":"not-allowed"})}>
                ⏹ Seansı Bitir → Not Oluştur
              </button>
            </div>
            <div style={S({textAlign:"center",marginTop:"10px",fontSize:"11px",color:"#94A3B8"})}>
              Notları yazdıktan sonra "Seansı Bitir" butonuna basın
            </div>
          </div>
        )}

        {step === "processing" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"48px",textAlign:"center"})}>
            <div style={S({fontSize:"48px",marginBottom:"16px"})}>⚙️</div>
            <div style={S({fontSize:"18px",fontWeight:"600",color:"#0A1628",marginBottom:"8px"})}>AI Not Oluşturuyor</div>
            <div style={S({fontSize:"13px",color:"#94A3B8"})}>SOAP notu hazırlanıyor, 30-60 saniye...</div>
          </div>
        )}

        {step === "done" && note && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px",paddingBottom:"16px",borderBottom:"1px solid #E5E7EB"})}>
              <div style={S({fontSize:"24px"})}>✅</div>
              <div>
                <div style={S({fontSize:"16px",fontWeight:"600",color:"#0A1628"})}>Not Hazır</div>
                <div style={S({fontSize:"12px",color:"#64748B"})}>AI güveni: {Math.round(((note.ai_confidence as number)||0.9)*100)}%</div>
              </div>
            </div>
            {([
              {label:"S — Subjektif",key:"content_subjektif",color:"#2563EB"},
              {label:"O — Objektif",key:"content_objektif",color:"#059669"},
              {label:"A — Değerlendirme",key:"content_degerlendirme",color:"#D97706"},
              {label:"P — Plan",key:"content_plan",color:"#7C3AED"},
            ] as {label:string;key:string;color:string}[]).filter(s=>(note as Record<string,unknown>)[s.key]).map(section=>(
              <div key={section.key} style={S({marginBottom:"14px"})}>
                <div style={S({fontSize:"10px",fontWeight:"600",color:section.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"5px"})}>{section.label}</div>
                <div style={S({fontSize:"13px",color:"#374151",background:"#F8FAFC",borderRadius:"8px",padding:"10px 12px",lineHeight:"1.6"})}>{String((note as Record<string,unknown>)[section.key])}</div>
              </div>
            ))}
            {Array.isArray(note.kritik_bulgular) && (note.kritik_bulgular as string[]).length > 0 && (
              <div style={S({background:"#FCEBEB",borderRadius:"10px",padding:"12px",marginBottom:"14px"})}>
                <div style={S({fontSize:"12px",fontWeight:"600",color:"#A32D2D",marginBottom:"4px"})}>⚠️ KRİTİK BULGULAR</div>
                {(note.kritik_bulgular as string[]).map((b,i)=><div key={i} style={S({fontSize:"12px",color:"#991B1B"})}>• {b}</div>)}
              </div>
            )}
            {note.takip_suresi && (
              <div style={S({fontSize:"13px",color:"#374151",background:"#EFF6FF",borderRadius:"8px",padding:"10px 12px",marginBottom:"14px"})}>
                📅 <strong>Takip:</strong> {String(note.takip_suresi)}
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
