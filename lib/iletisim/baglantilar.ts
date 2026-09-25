/**
 * NOTYA-ILETISIM-01 — link builders that open the SENDER'S OWN WhatsApp / mail. Pure, client-safe.
 *
 * Notya never sends here: it prepares recipient + text and opens the app on whatever device the
 * doctor or the secretary is holding, so the message leaves from that device's own account.
 *
 *   whatsappLinki  → https://wa.me/<digits>?text=…            (WhatsApp app / WhatsApp Web)
 *   epostaLinki    → mailto:… | Gmail web compose | Outlook web compose
 *
 * Every link is capped at LINK_UST_SINIRI characters: mailto: breaks on some mail apps above ~2000,
 * and very long GET URLs get cut by browsers/proxies. When the body has to be shortened, lines that
 * carry a link (the Sağlığım / form URL) are kept and the prose is trimmed first.
 */
import { normalizeTrPhoneE164 } from '@/lib/doktor/twilioNotify'
import type { EpostaAcilis } from './tipler'

export const LINK_UST_SINIRI = 1800

/**
 * WhatsApp-ready digits (no "+") for a patient number, or null when it is not a usable number.
 * Turkish numbers in any common spelling ("0532 …", "532…", "+90 …", "0090…") go through the
 * product's one normaliser; a number written with an explicit international prefix ("+49 …",
 * "0049 …") is accepted as-is for patients abroad.
 */
export function whatsappNumarasi(telefon: string | null | undefined): string | null {
  const ham = String(telefon || '').trim()
  if (!ham) return null
  const tr = normalizeTrPhoneE164(ham)
  if (tr) return tr.slice(1)
  const rakam = ham.replace(/\D/g, '')
  const uluslararasi = ham.startsWith('+') ? rakam : rakam.startsWith('00') ? rakam.slice(2) : ''
  if (uluslararasi && !uluslararasi.startsWith('90') && uluslararasi.length >= 8 && uluslararasi.length <= 15) return uluslararasi
  return null
}

/** One plausible address, or null. Deliberately permissive — the mail app is the real judge. */
export function epostaAdresi(adres: string | null | undefined): string | null {
  const a = String(adres || '').trim()
  return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(a) ? a : null
}

/** Encodes like encodeURIComponent; mailto bodies also want CRLF line breaks (RFC 6068). */
function kodla(s: string, crlf = false): string {
  const metin = crlf ? s.replace(/\r?\n/g, '\r\n') : s
  return encodeURIComponent(metin)
}

/**
 * Shortens `metin` until `olcu(metin)` fits `sinir`: first drops whole prose lines from the end
 * (never the first line, never a line with a URL), then hard-cuts prose, ending with "…".
 */
export function sigacakKadarKisalt(metin: string, sinir: number, olcu: (m: string) => number): string {
  if (olcu(metin) <= sinir) return metin
  const satirlar = metin.split('\n')
  const linkli = (s: string) => /https?:\/\//.test(s)
  for (let i = satirlar.length - 1; i > 0 && olcu(satirlar.join('\n')) > sinir; i--) {
    if (!linkli(satirlar[i])) satirlar.splice(i, 1)
  }
  let sonuc = satirlar.join('\n')
  if (olcu(sonuc) <= sinir) return sonuc
  // Still too long (very long free text): cut the first prose line, keep link lines intact.
  const ilkProse = satirlar.findIndex((s) => !linkli(s))
  if (ilkProse >= 0) {
    let s = satirlar[ilkProse]
    while (s.length > 1 && olcu([...satirlar.slice(0, ilkProse), `${s}…`, ...satirlar.slice(ilkProse + 1)].join('\n')) > sinir) {
      s = s.slice(0, Math.max(1, Math.floor(s.length * 0.9)))
    }
    satirlar[ilkProse] = `${s.trimEnd()}…`
    sonuc = satirlar.join('\n')
  }
  return sonuc
}

/** https://wa.me/<digits>?text=… — or null when the number is unusable. */
export function whatsappLinki(telefon: string | null | undefined, metin: string): string | null {
  const numara = whatsappNumarasi(telefon)
  if (!numara) return null
  const bas = `https://wa.me/${numara}?text=`
  const govde = sigacakKadarKisalt(metin, LINK_UST_SINIRI, (m) => bas.length + kodla(m).length)
  return bas + kodla(govde)
}

/**
 * A compose link in the sender's own mail: device app (mailto:), Gmail web or Outlook web.
 * Returns null when the address is unusable.
 */
export function epostaLinki(adres: string | null | undefined, konu: string, govde: string, acilis: EpostaAcilis = 'uygulama'): string | null {
  const to = epostaAdresi(adres)
  if (!to) return null
  const kur = (g: string): string => {
    switch (acilis) {
      case 'gmail':
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${kodla(to)}&su=${kodla(konu)}&body=${kodla(g)}`
      case 'outlook':
        return `https://outlook.office.com/mail/deeplink/compose?to=${kodla(to)}&subject=${kodla(konu)}&body=${kodla(g)}`
      default:
        // The address stays readable (some mail apps do not decode %40 in the path).
        return `mailto:${to}?subject=${kodla(konu)}&body=${kodla(g, true)}`
    }
  }
  const sigan = sigacakKadarKisalt(govde, LINK_UST_SINIRI, (m) => kur(m).length)
  return kur(sigan)
}

export const EPOSTA_ACILIS_ETIKETI: Record<EpostaAcilis, string> = {
  uygulama: 'Bu cihazdaki posta uygulaması',
  gmail: 'Gmail',
  outlook: 'Outlook',
}
