/**
 * NOTYA-DEMO-EPOSTA-01 — our own demo-booking e-mail from Cal.com webhooks.
 *   A. signature   only a correct HMAC-SHA256 of the raw body under our secret passes
 *   B. parsing     triggers, slugs, attendees, call link, cancel / reschedule links
 *   C. languages   every demo event renders in its country's own language, in the attendee's own time zone
 *   D. sending     Resend payload: notya.io sender, .ics, stable idempotency key; nothing else
 *   E. route       401 on a bad signature, 200 + one send per attendee on a good one, 503 without configuration
 *   F. header      the fixed top bar's background exists in the Türkiye landing sheet (NOTYA-DEMO-BASLIK-01)
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { calImzasiGecerli, calOlayiCoz, type DemoRezervasyonu } from './calOlayi'
import { calLinkleri, demoEpostasi, demoIcs, tarihYaz } from './eposta'
import { demoEpostasiGonder, gonderenAdresi, tekrarAnahtari, VARSAYILAN_GONDEREN } from './gonder'
import { DEMO_ETKINLIKLERI } from './metinler'

const SIR = 'test-secret-0123456789abcdef'
const imzala = (govde: string, sir = SIR) => createHmac('sha256', sir).update(govde).digest('hex')

function teslimat(slug = 'demo-tr', ek: Record<string, unknown> = {}, tetik = 'BOOKING_CREATED') {
  return JSON.stringify({
    triggerEvent: tetik,
    createdAt: '2026-11-06T18:00:00.000Z',
    payload: {
      type: slug,
      title: 'Notya Demo between Dr. Han Mamur and Ada Test',
      startTime: '2026-11-07T15:00:00.000Z',
      endTime: '2026-11-07T15:30:00.000Z',
      uid: 'abcDEF123456ghi',
      bookerUrl: 'https://cal.com',
      organizer: { name: 'Dr. Han Mamur', email: 'drhanmamur@notya.io', timeZone: 'America/New_York' },
      attendees: [{ name: 'Ada Test', email: 'Ada@Example.com', timeZone: 'Europe/Istanbul' }],
      videoCallData: { url: 'https://app.cal.com/video/abcDEF123456ghi' },
      ...ek,
    },
  })
}

const rez = (slug = 'demo-tr', ek: Record<string, unknown> = {}, tetik = 'BOOKING_CREATED'): DemoRezervasyonu => {
  const c = calOlayiCoz(teslimat(slug, ek, tetik))
  assert.equal(c.tur, 'rezervasyon')
  return (c as { r: DemoRezervasyonu }).r
}

describe('A. signature', () => {
  const g = teslimat()
  it('accepts the correct hex HMAC-SHA256 of the raw body (any case, surrounding spaces)', () => {
    assert.equal(calImzasiGecerli(g, imzala(g), SIR), true)
    assert.equal(calImzasiGecerli(g, ` ${imzala(g).toUpperCase()} `, SIR), true)
  })
  it('rejects a missing, malformed, wrong-key or tampered signature, and a missing secret', () => {
    assert.equal(calImzasiGecerli(g, null, SIR), false)
    assert.equal(calImzasiGecerli(g, '', SIR), false)
    assert.equal(calImzasiGecerli(g, 'no-secret-provided', SIR), false)
    assert.equal(calImzasiGecerli(g, imzala(g, 'another-secret'), SIR), false)
    assert.equal(calImzasiGecerli(g + ' ', imzala(g), SIR), false)
    assert.equal(calImzasiGecerli(g, imzala(g).slice(0, 63), SIR), false)
    assert.equal(calImzasiGecerli(g, imzala(g), ''), false)
    assert.equal(calImzasiGecerli(g, imzala(g), undefined), false)
  })
})

describe('B. parsing', () => {
  it('maps the three booking triggers; PING is a ping; anything else is ignored', () => {
    assert.equal(rez('demo-tr', {}, 'BOOKING_CREATED').olay, 'olustu')
    assert.equal(rez('demo-tr', {}, 'BOOKING_RESCHEDULED').olay, 'yeniden')
    assert.equal(rez('demo-tr', {}, 'BOOKING_CANCELLED').olay, 'iptal')
    assert.deepEqual(calOlayiCoz(JSON.stringify({ triggerEvent: 'PING', payload: {} })), { tur: 'ping' })
    assert.equal(calOlayiCoz(teslimat('demo-tr', {}, 'MEETING_ENDED')).tur, 'yoksay')
    assert.equal(calOlayiCoz('not json').tur, 'hata')
  })
  it('reads the slug, uid, times, attendees (lower-cased, de-duplicated) and the call link', () => {
    const r = rez('demo-tr', { attendees: [{ name: 'A', email: 'a@x.com', timeZone: 'Asia/Tashkent' }, { name: 'B', email: 'A@X.COM' }, { email: 'bad' }] })
    assert.equal(r.etkinlik, 'demo-tr')
    assert.equal(r.uid, 'abcDEF123456ghi')
    assert.deepEqual(r.katilimcilar, [{ ad: 'A', eposta: 'a@x.com', saatDilimi: 'Asia/Tashkent' }])
    assert.equal(r.gorusmeLinki, 'https://app.cal.com/video/abcDEF123456ghi')
    assert.equal(r.hekimEposta, 'drhanmamur@notya.io')
  })
  it('a call link only from a known video host; an unknown time zone becomes null; no attendee is an error', () => {
    assert.equal(rez('demo-tr', { videoCallData: { url: 'https://evil.example/x' }, location: 'javascript:alert(1)' }).gorusmeLinki, null)
    assert.equal(rez('demo-tr', { videoCallData: {}, metadata: { videoCallUrl: 'https://meet.google.com/abc-defg-hij' } }).gorusmeLinki, 'https://meet.google.com/abc-defg-hij')
    assert.equal(rez('demo-tr', { attendees: [{ name: 'A', email: 'a@x.com', timeZone: 'Mars/Base' }] }).katilimcilar[0].saatDilimi, null)
    assert.equal(calOlayiCoz(teslimat('demo-tr', { attendees: [] })).tur, 'hata')
    assert.equal(calOlayiCoz(teslimat('demo-tr', { uid: '../../x' })).tur, 'hata')
  })
  it("cancel and reschedule links point at Cal.com's own pages for this booking", () => {
    assert.deepEqual(calLinkleri(rez()), {
      iptal: 'https://cal.com/booking/abcDEF123456ghi?cancel=true',
      degistir: 'https://cal.com/reschedule/abcDEF123456ghi',
    })
    assert.equal(calLinkleri(rez('demo-tr', { bookerUrl: 'https://evil.example' })).iptal.startsWith('https://app.cal.com/'), true)
  })
})

/** Words that must not appear in a section of another language. */
const YABANCI: Record<string, RegExp> = {
  tr: /\b(?:the|your|call|cancel|minutes|demo call)\b|[А-Яа-яЁё]/i,
  en: /[çğışöüÇĞİŞÖÜА-Яа-яЁё]|\b(?:görüşme|dakika|uchrashuv|daqiqa)\b/i,
}

