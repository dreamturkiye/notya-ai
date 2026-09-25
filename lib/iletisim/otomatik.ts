/**
 * NOTYA-ILETISIM-01 → 04 — UNATTENDED sending from the doctor's own accounts.
 *
 * Registered senders (NOTYA-ILETISIM-04 wires them):
 *   • WhatsApp Business coexistence on the doctor's own number (job C, lib/iletisim/otomatik/whatsapp)
 *   • Gmail / Outlook, send-only permission on the doctor's mailbox (job B, lib/iletisim/otomatik/eposta)
 * Each is off (hazirMi → false) until its env vars exist and the doctor has connected the account.
 * The dispatcher that uses them is lib/iletisim/otomatikGonderim.ts. Contract and rules: lib/iletisim/README.md.
 */
import type { IletisimKanali, MesajTuru } from './tipler'
import { gonderici as epostaGondericisi } from './otomatik/eposta'
import { gonderici as whatsappGondericisi } from './otomatik/whatsapp'
import { SAGLIKIM_KOK, type SablonKodu } from './otomatik/whatsapp/sablonlar'

/** An approved WhatsApp template and its variables in template order. */
export type WhatsappSablonu = { kod: SablonKodu; degiskenler: string[] }

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
  /** WhatsApp only: the approved template for this message type (whatsappSablonu). No template → not sent. */
  sablon?: WhatsappSablonu | null
}

export type OtomatikGonderimSonucu =
  /** `saglayici` overrides the sender's own id when it knows better (e-posta: 'gmail' | 'outlook'). */
  | { ok: true; saglayiciMesajId?: string; saglayici?: string }
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

/**
 * The only message types that may ever leave without a human tap: appointment logistics, the intake form link
 * and the "new message in Sağlığım" notice. None carries clinical information (lib/iletisim/sablonlar.ts).
 * Vaccine, recall, "bring your tests", Sağlığım link and free text always stay one-tap.
 */
export const OTOMATIK_TURLER: readonly MesajTuru[] = [
  'randevu_hatirlatma',
  'randevu_degisikligi',
  'randevu_iptali',
  'bilgi_formu',
  'saglikim_yeni_mesaj',
]

export function otomatikTurMu(tur: MesajTuru): boolean {
  return (OTOMATIK_TURLER as readonly string[]).includes(tur)
}

const TZ = 'Europe/Istanbul'
const tek = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

/** Minors: the message goes to the parent (VELI-YASAL-ONAM) — the template's name slot greets the guardian. */
export const VELI_HITABI = 'Sayın Veli'

/**
 * Maps a message type to its approved WhatsApp template (lib/iletisim/otomatik/whatsapp/sablonlar.ts) and fills
 * the variables. null → this type has no approved template or a variable is missing → not sent on WhatsApp
 * (email or the one-tap path instead). WhatsApp never gets free text.
 *   randevu_hatirlatma  → [hasta adı, tarih, saat, doktor adı]
 *   saglikim_yeni_mesaj → [hasta adı, doktor adı, Sağlığım bağlantısı]
 */
export function whatsappSablonu(
  tur: MesajTuru,
  g: { hastaAdi?: string | null; veliDili?: boolean; doktorAdi?: string | null; randevuIso?: string | null; link?: string | null },
): WhatsappSablonu | null {
  const hitap = g.veliDili ? VELI_HITABI : tek(g.hastaAdi)
  const doktor = tek(g.doktorAdi)
  if (!hitap || !doktor) return null
  if (tur === 'randevu_hatirlatma') {
    if (!g.randevuIso || Number.isNaN(Date.parse(g.randevuIso))) return null
    const d = new Date(g.randevuIso)
    const tarih = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long', weekday: 'long' }).format(d)
    const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
    return { kod: 'randevu_hatirlatma', degiskenler: [hitap, tarih, saat, doktor] }
  }
  if (tur === 'saglikim_yeni_mesaj') {
    const link = tek(g.link)
    // The template's button only opens our own Sağlığım address.
    if (!link.startsWith(SAGLIKIM_KOK) || link.length <= SAGLIKIM_KOK.length) return null
    return { kod: 'saglikim_yeni_mesaj', degiskenler: [hitap, doktor, link] }
  }
  return null
}

