"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import DoctorChartView from "@/components/sandbox/DoctorChartView"
import {
  fetchChart,
  fetchTodayAppointments,
  type SandboxAppointment,
  type SandboxChartBundle,
} from "@/lib/sandbox/api"

function DoctorPageInner() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [appointments, setAppointments] = useState<SandboxAppointment[]>([])
  const [brief, setBrief] = useState<string | null>(null)
  const [selected, setSelected] = useState<SandboxChartBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    fetchTodayAppointments(token, true)
      .then(({ data, morning_brief }) => {
        setAppointments(data)
        setBrief(morning_brief)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const openChart = async (id: string) => {
    setLoading(true)
    try {
      const bundle = await fetchChart(token, id)
      setSelected(bundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chart yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <div style={{ padding: 40, textAlign: "center", color: "#F87171" }}>Token gerekli</div>
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 48px" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#0F9B8E", fontWeight: 700 }}>SANDBOX · DOKTOR</div>
        <h1 style={{ fontSize: 24, margin: "4px 0" }}>Günaydın Hocam 🏥</h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>Dr. Ayşe sabah brifinginiz</p>
      </header>

      {error && <p style={{ color: "#F87171", marginBottom: 16 }}>{error}</p>}

      {brief && (
        <div style={{
          background: "#1A2B40", borderRadius: 12, padding: 16, marginBottom: 20,
          borderLeft: "3px solid #0F9B8E", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14,
        }}>
          {brief}
        </div>
      )}

      {loading && !selected && <p style={{ color: "rgba(255,255,255,.4)" }}>Yükleniyor...</p>}

      {!selected && appointments.map((a) => (
        <div key={a.id} style={{
          background: "#0A1525", borderRadius: 12, padding: 16, marginBottom: 12,
          border: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 600 }}>
              {new Date(a.appointment_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              {" — "}{a.patient_name}
            </div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, marginTop: 4 }}>
              📋 {a.chief_complaint_seed || "Şikayet belirtilmedi"} — {a.status}
            </div>
          </div>
          <button onClick={() => openChart(a.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#0F9B8E", color: "#fff", cursor: "pointer", fontSize: 13,
          }}>
            Detayları Gör
          </button>
        </div>
      ))}

      {appointments.length === 0 && !loading && (
        <p style={{ color: "rgba(255,255,255,.4)", textAlign: "center", padding: 32 }}>
          Bugün randevu yok. Test sayfasından oluşturun.
        </p>
      )}

      {selected && (
        <div>
          <button onClick={() => setSelected(null)} style={{
            marginBottom: 16, padding: "8px 14px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "#fff", cursor: "pointer",
          }}>
            ← Listeye dön
          </button>
          <DoctorChartView bundle={selected} />
        </div>
      )}
    </div>
  )
}

export default function DrAyseDoctorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Yükleniyor...</div>}>
      <DoctorPageInner />
    </Suspense>
  )
}
