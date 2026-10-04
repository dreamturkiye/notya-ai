/**
 * NOTYA-RANDEVU-V2 — an RFC 5545 calendar file for the confirmation e-mail. Pure.
 * METHOD:PUBLISH (an attachment the patient adds to their calendar), not an invitation: there is no
 * organizer mailbox to answer. Content is logistics only — never a diagnosis, reason or appointment type.
 */

function utc(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function kacis(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Folds a content line at 75 octets without splitting a UTF-8 character (RFC 5545 §3.1). */
export function satirKatla(satir: string): string {
  const parcalar: string[] = []
  let parca = ''
  let bayt = 0
  for (const h of Array.from(satir)) {
    const b = Buffer.byteLength(h, 'utf8')
    const sinir = parcalar.length === 0 ? 75 : 74
    if (bayt + b > sinir) {
      parcalar.push(parca)
      parca = ''
      bayt = 0
    }
    parca += h
    bayt += b
  }
  parcalar.push(parca)
  return parcalar.join('\r\n ')
}

export type IcsGirdisi = {
  randevuId: string
  baslangic: string
  bitis: string
  baslik: string
  aciklama?: string
  konum?: string
  /** Sequence bumps on every reschedule so calendars replace, not duplicate, the event. */
  sira?: number
  simdi?: number
}

export function randevuIcs(g: IcsGirdisi): string {
  const satirlar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Notya//Randevu//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${g.randevuId}@notya.io`,
    `SEQUENCE:${Math.max(0, Math.floor(g.sira || 0))}`,
    `DTSTAMP:${utc(g.simdi ?? Date.now())}`,
    `DTSTART:${utc(Date.parse(g.baslangic))}`,
    `DTEND:${utc(Date.parse(g.bitis))}`,
    `SUMMARY:${kacis(g.baslik)}`,
    ...(g.aciklama ? [`DESCRIPTION:${kacis(g.aciklama)}`] : []),
    ...(g.konum ? [`LOCATION:${kacis(g.konum)}`] : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT2H',
    `DESCRIPTION:${kacis(g.baslik)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return satirlar.map(satirKatla).join('\r\n') + '\r\n'
}
