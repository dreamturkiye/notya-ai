export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

export function micPermissionHelp(): string {
  if (isAndroid()) {
    return 'Mikrofon izni gerekli. Chrome → ⋮ → Site ayarları → Mikrofon → İzin ver.'
  }
  if (isIos()) {
    return "Mikrofon izni gerekli. Ayarlar → Safari → Mikrofon → İzin ver."
  }
  return 'Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.'
}

export function connectionErrorHelp(detail?: string): string {
  const base = 'Bağlantı kurulamadı. Tekrar deneyin.'
  if (!detail) return base
  if (/denied|not-allowed|permission/i.test(detail)) return micPermissionHelp()
  return `${base} (${detail.slice(0, 60)})`
}
