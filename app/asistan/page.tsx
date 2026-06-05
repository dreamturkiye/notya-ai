
"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type ConvStatus = "idle" | "connecting" | "listening" | "speaking" | "error"
type Message = { id: string; role: "user" | "ai"; text: string }
type Persona = { name: string; title: string; emoji: string; color: string; specialty: string }

const PERSONAS: Record<string, Persona> = {
  aysekaya:    { name: "Prof. Ayşe Kaya",    title: "Pediatri Uzmanı",      emoji: "👩‍⚕️", color: "#0F9B8E", specialty: "pediatri"    },
  mehmetdemir: { name: "Prof. Mehmet Demir",  title: "Kardiyoloji Uzmanı",   emoji: "👨‍⚕️", color: "#006699", specialty: "kardiyoloji" },
  elifsahin:   { name: "Prof. Elif Şahin",    title: "Nöroloji & Dahiliye",  emoji: "👩‍⚕️", color: "#7C3AED", specialty: "genel"       },
}

const SYSTEM_PROMPTS: Record<string, string> = {
  pediatri: "Sen Prof. Dr. Ayse Kaya - dunya capinda taninmis Pediatri uzmanisın. Nelson Textbook Pediatrics 22e ve Harriet Lane 23e bilgin tam. SEN ASISTAN DEGILSIN. Doktorla esit meslektassin. Yanlis doz gordugunde uyar. SGK kisitlamalarini hatirlatir. Pediatrik dozu kg bazli hesapla. Doktoru 'doktor' diye hitap et. Dogal Turkce konuş. Kisa cumleler.",
  kardiyoloji: "Sen Prof. Dr. Mehmet Demir - Kardiyoloji uzmanisın. Braunwald Heart Disease 12e ve ESC Guidelines 2024 bilgin eksiksiz. Hizli net guven verici. Doktoru doktor diye hitap et. Turkce konuş.",
  genel: "Sen Prof. Dr. Elif Sahin - Noroloji ve Dahiliye uzmanisın. Harrisons Principles 22e Adams Victor Neurology 12e bilgin tam. Analitik dikkatli. Doktoru doktor diye hitap et. Turkce konuş.",
}

const FIRST_MESSAGES: Record<string, string> = {
  pediatri:    "Merhaba doktor. Ben Prof. Ayse. Hangi hastamiza bakiyoruz bugun?",
  kardiyoloji: "Doktor, dinliyorum.",
  genel:       "Merhaba doktor. Ben Prof. Elif. Vakayı dinliyorum.",
}

