/**
 * NOTYA-ILETISIM-02 — a plain-text RFC 5322 (RFC 2822) message for Gmail's users.messages.send.
 *
 * Turkish letters (ç ğ ı ö ş ü İ) are not allowed raw in headers: the subject becomes RFC 2047
 * encoded-words (=?UTF-8?B?…?=), each at most 75 characters and never cutting a letter in half.
 * The body is UTF-8, base64, 76-character lines. Header values are stripped of line breaks so a
 * recipient or subject can never inject a header.
 */

const ASCII_YAZILIR = /^[\x20-\x7e]*$/
/** 45 bytes → 60 base64 chars; with "=?UTF-8?B?" and "?=" that is 72 ≤ 75 (RFC 2047 §2). */
const KELIME_BAYT = 45

const E_POSTA = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/

export function epostaGecerliMi(adres: string): boolean {
  return adres.length <= 254 && E_POSTA.test(adres)
}

function tekSatir(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').trim()
}

/** RFC 2047 "B" encoding for a header value; ASCII passes through untouched. */
export function baslikKodla(deger: string): string {
  const s = tekSatir(deger)
  if (ASCII_YAZILIR.test(s)) return s
  const kelimeler: string[] = []
  let parca = ''
  for (const harf of Array.from(s)) {
    if (Buffer.byteLength(parca + harf, 'utf8') > KELIME_BAYT) {
      kelimeler.push(parca)
      parca = ''
    }
    parca += harf
  }
  if (parca) kelimeler.push(parca)
  return kelimeler.map((k) => `=?UTF-8?B?${Buffer.from(k, 'utf8').toString('base64')}?=`).join('\r\n ')
}

export function govdeKodla(metin: string): string {
  const b64 = Buffer.from(metin.replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64')
  return (b64.match(/.{1,76}/g) ?? []).join('\r\n')
}

/**
 * NOTYA-RANDEVU-V2: an optional text attachment (the appointment's .ics). Without attachments the message is
 * byte-for-byte what it was before; with them it becomes multipart/mixed (text part first).
 */
export type EpostaEki = { ad: string; tur: string; icerik: string }

const EK_ADI = /^[\w.-]{1,80}$/
const EK_TURU = /^[\w.+-]+\/[\w.+-]+(; ?[\w-]+=[\w.-]+)*$/

export function ekGecerliMi(e: EpostaEki): boolean {
  return EK_ADI.test(e.ad) && EK_TURU.test(e.tur) && e.icerik.length > 0 && e.icerik.length <= 100_000
}

export function epostaMesaji(m: { kimden?: string; alici: string; konu: string; metin: string; ekler?: EpostaEki[] }): string {
  const ekler = (m.ekler || []).filter(ekGecerliMi)
  const satirlar = [
    ...(m.kimden ? [`From: ${tekSatir(m.kimden)}`] : []),
    `To: ${tekSatir(m.alici)}`,
    `Subject: ${baslikKodla(m.konu)}`,
    'MIME-Version: 1.0',
  ]
  if (!ekler.length) {
    satirlar.push('Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64')
    return `${satirlar.join('\r\n')}\r\n\r\n${govdeKodla(m.metin)}\r\n`
  }
  const sinir = `notya_${Buffer.from(`${m.alici}|${m.konu}|${ekler.length}`).toString('hex').slice(0, 24)}`
  satirlar.push(`Content-Type: multipart/mixed; boundary="${sinir}"`)
  const parcalar = [
    `--${sinir}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    govdeKodla(m.metin),
    ...ekler.flatMap((e) => [
      `--${sinir}`,
      `Content-Type: ${e.tur}; name="${e.ad}"`,
      `Content-Disposition: attachment; filename="${e.ad}"`,
      'Content-Transfer-Encoding: base64',
      '',
      (Buffer.from(e.icerik, 'utf8').toString('base64').match(/.{1,76}/g) ?? []).join('\r\n'),
    ]),
    `--${sinir}--`,
  ]
  return `${satirlar.join('\r\n')}\r\n\r\n${parcalar.join('\r\n')}\r\n`
}
