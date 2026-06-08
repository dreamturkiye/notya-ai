/** Pre-visit interview opens 24h before appointment; stays open until 30min after slot. */
export const INTERVIEW_OPEN_HOURS_BEFORE = 24
export const INTERVIEW_CLOSE_MINUTES_AFTER = 30

export type InterviewWindowStatus =
  | { allowed: true; opensAt: Date; closesAt: Date }
  | { allowed: false; reason: string; opensAt: Date; closesAt: Date }

export function getInterviewWindow(appointmentTimeIso: string): InterviewWindowStatus {
  const appointmentTime = new Date(appointmentTimeIso)
  if (Number.isNaN(appointmentTime.getTime())) {
    return {
      allowed: false,
      reason: 'Geçersiz randevu saati',
      opensAt: new Date(),
      closesAt: new Date(),
    }
  }

  const opensAt = new Date(
    appointmentTime.getTime() - INTERVIEW_OPEN_HOURS_BEFORE * 60 * 60 * 1000
  )
  const closesAt = new Date(
    appointmentTime.getTime() + INTERVIEW_CLOSE_MINUTES_AFTER * 60 * 1000
  )
  const now = Date.now()

  if (now < opensAt.getTime()) {
    return {
      allowed: false,
      reason: `Görüşme ${formatTr(opensAt)} tarihinde açılacak (randevudan 24 saat önce).`,
      opensAt,
      closesAt,
    }
  }

  if (now > closesAt.getTime()) {
    return {
      allowed: false,
      reason: 'Randevu süresi geçti. Lütfen klinik ile iletişime geçin.',
      opensAt,
      closesAt,
    }
  }

  return { allowed: true, opensAt, closesAt }
}

function formatTr(d: Date): string {
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCountdownToAppointment(appointmentTimeIso: string): string {
  const diff = new Date(appointmentTimeIso).getTime() - Date.now()
  if (diff <= 0) return 'Randevu zamanı geldi'
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  if (hours >= 24) return `${Math.floor(hours / 24)} gün ${hours % 24} saat sonra`
  if (hours > 0) return `${hours} saat ${mins} dakika sonra`
  return `${mins} dakika sonra`
}
