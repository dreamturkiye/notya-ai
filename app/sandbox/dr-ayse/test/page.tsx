"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import PatientInterview from "@/components/sandbox/PatientInterview"
import DoctorChartView from "@/components/sandbox/DoctorChartView"
import {
  createAppointment,
  fetchChart,
  submitTestScores,
  type SandboxAppointment,
  type SandboxChartBundle,
} from "@/lib/sandbox/api"

const SCENARIOS = [
  { label: "Basit — Öksürük + ateş", complaint: "Öksürük ve ateş — 3 günlük" },
  { label: "Orta — Göğüs ağrısı", complaint: "Göğüs ağrısı — egzersizle artıyor" },
  { label: "Karmaşık — Yorgunluk + nefes darlığı", complaint: "Yorgunluk, nefes darlığı, bacaklarda şişlik" },
  { label: "Kronik — Diyabet takibi", complaint: "Diyabet kontrolü — 3 aylık takip" },
  { label: "Acil — Ani baş ağrısı", complaint: "Şiddetli baş ağrısı — ani başlangıç" },
]

const SCORE_SECTIONS = [
  { key: "chief_complaint", label: "Ana Şikayet Doğruluğu" },
  { key: "hpi", label: "HPI Kalitesi" },
  { key: "differential_diagnosis", label: "Diferansiyel Tanı" },
  { key: "treatment_suggestions", label: "Tedavi Önerileri" },
] as const

type Step = "setup" | "interview" | "doctor" | "score" | "done"

