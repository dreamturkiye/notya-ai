/**
 * NOTYA-ILETISIM-01 — the slot for UNATTENDED sending from the doctor's own accounts.
 *
 * Today the registry is empty: every message is opened on a device and a human taps send.
 * Later jobs plug in here without touching the send button, the queue or the templates:
 *   • job B (NOTYA-ILETISIM-02): Gmail / Outlook, send-only permission on the doctor's mailbox
 *   • job C (NOTYA-ILETISIM-03): WhatsApp Business coexistence on the doctor's own number
 * Contract and rules for implementers: lib/iletisim/README.md.
 */
import type { IletisimKanali, MesajTuru } from './tipler'

export type OtomatikGonderimIstegi = {
  /** Whose account sends. Always the practice owner — a secretary's action still sends from the doctor's account. */
  doktorId: string
  /** Patient id, already ownership-checked by the caller (hastaSahibiMi). */
  patientId: string
  tur: MesajTuru
  /** E.164 phone for WhatsApp, address for e-posta — already consent-checked (lib/iletisim/izin.ts). */
  alici: string
  konu: string
  metin: string
  /** iletisim_kuyrugu.id when the message comes from the queue. */
  kuyrukId?: string | null
}

export type OtomatikGonderimSonucu =
  | { ok: true; saglayiciMesajId?: string }
  | { ok: false; hata: string }

export interface OtomatikGonderici {
  kanal: IletisimKanali
  /** Stable id, e.g. 'gmail' | 'outlook' | 'whatsapp_business'. */
  saglayici: string
  /** Has this doctor connected and authorised this account? Must never throw; false on any doubt. */
  hazirMi(doktorId: string): Promise<boolean>
  /** Sends one message. Must never throw; report failure as { ok: false }. */
  gonder(istek: OtomatikGonderimIstegi): Promise<OtomatikGonderimSonucu>
}

/** Registered senders. Empty until jobs B and C land. */
export function otomatikGondericiler(): OtomatikGonderici[] {
  return []
}

/** The first sender that is ready for this doctor on this channel, or null (today: always null). */
export async function hazirOtomatikGonderici(doktorId: string, kanal: IletisimKanali): Promise<OtomatikGonderici | null> {
  for (const g of otomatikGondericiler()) {
    if (g.kanal !== kanal) continue
    try {
      if (await g.hazirMi(doktorId)) return g
    } catch {
      /* a broken sender must never block the manual path */
    }
  }
  return null
}
