/**
 * NOTYA-DEMO-EPOSTA-01 — the demo-booking e-mail: subject, text, HTML and the .ics invite, for one attendee.
 *
 * Same look and deliverability rules as our other transactional mail (lib/iletisim/bilgiFormuEposta.ts): table layout,
 * inline CSS, system fonts, no images, no tracking, links only to the call, to Cal.com's own cancel / reschedule pages
 * for this booking and to our demo page. The date and time are written in the attendee's own time zone (from the
 * Cal.com delivery), in each section's language. Pure.
 */
import { RENK, kacir } from '@/lib/iletisim/bilgiFormuEposta'
import type { DemoKatilimci, DemoRezervasyonu } from './calOlayi'
import { ETKINLIK_ADI, type DemoEpostaMetni, type DemoEtkinligi } from './metinler'

export type DemoEpostasi = { konu: string; metin: string; html: string; ics: string; icsYontemi: 'PUBLISH' | 'CANCEL' }

/** "7 Kasım 2026 Cumartesi 18:00 (Europe/Istanbul)" — in `dil`, in `saatDilimi`. */
export function tarihYaz(t: Date, dil: string, saatDilimi: string): string {
  const f = new Intl.DateTimeFormat(dil, { dateStyle: 'full', timeStyle: 'short', timeZone: saatDilimi })
  return `${f.format(t)} (${saatDilimi})`
}

const dakika = (r: DemoRezervasyonu) => Math.round((r.bitis.getTime() - r.baslangic.getTime()) / 60000)

export function calLinkleri(r: DemoRezervasyonu): { iptal: string; degistir: string } {
  const uid = encodeURIComponent(r.uid)
  return { iptal: `${r.calKoku}/booking/${uid}?cancel=true`, degistir: `${r.calKoku}/reschedule/${uid}` }
}

/* ---- .ics (RFC 5545) ---- */

