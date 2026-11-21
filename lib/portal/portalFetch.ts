/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — the patient portal's (Sağlığım, PIN-based) request path.
 *
 * The portal unlock is a short-lived cookie. When it lapses while the patient is on a screen, a request answers
 * 401 `pin_required`; before this file each screen showed that as an error with no way forward. Now every portal
 * request goes through `portalFetch`, which announces the lapse (PORTAL_PIN_GEREKLI_OLAYI) and PortalLiveProvider
 * puts the PIN screen back (the patient's own re-entry path — never the doctor login), then reloads the data.
 * The doctor's Bearer token is never sent here (the portal reads its cookie only).
 */
export const PORTAL_PIN_GEREKLI_OLAYI = 'notya:portal-pin-gerekli'

/** True when a portal response says the unlock has lapsed. Reads a clone; the caller's body stays unread. */
export async function pinGerekliMi(r: Response): Promise<boolean> {
  if (r.status !== 401) return false
  try {
    const j = (await r.clone().json()) as { code?: string; pinRequired?: boolean }
    return j?.code === 'pin_required' || j?.pinRequired === true
  } catch {
    return false
  }
}

export async function portalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const r = await fetch(input, { credentials: 'include', ...init })
  if (typeof window !== 'undefined' && (await pinGerekliMi(r))) window.dispatchEvent(new Event(PORTAL_PIN_GEREKLI_OLAYI))
  return r
}