function TestPageInner() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [step, setStep] = useState<Step>("setup")
  const [patientName, setPatientName] = useState("Gökhan Mamur")
  const [complaint, setComplaint] = useState(SCENARIOS[1].complaint)
  const [appointment, setAppointment] = useState<SandboxAppointment | null>(null)
  const [chartBundle, setChartBundle] = useState<SandboxChartBundle | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({
    chief_complaint: 3, hpi: 3, differential_diagnosis: 3, treatment_suggestions: 3,
  })
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#F87171" }}>Token gerekli: ?token=dr-gokhan-beta-2026</p>
      </div>
    )
  }

  const createAndStart = async () => {
    setLoading(true)
    setError("")
    try {
      const appt = await createAppointment(token, {
        patient_name: patientName,
        chief_complaint_seed: complaint,
        appointment_time: new Date().toISOString(),
      })
      setAppointment(appt)
      setStep("interview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Randevu oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }

  const loadDoctorView = async () => {
    if (!appointment) return
    setLoading(true)
    setError("")
    try {
      const bundle = await fetchChart(token, appointment.id)
      setChartBundle(bundle)
      setStep("doctor")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chart yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const submitScores = async () => {
    if (!appointment) return
    setLoading(true)
    setError("")
    try {
      await submitTestScores(token, appointment.id, scores, feedback)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Puanlar kaydedilemedi")
    } finally {
      setLoading(false)
    }
  }

  const steps: Step[] = ["setup", "interview", "doctor", "score", "done"]
  const stepIdx = steps.indexOf(step)

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 48px" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#0F9B8E", fontWeight: 700, letterSpacing: 2 }}>SANDBOX · TEST</div>
        <h1 style={{ fontSize: 24, margin: "4px 0 8px" }}>Dr. Ayşe Pre-Vizit Testi</h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.5 }}>
          Hasta rolünde görüşün → doktor görünümünde chart&apos;ı inceleyin → bölüm puanlayın.
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {["Kurulum", "Görüşme", "Doktor", "Puan", "Bitti"].map((label, i) => (
            <div key={label} style={{
              flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: 8, fontSize: 11,
              background: i <= stepIdx ? "#0F9B8E33" : "rgba(255,255,255,.05)",
              color: i <= stepIdx ? "#0F9B8E" : "rgba(255,255,255,.3)",
              fontWeight: i === stepIdx ? 700 : 400,
            }}>{label}</div>
          ))}
        </div>
      </header>

      {error && (
        <div style={{ background: "#EF444422", color: "#F87171", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {step === "setup" && (
        <div style={panel}>
          <h2 style={h2}>1. Test Randevusu Oluştur</h2>
          <label style={label}>Hasta adı (siz oynayacaksınız)</label>
          <input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={input} />

          <label style={{ ...label, marginTop: 16 }}>Senaryo</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {SCENARIOS.map((s) => (
              <button key={s.label} onClick={() => setComplaint(s.complaint)} style={{
                textAlign: "left", padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                border: complaint === s.complaint ? "2px solid #0F9B8E" : "1px solid rgba(255,255,255,.1)",
                background: complaint === s.complaint ? "#0F9B8E18" : "#0A1525",
                color: "#fff", fontSize: 13,
              }}>
                <strong>{s.label}</strong><br />
                <span style={{ color: "rgba(255,255,255,.5)" }}>{s.complaint}</span>
              </button>
            ))}
          </div>

          <button onClick={createAndStart} disabled={loading || !patientName.trim()} style={btnPrimary}>
            {loading ? "Oluşturuluyor..." : "Randevu Oluştur ve Görüşmeye Geç"}
          </button>
        </div>
      )}

      {step === "interview" && appointment && (
        <div style={panel}>
          <h2 style={h2}>2. Hasta Görüşmesi — Dr. Ayşe ile konuşun</h2>
          <p style={muted}>Şikayet: {complaint}</p>
          <PatientInterview
            token={token}
            appointmentId={appointment.id}
            compact
            onComplete={() => loadDoctorView()}
          />
          <button onClick={loadDoctorView} style={{ ...btnSecondary, marginTop: 12 }}>
            Görüşmeyi atla → Doktor görünümü
          </button>
        </div>
      )}

      {step === "doctor" && chartBundle && (
        <div>
          <div style={{ ...panel, marginBottom: 16 }}>
            <h2 style={h2}>3. Doktor Görünümü — Dr. Ayşe ne hazırladı?</h2>
            <p style={muted}>Gökhan Hocam, işte pre-vizit chart:</p>
          </div>
          <DoctorChartView bundle={chartBundle} />
          <button onClick={() => setStep("score")} style={{ ...btnPrimary, marginTop: 20, width: "100%" }}>
            Puanlamaya Geç
          </button>
        </div>
      )}

      {step === "score" && (
        <div style={panel}>
          <h2 style={h2}>4. Bölüm Puanları (1–5)</h2>
          {SCORE_SECTIONS.map((s) => (
            <div key={s.key} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#fff", fontSize: 14 }}>{s.label}</span>
                <span style={{ color: "#0F9B8E", fontWeight: 700 }}>{scores[s.key]}/5</span>
              </div>
              <input
                type="range" min={1} max={5} step={1}
                value={scores[s.key]}
                onChange={(e) => setScores((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
                style={{ width: "100%" }}
              />
              <textarea
                placeholder="Geri bildirim notu..."
                value={feedback[s.key] || ""}
                onChange={(e) => setFeedback((prev) => ({ ...prev, [s.key]: e.target.value }))}
                style={{ ...input, marginTop: 8, minHeight: 60, resize: "vertical" }}
              />
            </div>
          ))}
          <button onClick={submitScores} disabled={loading} style={btnPrimary}>
            {loading ? "Kaydediliyor..." : "Puanları Gönder"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div style={{ ...panel, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h2 style={h2}>Teşekkürler Hocam!</h2>
          <p style={muted}>Puanlarınız kaydedildi. Yeni senaryo için sayfayı yenileyin.</p>
          <button onClick={() => window.location.reload()} style={{ ...btnPrimary, marginTop: 16 }}>
            Yeni Test Başlat
          </button>
        </div>
      )}
    </div>
  )
}

export default function DrAyseTestPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.5)" }}>Yükleniyor...</div>}>
      <TestPageInner />
    </Suspense>
  )
}

const panel: React.CSSProperties = {
  background: "#0A1525",
  borderRadius: 16,
  padding: 20,
  border: "1px solid rgba(255,255,255,.08)",
}

const h2: React.CSSProperties = { fontSize: 18, margin: "0 0 12px", color: "#fff" }
const label: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 6 }
const muted: React.CSSProperties = { color: "rgba(255,255,255,.45)", fontSize: 13, marginBottom: 12 }
const input: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,.15)", background: "#080F1A", color: "#fff", fontSize: 14,
  boxSizing: "border-box",
}
const btnPrimary: React.CSSProperties = {
  padding: "14px 24px", borderRadius: 12, border: "none", width: "100%",
  background: "linear-gradient(135deg,#0F9B8E,#006699)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer",
}
const btnSecondary: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.2)",
  background: "transparent", color: "rgba(255,255,255,.7)", cursor: "pointer", width: "100%",
}
