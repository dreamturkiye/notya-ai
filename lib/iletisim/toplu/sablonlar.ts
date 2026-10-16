/**
 * NOTYA-HASTA-ILETISIMI-01 — bulk-message presets. Pure, client-safe.
 *
 * Same hard rule as lib/iletisim/sablonlar.ts: NO clinical information (no diagnosis, drug, test
 * result or vaccine BRAND/manufacturer — "aşınız geldi" names the vaccine the doctor is tracking
 * stock for, same level of detail asi_hatirlatma already uses, never a dose or medical instruction).
 * Guardian wording follows the patient's age (veliDiliMi/veliOnamGerekliMi), same as everywhere else.
 *
 * These are PRESETS, not auto-generated-and-locked text: the doctor/sekreter sees and can edit the
 * body before every send (brief: "short editable professional templates"). The STARTER text below
 * is neutral (no recipient name, no per-patient veli branching — called once, with hastaAdi/veliDili
 * left unset, to seed the compose box) because the brief's preview promise is "the exact final
 * message text... before sending": lib/iletisim/toplu/kampanya.ts sends the doctor's edited `govde`
 * VERBATIM to every recipient, so the preview and the sent text are provably identical. (hastaAdi/
 * veliDili stay on the type for a future per-recipient-personalised send, not used by kampanya.ts today.)
 */
import { ACIL_SATIRI } from '../sablonlar'
import type { SablonAnahtari } from './tipler'

export type TopluSablonGirdisi = {
  hastaAdi?: string | null
  veliDili?: boolean
  doktorAdi?: string | null
  /** Only for 'asi_stok_geldi'. */
  asiAdi?: string | null
}

const temiz = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

function merhaba(g: TopluSablonGirdisi): string {
  const ad = temiz(g.hastaAdi)
  return g.veliDili || !ad ? 'Merhaba,' : `Merhaba ${ad},`
}

function kime(g: TopluSablonGirdisi, ne: string): string {
  if (!g.veliDili) return ne
  const ad = temiz(g.hastaAdi)
  return `${ad || 'çocuğunuz'} için ${ne}`
}

export const TOPLU_SABLON_ETIKETI: Record<SablonAnahtari, string> = {
  asi_stok_geldi: 'Aşı stoğa geldi',
  randevu_genel: 'Genel randevu hatırlatması',
  genel_bilgi: 'Genel bilgilendirme',
  serbest: 'Serbest metin',
}

/** The editable preset body shown in the compose screen — the doctor/sekreter edits from here. */
export function topluSablonMetni(anahtar: SablonAnahtari, g: TopluSablonGirdisi): { konu: string; metin: string } {
  const doktor = temiz(g.doktorAdi) ? ` — ${temiz(g.doktorAdi)}` : ''
  if (anahtar === 'asi_stok_geldi') {
    const metin = `${merhaba(g)} ${kime(g, 'beklediğiniz aşı stoğumuza geldi')}. Randevu almak için bizi arayabilir ya da WhatsApp'tan yazabilirsiniz.${doktor}`
    return { konu: 'Aşınız geldi', metin }
  }
  if (anahtar === 'randevu_genel') {
    const metin = `${merhaba(g)} ${kime(g, 'kontrol randevusu almanızı')} hatırlatmak isteriz. Uygun bir zaman için bize ulaşabilirsiniz.${doktor}`
    return { konu: 'Randevu hatırlatması', metin }
  }
  if (anahtar === 'genel_bilgi') {
    const metin = `${merhaba(g)} muayenehanemizden bir bilgilendirme mesajıdır.${doktor}`
    return { konu: 'Bilgilendirme', metin }
  }
  return { konu: 'Mesaj', metin: merhaba(g) }
}

/** Appended once per recipient, same sentence as every other patient-facing message in this product. */
export const TOPLU_ACIL_SATIRI = ACIL_SATIRI

/**
 * SMS opt-out disclosure (coordinator addition 2026-10-16: "SMS opt-out via STOP-keyword handling —
 * standard convention most jurisdictions expect"). The webhook (app/api/iletisim/sms/webhook/) only
 * RECOGNISES the reply; the patient has to be told the keyword exists in the first place, or the
 * mechanism is real but undiscoverable. Appended once per SMS send, kampanya.ts — never in e-mail,
 * which carries the unsubscribe link instead.
 */
export const TOPLU_SMS_VAZGEC_SATIRI = 'Bu mesajları almak istemiyorsanız STOP yazıp gönderin.'
