"use client"

import type { SandboxChartBundle } from "@/lib/sandbox/api"

type Props = { bundle: SandboxChartBundle }

function riskColor(level?: string) {
  if (level === "urgent" || level === "high") return "#EF4444"
  if (level === "moderate") return "#F59E0B"
  return "#22C55E"
}

export default function DoctorChartView({ bundle }: Props) {
  const { appointment, interview, chart } = bundle
  const ddx = (chart?.differential_diagnosis as Array<Record<string, string>>) || []
  const workup = (chart?.suggested_workup as Array<Record<string, string>>) || []
  const treatments = (chart?.treatment_options as Array<Record<string, string>>) || []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={h3}>{appointment.patient_name}</h3>
            <p style={muted}>
              {new Date(appointment.appointment_time).toLocaleString("tr-TR")}
              {appointment.chief_complaint_seed ? ` — ${appointment.chief_complaint_seed}` : ""}
            </p>
          </div>
          <span style={{
            padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: `${riskColor(chart?.risk_level as string)}22`,
            color: riskColor(chart?.risk_level as string),
          }}>
            {(chart?.risk_level as string || "low").toUpperCase()}
          </span>
        </div>
      </div>

      <Section title="Ana Şikayet" content={(interview?.chief_complaint as string) || appointment.chief_complaint_seed || "—"} />
      <Section title="HPI (Öykü)" content={(interview?.hpi as string) || "—"} />
      <Section title="Geçmiş Öykü" content={(interview?.past_history as string) || "—"} />
      <Section title="Alerjiler" content={(interview?.allergies as string) || "—"} />

      <div style={card}>
        <h4 style={h4}>Diferansiyel Tanı</h4>
        {ddx.length === 0 ? <p style={muted}>Henüz oluşturulmadı</p> : ddx.map((d, i) => (
          <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ color: "#fff", fontWeight: 600 }}>{d.diagnosis}</div>
            <div style={muted}>{d.probability} — {d.rationale}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h4 style={h4}>Önerilen Tetkikler</h4>
        {workup.length === 0 ? <p style={muted}>—</p> : workup.map((w, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <span style={{ color: "#fff" }}>{w.test}</span>
            <span style={muted}> — {w.reason}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <h4 style={h4}>Tedavi Önerileri</h4>
        {treatments.length === 0 ? <p style={muted}>—</p> : treatments.map((t, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <span style={{ color: "#fff" }}>{t.option}</span>
            <span style={muted}> — {t.notes}</span>
          </div>
        ))}
      </div>

      {chart?.dr_ayse_notes && (
        <div style={{ ...card, borderLeft: "3px solid #0F9B8E" }}>
          <h4 style={h4}>Dr. Ayşe Notu (Gökhan Hocam)</h4>
          <p style={{ color: "rgba(255,255,255,.85)", lineHeight: 1.6, fontSize: 14 }}>{chart.dr_ayse_notes as string}</p>
        </div>
      )}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div style={card}>
      <h4 style={h4}>{title}</h4>
      <p style={{ color: "rgba(255,255,255,.85)", lineHeight: 1.6, fontSize: 14, whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  )
}

const card: React.CSSProperties = {
  background: "#1A2B40",
  borderRadius: 12,
  padding: 16,
  border: "1px solid rgba(255,255,255,.06)",
}

const h3: React.CSSProperties = { color: "#fff", margin: 0, fontSize: 18 }
const h4: React.CSSProperties = { color: "#0F9B8E", margin: "0 0 8px", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }
const muted: React.CSSProperties = { color: "rgba(255,255,255,.45)", fontSize: 13, margin: "4px 0 0" }
