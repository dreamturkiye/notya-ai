/**
 * MBYS-YARDIMCI-01 — the Notya tab's side of the hand-over to the browser helper (extensions/mbys-yardimci).
 *
 * The record goes from this tab to the extension inside the doctor's browser (chrome.runtime.sendMessage with the
 * extension id; the extension accepts only notya.io origins). Nothing is sent to a server here.
 * The id is fixed by the manifest `key` for the beta (load unpacked); the Web Store build gets its own id —
 * set NEXT_PUBLIC_MBYS_YARDIMCI_ID then.
 */
import type { MbysKayit } from './kontrol'

export const MBYS_YARDIMCI_ID = process.env.NEXT_PUBLIC_MBYS_YARDIMCI_ID || 'fcpohjcocgcobbognbpdkgmcgfnnhjpe'

export const MBYS_ADRES = 'https://mbys2.saglik.gov.tr'

type ChromeRuntime = {
  sendMessage: (id: string, mesaj: unknown, cb: (yanit: unknown) => void) => void
  lastError?: unknown
}

function runtime(): ChromeRuntime | null {
  const w = typeof window !== 'undefined' ? (window as unknown as { chrome?: { runtime?: ChromeRuntime } }) : null
  const r = w?.chrome?.runtime
  return r && typeof r.sendMessage === 'function' ? r : null
}

function gonder(mesaj: unknown, zamanAsimiMs = 1500): Promise<{ ok?: boolean } | null> {
  const r = runtime()
  if (!r) return Promise.resolve(null)
  return new Promise((coz) => {
    const t = setTimeout(() => coz(null), zamanAsimiMs)
    try {
      r.sendMessage(MBYS_YARDIMCI_ID, mesaj, (yanit) => {
        clearTimeout(t)
        coz(r.lastError ? null : ((yanit as { ok?: boolean }) ?? null))
      })
    } catch {
      clearTimeout(t)
      coz(null)
    }
  })
}

/** Is the helper installed in this browser? */
export async function yardimciKuruluMu(): Promise<boolean> {
  const y = await gonder({ tip: 'ping' })
  return !!y?.ok
}

/** true = the helper holds the record now. */
export async function yardimciyaGonder(kayit: MbysKayit): Promise<boolean> {
  const y = await gonder({ tip: 'kayit', kayit })
  return !!y?.ok
}
