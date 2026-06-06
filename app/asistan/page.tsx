
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
  kardiyoloji: "Sen Prof. Dr. Mehmet Demir - Kardiyoloji uzmanisın. Braunwald 12e bilgin tam. Hizli net. Doktoru doktor diye hitap et. Turkce.",
  genel:       "Sen Prof. Dr. Elif Sahin - Noroloji ve Dahiliye uzmanisın. Harrisons 22e bilgin tam. Doktoru doktor diye hitap et. Turkce.",
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

// Minimal silent WAV to unlock iOS audio session
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
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
    return () => cleanup()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function addMsg(role: "user" | "ai", text: string) {
    if (!text?.trim()) return
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: text.trim() }])
  }

  function dbg(msg: string) {
    const t = new Date().toISOString().substring(11,19)
    console.log("[DBG]", msg)
    setDebugLog(prev => [...prev.slice(-12), `${t} ${msg}`])
  }

  function cleanup() {
    try { wsRef.current?.close(1000) } catch {}
    wsRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
  }

  // Pre-created audio element — activated in tap gesture so iOS allows playback
  // from WebSocket callbacks without user gesture requirement
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // Play audio via pre-activated HTML Audio element
  async function playAudioChunk(base64pcm: string) {
    audioQueueRef.current.push(base64pcm)
    if (!isPlayingRef.current) drainQueue()
  }

  async function drainQueue() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      if (wsRef.current?.readyState === WebSocket.OPEN) setStatus("listening")
      return
    }
    isPlayingRef.current = true
    setStatus("speaking")

    const b64 = audioQueueRef.current.shift()!
    try {
      const raw = atob(b64)
      const pcm = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) pcm[i] = raw.charCodeAt(i)
      const wav = buildWav(pcm, 16000)
      const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }))

      // Reuse the pre-activated audio element
      const audio = audioElRef.current || new Audio()
      audioElRef.current = audio
      audio.playsInline = true
      audio.src = url

      await new Promise<void>(res => {
        audio.onended = () => { URL.revokeObjectURL(url); res() }
        audio.onerror = () => { URL.revokeObjectURL(url); res() }
        dbg('Playing audio...')
      audio.play().catch((e) => { dbg('play() blocked:'+e.name); console.warn("play blocked:", e); URL.revokeObjectURL(url); res() })
      })
    } catch(e) { console.warn("audio error:", e) }
    drainQueue()
  }

  function buildWav(pcm: Uint8Array, sampleRate: number): ArrayBuffer {
    const buf = new ArrayBuffer(44 + pcm.length)
    const v = new DataView(buf)
    const u = new Uint8Array(buf)
    const str = (o: number, s: string) => s.split("").forEach((c,i) => v.setUint8(o+i, c.charCodeAt(0)))
    str(0,"RIFF"); v.setUint32(4, 36+pcm.length, true); str(8,"WAVE")
    str(12,"fmt "); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true)
    v.setUint32(24,sampleRate,true); v.setUint32(28,sampleRate*2,true)
    v.setUint16(32,2,true); v.setUint16(34,16,true)
    str(36,"data"); v.setUint32(40,pcm.length,true)
    u.set(pcm, 44)
    return buf
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    cleanup()
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])

    try {
      // CRITICAL: all inside tap gesture handler
      // 1. Create and activate the audio element - this unlocks iOS audio session
      // Pre-activating in gesture means subsequent .play() calls work without gesture
      const audioEl = new Audio(SILENT_WAV)
      audioEl.playsInline = true
      audioEl.muted = false
      try { await audioEl.play(); audioEl.pause() } catch {}
      audioElRef.current = audioEl

      // 2. Fetch signed URL AND request mic in parallel
      // Both happen simultaneously so URL doesn't expire waiting for mic dialog
      dbg('Starting mic+url fetch...')
      const [stream, resp] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          }
        }),
        fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ])

      dbg('Mic granted. URL status:'+resp.status)
      streamRef.current = stream

      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`)
      const body = await resp.json()
      if (!body.signed_url) throw new Error("Bağlantı adresi alınamadı")

      // 3. Open WebSocket — URL is fresh, mic is granted, audio is unlocked
      dbg('Opening WS...')
      const ws = new WebSocket(body.signed_url)
      wsRef.current = ws

      const connTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close()
          setErrorMsg("Bağlantı zaman aşımı — tekrar deneyin")
          setStatus("error")
        }
      }, 10000)

      ws.onopen = () => {
        dbg('WS opened!')
        clearTimeout(connTimeout)

        // Send system prompt override
        // Send ONLY prompt and first_message override - do NOT override voice_id
        // Overriding voice_id via raw WebSocket causes 1008 policy violation
        // Send minimal init — no overrides (agent config on ElevenLabs dashboard controls behavior)
        ws.send(JSON.stringify({
          type: "conversation_initiation_client_data"
        }))

        setStatus("listening")

        // Start sending mic audio
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioCtx({ sampleRate: 16000 })
        audioCtxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const proc = ctx.createScriptProcessor(4096, 1, 1)
        proc.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN || isPlayingRef.current) return
          const pcm = e.inputBuffer.getChannelData(0)
          const i16 = new Int16Array(pcm.length)
          for (let i = 0; i < pcm.length; i++)
            i16[i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32768)))
          ws.send(JSON.stringify({
            user_audio_chunk: btoa(String.fromCharCode(...new Uint8Array(i16.buffer)))
          }))
        }
        src.connect(proc)
        proc.connect(ctx.destination)
      }

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data)
          if (d.type === "audio" && d.audio_event?.audio_base_64) {
            dbg('Audio chunk received')
            playAudioChunk(d.audio_event.audio_base_64)
          }
          else if (d.type === "agent_response" && d.agent_response_event?.agent_response)
            addMsg("ai", d.agent_response_event.agent_response)
          else if (d.type === "user_transcript" && d.user_transcription_event?.user_transcript?.trim())
            addMsg("user", d.user_transcription_event.user_transcript)
          else if (d.type === "interruption") {
            audioQueueRef.current = []; isPlayingRef.current = false; setStatus("listening")
          } else if (d.type === "ping" && d.ping_event?.event_id)
            ws.send(JSON.stringify({ type: "pong", event_id: d.ping_event.event_id }))
        } catch {}
      }

      ws.onerror = (e) => {
        dbg('WS error: '+JSON.stringify(e))
        setErrorMsg("WebSocket bağlantı hatası — tekrar deneyin")
        setStatus("error")
        cleanup()
      }

      ws.onclose = (e) => {
        dbg('WS close code='+e.code+' reason='+e.reason+' clean='+e.wasClean)
        clearTimeout(connTimeout)
        if (e.code === 1000 || e.code === 1001) setStatus("idle")
        else { setErrorMsg(`Bağlantı kesildi (kod: ${e.code}) — tekrar deneyin`); setStatus("error") }
        cleanup()
      }

    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      setErrorMsg(
        raw.includes("denied") || raw.includes("NotAllowed") || raw.includes("Permission")
          ? "Mikrofon izni reddedildi. Ayarlar → Safari → Mikrofon'dan izin verin."
          : raw.includes("NotFound")
          ? "Mikrofon bulunamadı. Cihazınızda mikrofon var mı?"
          : "Hata: " + raw.slice(0, 80)
      )
      setStatus("error")
      cleanup()
    }
  }

  function stopConversation() {
    cleanup()
    setStatus("idle")
  }

  function switchPersona(key: string) {
    stopConversation()
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    setMessages([])
    setErrorMsg("")
  }

  const isActive = ["connecting","listening","speaking"].includes(status)
  const statusLabel = {
    idle:       "Başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening:  "Dinliyor — konuşabilirsiniz",
    speaking:   persona.name.split(" ")[1] + " konuşuyor...",
    error:      "Tekrar deneyin",
  }[status]

  return (
    <div style={{height:"100dvh",background:"#080F1A",display:"flex",flexDirection:"column",
                 fontFamily:"system-ui,sans-serif",overflow:"hidden",userSelect:"none"}}>

      {/* Header */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",
                   borderBottom:"1px solid rgba(255,255,255,.08)",background:"#0A1525"}}>
        <div onClick={()=>{stopConversation();router.push("/dashboard")}}
          style={{color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"24px",padding:"4px"}}>‹</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff",overflow:"hidden",
                       textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{persona.name}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{persona.title}</div>
        </div>
        <div style={{display:"flex",gap:"4px",flexShrink:0}}>
          {Object.entries(PERSONAS).map(([key,p])=>(
            <div key={key} onClick={()=>switchPersona(key)}
              style={{padding:"5px 10px",borderRadius:"16px",fontSize:"11px",cursor:"pointer",
                      fontWeight:personaKey===key?"700":"400",
                      background:personaKey===key?p.color:"rgba(255,255,255,.08)",
                      color:personaKey===key?"#fff":"rgba(255,255,255,.4)",
                      border:`1px solid ${personaKey===key?p.color:"rgba(255,255,255,.1)"}`}}>
              {p.name.split(" ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {messages.length===0 && status==="idle" && (
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
        {messages.map(msg=>(
          <div key={msg.id} style={{display:"flex",
            justifyContent:msg.role==="user"?"flex-end":"flex-start",
            alignItems:"flex-end",gap:"8px"}}>
            {msg.role==="ai"&&(
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
        {status==="connecting" && (
          <div style={{display:"flex",alignItems:"flex-end",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:persona.color,
                         display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>
              {persona.emoji}
            </div>
            <div style={{padding:"12px 16px",background:"#1A2B40",borderRadius:"16px 16px 16px 3px",
                         display:"flex",gap:"5px",alignItems:"center"}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",
                                     background:"rgba(255,255,255,.4)",
                                     animation:`bounce 1.2s ease-in-out ${i*.2}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Controls */}
      <div style={{padding:"16px 16px 44px",display:"flex",flexDirection:"column",
                   alignItems:"center",gap:"12px",borderTop:"1px solid rgba(255,255,255,.06)",
                   background:"#0A1525"}}>
        {errorMsg&&(
          <div style={{fontSize:"12px",color:"#F87171",background:"rgba(239,68,68,.12)",
                       padding:"10px 18px",borderRadius:"10px",textAlign:"center",
                       maxWidth:"320px",lineHeight:"1.5"}}>{errorMsg}</div>
        )}
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",
                     display:"flex",alignItems:"center",gap:"8px"}}>
          {isActive&&(
            <div style={{width:"7px",height:"7px",borderRadius:"50%",
                         background:status==="speaking"?persona.color
                           :status==="connecting"?"#F59E0B":"#22C55E",
                         boxShadow:`0 0 8px ${status==="speaking"?persona.color:"#22C55E"}`}}/>
          )}
          {statusLabel}
        </div>
        <div onClick={isActive?stopConversation:startConversation}
          style={{width:"80px",height:"80px",borderRadius:"50%",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",
                  background:isActive
                    ?`radial-gradient(circle,${persona.color},${persona.color}88)`
                    :"rgba(255,255,255,.1)",
                  border:`2px solid ${isActive?persona.color:"rgba(255,255,255,.2)"}`,
                  boxShadow:isActive?`0 0 32px ${persona.color}55`:"none",
                  transition:"all .25s"}}>
          {status==="connecting"?"⏳":status==="speaking"?"🔊":"🎙️"}
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)"}}>
          {isActive?"Bitirmek için dokunun":"Başlatmak için dokunun"}
        </div>
      </div>
      {/* DEBUG OVERLAY - remove after fixing */}
      {debugLog.length > 0 && (
        <div style={{position:"fixed",top:0,left:0,right:0,background:"rgba(0,0,0,.92)",
                     zIndex:9999,padding:"8px",maxHeight:"40vh",overflowY:"auto"}}>
          {debugLog.map((l,i)=>(
            <div key={i} style={{fontSize:"10px",fontFamily:"monospace",color:"#0f0",marginBottom:"2px"}}>{l}</div>
          ))}
          <div onClick={()=>setDebugLog([])} style={{fontSize:"10px",color:"#f00",marginTop:"4px",cursor:"pointer"}}>✕ clear</div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
