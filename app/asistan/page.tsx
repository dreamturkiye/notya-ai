
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actionTaken?: string
  proactiveWarning?: string
  isTyping?: boolean
}

interface PersonaInfo {
  id: string
  name: string
  title: string
  avatar: string
  color: string
}

const PERSONAS: Record<string, PersonaInfo> = {
  aysekaya:    { id: "aysekaya",    name: "Prof. Ayşe Kaya",    title: "Pediatri Uzmanı",         avatar: "👩‍⚕️", color: "#0F9B8E" },
  mehmetdemir: { id: "mehmetdemir", name: "Prof. Mehmet Demir", title: "Kardiyoloji Uzmanı",       avatar: "👨‍⚕️", color: "#2563EB" },
  elifsahin:   { id: "elifsahin",   name: "Prof. Elif Şahin",   title: "Nöroloji & Dahiliye",      avatar: "👩‍⚕️", color: "#7C3AED" },
}

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
}

export default function AsistanPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [persona, setPersona] = useState<PersonaInfo>(PERSONAS.elifsahin)
  const [asistanSessionId, setAsistanSessionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [specialty, setSpecialty] = useState("genel")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [interimText, setInterimText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/giris"); return }
      setAuthToken(session.access_token)
    })
    // Initial greeting
    const defaultPersona = PERSONAS.elifsahin
    const greeting = getGreeting(defaultPersona.id)
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: greeting,
      timestamp: new Date()
    }])
    if (voiceEnabled) speakText(greeting, defaultPersona.id)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function getGreeting(personaId: string): string {
    const greetings: Record<string, string> = {
      aysekaya:    "Merhaba doktor. Ben Prof. Ayşe. Bugün hangi hastamıza bakıyoruz?",
      mehmetdemir: "Doktor, dinliyorum. Ne var?",
      elifsahin:   "Merhaba doktor. Ben Prof. Elif. Vakayı dinliyorum.",
    }
    return greetings[personaId] || "Merhaba doktor. Nasıl yardımcı olabilirim?"
  }

  // ElevenLabs TTS
  async function speakText(text: string, personaId: string) {
    if (!voiceEnabled || !process.env.NEXT_PUBLIC_ELEVENLABS_KEY) return
    const voiceIds: Record<string, string> = {
      aysekaya:    "21m00Tcm4TlvDq8ikWAM",
      mehmetdemir: "AZnzlk1XvdvUeBnXmlld",
      elifsahin:   "EXAVITQu4vr4xnSDxMaL",
    }
    try {
      setIsSpeaking(true)
      const resp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceIds[personaId] || voiceIds.elifsahin}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_KEY!,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: text.slice(0, 500),
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 }
          })
        }
      )
      if (resp.ok) {
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        if (audioRef.current) audioRef.current.pause()
        audioRef.current = new Audio(url)
        audioRef.current.onended = () => setIsSpeaking(false)
        audioRef.current.play()
      }
    } catch {
      setIsSpeaking(false)
    }
  }

  // Web Speech API — Voice input
  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      alert("Tarayıcınız ses tanımayı desteklemiyor. Chrome kullanın.")
      return
    }
    const recognition = new SpeechRec()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "tr-TR"
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      for (let i = 0; i < results.length; i++) {
        if (results[i].isFinal) {
          const transcript = results[i][0].transcript
          setInput(prev => prev + transcript)
          setInterimText("")
        } else {
          setInterimText(results[i][0].transcript)
        }
      }
    }
    recognition.onend = () => { setIsListening(false); setInterimText("") }
    recognition.onerror = () => { setIsListening(false); setInterimText("") }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  async function sendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText || loading || !authToken) return
    setInput("")
    setInterimText("")

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date()
    }
    const typingMsg: Message = {
      id: "typing",
      role: "assistant",
      content: "...",
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, userMsg, typingMsg])
    setLoading(true)

    try {
      const resp = await fetch("/api/asistan/chat", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          asistanSessionId,
          specialty,
          personaId: persona.id
        })
      })
      const data = await resp.json()

      if (data.success) {
        if (!asistanSessionId) setAsistanSessionId(data.data.asistanSessionId)
        const aiPersonaId = data.data.personaId
        if (aiPersonaId && PERSONAS[aiPersonaId]) setPersona(PERSONAS[aiPersonaId])

        const aiMsg: Message = {
          id: Date.now().toString() + "ai",
          role: "assistant",
          content: data.data.speech,
          timestamp: new Date(),
          actionTaken: data.data.actionResult?.message,
          proactiveWarning: data.data.proactiveWarning
        }
        setMessages(prev => prev.filter(m => m.id !== "typing").concat(aiMsg))
        if (voiceEnabled) speakText(data.data.speech, aiPersonaId || persona.id)
      } else {
        setMessages(prev => prev.filter(m => m.id !== "typing").concat({
          id: Date.now().toString(),
          role: "assistant",
          content: "Bir hata oluştu. Tekrar deneyin.",
          timestamp: new Date()
        }))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== "typing").concat({
        id: Date.now().toString(),
        role: "assistant",
        content: "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",
        timestamp: new Date()
      }))
    }
    setLoading(false)
  }

  const S = (s: Record<string,unknown>) => s as React.CSSProperties

  const QUICK_COMMANDS = [
    "Yeni hasta ekle",
    "Tanı ne?",
    "İlaç yaz",
    "Sevk mektubu",
    "SGK uyumlu mu?",
  ]

  return (
    <div style={S({minHeight:"100vh",background:"#0A1628",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"})}>

      {/* Header */}
      <div style={S({background:"#0F2040",borderBottom:"1px solid rgba(255,255,255,.1)",padding:"12px 20px",display:"flex",alignItems:"center",gap:"12px",position:"sticky",top:0,zIndex:50})}>
        <div onClick={()=>router.push("/dashboard")} style={S({color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"13px"})}>←</div>
        <div style={S({width:"40px",height:"40px",borderRadius:"50%",background:persona.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0,position:"relative"})}>
          {persona.avatar}
          {isSpeaking && <div style={S({position:"absolute",inset:"-3px",borderRadius:"50%",border:`2px solid ${persona.color}`,animation:"speakPulse 1s ease-in-out infinite",opacity:.7})}></div>}
        </div>
        <div style={S({flex:1})}>
          <div style={S({fontSize:"14px",fontWeight:"600",color:"#fff"})}>{persona.name}</div>
          <div style={S({fontSize:"11px",color:"rgba(255,255,255,.5)"})}>{persona.title} · {isSpeaking ? "🔊 Konuşuyor..." : isListening ? "🎙️ Dinliyor..." : "Hazır"}</div>
        </div>
        <div style={S({display:"flex",gap:"8px",alignItems:"center"})}>
          {/* Voice toggle */}
          <div onClick={()=>setVoiceEnabled(!voiceEnabled)}
            style={S({padding:"6px 10px",borderRadius:"20px",background:voiceEnabled?"rgba(37,99,235,.3)":"rgba(255,255,255,.1)",border:`1px solid ${voiceEnabled?"#2563EB":"rgba(255,255,255,.2)"}`,cursor:"pointer",fontSize:"16px"})}>
            {voiceEnabled ? "🔊" : "🔇"}
          </div>
          {/* Persona switcher */}
          <select
            value={persona.id}
            onChange={e => {
              const p = PERSONAS[e.target.value]
              setPersona(p)
              const greeting = getGreeting(p.id)
              setMessages([{ id: Date.now().toString(), role: "assistant", content: greeting, timestamp: new Date() }])
              setAsistanSessionId(null)
              if (voiceEnabled) speakText(greeting, p.id)
            }}
            style={S({background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"8px",color:"#fff",fontSize:"12px",padding:"6px 8px",cursor:"pointer"})}>
            <option value="elifsahin">Prof. Elif</option>
            <option value="aysekaya">Prof. Ayşe</option>
            <option value="mehmetdemir">Prof. Mehmet</option>
          </select>
        </div>
      </div>

      <style>{`
        @keyframes speakPulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        .typing-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor; margin:0 2px; animation:typingDot 1.2s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay:.2s }
        .typing-dot:nth-child(3) { animation-delay:.4s }
      `}</style>

      {/* Messages */}
      <div style={S({flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"12px",paddingBottom:"180px"})}>
        {messages.map(msg => (
          <div key={msg.id} style={S({display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",gap:"8px",alignItems:"flex-end"})}>
            {msg.role === "assistant" && (
              <div style={S({width:"32px",height:"32px",borderRadius:"50%",background:persona.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0})}>
                {persona.avatar}
              </div>
            )}
            <div style={S({maxWidth:"78%"})}>
              {msg.proactiveWarning && (
                <div style={S({background:"#FCEBEB",border:"1px solid rgba(226,75,74,.3)",borderRadius:"10px",padding:"8px 12px",marginBottom:"6px",fontSize:"12px",color:"#A32D2D"})}>
                  ⚠️ {msg.proactiveWarning}
                </div>
              )}
              <div style={S({
                padding:"12px 16px",
                borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
                background:msg.role==="user"?"#2563EB":"#1A3050",
                color:"#fff",
                fontSize:"14px",
                lineHeight:"1.55",
                maxWidth:"100%"
              })}>
                {msg.isTyping ? (
                  <div>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                ) : msg.content}
              </div>
              {msg.actionTaken && (
                <div style={S({fontSize:"11px",color:"#0F9B8E",marginTop:"4px",paddingLeft:"4px"})}>
                  ✅ {msg.actionTaken}
                </div>
              )}
              <div style={S({fontSize:"10px",color:"rgba(255,255,255,.3)",marginTop:"3px",paddingLeft:"4px",textAlign:msg.role==="user"?"right":"left"})}>
                {msg.timestamp.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom input */}
      <div style={S({position:"fixed",bottom:0,left:0,right:0,background:"#0F2040",borderTop:"1px solid rgba(255,255,255,.1)",padding:"12px 16px 24px"})}>

        {/* Quick commands */}
        <div style={S({display:"flex",gap:"6px",marginBottom:"10px",overflowX:"auto",paddingBottom:"2px"})}>
          {QUICK_COMMANDS.map(cmd => (
            <div key={cmd} onClick={()=>sendMessage(cmd)}
              style={S({padding:"6px 12px",borderRadius:"20px",background:"rgba(37,99,235,.2)",border:"1px solid rgba(37,99,235,.4)",color:"#93C5FD",fontSize:"12px",whiteSpace:"nowrap",cursor:"pointer",flexShrink:0})}>
              {cmd}
            </div>
          ))}
        </div>

        {/* Interim voice text */}
        {interimText && (
          <div style={S({fontSize:"12px",color:"rgba(255,255,255,.5)",marginBottom:"6px",fontStyle:"italic",paddingLeft:"4px"})}>
            🎙️ {interimText}...
          </div>
        )}

        <div style={S({display:"flex",gap:"8px",alignItems:"flex-end"})}>
          {/* Mic button */}
          <div onClick={toggleListening}
            style={S({
              width:"46px",height:"46px",borderRadius:"50%",flexShrink:0,
              background:isListening?"#DC2626":"rgba(37,99,235,.3)",
              border:`2px solid ${isListening?"#DC2626":"#2563EB"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:"pointer",fontSize:"20px",
              animation:isListening?"speakPulse 1s ease-in-out infinite":undefined
            })}>
            {isListening ? "⏹" : "🎙️"}
          </div>

          {/* Text input */}
          <textarea
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMessage() } }}
            placeholder="Doktor, hasta bilgisini girin veya soru sorun..."
            rows={1}
            style={S({
              flex:1,padding:"12px 14px",background:"rgba(255,255,255,.08)",
              border:"1px solid rgba(255,255,255,.15)",borderRadius:"14px",
              color:"#fff",fontSize:"14px",fontFamily:"system-ui",resize:"none",
              outline:"none",lineHeight:"1.4",maxHeight:"100px",overflowY:"auto"
            })}
          />

          {/* Send button */}
          <div onClick={()=>sendMessage()}
            style={S({
              width:"46px",height:"46px",borderRadius:"50%",flexShrink:0,
              background:loading||!input.trim()?"rgba(255,255,255,.1)":"#2563EB",
              display:"flex",alignItems:"center",justifyContent:"center",
              cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:"18px"
            })}>
            {loading ? "⏳" : "↑"}
          </div>
        </div>
      </div>
    </div>
  )
}