describe('C. languages — one set of words per Cal.com event, in the attendee time zone', () => {
  it('there are exactly the seven demo events', () => {
    assert.deepEqual(Object.keys(DEMO_ETKINLIKLERI).sort(), ['demo-au', 'demo-ca', 'demo-nz', 'demo-tr', 'demo-uk', 'demo-usa', 'demo-uz'])
  })

  it('TR: Turkish only, Dr. Gökhan Mamur, Istanbul time, 30 dakika, Turkish date', () => {
    const k = rez().katilimcilar[0]
    const e = demoEpostasi(rez(), DEMO_ETKINLIKLERI['demo-tr'], k)
    assert.match(e.konu, /onaylandı/)
    assert.match(e.metin, /Merhaba Ada Test,/)
    assert.match(e.metin, /Dr\. Gökhan Mamur/)
    assert.match(e.metin, /30 dakika/)
    assert.match(e.metin, /7 Kasım 2026 Cumartesi 18:00 \(Europe\/Istanbul\)/)
    assert.match(e.html, /<html lang="tr-TR">/)
    const duz = e.metin.replace(/https:\/\/\S+/g, ' ').replace(/Notya|notya\.io|invite\.ics|davet\.ics|Cal\.com/g, ' ')
    assert.doesNotMatch(duz, YABANCI.tr)
    assert.doesNotMatch(e.metin, /Han Mamur/)
  })

  for (const [slug, dil, iptalYazimi] of [
    ['demo-usa', 'en-US', 'canceled'],
    ['demo-uk', 'en-GB', 'cancelled'],
    ['demo-ca', 'en-CA', 'cancelled'],
    ['demo-nz', 'en-NZ', 'cancelled'],
    ['demo-au', 'en-AU', 'cancelled'],
  ] as const) {
    it(`${slug}: ${dil}, Dr. Han Mamur, attendee's own time zone, local spelling (${iptalYazimi})`, () => {
      const r = rez(slug, { attendees: [{ name: 'Sam', email: 'sam@example.com', timeZone: 'Australia/Perth' }] })
      const e = demoEpostasi(r, DEMO_ETKINLIKLERI[slug], r.katilimcilar[0])
      assert.match(e.metin, /Dr\. Han Mamur/)
      assert.doesNotMatch(e.metin, /Gökhan|Gokhan/)
      assert.match(e.metin, /30 minutes/)
      assert.match(e.metin, /\(Australia\/Perth\)/)
      assert.ok(e.metin.includes(tarihYaz(r.baslangic, dil, 'Australia/Perth')))
      assert.match(e.html, new RegExp(`<html lang="${dil}">`))
      assert.doesNotMatch(e.metin.replace(/https:\/\/\S+/g, ' '), YABANCI.en)
      const iptal = rez(slug, {}, 'BOOKING_CANCELLED')
      assert.ok(demoEpostasi(iptal, DEMO_ETKINLIKLERI[slug], iptal.katilimcilar[0]).konu.endsWith(iptalYazimi))
    })
  }

  it('UZ: Uzbek (Latin) first, then Russian; Tashkent time when the attendee gives none', () => {
    const r = rez('demo-uz', { attendees: [{ name: 'Aziz', email: 'aziz@example.uz' }] })
    const e = demoEpostasi(r, DEMO_ETKINLIKLERI['demo-uz'], r.katilimcilar[0])
    assert.match(e.konu, /^Notya demo uchrashuvingiz tasdiqlandi \/ Ваш демо-звонок Notya подтверждён$/)
    const [uz, ru] = e.metin.split('— — —')
    assert.match(uz, /Assalomu alaykum, Aziz!/)
    assert.match(uz, /30 daqiqa/)
    assert.doesNotMatch(uz, /[А-Яа-яЁё]/)
    assert.match(ru, /Здравствуйте, Aziz!/)
    assert.match(ru, /30 минут/)
    assert.match(ru, /\(Asia\/Tashkent\)/)
    assert.match(e.html, /<div lang="uz-Latn"/)
    assert.match(e.html, /<div lang="ru"/)
  })

  it('every e-mail: call link, cancel + reschedule links, .ics; no Cal.com branding; cancellation offers our demo page', () => {
    for (const [slug, et] of Object.entries(DEMO_ETKINLIKLERI)) {
      const r = rez(slug)
      const e = demoEpostasi(r, et, r.katilimcilar[0])
      assert.ok(e.html.includes('https://app.cal.com/video/abcDEF123456ghi'), slug)
      assert.ok(e.html.includes('https://cal.com/reschedule/abcDEF123456ghi'), slug)
      assert.ok(e.html.includes('https://cal.com/booking/abcDEF123456ghi?cancel=true'), slug)
      assert.doesNotMatch(e.html.replace(/https:\/\/(app\.)?cal\.com\/[^"<\s]*/g, ''), /cal\.com/i, `${slug}: no Cal.com branding`)
      assert.doesNotMatch(e.html, /<img|<script|<style/i, slug)
      assert.match(e.ics, /^BEGIN:VCALENDAR\r\n/)
      const iptal = rez(slug, {}, 'BOOKING_CANCELLED')
      const ei = demoEpostasi(iptal, et, iptal.katilimcilar[0])
      assert.ok(ei.html.includes(et.demoSayfasi), `${slug}: rebook link`)
      assert.ok(!ei.html.includes('/reschedule/'), `${slug}: no reschedule link on a cancellation`)
      assert.equal(ei.icsYontemi, 'CANCEL')
    }
  })

  it('.ics: UTC start/end, 30 minutes, CRLF, lines folded at 75 octets, CANCEL for a cancellation', () => {
    const { ics, yontem } = demoIcs(rez('demo-uz'), DEMO_ETKINLIKLERI['demo-uz'])
    assert.equal(yontem, 'PUBLISH')
    assert.match(ics, /DTSTART:20261107T150000Z\r\nDTEND:20261107T153000Z/)
    for (const satir of ics.split('\r\n')) assert.ok(Buffer.byteLength(satir) <= 75, satir)
    assert.match(demoIcs(rez('demo-tr', {}, 'BOOKING_CANCELLED'), DEMO_ETKINLIKLERI['demo-tr']).ics, /METHOD:CANCEL[\s\S]*STATUS:CANCELLED/)
  })

  it('HTML-escapes what the booker typed', () => {
    const r = rez('demo-usa', { attendees: [{ name: '<b>x</b>"', email: 'x@example.com' }] })
    const e = demoEpostasi(r, DEMO_ETKINLIKLERI['demo-usa'], r.katilimcilar[0])
    assert.ok(!e.html.includes('<b>x</b>'))
    assert.ok(e.html.includes('&lt;b&gt;x&lt;/b&gt;&quot;'))
  })
})

describe('D. sending', () => {
  it('Resend payload: our sender, the attendee only, Reply-To the doctor, .ics attachment, stable idempotency key', async () => {
    const r = rez()
    const k = r.katilimcilar[0]
    const e = demoEpostasi(r, DEMO_ETKINLIKLERI['demo-tr'], k)
    const cagrilar: { url: string; init: RequestInit }[] = []
    const fetchFn = (async (url: string, init: RequestInit) => {
      cagrilar.push({ url, init })
      return new Response(JSON.stringify({ id: 'em_1' }), { status: 200 })
    }) as unknown as typeof fetch
    const s = await demoEpostasiGonder(e, r, k, { apiAnahtari: 're_test', fetchFn })
    assert.deepEqual(s, { tamam: true, id: 'em_1' })
    assert.equal(cagrilar[0].url, 'https://api.resend.com/emails')
    const h = cagrilar[0].init.headers as Record<string, string>
    assert.equal(h.Authorization, 'Bearer re_test')
    assert.equal(h['Idempotency-Key'], tekrarAnahtari(r, k))
    assert.equal(tekrarAnahtari(r, k), tekrarAnahtari(rez(), rez().katilimcilar[0]), 'same booking, same key')
    assert.notEqual(tekrarAnahtari(r, k), tekrarAnahtari(rez('demo-tr', {}, 'BOOKING_CANCELLED'), k), 'another event, another key')
    assert.ok(!h['Idempotency-Key'].includes('@'), 'no address in the key')
    const b = JSON.parse(String(cagrilar[0].init.body))
    assert.equal(b.from, VARSAYILAN_GONDEREN)
    assert.deepEqual(b.to, ['ada@example.com'])
    assert.equal(b.reply_to, 'drhanmamur@notya.io')
    assert.equal(b.attachments[0].filename, 'invite.ics')
    assert.match(Buffer.from(b.attachments[0].content, 'base64').toString('utf8'), /BEGIN:VCALENDAR/)
  })
  it('only a notya.io sender is accepted', () => {
    assert.equal(gonderenAdresi('Notya Demo <demo@notya.io>'), 'Notya Demo <demo@notya.io>')
    assert.equal(gonderenAdresi('hello@notya.io'), 'hello@notya.io')
    assert.equal(gonderenAdresi('Evil <x@evil.com>'), VARSAYILAN_GONDEREN)
    assert.equal(gonderenAdresi(undefined), VARSAYILAN_GONDEREN)
  })
  it('a Resend error is reported, not thrown', async () => {
    const r = rez()
    const fetchFn = (async () => new Response('bad', { status: 422 })) as unknown as typeof fetch
    const s = await demoEpostasiGonder(demoEpostasi(r, DEMO_ETKINLIKLERI['demo-tr'], r.katilimcilar[0]), r, r.katilimcilar[0], { apiAnahtari: 'x', fetchFn })
    assert.deepEqual(s, { tamam: false, durum: 422, neden: 'bad' })
  })
})

describe('E. route', () => {
  const ESKI = { s: process.env.CAL_WEBHOOK_SECRET, k: process.env.RESEND_API_KEY }
  const ESKI_FETCH = globalThis.fetch
  afterEach(() => {
    if (ESKI.s === undefined) delete process.env.CAL_WEBHOOK_SECRET
    else process.env.CAL_WEBHOOK_SECRET = ESKI.s
    if (ESKI.k === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = ESKI.k
    globalThis.fetch = ESKI_FETCH
  })
  const istek = async (govde: string, imza: string | null, ip: string) => {
    const { POST } = await import('../../../app/api/demo/cal-webhook/route')
    const { NextRequest } = await import('next/server')
    const h: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': ip }
    if (imza) h['x-cal-signature-256'] = imza
    return POST(new NextRequest('https://www.notya.io/api/demo/cal-webhook', { method: 'POST', body: govde, headers: h }))
  }

  it('unsigned or wrongly signed → 401, nothing sent', async () => {
    process.env.CAL_WEBHOOK_SECRET = SIR
    process.env.RESEND_API_KEY = 're_test'
    let gonderildi = 0
    globalThis.fetch = (async () => { gonderildi++; return new Response('{}') }) as unknown as typeof fetch
    const g = teslimat()
    assert.equal((await istek(g, null, '10.0.0.1')).status, 401)
    assert.equal((await istek(g, imzala(g, 'wrong'), '10.0.0.1')).status, 401)
    assert.equal(gonderildi, 0)
  })

  it('signed demo booking → one send per attendee; PING and an unknown event → 200 with no send', async () => {
    process.env.CAL_WEBHOOK_SECRET = SIR
    process.env.RESEND_API_KEY = 're_test'
    const gidenler: string[] = []
    globalThis.fetch = (async (_u: string, init: RequestInit) => {
      gidenler.push(JSON.parse(String(init.body)).to[0])
      return new Response(JSON.stringify({ id: 'x' }))
    }) as unknown as typeof fetch
    const g = teslimat('demo-au', { attendees: [{ name: 'A', email: 'a@x.com' }, { name: 'B', email: 'b@x.com', timeZone: 'Australia/Perth' }] })
    const y = await istek(g, imzala(g), '10.0.0.2')
    assert.equal(y.status, 200)
    assert.deepEqual(await y.json(), { tamam: true, ulke: 'au', gonderilen: 2 })
    assert.deepEqual(gidenler, ['a@x.com', 'b@x.com'])
    const ping = JSON.stringify({ triggerEvent: 'PING', payload: {} })
    assert.equal((await istek(ping, imzala(ping), '10.0.0.2')).status, 200)
    const baska = teslimat('15min')
    assert.equal((await istek(baska, imzala(baska), '10.0.0.2')).status, 200)
    assert.equal(gidenler.length, 2)
  })

  it('no secret or no Resend key → 503 (never a silent success)', async () => {
    delete process.env.CAL_WEBHOOK_SECRET
    const g = teslimat()
    assert.equal((await istek(g, imzala(g), '10.0.0.3')).status, 503)
    process.env.CAL_WEBHOOK_SECRET = SIR
    delete process.env.RESEND_API_KEY
    assert.equal((await istek(g, imzala(g), '10.0.0.3')).status, 503)
  })

  it('rate limit: the 31st request from one IP within a minute → 429', async () => {
    process.env.CAL_WEBHOOK_SECRET = SIR
    let son = 0
    for (let i = 0; i < 31; i++) son = (await istek('{}', null, '10.0.0.9')).status
    assert.equal(son, 429)
  })
})

describe('F. header (NOTYA-DEMO-BASLIK-01)', () => {
  it('every bg-*/NN class of the fixed top bars has a rule in the Türkiye landing sheets', () => {
    const kok = join(__dirname, '../../..')
    const sayfa = readFileSync(join(kok, 'app/doktor/utilities.css'), 'utf8') + readFileSync(join(kok, 'app/doktor/landing.css'), 'utf8')
    for (const dosya of ['components/doktor-landing/site-nav.tsx', 'components/klinik-landing/nav.tsx', 'components/klinik/katman/KlinikKabuk.tsx']) {
      const kaynak = readFileSync(join(kok, dosya), 'utf8')
      for (const [sinif] of kaynak.matchAll(/\bbg-[a-z0-9-]+\/\d+\b/g)) {
        assert.ok(sayfa.includes(`.${sinif.replace('/', '\\/')}`) || sayfa.includes(sinif.replace('/', '\\/')), `${dosya}: ${sinif} has no CSS rule`)
      }
    }
  })
})
