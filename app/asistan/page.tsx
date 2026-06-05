
"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type ConvStatus = "idle" | "connecting" | "listening" | "speaking" | "error"
type Message = { id: string; role: "user" | "ai"; text: string }
type Persona = { name: string; title: string; emoji: string; color: string; specialty: string }

const PERSONAS: Record<string, Persona> = {
  aysekaya:    { name: "Prof. Ayşe Kaya",    title: "Pediatri Uzmanı",     emoji: "👩‍⚕️", color: "#0F9B8E", specialty: "pediatri"    },
  mehmetdemir: { name: "Prof. Mehmet Demir",  title: "Kardiyoloji Uzmanı",  emoji: "👨‍⚕️", color: "#006699", specialty: "kardiyoloji" },
  elifsahin:   { name: "Prof. Elif Şahin",    title: "Nöroloji & Dahiliye", emoji: "👩‍⚕️", color: "#7C3AED", specialty: "genel"       },
}

const SYSTEM_PROMPTS: Record<string, string> = {
  pediatri:    "Sen Prof. Dr. Ayse Kaya - Pediatri uzmanisın. Nelson Textbook 22e ve Harriet Lane 23e bilgin tam. Doktoru doktor diye hitap et. Yanlis doz gordugunde uyar. Kisa dogal Turkce cumleler.",
  kardiyoloji: "Sen Prof. Dr. Mehmet Demir - Kardiyoloji uzmanisın. Braunwald 12e ve ESC 2024 bilgin tam. Hizli net. Doktoru doktor diye hitap et. Turkce.",
  genel:       "Sen Prof. Dr. Elif Sahin - Noroloji ve Dahiliye uzmanisın. Harrisons 22e bilgin tam. Analitik. Doktoru doktor diye hitap et. Turkce.",
}

const FIRST_MESSAGES: Record<string, string> = {
  pediatri:    "Merhaba doktor. Ben Prof. Ayse. Hangi hastamiza bakiyoruz?",
  kardiyoloji: "Doktor, dinliyorum.",
  genel:       "Merhaba doktor. Ben Prof. Elif. Vakayı dinliyorum.",
}

