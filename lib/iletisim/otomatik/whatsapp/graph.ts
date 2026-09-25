/**
 * NOTYA-ILETISIM-03 — Graph API için ince istemci. `fetch` enjekte edilebilir (testler sahte HTTP ile koşar).
 * Anahtar yalnız Authorization başlığında gider; hata metnine, loga ya da yanıta asla yazılmaz.
 */
import { GRAPH_KOK } from './ayar'

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

export class GraphHatasi extends Error {
  constructor(public durum: number, public kod: number | null, mesaj: string) {
    super(mesaj)
    this.name = 'GraphHatasi'
  }
}

export interface GraphIstek {
  method?: 'GET' | 'POST' | 'DELETE'
  token?: string
  query?: Record<string, string>
  body?: unknown
}

export async function graph<T = Record<string, unknown>>(yol: string, istek: GraphIstek = {}, f: FetchFn = fetch): Promise<T> {
  const url = new URL(`${GRAPH_KOK}/${yol.replace(/^\//, '')}`)
  for (const [k, v] of Object.entries(istek.query || {})) url.searchParams.set(k, v)
  const basliklar: Record<string, string> = {}
  if (istek.token) basliklar.Authorization = `Bearer ${istek.token}`
  if (istek.body !== undefined) basliklar['Content-Type'] = 'application/json'
  const r = await f(url.toString(), {
    method: istek.method || 'GET',
    headers: basliklar,
    body: istek.body === undefined ? undefined : JSON.stringify(istek.body),
    cache: 'no-store',
  })
  const j = (await r.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T
  if (!r.ok || j?.error) {
    const e = j?.error
    throw new GraphHatasi(r.status, typeof e?.code === 'number' ? e.code : null, String(e?.message || `HTTP ${r.status}`).slice(0, 300))
  }
  return j
}
