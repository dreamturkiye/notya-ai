/** Gebe okulu — Dec 2024 regulation. Attendance, certificate, SB notification stub. */
export type GebeOkuluSession = { date: string; topic: string; attended: boolean }

export function certificateReady(sessions: GebeOkuluSession[], required = 4): boolean {
  return sessions.filter((s) => s.attended).length >= required
}

export function sbNotificationStub(mother_patient_id: string, ready: boolean) {
  return {
    form_id: 'gebe-okulu-bildirim',
    mother_patient_id,
    ready,
    regulation: 'Dec 2024',
    live_write: false,
  }
}