const VOICE_IDS: Record<string, string> = {
  pediatri:    "EXAVITQu4vr4xnSDxMaL",
  kardiyoloji: "AZnzlk1XvdvUeBnXmlld",
  genel:       "pNInz6obpgDQGcFmaJgB",
}

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const convRef = useRef<{ endSession: () => Promise<void> } | null>(null)
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
    return () => { convRef.current?.endSession?.().catch(() => {}) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function addMsg(role: "user" | "ai", text: string) {
    if (!text?.trim()) return
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`, role, text: text.trim()
    }])
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])

    try {
      // Get signed URL
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}))
        throw new Error(e.error || `Sunucu hatası: ${resp.status}`)
      }
      const { signed_url } = await resp.json()
      if (!signed_url) throw new Error("Bağlantı adresi alınamadı")

      // CRITICAL: import from the browser entry point which registers setupStrategy
      // Without this the SDK throws "No voice session setup strategy registered"
      const { Conversation } = await import("@elevenlabs/client/browser")

      const conv = await Conversation.startSession({
        signedUrl: signed_url,

        overrides: {
          agent: {
            prompt: { prompt: SYSTEM_PROMPTS[persona.specialty] || SYSTEM_PROMPTS.genel },
            firstMessage: FIRST_MESSAGES[persona.specialty] || FIRST_MESSAGES.genel,
            language: "tr",
          },
          tts: {
            voiceId: VOICE_IDS[persona.specialty] || VOICE_IDS.genel,
          }
        },

        onConnect: () => setStatus("listening"),
        onDisconnect: () => { setStatus("idle"); convRef.current = null },

        onMessage: (props: { message: string; source: "user" | "ai" }) => {
          addMsg(props.source, props.message)
        },

        onModeChange: (props: { mode: "speaking" | "listening" }) => {
          setStatus(props.mode === "speaking" ? "speaking" : "listening")
        },

        onError: (message: string) => {
          console.error("[ElevenLabs]", message)
          setErrorMsg(
            message.includes("microphone") || message.includes("Permission")
              ? "Mikrofon izni gerekli — tarayıcıdan izin verin"
              : "Bağlantı hatası: " + message.slice(0, 80)
          )
          setStatus("error")
          convRef.current = null
        },
      })

      convRef.current = conv

    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      console.error("[Asistan]", raw)
      setErrorMsg(
        raw.includes("microphone") || raw.includes("Permission") || raw.includes("denied")
          ? "Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verin."
          : raw.includes("setupStrategy") || raw.includes("strategy")
          ? "Tarayıcı uyumsuz. Chrome veya Safari kullanın."
          : raw.includes("401") || raw.includes("403")
          ? "Oturum süresi dolmuş. Tekrar giriş yapın."
          : "Bağlantı kurulamadı — " + raw.slice(0, 60)
      )
      setStatus("error")
    }
  }

  function stopConversation() {
    convRef.current?.endSession?.().catch(() => {})
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

  return (
    <div style={{height:"100dvh",background:"#080F1A",display:"flex",flexDirection:"column",
                 fontFamily:"system-ui,sans-serif",overflow:"hidden",userSelect:"none"}}>

      {/* Header */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",
                   borderBottom:"1px solid rgba(255,255,255,.08)",background:"#0A1525"}}>
        <div onClick={() => { stopConversation(); router.push("/dashboard") }}
          style={{color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"24px",padding:"4px"}}>‹</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff",overflow:"hidden",
                       textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{persona.name}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
        </div>
        <div style={{display:"flex",gap:"4px",flexShrink:0}}>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <div key={key} onClick={() => switchPersona(key)}
              style={{padding:"5px 10px",borderRadius:"16px",fontSize:"11px",cursor:"pointer",
                      fontWeight: personaKey === key ? "700" : "400",
                      background: personaKey === key ? p.color : "rgba(255,255,255,.08)",
                      color: personaKey === key ? "#fff" : "rgba(255,255,255,.4)",
                      border:`1px solid ${personaKey === key ? p.color : "rgba(255,255,255,.1)"}`}}>
              {p.name.split(" ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",
                   flexDirection:"column",gap:"10px"}}>
        {messages.length === 0 && status === "idle" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                       justifyContent:"center",gap:"12px",opacity:.4}}>
            <div style={{fontSize:"56px"}}>{persona.emoji}</div>
            <div style={{fontSize:"16px",fontWeight:"600",color:"#fff"}}>{persona.name}</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.25)",marginTop:"8px",
                         textAlign:"center",maxWidth:"220px",lineHeight:"1.6"}}>
              Butona dokunun ve doğal konuşun
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:"flex",
            justifyContent:msg.role==="user"?"flex-end":"flex-start",
            alignItems:"flex-end",gap:"8px"}}>
            {msg.role === "ai" && (
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"14px",flexShrink:0}}>{persona.emoji}</div>
            )}
            <div style={{maxWidth:"78%",padding:"10px 14px",fontSize:"14px",lineHeight:"1.55",
                         borderRadius:msg.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",
                         background:msg.role==="user"?"#006699":"#1A2B40",color:"#fff"}}>
              {msg.text}
            </div>
          </div>
        ))}
        {status === "connecting" && (
          <div style={{display:"flex",alignItems:"flex-end",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                         display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>
              {persona.emoji}
            </div>
            <div style={{padding:"12px 16px",background:"#1A2B40",borderRadius:"16px 16px 16px 3px",
                         display:"flex",gap:"5px",alignItems:"center"}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",
                                     background:"rgba(255,255,255,.4)",
                                     animation:`bounce 1.2s ease-in-out ${i*.2}s infinite`}} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div style={{padding:"16px 16px 44px",display:"flex",flexDirection:"column",
                   alignItems:"center",gap:"12px",borderTop:"1px solid rgba(255,255,255,.06)",
                   background:"#0A1525"}}>
        {errorMsg && (
          <div style={{fontSize:"12px",color:"#F87171",background:"rgba(239,68,68,.12)",
                       padding:"10px 18px",borderRadius:"10px",textAlign:"center",
                       maxWidth:"320px",lineHeight:"1.5"}}>
            {errorMsg}
          </div>
        )}
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",
                     display:"flex",alignItems:"center",gap:"8px"}}>
          {isActive && (
            <div style={{width:"7px",height:"7px",borderRadius:"50%",
                         background:status==="speaking"?persona.color:status==="connecting"?"#F59E0B":"#22C55E",
                         boxShadow:`0 0 8px ${status==="speaking"?persona.color:"#22C55E"}`}} />
          )}
          {{
            idle:       "Başlatmak için dokunun",
            connecting: "Bağlanıyor...",
            listening:  "Dinliyor — konuşabilirsiniz",
            speaking:   persona.name.split(" ")[1] + " konuşuyor...",
            error:      "Tekrar deneyin",
          }[status]}
        </div>
        <div onClick={isActive ? stopConversation : startConversation}
          style={{width:"80px",height:"80px",borderRadius:"50%",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",
                  background:isActive?`radial-gradient(circle,${persona.color},${persona.color}88)`:"rgba(255,255,255,.1)",
                  border:`2px solid ${isActive?persona.color:"rgba(255,255,255,.2)"}`,
                  boxShadow:isActive?`0 0 32px ${persona.color}55`:"none",
                  transition:"all .25s"}}>
          {status==="connecting"?"⏳":status==="speaking"?"🔊":"🎙️"}
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)"}}>
          {isActive?"Bitirmek için dokunun":"Başlatmak için dokunun"}
        </div>
      </div>

      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
      `}</style>
    </div>
  )
}