type EpostaCekirdegi = {
  hazirMi(doktorId: string): Promise<boolean>
  gonder(g: { doktorId: string; alici: string; konu?: string; metin: string }): Promise<
    { ok: true; disId?: string; saglayici?: 'google' | 'microsoft' } | { ok: false; hata: string }
  >
}
type WhatsappCekirdegi = {
  hazirMi(doktorId: string): Promise<boolean>
  gonder(g: { doktorId: string; alici: string; metin: string; sablonKodu?: string; degiskenler?: string[] }): Promise<
    { ok: true; disId?: string } | { ok: false; hata: string }
  >
}

const EPOSTA_SAGLAYICI: Record<'google' | 'microsoft', string> = { google: 'gmail', microsoft: 'outlook' }

async function guvenli<T>(f: () => Promise<T>, yedek: T): Promise<T> {
  try {
    return await f()
  } catch {
    return yedek
  }
}

/** Job B's Gmail/Outlook sender behind the OtomatikGonderici contract. Sends the prepared text as is. */
export function epostaAdaptoru(c: EpostaCekirdegi = epostaGondericisi): OtomatikGonderici {
  return {
    kanal: 'eposta',
    saglayici: 'eposta',
    hazirMi: (doktorId) => guvenli(() => c.hazirMi(doktorId), false),
    gonder: (i) =>
      guvenli<OtomatikGonderimSonucu>(async () => {
        const s = await c.gonder({ doktorId: i.doktorId, alici: i.alici, konu: i.konu, metin: i.metin })
        if (!s.ok) return { ok: false, hata: s.hata }
        return {
          ok: true,
          ...(s.saglayici ? { saglayici: EPOSTA_SAGLAYICI[s.saglayici] } : {}),
          ...(s.disId ? { saglayiciMesajId: s.disId } : {}),
        }
      }, { ok: false, hata: 'E-posta şu an gönderilemedi.' }),
  }
}

/** Job C's WhatsApp sender behind the contract. Template only: without `sablon` nothing is sent. */
export function whatsappAdaptoru(c: WhatsappCekirdegi = whatsappGondericisi): OtomatikGonderici {
  return {
    kanal: 'whatsapp',
    saglayici: 'whatsapp_business',
    hazirMi: (doktorId) => guvenli(() => c.hazirMi(doktorId), false),
    gonder: (i) =>
      guvenli<OtomatikGonderimSonucu>(async () => {
        if (!i.sablon) return { ok: false, hata: 'Bu mesaj için onaylı WhatsApp şablonu yok.' }
        // `metin` is required by the sender's type but never sent: WhatsApp gets the template only.
        const s = await c.gonder({ doktorId: i.doktorId, alici: i.alici, metin: '', sablonKodu: i.sablon.kod, degiskenler: i.sablon.degiskenler })
        if (!s.ok) return { ok: false, hata: s.hata }
        return { ok: true, ...(s.disId ? { saglayiciMesajId: s.disId } : {}) }
      }, { ok: false, hata: 'WhatsApp şu an ulaşılamıyor.' }),
  }
}

/** Registered senders, WhatsApp first (the dispatcher prefers it when both are ready). */
export function otomatikGondericiler(): OtomatikGonderici[] {
  return [whatsappAdaptoru(), epostaAdaptoru()]
}

/** The first sender that is ready for this doctor on this channel, or null (→ the manual one-tap path). */
export async function hazirOtomatikGonderici(
  doktorId: string,
  kanal: IletisimKanali,
  liste: OtomatikGonderici[] = otomatikGondericiler(),
): Promise<OtomatikGonderici | null> {
  for (const g of liste) {
    if (g.kanal !== kanal) continue
    try {
      if (await g.hazirMi(doktorId)) return g
    } catch {
      /* a broken sender must never block the manual path */
    }
  }
  return null
}
