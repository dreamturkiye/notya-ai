
"use client"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type ConvStatus = "idle" | "requesting_mic" | "connecting" | "listening" | "speaking" | "error"
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

const AGENT_ID = "agent_3601ktc884ntf3dbdkjtyx6vdfwa"

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
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

  function cleanup() {
    wsRef.current?.close(1000)
    wsRef.current = null
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    audioQueueRef.current = []
    isPlayingRef.current = false
  }

  // Play PCM audio via HTML Audio element — works on iOS Safari natively
  async function playAudioChunk(base64pcm: string) {
    audioQueueRef.current.push(base64pcm)
    if (!isPlayingRef.current) drainAudioQueue()
  }

  async function drainAudioQueue() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      if (wsRef.current?.readyState === WebSocket.OPEN) setStatus("listening")
      return
    }
    isPlayingRef.current = true
    setStatus("speaking")

    const base64 = audioQueueRef.current.shift()!
    // Convert base64 PCM16 to WAV for HTML Audio
    const pcmData = atob(base64)
    const pcmBytes = new Uint8Array(pcmData.length)
    for (let i = 0; i < pcmData.length; i++) pcmBytes[i] = pcmData.charCodeAt(i)

    // Build WAV header for PCM16 16kHz mono
    const sampleRate = 16000
    const numChannels = 1
    const bitsPerSample = 16
    const dataLength = pcmBytes.length
    const header = new ArrayBuffer(44)
    const view = new DataView(header)
    const write = (offset: number, val: number, size: number) => {
      if (size === 4) view.setUint32(offset, val, true)
      else if (size === 2) view.setUint16(offset, val, true)
    }
    // RIFF chunk
    "RIFF".split("").forEach((c,i) => view.setUint8(i, c.charCodeAt(0)))
    write(4, 36 + dataLength, 4)
    "WAVE".split("").forEach((c,i) => view.setUint8(8+i, c.charCodeAt(0)))
    // fmt chunk
    "fmt ".split("").forEach((c,i) => view.setUint8(12+i, c.charCodeAt(0)))
    write(16, 16, 4)
    write(20, 1, 2) // PCM
    write(22, numChannels, 2)
    write(24, sampleRate, 4)
    write(28, sampleRate * numChannels * bitsPerSample / 8, 4)
    write(32, numChannels * bitsPerSample / 8, 2)
    write(34, bitsPerSample, 2)
    // data chunk
    "data".split("").forEach((c,i) => view.setUint8(36+i, c.charCodeAt(0)))
    write(40, dataLength, 4)

    const wav = new Blob([header, pcmBytes], { type: "audio/wav" })
    const url = URL.createObjectURL(wav)

    const audio = new Audio(url)
    audio.playsInline = true
    // Force speaker output (not earpiece) on iOS
    try { (audio as any).sinkId && await (audio as any).setSinkId("speaker") } catch {}

    await new Promise<void>(resolve => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => resolve())
    })

    drainAudioQueue()
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    cleanup()
    setStatus("requesting_mic")
    setErrorMsg("")
    setMessages([])

    try {
      // Step 1: unlock audio AND get mic permission in same gesture
      // Play a silent HTML audio to unlock iOS audio session
      const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=")
      silentAudio.playsInline = true
      try { await silentAudio.play() } catch {}

      // Step 2: get mic permission — Safari dialog appears here
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })

      setStatus("connecting")

      // Step 3: get signed URL
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!resp.ok) throw new Error(`API hatası: ${resp.status}`)
      const { signed_url } = await resp.json()
      if (!signed_url) throw new Error("URL alınamadı")

      // Step 4: open WebSocket AFTER mic granted and audio unlocked
      const ws = new WebSocket(signed_url)
      wsRef.current = ws

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close(); setErrorMsg("Bağlantı zaman aşımı"); setStatus("error")
        }
      }, 10000)

      ws.onopen = () => {
        clearTimeout(timeout)
        // Send conversation config override
        ws.send(JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: { prompt: SYSTEM_PROMPTS[persona.specialty] || SYSTEM_PROMPTS.genel },
              first_message: FIRST_MESSAGES[persona.specialty] || FIRST_MESSAGES.genel,
              language: "tr"
            },
            tts: { voice_id: VOICE_IDS[persona.specialty] || VOICE_IDS.genel, optimize_streaming_latency: 4 }
          }
        }))
        setStatus("listening")
        startSendingAudio(stream, ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          switch (data.type) {
            case "audio":
              if (data.audio_event?.audio_base_64) playAudioChunk(data.audio_event.audio_base_64)
              break
            case "agent_response":
              if (data.agent_response_event?.agent_response)
                addMsg("ai", data.agent_response_event.agent_response)
              break
            case "user_transcript":
              if (data.user_transcription_event?.user_transcript?.trim())
                addMsg("user", data.user_transcription_event.user_transcript)
              break
            case "interruption":
              audioQueueRef.current = []
              isPlayingRef.current = false
              setStatus("listening")
              break
            case "ping":
              if (data.ping_event?.event_id)
                ws.send(JSON.stringify({ type: "pong", event_id: data.ping_event.event_id }))
              break
          }
        } catch {}
      }

      ws.onerror = () => { setErrorMsg("Bağlantı hatası. Tekrar deneyin."); setStatus("error") }
      ws.onclose = (e) => {
        if (e.code !== 1000 && e.code !== 1001) {
          setErrorMsg(`Bağlantı kesildi (${e.code})`); setStatus("error")
        } else {
          setStatus("idle")
        }
        cleanup()
      }

    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      setErrorMsg(
        raw.includes("denied") || raw.includes("NotAllowed")
          ? "Mikrofon izni reddedildi. Ayarlar → Safari → Mikrofon'dan izin verin."
          : "Hata: " + raw.slice(0, 80)
      )
      setStatus("error")
    }
  }

  function startSendingAudio(stream: MediaStream, ws: WebSocket) {
    // Send mic audio as PCM chunks via WebSocket
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx({ sampleRate: 16000 })
    const source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN || isPlayingRef.current) return
      const pcm = e.inputBuffer.getChannelData(0)
      const int16 = new Int16Array(pcm.length)
      for (let i = 0; i < pcm.length; i++)
        int16[i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32768)))
      const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)))
      ws.send(JSON.stringify({ user_audio_chunk: b64 }))
    }
    source.connect(processor)
    processor.connect(ctx.destination)
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
    idle: "Başlatmak için dokunun",
    requesting_mic: "Mikrofon izni isteniyor...",
    connecting: "Bağlanıyor...",
    listening: "Dinliyor — konuşabilirsiniz",
    speaking: persona.name.split(" ")[1] + " konuşuyor...",
    error: "Tekrar deneyin",
  }[status]

  return (
    <div style={{height:"100dvh",background:"#080F1A",display:"flex",flexDirection:"column",
                 fontFamily:"system-ui,sans-serif",overflow:"hidden",userSelect:"none"}}>
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
            justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:"8px"}}>
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
        {["connecting","requesting_mic"].includes(status)&&(
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
          {(isActive||status==="requesting_mic")&&(
            <div style={{width:"7px",height:"7px",borderRadius:"50%",
                         background:status==="speaking"?persona.color
                           :status==="connecting"||status==="requesting_mic"?"#F59E0B":"#22C55E",
                         boxShadow:`0 0 8px ${status==="speaking"?persona.color:"#22C55E"}`}}/>
          )}
          {statusLabel}
        </div>
        <div onClick={isActive?stopConversation:startConversation}
          style={{width:"80px",height:"80px",borderRadius:"50%",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",
                  background:isActive?`radial-gradient(circle,${persona.color},${persona.color}88)`:"rgba(255,255,255,.1)",
                  border:`2px solid ${isActive?persona.color:"rgba(255,255,255,.2)"}`,
                  boxShadow:isActive?`0 0 32px ${persona.color}55`:"none",
                  transition:"all .25s"}}>
          {status==="requesting_mic"?"🎤":status==="connecting"?"⏳":status==="speaking"?"🔊":"🎙️"}
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)"}}>
          {isActive?"Bitirmek için dokunun":"Başlatmak için dokunun"}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
