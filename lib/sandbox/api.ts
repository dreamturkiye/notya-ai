export type SandboxAppointment = {
  id: string
  doctor_id: string
  patient_name: string
  patient_phone?: string | null
  patient_age?: number | null
  patient_gender?: 'male' | 'female' | null
  appointment_time: string
  status: string
  chief_complaint_seed?: string | null
  created_at: string
  interview_opens_at?: string
  interview_closes_at?: string
  interview_allowed?: boolean
}

export type SandboxChartBundle = {
  appointment: SandboxAppointment
  interview: Record<string, unknown> | null
  chart: Record<string, unknown> | null
}

async function parseJson<T>(resp: Response): Promise<T> {
  const data = await resp.json()
  if (!resp.ok || !data.success) {
    throw new Error(data.error || `HTTP ${resp.status}`)
  }
  return data as T
}

export async function fetchAppointment(token: string, appointmentId: string): Promise<SandboxAppointment> {
  const resp = await fetch(
    `/api/sandbox/appointments?appointment_id=${encodeURIComponent(appointmentId)}&token=${encodeURIComponent(token)}`,
    { headers: { 'x-sandbox-token': token } }
  )
  const data = await parseJson<{ data: SandboxAppointment }>(resp)
  return data.data
}

export async function createAppointment(
  token: string,
  payload: {
    patient_name: string
    chief_complaint_seed: string
    appointment_time?: string
    patient_phone?: string
    patient_age?: number
    patient_gender?: 'male' | 'female'
  }
): Promise<SandboxAppointment> {
  const resp = await fetch('/api/sandbox/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sandbox-token': token },
    body: JSON.stringify({ ...payload, token }),
  })
  const data = await parseJson<{ data: SandboxAppointment }>(resp)
  return data.data
}

export async function startInterview(token: string, appointmentId: string) {
  const resp = await fetch('/api/sandbox/interview/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sandbox-token': token },
    body: JSON.stringify({ appointment_id: appointmentId, token }),
  })
  return parseJson<{ data: {
    welcome_message: string
    audio_base64: string | null
    patient_name: string
    chief_complaint_seed: string | null
  } }>(resp)
}

export async function sendInterviewMessage(token: string, appointmentId: string, message: string) {
  const resp = await fetch('/api/sandbox/interview/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sandbox-token': token },
    body: JSON.stringify({ appointment_id: appointmentId, message, token }),
  })
  return parseJson<{ data: {
    reply: string
    audio_base64: string | null
    should_complete: boolean
    exchange_count: number
  } }>(resp)
}

export async function completeInterview(token: string, appointmentId: string) {
  const resp = await fetch('/api/sandbox/interview/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sandbox-token': token },
    body: JSON.stringify({ appointment_id: appointmentId, token }),
  })
  return parseJson<{ data: Record<string, unknown> }>(resp)
}

export async function fetchChart(token: string, appointmentId: string): Promise<SandboxChartBundle> {
  const resp = await fetch(
    `/api/sandbox/chart/${appointmentId}?token=${encodeURIComponent(token)}`,
    { headers: { 'x-sandbox-token': token } }
  )
  const data = await parseJson<{ data: SandboxChartBundle }>(resp)
  return data.data
}

export async function fetchTodayAppointments(token: string, includeBrief = false) {
  const qs = new URLSearchParams({ token, include_brief: String(includeBrief) })
  const resp = await fetch(`/api/sandbox/appointments?${qs}`, {
    headers: { 'x-sandbox-token': token },
  })
  return parseJson<{ data: SandboxAppointment[]; morning_brief: string | null }>(resp)
}

export async function submitTestScores(
  token: string,
  appointmentId: string,
  scores: Record<string, number>,
  feedback: Record<string, string>
) {
  const resp = await fetch('/api/sandbox/test/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sandbox-token': token },
    body: JSON.stringify({ appointment_id: appointmentId, scores, feedback, token }),
  })
  return parseJson<{ data: Record<string, unknown> }>(resp)
}

export { playBase64Mp3 as playAudioBase64 } from './audio'
