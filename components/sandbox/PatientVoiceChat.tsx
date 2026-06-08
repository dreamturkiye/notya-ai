"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  completeInterview,
  fetchAppointment,
  sendInterviewMessage,
  startInterview,
  type SandboxAppointment,
} from "@/lib/sandbox/api"
import { unlockAudioSession, playBase64Mp3, isAndroid } from "@/lib/sandbox/audio"
import {
  createSpeechRecognizer,
  ensureMicrophonePermission,
  type SpeechController,
} from "@/lib/sandbox/speech"
import {
  formatCountdownToAppointment,
  getInterviewWindow,
} from "@/lib/sandbox/interview-window"

type Phase = "loading" | "welcome" | "connecting" | "listening" | "speaking" | "done" | "blocked"
type Message = { role: "patient" | "dr_ayse"; text: string }

type Props = {
  token: string
  appointmentId: string
  onComplete?: () => void
}

export default function PatientVoiceChat({ token, appointmentId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [appointment, setAppointment] = useState<SandboxAppointment | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState("")
  const [statusHint, setStatusHint] = useState("Konuşmayı başlatmak için dokunun")
  const [exchangeCount, setExchangeCount] = useState(0)
  const [inputFallback, setInputFallback] = useState("")
  const speechRef = useRef<(SpeechController & { start?: () => void }) | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    fetchAppointment(token, appointmentId)
      .then((appt) => {
        setAppointment(appt)
        const window = getInterviewWindow(appt.appointment_time)
        if (!window.allowed) {
          setPhase("blocked")
          setError(window.reason)
          return
        }
        setPhase("welcome")
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Randevu yüklenemedi")
        setPhase("blocked")
      })
  }, [token, appointmentId])

  const stopListening = useCallback(() => {
    speechRef.current?.stop()
    speechRef.current = null
  }, [])

  const sendPatientText = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busyRef.current) return
    busyRef.current = true
    stopListening()
    setPhase("speaking")
    setStatusHint("Dr. Ayşe yanıtlıyor...")
    setMessages((prev) => [...prev, { role: "patient", text: trimmed }])
    setError("")

    try {
      const { data } = await sendInterviewMessage(token, appointmentId, trimmed)
      setMessages((prev) => [...prev, { role: "dr_ayse", text: data.reply }])
      setExchangeCount(data.exchange_count)
      await playBase64Mp3(data.audio_base64)

      if (data.should_complete) {
        setPhase("connecting")
        setStatusHint("Özet hazırlanıyor...")
        await completeInterview(token, appointmentId)
        setPhase("done")
        onComplete?.()
        return
      }

      setPhase("listening")
      setStatusHint("Dinliyor — konuşabilirsiniz")
      speechRef.current?.start?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yanıt alınamadı")
      setPhase("listening")
      setStatusHint("Tekrar deneyin")
      speechRef.current?.start?.()
    } finally {
      busyRef.current = false
    }
  }, [token, appointmentId, onComplete, stopListening])

  const startVoiceSession = useCallback(async () => {
    setError("")
    setPhase("connecting")
    setStatusHint("Bağlanıyor...")

    try {
      // MUST run inside tap — unlock audio before any await (Android + iOS)
      await unlockAudioSession()

      const micOk = await ensureMicrophonePermission()
      if (!micOk) {
        throw new Error(
          isAndroid()
            ? "Mikrofon izni gerekli. Chrome → Site ayarları → Mikrofon → İzin ver."
            : "Mikrofon izni reddedildi."
        )
      }

      const { data } = await startInterview(token, appointmentId)
      setMessages([{ role: "dr_ayse", text: data.welcome_message }])
      await playBase64Mp3(data.audio_base64)

      const rec = createSpeechRecognizer({
        onResult: (text) => sendPatientText(text),
        onError: (msg) => setError(msg),
        onListeningChange: (on) => {
          if (!busyRef.current && on) setStatusHint("Dinliyor — konuşabilirsiniz")
        },
      })

      if (!rec) {
        setError("Ses tanıma desteklenmiyor — alttan yazarak devam edebilirsiniz.")
        setPhase("listening")
        setStatusHint("Yazarak yanıtlayın")
        return
      }

      speechRef.current = rec
      setPhase("listening")
      setStatusHint("Dinliyor — konuşabilirsiniz")
      rec.start?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bağlantı kurulamadı"
      setError(`Bağlantı kurulamadı. ${msg}`)
      setPhase("welcome")
      setStatusHint("Tekrar deneyin")
    }
  }, [token, appointmentId, sendPatientText])

  useEffect(() => () => stopListening(), [stopListening])

  if (phase === "loading") {
    return <Centered>Randevu bilgileri yükleniyor...</Centered>
  }

  if (phase === "blocked") {
    return (
      <Centered>
        <p style={{ color: "#F87171", lineHeight: 1.6 }}>{error}</p>
      </Centered>
    )
  }

  if (phase === "welcome" && appointment) {
    const countdown = formatCountdownToAppointment(appointment.appointment_time)
    return (
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👩‍⚕️</div>
        <h2 style={{ color: "#fff", fontSize: 20, margin: "0 0 4px" }}>Dr. Ayşe</h2>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginBottom: 20 }}>
          Dr. Gökhan Hocam&apos;ın yapay zeka asistanı
        </p>

        <div style={{
          background: "#1A2B40", borderRadius: 12, padding: 16, textAlign: "left",
          marginBottom: 20, border: "1px solid rgba(255,255,255,.08)",
        }}>
          <Row label="Hasta" value={appointment.patient_name} />
          {appointment.patient_age != null && (
            <Row label="Yaş" value={String(appointment.patient_age)} />
          )}
          {appointment.patient_gender && (
            <Row label="Cinsiyet" value={appointment.patient_gender === "female" ? "Kadın" : "Erkek"} />
          )}
          <Row
            label="Randevu"
            value={new Date(appointment.appointment_time).toLocaleString("tr-TR")}
          />
          <Row label="Kalan süre" value={countdown} />
          {appointment.chief_complaint_seed && (
            <Row label="Başvuru" value={appointment.chief_complaint_seed} />
          )}
        </div>

        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Merhaba {appointment.patient_name.split(" ")[0]} Bey/Hanım. Randevunuzdan önce birkaç
          dakikalık sesli görüşme yapacağız. Bilgileriniz Dr. Gökhan Hocam ile paylaşılacak.
        </p>

        {error && (
          <div style={{
            background: "#EF444433", color: "#FCA5A5", padding: 12, borderRadius: 10,
            marginBottom: 16, fontSize: 13, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <MicButton onClick={startVoiceSession} active={false} />
        <p style={{ color: "rgba(255,255,255,.35)", fontSize: 13, marginTop: 12 }}>
          Konuşmayı başlatmak için dokunun
        </p>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <Centered>
        <div style={{ fontSize: 40 }}>✅</div>
        <p style={{ color: "#fff", marginTop: 12, lineHeight: 1.6 }}>
          Teşekkürler! Bilgilerinizi Dr. Gökhan Hocam ile paylaştım.
        </p>
      </Centered>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 480 }}>
      {appointment && (
        <div style={{
          padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.06)",
          fontSize: 12, color: "rgba(255,255,255,.5)",
        }}>
          {appointment.patient_name} · {appointment.chief_complaint_seed || "Ön görüşme"}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "patient" ? "flex-end" : "flex-start",
            maxWidth: "88%", padding: "10px 14px", fontSize: 14, lineHeight: 1.5, color: "#fff",
            borderRadius: m.role === "patient" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: m.role === "patient" ? "#006699" : "#1A2B40",
          }}>
            {m.text}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          margin: "0 12px", padding: 10, borderRadius: 10, background: "#EF444433",
          color: "#FCA5A5", fontSize: 12, lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <div style={{
        padding: "20px 16px 32px", display: "flex", flexDirection: "column", alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,.06)",
      }}>
        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, marginBottom: 16 }}>{statusHint}</p>
        <MicButton
          onClick={() => {
            if (phase === "listening") stopListening()
            else if (!busyRef.current) speechRef.current?.start?.()
          }}
          active={phase === "listening" || phase === "connecting"}
        />
        {(phase === "listening" || error) && (
          <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 16 }}>
            <input
              value={inputFallback}
              onChange={(e) => setInputFallback(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendPatientText(inputFallback).then(() => setInputFallback(""))}
              placeholder="Yazarak yanıtla (Android yedek)"
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,.15)", background: "#0A1525", color: "#fff", fontSize: 14,
              }}
            />
            <button
              onClick={() => { sendPatientText(inputFallback); setInputFallback("") }}
              style={{
                padding: "10px 14px", borderRadius: 10, border: "none",
                background: "#0F9B8E", color: "#fff", cursor: "pointer",
              }}
            >
              Gönder
            </button>
          </div>
        )}
        {exchangeCount >= 6 && phase === "listening" && (
          <button
            onClick={async () => {
              stopListening()
              busyRef.current = true
              try {
                await completeInterview(token, appointmentId)
                setPhase("done")
                onComplete?.()
              } catch (e) {
                setError(e instanceof Error ? e.message : "Tamamlanamadı")
              } finally {
                busyRef.current = false
              }
            }}
            style={{
              marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "none",
              background: "#7C3AED", color: "#fff", cursor: "pointer", fontSize: 13,
            }}
          >
            Görüşmeyi Bitir
          </button>
        )}
      </div>
    </div>
  )
}

function MicButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 88, height: 88, borderRadius: "50%", border: "none", cursor: "pointer",
        fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center",
        background: active
          ? "radial-gradient(circle, #0F9B8E, #006699)"
          : "rgba(255,255,255,.1)",
        boxShadow: active ? "0 0 28px #0F9B8E55" : "none",
      }}
    >
      🎙️
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "rgba(255,255,255,.45)" }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 500, textAlign: "right", maxWidth: "65%" }}>{value}</span>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.5)" }}>
      {children}
    </div>
  )
}