const icsKacir = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const icsZaman = (t: Date) => t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Folds a content line at 75 octets without splitting a UTF-8 character. */
function katla(satir: string): string {
  const parcalar: string[] = []
  let parca = ''
  let bayt = 0
  for (const h of satir) {
    const b = Buffer.byteLength(h)
    const sinir = parcalar.length ? 74 : 75
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

export function demoIcs(r: DemoRezervasyonu, e: DemoEtkinligi): { ics: string; yontem: 'PUBLISH' | 'CANCEL' } {
  const m = e.bolumler[0]
  const iptal = r.olay === 'iptal'
  const yontem = iptal ? 'CANCEL' : 'PUBLISH'
  const aciklama = [m.govde[r.olay], r.gorusmeLinki ? `${m.baglanti}: ${r.gorusmeLinki}` : ''].filter(Boolean).join('\n')
  const satirlar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Notya//Demo//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${yontem}`,
    'BEGIN:VEVENT',
    `UID:${r.uid}@demo.notya.io`,
    `DTSTAMP:${icsZaman(new Date())}`,
    `DTSTART:${icsZaman(r.baslangic)}`,
    `DTEND:${icsZaman(r.bitis)}`,
    `SEQUENCE:${iptal ? 1 : 0}`,
    `STATUS:${iptal ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${icsKacir(ETKINLIK_ADI)}`,
    `DESCRIPTION:${icsKacir(aciklama)}`,
    ...(r.gorusmeLinki ? [`LOCATION:${icsKacir(r.gorusmeLinki)}`, `URL:${r.gorusmeLinki}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return { ics: satirlar.map(katla).join('\r\n') + '\r\n', yontem }
}

/* ---- text + HTML ---- */

type Bolum = { m: DemoEpostaMetni; satirlar: { etiket: string; deger: string }[] }

function bolumler(r: DemoRezervasyonu, e: DemoEtkinligi, k: DemoKatilimci): Bolum[] {
  const tz = k.saatDilimi || e.varsayilanSaatDilimi
  return e.bolumler.map((m) => ({
    m,
    satirlar: [
      { etiket: m.ne, deger: ETKINLIK_ADI },
      { etiket: m.neZaman, deger: tarihYaz(r.baslangic, m.dil, tz) },
      { etiket: m.sure, deger: m.sureDegeri(dakika(r)) },
      ...(r.gorusmeLinki && r.olay !== 'iptal' ? [{ etiket: m.baglanti, deger: r.gorusmeLinki }] : []),
    ],
  }))
}

export function demoEpostasi(r: DemoRezervasyonu, e: DemoEtkinligi, k: DemoKatilimci): DemoEpostasi {
  const b = bolumler(r, e, k)
  const l = calLinkleri(r)
  const iptal = r.olay === 'iptal'
  const konu = e.bolumler.map((m) => m.konu[r.olay]).join(' / ')
  const { ics, yontem } = demoIcs(r, e)

  const metin = b
    .map(({ m, satirlar }) =>
      [
        m.selam(k.ad),
        '',
        m.govde[r.olay],
        '',
        ...satirlar.map((s) => `${s.etiket}: ${s.deger}`),
        '',
        ...(iptal ? [m.yeniSaat, e.demoSayfasi] : [m.takvim, '', `${m.degistir}: ${l.degistir}`, `${m.iptalEt}: ${l.iptal}`]),
        '',
        m.kapanis,
        m.imza,
      ].join('\n'),
    )
    .concat([e.bolumler.map((m) => m.altBilgi).join('\n')])
    .join('\n\n— — —\n\n')

  const font = 'font-family:Arial,Helvetica,sans-serif;'
  const p = (s: string, ek = '') => `<p style="margin:0 0 16px;${font}font-size:16px;line-height:24px;color:${RENK.murekkep};${ek}">${kacir(s)}</p>`
  const link = (href: string, yazi: string) => `<a href="${kacir(href)}" target="_blank" style="color:${RENK.cam};text-decoration:underline;">${kacir(yazi)}</a>`
  const dugme = (href: string, yazi: string) =>
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;"><tr>' +
    `<td align="center" bgcolor="${RENK.cam}" style="border-radius:8px;background-color:${RENK.cam};">` +
    `<a href="${kacir(href)}" target="_blank" style="display:inline-block;padding:12px 28px;${font}font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${kacir(yazi)}</a>` +
    '</td></tr></table>'
  const tablo = (satirlar: Bolum['satirlar']) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-top:1px solid ${RENK.cizgi};">` +
    satirlar
      .map(
        (s) =>
          `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${RENK.cizgi};${font}font-size:14px;line-height:20px;color:${RENK.soluk};white-space:nowrap;vertical-align:top;">${kacir(s.etiket)}</td>` +
          `<td style="padding:10px 0;border-bottom:1px solid ${RENK.cizgi};${font}font-size:15px;line-height:22px;color:${RENK.murekkep};word-break:break-word;">${
            /^https:\/\//.test(s.deger) ? link(s.deger, s.deger) : kacir(s.deger)
          }</td></tr>`,
      )
      .join('') +
    '</table>'
  const bolumHtml = ({ m, satirlar }: Bolum, i: number) =>
    [
      `<div lang="${kacir(m.dil)}"${i ? ` style="border-top:1px solid ${RENK.cizgi};padding-top:24px;margin-top:8px;"` : ''}>`,
      p(m.selam(k.ad)),
      p(m.govde[r.olay]),
      tablo(satirlar),
      ...(iptal
        ? [p(m.yeniSaat, 'margin:0 0 8px;'), dugme(e.demoSayfasi, ETKINLIK_ADI)]
        : [
            ...(r.gorusmeLinki ? [dugme(r.gorusmeLinki, m.katil)] : []),
            p(m.takvim, `font-size:14px;line-height:20px;color:${RENK.soluk};`),
            `<p style="margin:0 0 20px;${font}font-size:14px;line-height:20px;">${link(l.degistir, m.degistir)} &nbsp;·&nbsp; ${link(l.iptal, m.iptalEt)}</p>`,
          ]),
      p(m.kapanis, 'margin:0;'),
      p(m.imza, 'margin:0 0 8px;font-weight:bold;'),
      '</div>',
    ].join('\n')

  const ana = e.bolumler[0]
  const html = [
    '<!DOCTYPE html>',
    `<html lang="${kacir(ana.dil)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<title>${kacir(konu)}</title></head>`,
    `<body style="margin:0;padding:0;background-color:${RENK.krem};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${RENK.krem};">`,
    '<tr><td align="center" style="padding:24px 12px;">',
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${RENK.kart};border:1px solid ${RENK.cizgi};border-radius:12px;">`,
    `<tr><td style="background-color:${RENK.cam};padding:18px 24px;border-radius:12px 12px 0 0;${font}font-size:18px;line-height:24px;font-weight:bold;color:#ffffff;">${kacir(ETKINLIK_ADI)}</td></tr>`,
    '<tr><td style="padding:24px;">',
    b.map(bolumHtml).join('\n'),
    '</td></tr></table>',
    ...e.bolumler.map((m) => `<p lang="${kacir(m.dil)}" style="margin:16px 0 0;${font}font-size:12px;line-height:18px;color:${RENK.soluk};">${kacir(m.altBilgi)}</p>`),
    '</td></tr></table>',
    '</body></html>',
  ].join('\n')

  return { konu, metin, html, ics, icsYontemi: yontem }
}
