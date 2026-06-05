
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

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<Float32Array[]>([])
  const isPlayingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/giris"); return }
      setAuthToken(session.access_token)
    })
    return () => stopConversation()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function addMsg(role: "user" | "ai", text: string) {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, text }])
  }

  // ── AUDIO PLAYBACK ──────────────────────────────────────────
  function base64ToFloat32(b64: string): Float32Array {
    const raw = atob(b64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    // ElevenLabs sends PCM 16-bit little-endian at 16kHz
    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0
    return float32
  }

  async function playAudio(b64: string) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 16000 })
    const ctx = audioCtxRef.current
    const samples = base64ToFloat32(b64)
    const buf = ctx.createBuffer(1, samples.length, 16000)
    buf.getChannelData(0).set(samples)
    audioQueueRef.current.push(samples)
    if (!isPlayingRef.current) drainQueue()
  }

  async function drainQueue() {
    if (!audioCtxRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    setStatus("speaking")
    const ctx = audioCtxRef.current
    while (audioQueueRef.current.length > 0) {
      const samples = audioQueueRef.current.shift()!
      const buf = ctx.createBuffer(1, samples.length, 16000)
      buf.getChannelData(0).set(samples)
      await new Promise<void>(resolve => {
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        src.onended = () => resolve()
        src.start()
      })
    }
    isPlayingRef.current = false
    if (wsRef.current?.readyState === WebSocket.OPEN) setStatus("listening")
  }

  function stopAudio() {
    audioQueueRef.current = []
    isPlayingRef.current = false
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
  }

  // ── MICROPHONE ──────────────────────────────────────────────
  async function startMic(ws: WebSocket) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      micStreamRef.current = stream
      const ctx = audioCtxRef.current || new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN || isPlayingRef.current) return
        const pcm = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(pcm.length)
        for (let i = 0; i < pcm.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32768)))
        }
        const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)))
        ws.send(JSON.stringify({ user_audio_chunk: b64 }))
      }
      source.connect(processor)
      processor.connect(ctx.destination)
      processorRef.current = processor
    } catch (e) {
      setErrorMsg("Mikrofon erişimi reddedildi. Ayarlardan izin verin.")
      setStatus("error")
    }
  }

  function stopMic() {
    try { processorRef.current?.disconnect() } catch {}
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    processorRef.current = null
  }

  // ── MAIN CONVERSATION ───────────────────────────────────────
  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])
    stopAudio()
    stopMic()

    try {
      // 1. Get signed URL
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      })
      const respData = await resp.json()
      if (!resp.ok || !respData.signed_url) {
        throw new Error(respData.error || "Bağlantı URL'si alınamadı")
      }

      // 2. Open WebSocket
      const ws = new WebSocket(respData.signed_url)
      wsRef.current = ws

      // 3. Connection timeout — if not open in 10s, fail gracefully
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          setErrorMsg("Bağlantı zaman aşımı. Tekrar deneyin.")
          setStatus("error")
        }
      }, 10000)

      ws.onopen = () => {
        clearTimeout(timeout)
        // Send init with system prompt override
        const specialty = persona.specialty
        const initMsg = {
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: { prompt: SYSTEM_PROMPTS[specialty] || SYSTEM_PROMPTS.genel },
              first_message: FIRST_MESSAGES[specialty] || FIRST_MESSAGES.genel,
              language: "tr"
            },
            tts: { optimize_streaming_latency: 4 }
          }
        }
        ws.send(JSON.stringify(initMsg))
        setStatus("listening")
        startMic(ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          switch (data.type) {
            case "audio":
              if (data.audio_event?.audio_base_64) playAudio(data.audio_event.audio_base_64)
              break
            case "agent_response":
              if (data.agent_response_event?.agent_response) {
                addMsg("ai", data.agent_response_event.agent_response)
              }
              break
            case "user_transcript":
              if (data.user_transcription_event?.user_transcript?.trim()) {
                addMsg("user", data.user_transcription_event.user_transcript)
              }
              break
            case "interruption":
              stopAudio()
              setStatus("listening")
              break
            case "ping":
              if (data.ping_event?.event_id) {
                ws.send(JSON.stringify({ type: "pong", event_id: data.ping_event.event_id }))
              }
              break
            case "conversation_initiation_metadata":
              setStatus("listening")
              break
            case "internal_tentative_agent_response":
              setStatus("speaking")
              break
          }
        } catch { /* ignore parse errors */ }
      }

      ws.onerror = (e) => {
        console.error("[ws] error", e)
        clearTimeout(timeout)
        setErrorMsg("Bağlantı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.")
        setStatus("error")
        stopMic()
        stopAudio()
      }

      ws.onclose = (e) => {
        clearTimeout(timeout)
        stopMic()
        stopAudio()
        if (status !== "error") setStatus("idle")
        if (e.code !== 1000 && e.code !== 1001) {
          setErrorMsg(`Bağlantı kapandı (${e.code}). Tekrar deneyin.`)
          setStatus("error")
        }
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata"
      setErrorMsg(msg)
      setStatus("error")
      stopMic()
      stopAudio()
    }
  }

  function stopConversation() {
    try { wsRef.current?.close(1000, "User stopped") } catch {}
    wsRef.current = null
    stopMic()
    stopAudio()
    setStatus("idle")
  }

  function switchPersona(key: string) {
    if (["connecting","listening","speaking"].includes(status)) stopConversation()
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    setMessages([])
    setErrorMsg("")
  }

  const isActive = ["connecting","listening","speaking"].includes(status)
  const statusLabels: Record<ConvStatus, string> = {
    idle: "Başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening: "Dinliyor — konuşabilirsiniz",
    speaking: `${persona.name.split(" ")[1]} konuşuyor...`,
    error: "Hata — tekrar deneyin"
  }

  return (
    <div style={{height:"100dvh",background:"#080F1A",display:"flex",flexDirection:"column",
                 fontFamily:"system-ui,sans-serif",overflow:"hidden",userSelect:"none"}}>

      {/* Header */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",
                   borderBottom:"1px solid rgba(255,255,255,.08)",background:"#0A1525"}}>
        <div onClick={()=>{stopConversation();router.push("/dashboard")}}
          style={{color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"24px",lineHeight:1,padding:"4px"}}>‹</div>
        <div style={{flex:1}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff"}}>{persona.name}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <div key={key} onClick={() => switchPersona(key)}
              style={{padding:"5px 10px",borderRadius:"16px",fontSize:"11px",cursor:"pointer",
                      fontWeight:personaKey===key?"700":"400",
                      background:personaKey===key ? p.color : "rgba(255,255,255,.08)",
                      color:personaKey===key ? "#fff" : "rgba(255,255,255,.4)",
                      border:`1px solid ${personaKey===key ? p.color : "rgba(255,255,255,.1)"}`}}>
              {p.name.split(" ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {messages.length === 0 && !isActive && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                       justifyContent:"center",gap:"12px",opacity:.5}}>
            <div style={{fontSize:"52px"}}>{persona.emoji}</div>
            <div style={{fontSize:"15px",fontWeight:"500",color:"#fff",textAlign:"center"}}>{persona.name}</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)",textAlign:"center"}}>{persona.title}</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.3)",textAlign:"center",marginTop:"8px"}}>
              Aşağıdaki butona dokunarak konuşmayı başlatın
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
            {msg.role === "ai" && (
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"14px",flexShrink:0,marginRight:"8px",alignSelf:"flex-end"}}>
                {persona.emoji}
              </div>
            )}
            <div style={{maxWidth:"78%",padding:"10px 14px",fontSize:"14px",lineHeight:"1.55",
                         borderRadius:msg.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",
                         background:msg.role==="user"?"#006699":"#1A2B40",color:"#fff"}}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div style={{padding:"16px 16px 36px",display:"flex",flexDirection:"column",
                   alignItems:"center",gap:"12px",borderTop:"1px solid rgba(255,255,255,.06)",
                   background:"#0A1525"}}>

        {/* Error message */}
        {errorMsg && (
          <div style={{fontSize:"12px",color:"#F87171",background:"rgba(239,68,68,.12)",
                       padding:"8px 16px",borderRadius:"20px",textAlign:"center",maxWidth:"320px"}}>
            {errorMsg}
          </div>
        )}

        {/* Status */}
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",
                     display:"flex",alignItems:"center",gap:"8px"}}>
          {isActive && (
            <div style={{width:"7px",height:"7px",borderRadius:"50%",flexShrink:0,
                         background:status==="speaking"?persona.color:status==="connecting"?"#F59E0B":"#22C55E",
                         boxShadow:`0 0 8px ${status==="speaking"?persona.color:"#22C55E"}`}} />
          )}
          {statusLabels[status]}
        </div>

        {/* Main button */}
        <div onClick={isActive ? stopConversation : startConversation}
          style={{width:"76px",height:"76px",borderRadius:"50%",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px",
                  background:isActive
                    ? `radial-gradient(circle, ${persona.color}, ${persona.color}99)`
                    : "rgba(255,255,255,.1)",
                  border:`2px solid ${isActive ? persona.color : "rgba(255,255,255,.2)"}`,
                  boxShadow:isActive ? `0 0 28px ${persona.color}55` : "none",
                  transition:"all .25s"}}>
          {status === "connecting" ? "⏳" : isActive ? (status === "speaking" ? "🔊" : "🎙️") : "🎙️"}
        </div>

        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)"}}>
          {isActive ? "Bitirmek için dokunun" : "Başlatmak için dokunun"}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  )
}
