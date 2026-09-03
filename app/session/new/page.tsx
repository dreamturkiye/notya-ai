"use client"
export const dynamic = "force-dynamic"
import { useState, useRef, useEffect, Suspense } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

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
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#0A1628"}} />}>
      <NewSessionInner />
    </Suspense>
  )
}

function NewSessionInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get("patientId") || null
  const [specialty, setSpecialty] = useState("genel")
  const [bransKilitli, setBransKilitli] = useState(false)

  // NOTYA-BRANS-02: branş onboarding'de alınıyor — her muayenede TEKRAR SORULMAZ.
  // Profilde branş varsa otomatik seçilir ve seçici gizlenir; yoksa seçici yedeğe düşer.
  useEffect(() => {
    (async () => {
      try {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: { session: as } } = await sb.auth.getSession()
        if (!as?.access_token) return
        const r = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${as.access_token}` } })
        const d = await r.json()
        // users/me yanıtı { success, data: {...} } sarmalında döner — ilk sürüm bunu ıskaladı.
        const b = d?.data?.specialty || d?.specialty
        if (b && SPECIALTIES.some((s) => s.id === b)) { setSpecialty(b); setBransKilitli(true) }
      } catch { /* sessiz — seçici görünür kalır */ }
    })()
  }, [])
  const [sessionType, setSessionType] = useState("muayene")
  const [step, setStep] = useState<"setup"|"recording"|"processing"|"done">("setup")
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [note, setNote] = useState<Record<string,unknown>|null>(null)
  const [sesYukleniyor, setSesYukleniyor] = useState(false)
  const [sesHata, setSesHata] = useState("")
  const [error, setError] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance|null>(null)
  const transcriptRef = useRef("")  // Keep ref in sync for speech callbacks

  // NOTYA-SES-01: hazır ses dosyasını doğrudan Storage'a yükle (Vercel gövde limiti aşılır),
  // sunucu transkript + SOAP üretir, not İnceleme kuyruğuna düşer. Ham ses sunucuda silinir.
  async function sesDosyasiIsle(dosya: File) {
    setSesHata("")
    if (dosya.size > 60 * 1024 * 1024) { setSesHata("Dosya 60 MB'ı aşıyor. Daha kısa bir kayıt deneyin."); return }
    setSesYukleniyor(true)
    try {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session: authSession } } = await sb.auth.getSession()
      const authToken = authSession?.access_token
      const userId = authSession?.user?.id
      if (!authToken || !userId) throw new Error("Oturum bulunamadı. Yeniden giriş yapın.")
      const guvenliAd = dosya.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(-60) || "kayit"
      const yol = `${userId}/${Date.now()}-${guvenliAd}`
      const { error: yuklemeHatasi } = await sb.storage.from("ses-kayitlari").upload(yol, dosya, { contentType: dosya.type || "audio/mpeg" })
      if (yuklemeHatasi) throw new Error("Yükleme başarısız: " + yuklemeHatasi.message)
      const resp = await fetch("/api/sessions/ses-yukle", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ path: yol, patientId: patientId || null, specialty }),
      })
      const d = await resp.json()
      if (!resp.ok) throw new Error(d.error || "Not üretilemedi.")
      router.push("/dashboard/doktor/inceleme")
    } catch (e) {
      setSesHata(e instanceof Error ? e.message : "Yükleme başarısız oldu.")
    } finally {
      setSesYukleniyor(false)
    }
  }
  const getSB = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Keep ref in sync with state
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  function startTimer() {
    // Duraklat/devam doğru toplansın diye sayaç burada SIFIRLANMAZ; sıfırlama seans girişinde.
    if (timerRef.current) return
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
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
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

    r.onerror = () => { setIsRecordingVoice(false); stopTimer() }
    r.onend = () => { setIsRecordingVoice(false); stopTimer() }

    recognitionRef.current = r
    r.start()
    setIsRecordingVoice(true)
    // NOTYA-KAYIT-01 (canlı defter): sayaç ve "devam ediyor" ancak gerçek kayıtla başlar.
    startTimer()
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
        doctor_id: user.id, patient_id: patientId, specialty, session_type: sessionType,
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

      // AUDIT-2026-09-03: 504/Vercel çökmesi düz metin döner — resp.json() ham hatayı gösteriyordu.
      const hamMetin = await resp.text()
      let result: { success?: boolean; error?: string; data?: { note: Record<string, unknown> } }
      try { result = JSON.parse(hamMetin) } catch {
        throw new Error("Sunucu geçici bir sorun yaşadı. Notlarınız güvende — birkaç saniye bekleyip 'Seansı Bitir'e yeniden basın.")
      }
      if (!resp.ok || !result.success) throw new Error(result.error || "Not oluşturulamadı")
      setNote((result.data as { note: Record<string, unknown> }).note)
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
            {bransKilitli ? (
              <div style={S({display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px",padding:"10px 12px",background:"#F0FDFA",border:"1px solid #99F6E4",borderRadius:"10px",fontSize:"13px",color:"#0F766E",fontWeight:"600"})}>
                <span>{SPECIALTIES.find(s=>s.id===specialty)?.emoji}</span>
                <span>Branş: {SPECIALTIES.find(s=>s.id===specialty)?.label}</span>
                <span style={S({fontWeight:"400",color:"#64748B"})}>· profilinizden</span>
              </div>
            ) : (<>
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"16px"})}>Uzmanlık Seçin</div>
            <div style={S({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"})}>
              {SPECIALTIES.map(s => (
                <div key={s.id} onClick={()=>setSpecialty(s.id)}
                  style={S({padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${specialty===s.id?"#2563EB":"#E5E7EB"}`,background:specialty===s.id?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:specialty===s.id?"600":"400",color:specialty===s.id?"#1D4ED8":"#374151"})}>
                  <span>{s.emoji}</span>{s.label}
                </div>
              ))}
            </div>
            </>)}
            <div style={S({fontSize:"15px",fontWeight:"600",color:"#0A1628",marginBottom:"12px"})}>Seans Türü</div>
            <div style={S({display:"flex",gap:"8px",marginBottom:"20px"})}>
              {["muayene","kontrol","konsültasyon"].map(t=>(
                <div key={t} onClick={()=>setSessionType(t)}
                  style={S({padding:"8px 16px",borderRadius:"20px",border:`1.5px solid ${sessionType===t?"#2563EB":"#E5E7EB"}`,background:sessionType===t?"#EFF6FF":"#fff",cursor:"pointer",fontSize:"13px",fontWeight:sessionType===t?"600":"400",color:sessionType===t?"#1D4ED8":"#374151"})}>
                  {t}
                </div>
              ))}
            </div>
            <button onClick={()=>{setSeconds(0);setStep("recording")}}
              style={S({width:"100%",padding:"16px",background:"#2563EB",color:"#fff",border:"none",borderRadius:"12px",fontSize:"16px",fontWeight:"600",cursor:"pointer"})}>
              🎙️ Seansa Başla
            </button>
            {/* NOTYA-SES-01: hazır ses kaydı yükle — telefonda kaydedilen ya da kayıt başlatılmayı
                unutulan muayeneler için aynı Ayşe Kaya SOAP motoru. Ses, transkript sonrası silinir. */}
            <div style={S({textAlign:"center",margin:"14px 0 6px",color:"#9CA3AF",fontSize:"12px"})}>ya da</div>
            <label style={S({display:"block",width:"100%",padding:"13px",background:sesYukleniyor?"#EFF6FF":"#F9FAFB",color:"#374151",border:"1.5px dashed #D1D5DB",borderRadius:"12px",fontSize:"14px",fontWeight:"600",cursor:sesYukleniyor?"default":"pointer",textAlign:"center",boxSizing:"border-box"})}>
              {sesYukleniyor ? "⏳ Ses çözümlüyor ve not üretiliyor… birkaç dakika sürebilir, sayfayı kapatmayın" : "📁 Ses dosyası yükle → SOAP üret (m4a / mp3 / wav)"}
              <input type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg" style={{display:"none"}} disabled={sesYukleniyor}
                onChange={(e)=>{const f=e.target.files?.[0]; if(f) sesDosyasiIsle(f); e.target.value=""}} />
            </label>
            {sesHata && <div style={S({marginTop:"8px",color:"#DC2626",fontSize:"13px"})}>{sesHata}</div>}
          </div>
        )}

        {step === "recording" && (
          <div style={S({background:"#fff",borderRadius:"20px",padding:"24px"})}>
            <div style={S({textAlign:"center",marginBottom:"20px"})}>
              <div style={S({width:"64px",height:"64px",background:isRecordingVoice?"#FEE2E2":"#EFF6FF",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"28px"})}>🎙️</div>
              <div style={S({fontSize:"32px",fontWeight:"600",color:"#0A1628",fontFamily:"monospace",marginBottom:"4px"})}>{fmt(seconds)}</div>
              <div style={S({fontSize:"13px",color:"#64748B"})}>{isRecordingVoice ? "Kayıt devam ediyor" : seconds > 0 ? "Kayıt duraklatıldı" : "Kayıt başlamadı — 🎤 Sesle Dikte Et'e basın"} · {SPECIALTIES.find(s=>s.id===specialty)?.label}</div>
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
            {!!note.takip_suresi && (
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
