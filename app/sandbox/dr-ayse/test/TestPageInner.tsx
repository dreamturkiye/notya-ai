'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  useSandboxToken,
  sandboxFetch,
  SANDBOX_THEME,
  SCORE_SECTIONS,
} from '@/lib/sandbox/client'

type Appointment = {
  id: string
  patient_name: string
  appointment_time: string
  chief_complaint_seed: string | null
  status: string
}

type ChartData = {
  appointment: Appointment
  interview: {
    chief_complaint?: string
    hpi?: string
    transcript?: unknown[]
  } | null
  chart: {
    differential_diagnosis?: Array<{ diagnosis: string; probability: string; rationale: string }>
    suggested_workup?: Array<{ test: string; reason: string }>
    treatment_options?: Array<{ option: string; notes: string }>
    risk_level?: string
    dr_ayse_notes?: string
  } | null
}

type View = 'setup' | 'patient' | 'doctor' | 'score'

export default function TestPageInner() {
  const token = useSandboxToken()
  const [view, setView] = useState<View>('setup')
  const [patientName, setPatientName] = useState('Ahmet Yılmaz')
  const [complaint, setComplaint] = useState('3 gündür göğüs ağrısı')
  const [apptTime, setApptTime] = useState('')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({
    chief_complaint: 3,
    hpi: 3,
    differential_diagnosis: 3,
    treatment_suggestions: 3,
  })
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const d = new Date()
    d.setHours(d.getHours() + 2)
    setApptTime(d.toISOString().slice(0, 16))
  }, [])

  if (!token) {
    return (
      <div style={pageStyle}>
        <h1 style={{ color: SANDBOX_THEME.accent }}>Dr. Ayşe Sandbox</h1>
        <p style={{ color: SANDBOX_THEME.muted }}>Erişim tokeni gerekli: ?token=XXX</p>
      </div>
    )
  }

  async function createAppointment() {
    setLoading(true)
    setError('')
    try {
      const resp = await sandboxFetch('/api/sandbox/appointments', token, {
        method: 'POST',
        body: JSON.stringify({
          token,
          patient_name: patientName,
          chief_complaint_seed: complaint,
          appointment_time: new Date(apptTime).toISOString(),
        }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)
      setAppointment(json.data)
      setView('patient')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }

  async function loadChart() {
    if (!appointment) return
    setLoading(true)
    setError('')
    try {
      const resp = await sandboxFetch(
        `/api/sandbox/chart/${appointment.id}`,
        token
      )
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)
      setChartData(json.data)
      setView('doctor')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Chart yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function submitScores() {
    if (!appointment) return
    setLoading(true)
    setError('')
    try {
      const resp = await sandboxFetch('/api/sandbox/test/score', token, {
        method: 'POST',
        body: JSON.stringify({ token, appointment_id: appointment.id, scores, feedback }),
      })
      const json = await resp.json()
      if (!json.success) throw new Error(json.error)
      setSubmitted(true)
      setView('score')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: SANDBOX_THEME.muted, letterSpacing: 1 }}>SANDBOX · Dr. Gökhan Beta</div>
        <h1 style={{ margin: '8px 0', color: SANDBOX_THEME.text, fontSize: 24 }}>Dr. Ayşe Pre-Visit Test</h1>
        <p style={{ color: SANDBOX_THEME.muted, fontSize: 14, margin: 0 }}>
          Test randevusu oluştur → hasta görüşmesi → doktor brifingi → puanlama
        </p>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['setup', 'patient', 'doctor', 'score'] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              if (v === 'doctor' && appointment) loadChart()
              else if (v !== 'doctor' || chartData) setView(v)
            }}
            style={{
              ...btnStyle,
              background: view === v ? SANDBOX_THEME.accent : SANDBOX_THEME.card,
              opacity: v === 'setup' || appointment ? 1 : 0.4,
            }}
            disabled={v !== 'setup' && !appointment}
          >
            {v === 'setup' ? '1. Randevu' : v === 'patient' ? '2. Hasta' : v === 'doctor' ? '3. Doktor' : '4. Puan'}
          </button>
        ))}
      </nav>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {view === 'setup' && (
        <section style={cardStyle}>
          <h2 style={h2Style}>Test Randevusu Oluştur</h2>
          <label style={labelStyle}>Hasta Adı</label>
          <input style={inputStyle} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          <label style={labelStyle}>Şikayet</label>
          <input style={inputStyle} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          <label style={labelStyle}>Randevu Saati</label>
          <input style={inputStyle} type="datetime-local" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
          <button type="button" style={{ ...btnStyle, background: SANDBOX_THEME.accent, marginTop: 16 }} onClick={createAppointment} disabled={loading}>
            {loading ? 'Oluşturuluyor...' : 'Randevu Oluştur & Devam'}
          </button>
        </section>
      )}

      {view === 'patient' && appointment && (
        <section style={cardStyle}>
          <h2 style={h2Style}>Hasta Görüşmesi</h2>
          <p style={{ color: SANDBOX_THEME.muted, fontSize: 14 }}>
            {appointment.patient_name} — {appointment.chief_complaint_seed}
          </p>
          <p style={{ color: SANDBOX_THEME.muted, fontSize: 13 }}>
            Dr. Ayşe ile sesli görüşmeyi başlatın. Mikrofon izni gerekir.
          </p>
          <Link
            href={`/sandbox/dr-ayse/patient?token=${encodeURIComponent(token)}&appointment_id=${appointment.id}`}
            style={{ ...btnStyle, display: 'inline-block', background: SANDBOX_THEME.accentAlt, textDecoration: 'none', textAlign: 'center' }}
          >
            🎙️ Görüşmeyi Başlat
          </Link>
          <button type="button" style={{ ...btnStyle, background: SANDBOX_THEME.card, marginTop: 12 }} onClick={loadChart}>
            Görüşme bitti → Doktor görünümü
          </button>
        </section>
      )}

      {view === 'doctor' && chartData && (
        <section style={cardStyle}>
          <h2 style={h2Style}>Doktor Görünümü — Pre-Visit Chart</h2>
          <div style={{ fontSize: 13, color: SANDBOX_THEME.accent, marginBottom: 12 }}>
            Risk: {chartData.chart?.risk_level?.toUpperCase() || '—'}
          </div>

          <ChartBlock title="Chief Complaint" content={chartData.interview?.chief_complaint || chartData.appointment.chief_complaint_seed || '—'} />
          <ChartBlock title="HPI" content={chartData.interview?.hpi || '—'} />
          <ChartBlock
            title="Differential Diagnosis"
            content={
              chartData.chart?.differential_diagnosis?.map((d) => `• ${d.diagnosis} (${d.probability}): ${d.rationale}`).join('\n') || '—'
            }
          />
          <ChartBlock
            title="Treatment Suggestions"
            content={
              chartData.chart?.treatment_options?.map((t) => `• ${t.option}${t.notes ? ` — ${t.notes}` : ''}`).join('\n') || '—'
            }
          />
          {chartData.chart?.dr_ayse_notes && (
            <ChartBlock title="Dr. Ayşe Notları" content={chartData.chart.dr_ayse_notes} />
          )}

          <button type="button" style={{ ...btnStyle, background: SANDBOX_THEME.accent, marginTop: 16 }} onClick={() => setView('score')}>
            Puanlamaya Geç →
          </button>
        </section>
      )}

      {view === 'score' && (
        <section style={cardStyle}>
          <h2 style={h2Style}>Değerlendirme (1-5)</h2>
          {submitted && (
            <div style={{ color: '#22C55E', marginBottom: 12 }}>✓ Puanlar kaydedildi. Teşekkürler Hocam.</div>
          )}
          {SCORE_SECTIONS.map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: SANDBOX_THEME.text, fontWeight: 600 }}>{label}</span>
                <span style={{ color: SANDBOX_THEME.accent, fontSize: 18 }}>{scores[key]}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={scores[key]}
                onChange={(e) => setScores((s) => ({ ...s, [key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: SANDBOX_THEME.accent }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: SANDBOX_THEME.muted }}>
                <span>1 — Zayıf</span>
                <span>5 — Mükemmel</span>
              </div>
              <textarea
                placeholder="Geri bildirim notu..."
                value={feedback[key] || ''}
                onChange={(e) => setFeedback((f) => ({ ...f, [key]: e.target.value }))}
                style={{ ...inputStyle, minHeight: 60, marginTop: 8, resize: 'vertical' }}
              />
            </div>
          ))}
          <button type="button" style={{ ...btnStyle, background: SANDBOX_THEME.accent }} onClick={submitScores} disabled={loading || submitted}>
            {loading ? 'Gönderiliyor...' : 'Puanları Gönder'}
          </button>
        </section>
      )}
    </div>
  )
}

function ChartBlock({ title, content }: { title: string; content: string }) {
  return (
    <div style={{ background: SANDBOX_THEME.bg, borderRadius: 8, padding: 12, marginBottom: 12, border: `1px solid ${SANDBOX_THEME.border}` }}>
      <div style={{ fontSize: 11, color: SANDBOX_THEME.accent, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ color: SANDBOX_THEME.text, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  )
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

const h2Style: CSSProperties = { margin: '0 0 16px', fontSize: 18 }
const labelStyle: CSSProperties = { display: 'block', fontSize: 12, color: SANDBOX_THEME.muted, marginBottom: 4, marginTop: 12 }
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${SANDBOX_THEME.border}`,
  background: SANDBOX_THEME.card,
  color: SANDBOX_THEME.text,
  fontSize: 14,
  boxSizing: 'border-box',
}
const btnStyle: CSSProperties = {
  padding: '12px 20px',
  borderRadius: 10,
  border: 'none',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
}
