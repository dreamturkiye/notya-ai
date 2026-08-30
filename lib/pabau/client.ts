/**
 * NOTYA-PABAU-01 — the one Pabau API client.
 *
 * Pabau's documented API (support.pabau.com/en/api): base `https://api.oauth.pabau.com/{api_key}/`
 * with the clinic's API key IN THE PATH — there is no Authorization header and no OAuth
 * token exchange. The key is created by the clinic in Pabau (Setup → Developer Hub), or passed by
 * Pabau to a marketplace app's configuration page for auto-login.
 *
 * Because the key sits in the URL, requests through this module must never be logged with their
 * URL. maskKey() exists for every place a key might surface in an error or a log line.
 */

const BASE = "https://api.oauth.pabau.com"

export function maskKey(apiKey: string): string {
  return apiKey.length <= 4 ? "****" : `••••${apiKey.slice(-4)}`
}

export interface PabauResult<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

export async function pabauGet<T = unknown>(apiKey: string, path: string): Promise<PabauResult<T>> {
  const url = `${BASE}/${encodeURIComponent(apiKey)}/${path.replace(/^\//, "")}`
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
    const text = await res.text()
    let data: T | undefined
    try { data = JSON.parse(text) as T } catch { /* non-JSON error body */ }
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Pabau ${res.status} (${maskKey(apiKey)})` }
    }
    return { ok: true, status: res.status, data }
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "Pabau zaman aşımı" : "Pabau erişilemedi"
    return { ok: false, status: 0, error: `${msg} (${maskKey(apiKey)})` }
  }
}

/**
 * Validate a key with the cheapest real call: /appointments returns the clinic's future
 * appointments. A wrong key answers non-200; a right key proves read access in one round trip.
 */
export async function validatePabauKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  const r = await pabauGet<{ success?: boolean }>(apiKey, "appointments")
  if (r.ok) return { valid: true }
  if (r.status === 401 || r.status === 403 || r.status === 404) {
    return { valid: false, error: "Pabau bu anahtarı kabul etmedi. Anahtarı Pabau → Setup → Developer Hub'dan kontrol edin." }
  }
  return { valid: false, error: r.error || "Pabau doğrulaması başarısız." }
}
