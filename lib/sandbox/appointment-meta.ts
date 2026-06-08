import { getInterviewWindow } from './interview-window'

export type AppointmentRow = Record<string, unknown> & {
  appointment_time: string
}

export function enrichAppointment<T extends AppointmentRow>(row: T) {
  const window = getInterviewWindow(row.appointment_time)
  return {
    ...row,
    interview_opens_at: window.opensAt.toISOString(),
    interview_closes_at: window.closesAt.toISOString(),
    interview_allowed: window.allowed,
    interview_block_reason: window.allowed ? null : window.reason,
  }
}
