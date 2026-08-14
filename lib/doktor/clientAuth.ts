/** Client helper: doctor access token from localStorage. */
export function getDoctorAccessToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw =
      localStorage.getItem('auth-token') ||
      localStorage.getItem(
        Object.keys(localStorage).find((k) => k.includes('auth-token')) || ''
      ) ||
      ''
    if (!raw) return ''
    const parsed = JSON.parse(raw) as { access_token?: string }
    return parsed.access_token || ''
  } catch {
    return ''
  }
}
