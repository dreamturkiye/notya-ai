"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"
import { connectionErrorHelp, micPermissionHelp, isAndroid } from "@/lib/asistan/platform"
import {
  PERSONAS,
  PERSONA_ORDER,
  buildVoiceFirstMessage,
  buildVoiceSystemPrompt,
  getPersonaForSpecialty,
  type Persona,
  type PersonaId,
} from "@/lib/asistan/personaEngine"
import { SPECIALTY_MAP } from "@/lib/doktor/specialties"
import { formatColleagueTabLabel } from "@/lib/colleagueAddress"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"

type ConvStatus = "idle" | "connecting" | "listening" | "speaking" | "error"
type Message = { id: string; role: "user" | "ai"; text: string }

type ActiveConversation = Awaited<ReturnType<typeof Conversation.startSession>>

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState<PersonaId>("aysekaya")
  const [isMobile, setIsMobile] = useState(true)
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<ReturnType<typeof toAddressableUser> | null>(null)
  const conversationRef = useRef<ActiveConversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // auth via localStorage

  useEffect(() => {
    const chk = () => setIsMobile(window.innerWidth < 768)
    chk()
    window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  useEffect(() => {
    ;(async () => { const _r = localStorage.getItem('auth-token') || localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('sb-'))||''); const session = _r ? JSON.parse(_r) : null;
      if (!session) { router.push("/giris"); return }
      setAuthToken(session.access_token)

      const resp = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const profileData = await resp.json()
      if (!profileData.data?.onboarding_completed && !profileData.data?.profession_type) {
        router.push("/onboarding")
        return
      }
      setDoctorProfile(toAddressableUser(profileData.data as DoctorProfile))
      const profileSpecialty = (profileData.data as { specialty?: string } | undefined)?.specialty
      if (profileSpecialty) {
        const matchedId = getPersonaForSpecialty(profileSpecialty)
        if (PERSONAS[matchedId]) {
          setPersonaKey(matchedId)
          setPersona(PERSONAS[matchedId])
        }
      }
    })()
    return () => { void endConversation() }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // iOS notification banners can suspend the mic mid-call without firing onDisconnect.
  // Playback keeps working (separate audio pipe) but the mic input silently stays muted.
  // On tab/app return, force-unmute so the doctor's voice input resumes.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const conv = conversationRef.current as unknown as { setMuted?: (m: boolean) => void; isMuted?: boolean } | null
      if (!conv) return
      try {
        if (typeof conv.setMuted === 'function') {
          conv.setMuted(false)
        }
      } catch { /* non-fatal */ }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  function addMsg(role: "user" | "ai", text: string) {
    if (!text?.trim()) return
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: text.trim() }])
  }

  async function endConversation() {
    const conv = conversationRef.current
    conversationRef.current = null
    if (conv) {
      try { await conv.endSession() } catch { /* ignore */ }
    }
    setStatus("idle")
  }

  async function startConversation() {
    if (!authToken) { router.push("/giris"); return }
    await endConversation()
    setStatus("connecting")
    setErrorMsg("")
    setMessages([])
    // Pre-flight: request mic permission explicitly on user gesture
    // so the browser prompt fires before any async work
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch {
      setErrorMsg(micPermissionHelp())
      setStatus("error")
      return
    }
    // Android: unlock AudioContext on user gesture before any async work
    if (isAndroid() && typeof window !== "undefined") {
      try { const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)(); await ctx.resume() } catch { /* non-fatal */ }
    }

    try {
      const resp = await fetch(
        `/api/asistan/signed-url?specialty=${persona.primarySpecialty}&persona=${persona.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error || `Sunucu hatası: ${resp.status}`)
      }

      const body = await resp.json()
      if (!body.signed_url) throw new Error("Bağlantı adresi alınamadı")

      const doctor = doctorProfile || toAddressableUser(null)
      const p = PERSONAS[personaKey]
      const firstMessage = buildVoiceFirstMessage(p, doctor)
      const voicePrompt = buildVoiceSystemPrompt(p, doctor)

      // Try personalized first_message (enabled on agents); auto-fallback without it.
      await startConversationWithoutFirstMessage(
        body.signed_url as string,
        voicePrompt,
        firstMessage,
        body.voice_id || p.voiceId,
        { tryFirstMessage: true }
      )
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      setErrorMsg(
        raw.includes("denied") || raw.includes("NotAllowed") || raw.includes("Permission")
          ? micPermissionHelp()
          : connectionErrorHelp(raw)
      )
      setStatus("error")
      conversationRef.current = null
    }
  }

  async function startConversationWithoutFirstMessage(
    signedUrl: string,
    voicePrompt: string,
    firstMessage: string,
    voiceId: string,
    opts?: { tryFirstMessage?: boolean }
  ) {
    const tryFirst = Boolean(opts?.tryFirstMessage)
    let usedFirstMessage = tryFirst
    let retriedWithoutFirst = false

    const begin = async (includeFirstMessage: boolean) => {
      usedFirstMessage = includeFirstMessage
      setStatus("connecting")
      const conversation = await Conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: voicePrompt },
            language: "tr",
            ...(includeFirstMessage ? { firstMessage } : {}),
          },
          tts: { voiceId },
        },
        onConnect: () => {
          setStatus("listening")
          setErrorMsg("")
          addMsg("ai", firstMessage)
        },
        onDisconnect: (details) => {
          conversationRef.current = null
          if (details.reason === "error") {
            const msg = details.message || ""
            if (usedFirstMessage && !retriedWithoutFirst && /first_message|Override for field/i.test(msg)) {
              retriedWithoutFirst = true
              void begin(false)
              return
            }
            setErrorMsg(connectionErrorHelp(msg))
            setStatus("error")
          } else {
            setStatus("idle")
          }
        },
        onError: (message) => {
          if (usedFirstMessage && !retriedWithoutFirst && /first_message|Override for field/i.test(message || "")) {
            retriedWithoutFirst = true
            void begin(false)
            return
          }
          setErrorMsg(connectionErrorHelp(message))
          setStatus("error")
        },
        onMessage: ({ message, role }) => {
          addMsg(role === "user" ? "user" : "ai", message)
        },
        onModeChange: ({ mode }) => {
          setStatus(mode === "speaking" ? "speaking" : "listening")
        },
        onStatusChange: ({ status: sdkStatus }) => {
          if (sdkStatus === "connecting") setStatus("connecting")
          if (sdkStatus === "connected") setStatus("listening")
        },
      })
      conversationRef.current = conversation
    }

    try {
      // Default path omits first_message so talk never depends on agent override flags.
      // When tryFirstMessage is set, attempt personalized greeting then fall back.
      await begin(tryFirst ? true : false)
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      if (tryFirst && /first_message|Override for field/i.test(raw) && !retriedWithoutFirst) {
        retriedWithoutFirst = true
        try {
          await begin(false)
          return
        } catch (e2: unknown) {
          setErrorMsg(connectionErrorHelp(e2 instanceof Error ? e2.message : String(e2)))
          setStatus("error")
          conversationRef.current = null
          return
        }
      }
      setErrorMsg(connectionErrorHelp(raw))
      setStatus("error")
      conversationRef.current = null
    }
  }

  async function stopConversation() {
    await endConversation()
  }

  function switchPersona(key: PersonaId) {
    void stopConversation()
    setPersonaKey(key)
    setPersona(PERSONAS[key])
    setMessages([])
    setErrorMsg("")
  }

  const isActive = ["connecting", "listening", "speaking"].includes(status)
  const statusLabel = {
    idle:       "Konuşmayı başlatmak için dokunun",
    connecting: "Bağlanıyor...",
    listening:  "Dinliyor — konuşabilirsiniz",
    speaking:   `${formatColleagueTabLabel(persona.name)} konuşuyor...`,
    error:      "Tekrar deneyin",
  }[status]

  return (
    <div style={{ height: "100dvh", minHeight: 0, background: "#080F1A", display: "flex", flexDirection: isMobile ? "column" : "row",
                  fontFamily: "system-ui,sans-serif", overflow: "hidden", userSelect: "none" }}>

      {!isMobile && persona.photo && (
        <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,.08)", background: "#0A1525", padding: "40px 28px", gap: "20px" }}>
          <img src={persona.photo} alt={persona.name} style={{ width: "200px", height: "200px", borderRadius: "50%", objectFit: "cover", border: "3px solid " + persona.color + "CC", boxShadow: "0 0 60px " + persona.color + "44" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,.5)", marginBottom: "16px" }}>{persona.title}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: status === "speaking" ? "#10B981" : status === "listening" ? "#3B82F6" : "#6B7280" }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,.4)" }}>{statusLabel}</span>
            </div>
          </div>
        </div>
      )}
      {/* chat col */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <div style={{ padding: "12px 16px", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))", borderBottom: "1px solid rgba(255,255,255,.08)", background: "#0A1525", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div onClick={() => { void stopConversation(); router.push("/dashboard/doktor") }}
            style={{ color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: "24px", padding: "6px 8px", flexShrink: 0, lineHeight: 1 }}>‹</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", lineHeight: 1.35, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,.45)", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{persona.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "2px" }}>
          {PERSONA_ORDER.map((key) => {
            const p = PERSONAS[key]
            if (!p) return null
            const active = personaKey === key
            const branş = SPECIALTY_MAP[p.primarySpecialty]?.label || p.primarySpecialty
            return (
              <button key={key} type="button" onClick={() => switchPersona(key)}
                title={`${p.name} — ${branş}`}
                style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "11px", cursor: "pointer",
                         fontWeight: active ? 700 : 500, flexShrink: 0, whiteSpace: "nowrap",
                         background: active ? p.color : "rgba(255,255,255,.08)",
                         color: active ? "#fff" : "rgba(255,255,255,.55)",
                         border: `1px solid ${active ? p.color : "rgba(255,255,255,.12)"}` }}>
                {p.shortName} · {branş}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && status === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: "12px" }}>
            <div style={{ width: 128, height: 128, borderRadius: '50%',
                          background: '#060C18',
                          border: '3px solid ' + persona.color + 'CC',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          fontSize: '30px', fontWeight: 700, color: persona.color,
                          boxShadow: '0 0 48px ' + persona.color + '55' }}>
              {persona.photo
                ? <img src={persona.photo} alt={persona.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                : persona.shortName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>{formatColleagueTabLabel(persona.name)}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,.4)" }}>{persona.title}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,.25)", marginTop: "8px",
                          textAlign: "center", maxWidth: "260px", lineHeight: "1.6" }}>
              1:1 sesli görüşme — doğal konuşun
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end", gap: "8px" }}>
            {msg.role === "ai" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px", flexShrink: 0 }}>{persona.shortName.slice(0, 1)}</div>
            )}
            <div style={{ maxWidth: "78%", padding: "10px 14px", fontSize: "14px", lineHeight: "1.55",
                          borderRadius: msg.role === "user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                          background: msg.role === "user" ? "#006699" : "#1A2B40", color: "#fff" }}>
              {msg.text}
            </div>
          </div>
        ))}
        {status === "connecting" && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: persona.color,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              {persona.shortName.slice(0, 1)}
            </div>
            <div style={{ padding: "12px 16px", background: "#1A2B40", borderRadius: "16px 16px 16px 3px",
                          display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%",
                                      background: "rgba(255,255,255,.4)",
                                      animation: `bounce 1.2s ease-in-out ${i * .2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "12px", borderTop: "1px solid rgba(255,255,255,.06)",
                    background: "#0A1525" }}>
        {errorMsg && (
          <div style={{ fontSize: "13px", color: "#FEE2E2", background: "#7F1D1D",
                        border: "1px solid #FCA5A5", padding: "12px 16px", borderRadius: "10px",
                        textAlign: "center", maxWidth: "340px", lineHeight: "1.5",
                        fontWeight: 500 }}>{errorMsg}</div>
        )}
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,.45)",
                      display: "flex", alignItems: "center", gap: "8px" }}>
          {isActive && (
            <div style={{ width: "7px", height: "7px", borderRadius: "50%",
                          background: status === "speaking" ? persona.color
                            : status === "connecting" ? "#F59E0B" : "#22C55E",
                          boxShadow: `0 0 8px ${status === "speaking" ? persona.color : "#22C55E"}` }} />
          )}
          {statusLabel}
        </div>
        <div onClick={isActive ? () => void stopConversation() : () => void startConversation()}
          style={{ width: "80px", height: "80px", borderRadius: "50%", cursor: "pointer",
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
                   background: isActive
                     ? `radial-gradient(circle,${persona.color},${persona.color}88)`
                     : "rgba(255,255,255,.1)",
                   border: `2px solid ${isActive ? persona.color : "rgba(255,255,255,.2)"}`,
                   boxShadow: isActive ? `0 0 32px ${persona.color}55` : "none",
                   transition: "all .25s" }}>
          {status === 'idle' || status === 'error' ? (
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.7)' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='9' y='2' width='6' height='11' rx='3'/>
              <path d='M5 10a7 7 0 0 0 14 0'/>
              <line x1='12' y1='21' x2='12' y2='17'/>
              <line x1='8' y1='21' x2='16' y2='21'/>
            </svg>
          ) : status === 'speaking' ? (
            <svg width='28' height='28' viewBox='0 0 30 24'>
              <rect x='1' y='9' width='4' height='6' rx='2' fill='white' style={{animation:'wave1 0.7s ease-in-out infinite'}}/>
              <rect x='8' y='5' width='4' height='14' rx='2' fill='white' style={{animation:'wave2 0.7s ease-in-out 0.1s infinite'}}/>
              <rect x='15' y='3' width='4' height='18' rx='2' fill='white' style={{animation:'wave1 0.7s ease-in-out 0.2s infinite'}}/>
              <rect x='22' y='6' width='4' height='12' rx='2' fill='white' style={{animation:'wave2 0.7s ease-in-out 0.15s infinite'}}/>
            </svg>
          ) : status === 'connecting' ? (
            <div style={{width:26,height:26,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.15)',borderTopColor:'#F59E0B',animation:'spin 0.8s linear infinite'}}/>
          ) : (
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.85)' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='9' y='2' width='6' height='11' rx='3'/>
              <path d='M5 10a7 7 0 0 0 14 0'/>
              <line x1='12' y1='21' x2='12' y2='17'/>
              <line x1='8' y1='21' x2='16' y2='21'/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.2)" }}>
          {isActive ? "Bitirmek için dokunun" : "Konuşmayı başlatmak için dokunun"}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wave1{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}@keyframes wave2{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.4)}}`}</style>
    </div>
      </div>
  )
}
