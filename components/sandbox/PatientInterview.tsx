"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  completeInterview,
  sendInterviewMessage,
  startInterview,
} from "@/lib/sandbox/api"
import { unlockAudioSession, playBase64Mp3 } from "@/lib/sandbox/audio"
import { createSpeechRecognizer, ensureMicrophonePermission } from "@/lib/sandbox/speech"

type Message = { role: "patient" | "dr_ayse"; text: string }

type Props = {
  token: string
  appointmentId: string
  onComplete?: () => void
  compact?: boolean
}

export default function PatientInterview({ token, appointmentId, onComplete, compact }: Props) {
  const [phase, setPhase] = useState<"welcome" | "active" | "done">("welcome")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [exchangeCount, setExchangeCount] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const beginInterview = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      await unlockAudioSession()
      await ensureMicrophonePermission()
      const { data } = await startInterview(token, appointmentId)
      setMessages([{ role: "dr_ayse", text: data.welcome_message }])
      await playBase64Mp3(data.audio_base64)
      setPhase("active")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı kurulamadı. Tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }, [token, appointmentId])

  const finishInterview = useCallback(async () => {
    setLoading(true)
    try {
      await completeInterview(token, appointmentId)
      setPhase("done")
      onComplete?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chart oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }, [token, appointmentId, onComplete])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput("")
    setMessages((prev) => [...prev, { role: "patient", text: trimmed }])
    setLoading(true)
    setError("")
    try {
      const { data } = await sendInterviewMessage(token, appointmentId, trimmed)
      setMessages((prev) => [...prev, { role: "dr_ayse", text: data.reply }])
      setExchangeCount(data.exchange_count)
      await playBase64Mp3(data.audio_base64)
      if (data.should_complete) {
        await finishInterview()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yanıt alınamadı")
    } finally {
      setLoading(false)
    }
  }, [token, appointmentId, loading, finishInterview])

  const toggleListen = async () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }
    await ensureMicrophonePermission()
    const rec = createSpeechRecognizer({
      onResult: (text) => sendMessage(text),
      onError: (msg) => setError(msg),
      onListeningChange: setListening,
    })
    if (!rec) {
      setError("Tarayıcınız ses tanımayı desteklemiyor — yazarak devam edin.")
      return
    }
    recognitionRef.current = rec
    ;(rec as { start?: () => void }).start?.()
  }

  if (phase === "welcome") {
    return (
      <div style={{ textAlign: "center", padding: compact ? "16px 0" : "32px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👩‍⚕️</div>
        <h2 style={{ color: "#fff", fontSize: 20, marginBottom: 8 }}>Dr. Ayşe</h2>
        <p style={{ color: "rgba(255,255,255,.6)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>
          Merhaba! Ben Dr. Ayşe, Dr. Gökhan Hocam&apos;ın yapay zeka asistanıyım.
          Randevunuzdan önce sizi biraz tanımak istiyorum.
        </p>
        <button
          onClick={beginInterview}
          disabled={loading}
          style={btnPrimary}
        >
          {loading ? "Hazırlanıyor..." : "Görüşmeyi Başlat"}
        </button>
        {error && <p style={{ color: "#F87171", marginTop: 12, fontSize: 13 }}>{error}</p>}
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <p style={{ color: "#fff", marginTop: 12, lineHeight: 1.6 }}>
          Teşekkürler! Bilgilerinizi Dr. Gökhan Hocam ile paylaştım.
          Görüşmenizde görüşmek üzere!
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: compact ? 420 : "60vh", minHeight: 320 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "patient" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "10px 14px",
            borderRadius: m.role === "patient" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: m.role === "patient" ? "#006699" : "#1A2B40",
            color: "#fff",
            fontSize: 14,
            lineHeight: 1.5,
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "rgba(255,255,255,.4)", fontSize: 13 }}>Dr. Ayşe düşünüyor...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p style={{ color: "#F87171", fontSize: 12, padding: "0 12px" }}>{error}</p>}

      <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Yanıtınızı yazın..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.15)",
            background: "#0A1525", color: "#fff", fontSize: 14,
          }}
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={btnSmall}>Gönder</button>
        <button onClick={toggleListen} style={{ ...btnSmall, background: listening ? "#0F9B8E" : "rgba(255,255,255,.1)" }}>
          {listening ? "⏹" : "🎙️"}
        </button>
        {exchangeCount >= 6 && (
          <button onClick={finishInterview} disabled={loading} style={{ ...btnSmall, background: "#7C3AED" }}>
            Bitir
          </button>
        )}
      </div>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: "14px 28px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#0F9B8E,#006699)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
}

const btnSmall: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "rgba(255,255,255,.12)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
}
