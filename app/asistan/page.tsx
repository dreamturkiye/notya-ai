"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Conversation } from "@/components/AsistanConversation"
import { connectionErrorHelp, micPermissionHelp } from "@/lib/asistan/platform"
import { formatColleagueTabLabel } from "@/lib/colleagueAddress"
import { buildPersonaFirstMessage } from "@/lib/greetings"
import { toAddressableUser, type DoctorProfile } from "@/lib/userProfile"

type ConvStatus = "idle" | "connecting" | "listening" | "speaking" | "error"
type Message = { id: string; role: "user" | "ai"; text: string }
type Persona = {
  name: string
  fullName: string
  title: string
  emoji: string
  color: string
  specialty: string
  template: "pediatri" | "kardiyoloji" | "genel"
}

const PERSONAS: Record<string, Persona> = {
  aysekaya:    { fullName: "Prof. Dr. Ayşe Kaya",    name: "Prof. Ayşe Kaya",    title: "Pediatri Uzmanı",     emoji: "👩‍⚕️", color: "#0F9B8E", specialty: "pediatri",    template: "pediatri"    },
  mehmetdemir: { fullName: "Prof. Dr. Mehmet Demir",  name: "Prof. Mehmet Demir",  title: "Kardiyoloji Uzmanı",  emoji: "👨‍⚕️", color: "#006699", specialty: "kardiyoloji", template: "kardiyoloji" },
  elifsahin:   { fullName: "Prof. Dr. Elif Şahin",    name: "Prof. Elif Şahin",    title: "Nöroloji & Dahiliye", emoji: "👩‍⚕️", color: "#7C3AED", specialty: "genel",       template: "genel"       },
}

type ActiveConversation = Awaited<ReturnType<typeof Conversation.startSession>>

export default function AsistanPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<Persona>(PERSONAS.aysekaya)
  const [personaKey, setPersonaKey] = useState("aysekaya")
  const [status, setStatus] = useState<ConvStatus>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<ReturnType<typeof toAddressableUser> | null>(null)
  const conversationRef = useRef<ActiveConversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // auth via localStorage

  useEffect(() => {
    ;(async () => { const _r = localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||''); const session = _r ? JSON.parse(_r) : null;
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
    })()
    return () => { void endConversation() }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    // Android: unlock AudioContext on user gesture before any async work
    if (isAndroid() && typeof window !== "undefined") {
      try { const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)(); await ctx.resume() } catch { /* non-fatal */ }
    }

    try {
      const resp = await fetch(`/api/asistan/signed-url?specialty=${persona.specialty}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error || `Sunucu hatası: ${resp.status}`)
      }

      const body = await resp.json()
      if (!body.signed_url) throw new Error("Bağlantı adresi alınamadı")

      // ElevenLabs SDK: AudioWorklet + 3s Android AudioManager delay + iOS unlock listener
      const conversation = await Conversation.startSession({
        signedUrl: body.signed_url,
        connectionType: "websocket",
        onConnect: () => {
          setStatus("listening")
          setErrorMsg("")
          const p = PERSONAS[personaKey]
          const doctor = doctorProfile || toAddressableUser(null)
          addMsg("ai", buildPersonaFirstMessage(
            formatColleagueTabLabel(p.fullName),
            doctor,
            p.template
          ))
        },
        onDisconnect: (details) => {
          conversationRef.current = null
          if (details.reason === "error") {
            setErrorMsg(connectionErrorHelp(details.message))
            setStatus("error")
          } else {
            setStatus("idle")
          }
        },
        onError: (message) => {
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

  async function stopConversation() {
    await endConversation()
  }

  function switchPersona(key: string) {
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
    speaking:   `${formatColleagueTabLabel(persona.fullName)} konuşuyor...`,
    error:      "Tekrar deneyin",
  }[status]

  return (
    <div style={{ height: "100dvh", background: "#080F1A", display: "flex", flexDirection: "column",
                  fontFamily: "system-ui,sans-serif", overflow: "hidden", userSelect: "none" }}>

      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px",
                    borderBottom: "1px solid rgba(255,255,255,.08)", background: "#0A1525" }}>
        <div onClick={() => { void stopConversation(); router.push("/dashboard") }}
          style={{ color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: "24px", padding: "4px" }}>‹</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#fff", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatColleagueTabLabel(persona.fullName)}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,.4)" }}>{persona.title}</div>
        </div>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <div key={key} onClick={() => switchPersona(key)}
              style={{ padding: "5px 10px", borderRadius: "16px", fontSize: "11px", cursor: "pointer",
                       fontWeight: personaKey === key ? "700" : "400",
                       background: personaKey === key ? p.color : "rgba(255,255,255,.08)",
                       color: personaKey === key ? "#fff" : "rgba(255,255,255,.4)",
                       border: `1px solid ${personaKey === key ? p.color : "rgba(255,255,255,.1)"}` }}>
              {formatColleagueTabLabel(p.fullName)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && status === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: "12px", opacity: .4 }}>
            <div style={{ fontSize: "56px" }}>{persona.emoji}</div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>{formatColleagueTabLabel(persona.fullName)}</div>
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
                            fontSize: "14px", flexShrink: 0 }}>{persona.emoji}</div>
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
              {persona.emoji}
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

      <div style={{ padding: "16px 16px 44px", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "12px", borderTop: "1px solid rgba(255,255,255,.06)",
                    background: "#0A1525" }}>
        {errorMsg && (
          <div style={{ fontSize: "12px", color: "#F87171", background: "rgba(239,68,68,.12)",
                        padding: "10px 18px", borderRadius: "10px", textAlign: "center",
                        maxWidth: "320px", lineHeight: "1.5" }}>{errorMsg}</div>
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
          {status === "connecting" ? "⏳" : status === "speaking" ? "🔊" : "🎙️"}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,.2)" }}>
          {isActive ? "Bitirmek için dokunun" : "Konuşmayı başlatmak için dokunun"}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
