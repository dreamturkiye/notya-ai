'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSandboxToken, sandboxFetch, SANDBOX_THEME } from '@/lib/sandbox/client'

type Appointment = {
  id: string
  patient_name: string
  appointment_time: string
  chief_complaint_seed: string | null
  status: string
}

type ChartSummary = {
  risk_level?: string
  dr_ayse_notes?: string
  differential_diagnosis?: Array<{ diagnosis: string; probability: string }>
}

export default function DoctorPageInner() {
  const token = useSandboxToken()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [morningBrief, setMorningBrief] = useState('')
  const [charts, setCharts] = useState<Record<string, ChartSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        const resp = await sandboxFetch(
          '/api/sandbox/appointments?include_brief=true',
          token
        )
        const json = await resp.json()
        if (!json.success) throw new Error(json.error)
        setAppointments(json.data || [])
        setMorningBrief(json.morning_brief || '')

        const chartMap: Record<string, ChartSummary> = {}
        for (const appt of json.data || []) {
          const cResp = await sandboxFetch(`/api/sandbox/chart/${appt.id}`, token)
          const cJson = await cResp.json()
          if (cJson.success && cJson.data.chart) {
            chartMap[appt.id] = cJson.data.chart
          }
        }
        setCharts(chartMap)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  if (!token) {
    return (
      <div style={pageStyle}>
        <p style={{ color: SANDBOX_THEME.muted }}>?token=XXX gerekli</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: SANDBOX_THEME.muted }}>Gökhan Hocam — Sabah Brifingi</div>
        <h1 style={{ margin: '8px 0', fontSize: 22 }}>Dr. Ayşe Dashboard</h1>
        <Link href={`/sandbox/dr-ayse/test?token=${encodeURIComponent(token)}`} style={{ color: SANDBOX_THEME.accent, fontSize: 13 }}>
          ← Test sayfası
        </Link>
      </header>

      {loading && <p style={{ color: SANDBOX_THEME.muted }}>Yükleniyor...</p>}
      {error && <p style={{ color: '#F87171' }}>{error}</p>}

      {morningBrief && (
        <section style={cardStyle}>
          <h2 style={h2Style}>🌅 Sabah Brifingi</h2>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{morningBrief}</div>
        </section>
      )}

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h2 style={h2Style}>Bugünkü Randevular ({appointments.length})</h2>
        {appointments.length === 0 && (
          <p style={{ color: SANDBOX_THEME.muted, fontSize: 14 }}>Bugün sandbox randevusu yok.</p>
        )}
        {appointments.map((appt) => {
          const chart = charts[appt.id]
          const time = new Date(appt.appointment_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={appt.id} style={{ borderTop: `1px solid ${SANDBOX_THEME.border}`, paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{appt.patient_name}</div>
                  <div style={{ fontSize: 13, color: SANDBOX_THEME.muted }}>{time} — {appt.chief_complaint_seed || '—'}</div>
                </div>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: appt.status === 'chart_ready' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                  color: appt.status === 'chart_ready' ? '#22C55E' : '#F59E0B',
                }}>
                  {appt.status}
                </span>
              </div>
              {chart && (
                <div style={{ marginTop: 8, fontSize: 13, color: SANDBOX_THEME.muted }}>
                  Risk: <strong style={{ color: riskColor(chart.risk_level) }}>{chart.risk_level}</strong>
                  {chart.differential_diagnosis?.[0] && (
                    <span> · DDx: {chart.differential_diagnosis[0].diagnosis}</span>
                  )}
                </div>
              )}
              <Link
                href={`/sandbox/dr-ayse/patient?token=${encodeURIComponent(token)}&appointment_id=${appt.id}`}
                style={{ fontSize: 12, color: SANDBOX_THEME.accentAlt, display: 'inline-block', marginTop: 6 }}
              >
                Chart detay →
              </Link>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function riskColor(level?: string): string {
  if (level === 'urgent' || level === 'high') return '#F87171'
  if (level === 'moderate') return '#F59E0B'
  return '#22C55E'
}

const pageStyle: CSSProperties = {
  minHeight: '100dvh',
  background: SANDBOX_THEME.bg,
  color: SANDBOX_THEME.text,
  padding: '24px 20px 48px',
  fontFamily: 'system-ui, sans-serif',
  maxWidth: 640,
  margin: '0 auto',
}

const cardStyle: CSSProperties = {
  background: SANDBOX_THEME.panel,
  borderRadius: 12,
  padding: 20,
  border: `1px solid ${SANDBOX_THEME.border}`,
}

const h2Style: CSSProperties = { margin: '0 0 12px', fontSize: 16 }
