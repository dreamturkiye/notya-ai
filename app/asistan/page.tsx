
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type Persona = { id: string; name: string; title: string; emoji: string; color: string; specialty: string }

const PERSONAS: Persona[] = [
  { id: "aysekaya",    name: "Prof. Ayşe Kaya",    title: "Pediatri Uzmanı",        emoji: "👩‍⚕️", color: "#0F9B8E", specialty: "pediatri"    },
  { id: "mehmetdemir", name: "Prof. Mehmet Demir",  title: "Kardiyoloji Uzmanı",     emoji: "👨‍⚕️", color: "#2563EB", specialty: "kardiyoloji" },
  { id: "elifsahin",   name: "Prof. Elif Şahin",    title: "Nöroloji & Dahiliye",    emoji: "👩‍⚕️", color: "#7C3AED", specialty: "genel"       },
]

type ConvStatus = "idle" | "connecting" | "connected" | "speaking_ai" | "listening" | "error"
type Message = { id: string; speaker: "doctor" | "ai"; text: string; time: Date }

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS[0])
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/giris"); return }
      setAuthToken(session.access_token)
    })
    return () => { stopConversation() }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  function addMessage(speaker: "doctor" | "ai", text: string) {
    setMessages(prev => [...prev, { id: Date.now().toString(), speaker, text, time: new Date() }])
  }

  // ── AUDIO PLAYBACK ───────────────────────────────────────────
  async function playAudioChunk(base64Audio: string) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 16000 })
    const ctx = audioCtxRef.current
    const raw = atob(base64Audio)
    const buf = new ArrayBuffer(raw.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
    audioQueueRef.current.push(buf)
    if (!isPlayingRef.current) drainAudioQueue()
  }

  async function drainAudioQueue() {
    if (isPlayingRef.current || !audioQueueRef.current.length) return
    isPlayingRef.current = true
    setStatus("speaking_ai")
    while (audioQueueRef.current.length > 0) {
      const buf = audioQueueRef.current.shift()!
      const ctx = audioCtxRef.current!
      try {
        const decoded = await ctx.decodeAudioData(buf.slice(0))
        await new Promise<void>(resolve => {
          const source = ctx.createBufferSource()
          source.buffer = decoded
          source.connect(ctx.destination)
          source.onended = () => resolve()
          source.start()
        })
      } catch { /* skip bad chunk */ }
    }
    isPlayingRef.current = false
    if (wsRef.current?.readyState === WebSocket.OPEN) setStatus("listening")
  }

  function stopAudio() {
    audioQueueRef.current = []
    isPlayingRef.current = false
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }

  // ── MICROPHONE ───────────────────────────────────────────────
  async function startMic(ws: WebSocket) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
    micStreamRef.current = stream
    const ctx = audioCtxRef.current || new AudioContext({ sampleRate: 16000 })
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN || isPlayingRef.current) return
      const pcm = e.inputBuffer.getChannelData(0)
      const int16 = new Int16Array(pcm.length)
      for (let i = 0; i < pcm.length; i++) int16[i] = Math.max(-32768, Math.min(32767, pcm[i] * 32768))
      const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)))
      ws.send(JSON.stringify({ user_audio_chunk: b64 }))
    }
    source.connect(processor)
    processor.connect(ctx.destination)
    processorRef.current = processor
  }

  function stopMic() {
    processorRef.current?.disconnect()
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
  }

  // ── WEBSOCKET CONVERSATION ───────────────────────────────────
  async function startConversation() {
    if (!authToken) return
    setStatus("connecting")
    setError("")
    setMessages([])
    stopAudio()

    try {
      // Get signed URL from our API
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!resp.ok) throw new Error("Bağlantı başlatılamadı")
      const { signed_url } = await resp.json()

      const ws = new WebSocket(signed_url)
      wsRef.current = ws

      ws.onopen = () => {
        // Send init config
        ws.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: { language: "tr" },
            tts: { optimize_streaming_latency: 4 }
          }
        }))
        setStatus("connected")
        startMic(ws)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case "conversation_initiation_metadata":
            setStatus("listening")
            break
          case "audio":
            if (data.audio_event?.audio_base_64) {
              playAudioChunk(data.audio_event.audio_base_64)
            }
            break
          case "agent_response":
            if (data.agent_response_event?.agent_response) {
              addMessage("ai", data.agent_response_event.agent_response)
            }
            break
          case "user_transcript":
            if (data.user_transcription_event?.user_transcript) {
              const t = data.user_transcription_event.user_transcript.trim()
              if (t) addMessage("doctor", t)
            }
            break
          case "interruption":
            stopAudio()
            setStatus("listening")
            break
          case "ping":
            ws.send(JSON.stringify({ type: "pong", event_id: data.ping_event?.event_id }))
            break
          case "internal_tentative_agent_response":
            setStatus("speaking_ai")
            break
        }
      }

      ws.onerror = () => { setError("Bağlantı hatası"); setStatus("error") }
      ws.onclose = () => { setStatus("idle"); stopMic(); stopAudio() }

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata")
      setStatus("error")
    }
  }

  function stopConversation() {
    wsRef.current?.close()
    wsRef.current = null
    stopMic()
    stopAudio()
    setStatus("idle")
  }

  // ── UI ───────────────────────────────────────────────────────
  const statusText: Record<ConvStatus, string> = {
    idle:         "Başlamak için dokunun",
    connecting:   "Bağlanıyor...",
    connected:    "Hazırlanıyor...",
    listening:    "Dinliyor — konuşabilirsiniz",
    speaking_ai:  `${persona.name.split(" ")[1]} konuşuyor...`,
    error:        "Bağlantı hatası"
  }

  const isActive = ["connecting","connected","listening","speaking_ai"].includes(status)

  return (
    <div style={{height:"100dvh",background:"#080E1A",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>

      {/* Header */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <div onClick={()=>{stopConversation();router.push("/dashboard")}}
          style={{color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"22px",lineHeight:1}}>‹</div>
        <div style={{flex:1}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff"}}>{persona.name}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
        </div>
        {/* Persona switcher pills */}
        <div style={{display:"flex",gap:"4px"}}>
          {PERSONAS.map(p => (
            <div key={p.id}
              onClick={() => { if (isActive) stopConversation(); setPersona(p); setMessages([]) }}
              style={{padding:"4px 10px",borderRadius:"20px",fontSize:"11px",cursor:"pointer",
                      background:persona.id===p.id ? p.color : "rgba(255,255,255,.08)",
                      color:persona.id===p.id ? "#fff" : "rgba(255,255,255,.5)",
                      fontWeight:persona.id===p.id?"600":"400",
                      border:`1px solid ${persona.id===p.id ? p.color : "rgba(255,255,255,.1)"}`}}>
              {p.name.split(" ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {messages.length === 0 && !isActive && (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",opacity:.6}}>
            <div style={{fontSize:"56px"}}>{persona.emoji}</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:"500",color:"#fff",marginBottom:"6px"}}>{persona.name}</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.5)"}}>{persona.title}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",marginTop:"12px"}}>Aşağıdaki butona basın ve konuşmaya başlayın</div>
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{display:"flex",justifyContent:msg.speaker==="doctor"?"flex-end":"flex-start",gap:"8px",alignItems:"flex-end"}}>
            {msg.speaker === "ai" && (
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                           display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0}}>
                {persona.emoji}
              </div>
            )}
            <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:msg.speaker==="doctor"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                         background:msg.speaker==="doctor"?"#2563EB":"#1A2B45",
                         color:"#fff",fontSize:"14px",lineHeight:"1.5"}}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Status + Main Button */}
      <div style={{padding:"16px 16px 32px",display:"flex",flexDirection:"column",alignItems:"center",gap:"14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>

        {error && (
          <div style={{fontSize:"12px",color:"#F87171",background:"rgba(239,68,68,.1)",padding:"8px 16px",borderRadius:"20px"}}>
            {error}
          </div>
        )}

        {/* Status indicator */}
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.5)",display:"flex",alignItems:"center",gap:"8px"}}>
          {isActive && (
            <div style={{width:"7px",height:"7px",borderRadius:"50%",
                         background:status==="speaking_ai"?persona.color:status==="listening"?"#22C55E":"#F59E0B",
                         animation:"pulse 1.5s ease-in-out infinite"}} />
          )}
          {statusText[status]}
        </div>

        {/* The one button */}
        <div onClick={isActive ? stopConversation : startConversation}
          style={{width:"80px",height:"80px",borderRadius:"50%",cursor:"pointer",
                  background:isActive ? `radial-gradient(circle, ${persona.color}, ${persona.color}88)` : "rgba(255,255,255,.08)",
                  border:`2px solid ${isActive ? persona.color : "rgba(255,255,255,.15)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",
                  boxShadow:isActive ? `0 0 30px ${persona.color}44, 0 0 60px ${persona.color}22` : "none",
                  transition:"all .3s",animation:status==="speaking_ai"?`glow-${persona.id} 2s ease-in-out infinite`:undefined}}>
          {isActive ? (status === "speaking_ai" ? "🔊" : "🎙️") : "🎙️"}
        </div>

        <div style={{fontSize:"11px",color:"rgba(255,255,255,.25)",textAlign:"center"}}>
          {isActive ? "Sohbeti bitirmek için dokunun" : "Konuşmayı başlatmak için dokunun"}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
      `}</style>
    </div>
  )
}
