/**
 * NOTYA-UZ-MUAYENE-01 — THE BOUNDARY of a country's API. Every handler of app/api/ulke/* runs inside `sinirda`.
 *
 * Why. A country build reuses a few pieces of shared infrastructure that still speak Turkish when they fail — the
 * patient-data cipher (lib/security/encryption.ts: "ENCRYPTION_MASTER_KEY ortam değişkeni tanımlı değil") and the
 * model gateway (lib/ai/: "OpenRouter zaman aşımı"). Those sentences are for an engineer's log. They must never
 * reach a doctor in another country, in an answer or in a framework error page.
 *
 * What it does. Anything thrown inside a handler stops here: the caller gets a machine code and nothing else
 * ({ code: 'BASARISIZ' }, 500), and the screen shows its own pack's wording for that code. The log line names the
 * route and the KIND of error only — never its message, which may be Turkish and may quote patient text.
 *
 * Library code that can name a better code (speech not configured, note could not be written) catches its own
 * failures and returns that code; this is the net under all of it.
 */
import type { NextRequest } from 'next/server'
import { KOD } from './cevap'

type Isleyici = (req: NextRequest) => Promise<Response>

export function sinirda(ad: string, isleyici: Isleyici): Isleyici {
  return async (req) => {
    try {
      return await isleyici(req)
    } catch (e) {
      console.error(`[ulke/sinir] ${ad}: ${e instanceof Error ? e.name : typeof e}`)
      return KOD.basarisiz()
    }
  }
}
