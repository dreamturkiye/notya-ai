"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import PatientInterview from "@/components/sandbox/PatientInterview"

function PatientPageInner() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const appointmentId = params.get("appointment_id") || ""

  if (!token || !appointmentId) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#F87171" }}>token ve appointment_id gerekli</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#0F9B8E", fontWeight: 700 }}>SANDBOX · HASTA</div>
      </header>
      <div style={{
        background: "#0A1525", borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", overflow: "hidden",
      }}>
        <PatientInterview token={token} appointmentId={appointmentId} />
      </div>
    </div>
  )
}

export default function DrAysePatientPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Yükleniyor...</div>}>
      <PatientPageInner />
    </Suspense>
  )
}