const AGENT_ID = "agent_3601ktc884ntf3dbdkjtyx6vdfwa"

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/giris"); return }
      setAuthToken(session.access_token)
    })
    return () => { convRef.current?.endSession?.() }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function addMsg(role: "user" | "ai", text: string) {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role, text }])
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])

    try {
      // Get signed URL from our API
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await resp.json()
      if (!resp.ok || !data.signed_url) throw new Error(data.error || "URL alınamadı")

      // Dynamically import ElevenLabs SDK to avoid SSR issues
      const { Conversation } = await import("@elevenlabs/client")

      const conv = await Conversation.startSession({
        signedUrl: data.signed_url,

        // Override the agent's system prompt for this specialty
        overrides: {
          agent: {
            prompt: { prompt: SYSTEM_PROMPTS[persona.specialty] || SYSTEM_PROMPTS.genel },
            firstMessage: FIRST_MESSAGES[persona.specialty] || FIRST_MESSAGES.genel,
            language: "tr",
          },
          tts: {
            voiceId: persona.specialty === "pediatri"
              ? "EXAVITQu4vr4xnSDxMaL"
              : persona.specialty === "kardiyoloji"
              ? "AZnzlk1XvdvUeBnXmlld"
              : "pNInz6obpgDQGcFmaJgB"
          }
        },

        // ElevenLabs SDK handles WebRTC, echo cancellation, noise suppression automatically
        onConnect: () => {
          setStatus("listening")
        },

        onDisconnect: () => {
          setStatus("idle")
        },

        onMessage: (msg: { message: string; source: string }) => {
          if (msg.source === "ai" && msg.message?.trim()) {
            addMsg("ai", msg.message)
          } else if (msg.source === "user" && msg.message?.trim()) {
            addMsg("user", msg.message)
          }
        },

        onStatusChange: (s: { status: string }) => {
          if (s.status === "speaking") setStatus("speaking")
          else if (s.status === "listening") setStatus("listening")
        },

        onError: (err: string) => {
          console.error("[ElevenLabs]", err)
          setErrorMsg("Bağlantı hatası. Tekrar deneyin.")
          setStatus("error")
        },
      })

      convRef.current = conv

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error("[startConversation]", msg)
      setErrorMsg(msg.includes("microphone") || msg.includes("Permission")
        ? "Mikrofon erişimi gerekli. Tarayıcı ayarlarından izin verin."
        : "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.")
      setStatus("error")
    }
  }

  function stopConversation() {
    convRef.current?.endSession?.()
    convRef.current = null
    setStatus("idle")
  }

  function switchPersona(key: string) {
    if (convRef.current) stopConversation()
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    setMessages([])
    setErrorMsg("")
  }

  const isActive = ["connecting", "listening", "speaking"].includes(status)

  const statusLabels: Record<ConvStatus, string> = {
    idle:       "Başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening:  "Dinliyor — konuşabilirsiniz",
    speaking:   `${persona.name.split(" ")[1]} konuşuyor...`,
    error:      "Hata — tekrar deneyin",
  }

  return (
    <div style={{height:"100dvh",background:"#080F1A",display:"flex",flexDirection:"column",
                 fontFamily:"system-ui,sans-serif",overflow:"hidden",userSelect:"none"}}>

      {/* Header */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",
                   borderBottom:"1px solid rgba(255,255,255,.08)",background:"#0A1525"}}>
        <div onClick={() => { stopConversation(); router.push("/dashboard") }}
          style={{color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"24px",padding:"4px"}}>‹</div>
        <div style={{flex:1}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff"}}>{persona.name}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
        </div>
        {/* Persona switcher */}
        <div style={{display:"flex",gap:"4px"}}>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <div key={key} onClick={() => switchPersona(key)}
              style={{padding:"5px 10px",borderRadius:"16px",fontSize:"11px",cursor:"pointer",
                      fontWeight: personaKey === key ? "700" : "400",
                      background: personaKey === key ? p.color : "rgba(255,255,255,.08)",
                      color: personaKey === key ? "#fff" : "rgba(255,255,255,.4)",
                      border: `1px solid ${personaKey === key ? p.color : "rgba(255,255,255,.1)"}`}}>
              {p.name.split(" ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",
                   display:"flex",flexDirection:"column",gap:"10px"}}>
        {messages.length === 0 && !isActive && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                       justifyContent:"center",gap:"12px",opacity:.45,padding:"40px 0"}}>
            <div style={{fontSize:"56px"}}>{persona.emoji}</div>
            <div style={{fontSize:"16px",fontWeight:"600",color:"#fff",textAlign:"center"}}>
              {persona.name}
            </div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)",textAlign:"center"}}>
              {persona.title}
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.25)",textAlign:"center",
                         marginTop:"8px",maxWidth:"240px",lineHeight:"1.6"}}>
              Mikrofon ikonuna dokunun ve konuşmaya başlayın — arka plan gürültüsü otomatik filtrelenir
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id}
            style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",
                    alignItems:"flex-end",gap:"8px"}}>
            {msg.role === "ai" && (
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"14px",flexShrink:0}}>
                {persona.emoji}
              </div>
            )}
            <div style={{maxWidth:"78%",padding:"10px 14px",fontSize:"14px",lineHeight:"1.55",
                         borderRadius: msg.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",
                         background: msg.role==="user" ? "#006699" : "#1A2B40",
                         color:"#fff"}}>
              {msg.text}
            </div>
          </div>
        ))}
        {/* Typing indicator when AI is about to speak */}
        {status === "connecting" && (
          <div style={{display:"flex",alignItems:"flex-end",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                         display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>
              {persona.emoji}
            </div>
            <div style={{padding:"12px 16px",background:"#1A2B40",borderRadius:"16px 16px 16px 3px",
                         display:"flex",gap:"4px",alignItems:"center"}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",
                                     background:"rgba(255,255,255,.4)",
                                     animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div style={{padding:"16px 16px 40px",display:"flex",flexDirection:"column",
                   alignItems:"center",gap:"12px",borderTop:"1px solid rgba(255,255,255,.06)",
                   background:"#0A1525"}}>

        {/* Error */}
        {errorMsg && (
          <div style={{fontSize:"12px",color:"#F87171",background:"rgba(239,68,68,.12)",
                       padding:"8px 18px",borderRadius:"20px",textAlign:"center",maxWidth:"300px",
                       lineHeight:"1.5"}}>
            {errorMsg}
          </div>
        )}

        {/* Status text */}
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",
                     display:"flex",alignItems:"center",gap:"8px"}}>
          {isActive && (
            <div style={{width:"7px",height:"7px",borderRadius:"50%",flexShrink:0,
                         background: status === "speaking" ? persona.color
                                   : status === "connecting" ? "#F59E0B" : "#22C55E",
                         boxShadow: `0 0 8px ${status === "speaking" ? persona.color : "#22C55E"}`}} />
          )}
          {statusLabels[status]}
        </div>

        {/* Main mic button */}
        <div onClick={isActive ? stopConversation : startConversation}
          style={{width:"80px",height:"80px",borderRadius:"50%",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",
                  background: isActive
                    ? `radial-gradient(circle, ${persona.color}, ${persona.color}99)`
                    : "rgba(255,255,255,.1)",
                  border: `2px solid ${isActive ? persona.color : "rgba(255,255,255,.2)"}`,
                  boxShadow: isActive ? `0 0 32px ${persona.color}55, 0 0 64px ${persona.color}22` : "none",
                  transition:"all .25s",
                  animation: status === "listening" ? "breathe 3s ease-in-out infinite" : "none"}}>
          {status === "connecting" ? "⏳"
            : status === "speaking" ? "🔊"
            : "🎙️"}
        </div>

        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)",textAlign:"center"}}>
          {isActive ? "Bitirmek için dokunun" : "Başlatmak için dokunun"}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0) }
          30% { transform: translateY(-5px) }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  )
}
