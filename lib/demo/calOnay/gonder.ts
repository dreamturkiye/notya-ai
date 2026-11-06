/**
 * NOTYA-DEMO-EPOSTA-01 — sends one demo-booking e-mail through Resend's HTTP API from a notya.io sender (the domain is
 * DKIM-signed by Resend and DMARC-aligned). Idempotent: the same booking, event and recipient always carry the same
 * `Idempotency-Key`, so a repeated Cal.com delivery within Resend's idempotency window sends nothing twice. The
 * attendee address is used only for this one send; nothing is stored.
 */
import { createHash } from 'node:crypto'
import type { DemoKatilimci, DemoRezervasyonu } from './calOlayi'
import type { DemoEpostasi } from './eposta'

export const RESEND_URL = 'https://api.resend.com/emails'
export const VARSAYILAN_GONDEREN = 'Notya <demo@notya.io>'

export function tekrarAnahtari(r: DemoRezervasyonu, k: DemoKatilimci): string {
  const kim = createHash('sha256').update(k.eposta).digest('hex').slice(0, 24)
  return `notya-demo/${r.tetik}/${r.uid}/${kim}`
}

/** Only a sender on our own domain is used; anything else falls back to the default. */
export function gonderenAdresi(ham: string | undefined): string {
  const s = String(ham || '').trim()
  const yalin = /^[a-z0-9._%+-]+@notya\.io$/i
  const adli = /^[^<>@\r\n]{1,60}<[a-z0-9._%+-]+@notya\.io>$/i
  return yalin.test(s) || adli.test(s) ? s : VARSAYILAN_GONDEREN
}

export type GonderimSonucu = { tamam: true; id: string | null } | { tamam: false; durum: number; neden: string }

export async function demoEpostasiGonder(
  e: DemoEpostasi,
  r: DemoRezervasyonu,
  k: DemoKatilimci,
  ayar: { apiAnahtari: string; gonderen?: string; fetchFn?: typeof fetch },
): Promise<GonderimSonucu> {
  const f = ayar.fetchFn ?? fetch
  const govde = {
    from: gonderenAdresi(ayar.gonderen),
    to: [k.eposta],
    subject: e.konu,
    html: e.html,
    text: e.metin,
    ...(r.hekimEposta ? { reply_to: r.hekimEposta } : {}),
    attachments: [
      {
        filename: 'invite.ics',
        content: Buffer.from(e.ics, 'utf8').toString('base64'),
        content_type: `text/calendar; charset=utf-8; method=${e.icsYontemi}`,
      },
    ],
  }
  let yanit: Response
  try {
    yanit = await f(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ayar.apiAnahtari}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': tekrarAnahtari(r, k),
      },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
  } catch (err) {
    return { tamam: false, durum: 0, neden: err instanceof Error ? err.name : 'ag' }
  }
  if (!yanit.ok) {
    const ozet = (await yanit.text().catch(() => '')).slice(0, 200)
    return { tamam: false, durum: yanit.status, neden: ozet }
  }
  const j = (await yanit.json().catch(() => ({}))) as { id?: string }
  return { tamam: true, id: typeof j.id === 'string' ? j.id : null }
}
