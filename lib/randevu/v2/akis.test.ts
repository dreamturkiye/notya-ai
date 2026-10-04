import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ayarNormalize, acikTurler, VARSAYILAN_AYAR } from './ayar'
import { eskalasyonGerekliMi, hastaIzinleri, onayGerekirMi, oneriBekliyorMu, v2Durum } from './durum'
import { jetonSonu, randevuJetonu, randevuJetonuCoz } from './jeton'
import { randevuIcs, satirKatla } from './ics'
import { hatirlatmaZamanlari, isGecerliMi, onayIsleri } from './isPlani'
import { randevuEpostasi } from './eposta'
import { kayitTuru } from './kanal'
import { epostaMesaji } from '../../iletisim/otomatik/eposta/mime'

const ID = '7d1a2c3e-4b5f-4a6b-8c9d-0e1f2a3b4c5d'
const GIZLI = 'test-gizli'
const H = 3_600_000

describe('ayar — default OFF, normalised from DB rows and bodies alike', () => {
  it('default is off and every portal type open', () => {
    assert.equal(VARSAYILAN_AYAR.acik, false)
    assert.equal(ayarNormalize(null).acik, false)
    assert.deepEqual(acikTurler(VARSAYILAN_AYAR).map((t) => t.tur), ['ilk_muayene', 'muayene', 'kontrol'])
  })
  it('reads snake_case rows and clamps values', () => {
    const a = ayarNormalize({ acik: true, tampon_dk: 999, onay_modu: 'mevcut_hasta_otomatik', turler: { kontrol: { acik: false, sure: 1 } } })
    assert.equal(a.acik, true)
    assert.equal(a.tamponDk, 120)
    assert.equal(a.onayModu, 'mevcut_hasta_otomatik')
    assert.deepEqual(a.turler.kontrol, { acik: false, sure: 5 })
    assert.equal(ayarNormalize({ acik: 'true' }).acik, false, 'only a real boolean turns it on')
  })
})

describe('durum — V2 states mapped onto existing values', () => {
  const b = new Date(Date.now() + 72 * H).toISOString()
  it('maps talep / onaylandi / teyit / geldi / gelmedi / iptal', () => {
    assert.equal(v2Durum({ durum: 'talep', baslangic: b }), 'talep')
    assert.equal(v2Durum({ durum: 'onaylandi', baslangic: b }), 'onaylandi')
    assert.equal(v2Durum({ durum: 'onaylandi', baslangic: b, hasta_teyit_at: b }), 'teyit_edildi')
    assert.equal(v2Durum({ durum: 'tamamlandi', baslangic: b }), 'geldi')
    assert.equal(v2Durum({ durum: 'gelmedi', baslangic: b }), 'gelmedi')
    assert.equal(v2Durum({ durum: 'iptal', baslangic: b }), 'iptal')
    assert.equal(v2Durum({ durum: 'planlandi', baslangic: b }), 'planlandi')
  })
  it('cancel / reschedule only before the cutoff; a pending request can always be withdrawn', () => {
    const simdi = Date.now()
    const yakin = new Date(simdi + 10 * H).toISOString()
    assert.equal(hastaIzinleri({ durum: 'onaylandi', baslangic: yakin }, { iptalSinirSaat: 24 }, simdi).iptal, false)
    assert.equal(hastaIzinleri({ durum: 'onaylandi', baslangic: yakin }, { iptalSinirSaat: 24 }, simdi).teyit, true)
    assert.equal(hastaIzinleri({ durum: 'onaylandi', baslangic: b }, { iptalSinirSaat: 24 }, simdi).iptal, true)
    assert.equal(hastaIzinleri({ durum: 'talep', baslangic: yakin }, { iptalSinirSaat: 24 }, simdi).iptal, true)
    assert.equal(hastaIzinleri({ durum: 'iptal', baslangic: b }, { iptalSinirSaat: 24 }, simdi).ertele, false)
    assert.equal(hastaIzinleri({ durum: 'onaylandi', baslangic: new Date(simdi - H).toISOString() }, { iptalSinirSaat: 0 }, simdi).iptal, false)
  })
  it('escalation after the configured period, never for an answered proposal', () => {
    const simdi = Date.now()
    const eski = new Date(simdi - 5 * H).toISOString()
    assert.equal(eskalasyonGerekliMi({ durum: 'talep', talep_at: eski }, { eskalasyonSaat: 4 }, simdi), true)
    assert.equal(eskalasyonGerekliMi({ durum: 'talep', talep_at: eski }, { eskalasyonSaat: 6 }, simdi), false)
    assert.equal(eskalasyonGerekliMi({ durum: 'talep', talep_at: eski, oneri_at: eski }, { eskalasyonSaat: 4 }, simdi), false)
    assert.equal(eskalasyonGerekliMi({ durum: 'onaylandi', talep_at: eski }, { eskalasyonSaat: 4 }, simdi), false)
  })
  it('approval: every request by default; auto-confirm only existing patients when chosen', () => {
    assert.equal(onayGerekirMi({ onayModu: 'hepsi_onay' }, true), true)
    assert.equal(onayGerekirMi({ onayModu: 'mevcut_hasta_otomatik' }, true), false)
    assert.equal(onayGerekirMi({ onayModu: 'mevcut_hasta_otomatik' }, false), true)
    assert.equal(oneriBekliyorMu({ durum: 'talep', baslangic: b, oneri_at: b }), true)
  })
})

describe('jeton — signed single-appointment links (HMAC, same pattern as the portal)', () => {
  const son = Date.now() + 48 * H
  it('round-trips and names exactly one appointment and action', () => {
    const j = randevuJetonu(ID, 'iptal', son, GIZLI)!
    assert.deepEqual(randevuJetonuCoz(j, Date.now(), GIZLI), { randevuId: ID, eylem: 'iptal', son: Math.floor(son) })
  })
  it('rejects tampering, another action, expiry and a different secret', () => {
    const j = randevuJetonu(ID, 'geliyorum', son, GIZLI)!
    assert.equal(randevuJetonuCoz(j.replace('geliyorum', 'iptal'), Date.now(), GIZLI), null)
    assert.equal(randevuJetonuCoz(j, son + 1, GIZLI), null)
    assert.equal(randevuJetonuCoz(j, Date.now(), 'baska'), null)
    assert.equal(randevuJetonuCoz(`${j}x`, Date.now(), GIZLI), null)
  })
  it('no secret → no link, never a fallback', () => {
    assert.equal(randevuJetonu(ID, 'iptal', son, ''), null)
    assert.equal(randevuJetonu('not-a-uuid', 'iptal', son, GIZLI), null)
  })
  it('links live until the day after the appointment', () => {
    assert.equal(jetonSonu('2026-10-05T07:00:00.000Z'), Date.parse('2026-10-06T19:00:00.000Z'))
  })
})

describe('ics — confirmation attachment', () => {
  it('UTC times, CRLF, stable UID, no clinical content', () => {
    const ics = randevuIcs({ randevuId: ID, baslangic: '2026-10-05T07:00:00.000Z', bitis: '2026-10-05T07:20:00.000Z', baslik: 'Randevu · Dr. Ayşe, Kaya', simdi: Date.parse('2026-10-01T00:00:00Z') })
    assert.match(ics, /DTSTART:20261005T070000Z\r\n/)
    assert.match(ics, /DTEND:20261005T072000Z\r\n/)
    assert.match(ics, new RegExp(`UID:${ID}@notya.io`))
    assert.match(ics, /SUMMARY:Randevu · Dr\. Ayşe\\, Kaya/)
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
    assert.ok(!/\n(?!\s)[^\r]*\n/.test(ics.replace(/\r\n/g, '')), 'only CRLF line endings')
  })
  it('folds long lines at 75 octets without splitting a Turkish letter', () => {
    const k = satirKatla(`SUMMARY:${'ş'.repeat(60)}`)
    for (const s of k.split('\r\n')) assert.ok(Buffer.byteLength(s, 'utf8') <= 75)
    assert.equal(k.replace(/\r\n /g, ''), `SUMMARY:${'ş'.repeat(60)}`)
  })
})

describe('isPlani — day-before 10:00 and morning-of 08:00 Istanbul, stored UTC', () => {
  const bas = '2026-10-07T08:00:00.000Z' // Wednesday 11:00 Istanbul
  it('schedules both reminders in the future', () => {
    const z = hatirlatmaZamanlari(bas, Date.parse('2026-10-05T12:00:00Z'))
    assert.deepEqual(z, [
      { tur: 'gun_once', zaman: '2026-10-06T07:00:00.000Z' },
      { tur: 'sabah', zaman: '2026-10-07T05:00:00.000Z' },
    ])
  })
  it('skips a passed day-before reminder and a morning reminder too close to the visit', () => {
    assert.deepEqual(hatirlatmaZamanlari(bas, Date.parse('2026-10-06T09:00:00Z')).map((x) => x.tur), ['sabah'])
    assert.deepEqual(hatirlatmaZamanlari('2026-10-07T05:30:00.000Z', Date.parse('2026-10-05T12:00:00Z')).map((x) => x.tur), ['gun_once'])
  })
  it('confirmation jobs = e-mail now + reminders', () => {
    const simdi = Date.parse('2026-10-05T12:00:00Z')
    assert.deepEqual(onayIsleri(bas, simdi).map((x) => x.tur), ['onay_eposta', 'gun_once', 'sabah'])
  })
  it('a moved or cancelled appointment invalidates its old jobs', () => {
    const simdi = Date.parse('2026-10-05T12:00:00Z')
    assert.equal(isGecerliMi('gun_once', '2026-10-06T07:00:00.000Z', { durum: 'onaylandi', baslangic: bas }, simdi), true)
    assert.equal(isGecerliMi('gun_once', '2026-10-06T07:00:00.000Z', { durum: 'onaylandi', baslangic: '2026-10-09T08:00:00.000Z' }, simdi), false)
    assert.equal(isGecerliMi('gun_once', '2026-10-06T07:00:00.000Z', { durum: 'iptal', baslangic: bas }, simdi), false)
    assert.equal(isGecerliMi('red_eposta', 'x', { durum: 'iptal', baslangic: bas }, simdi), true)
    assert.equal(isGecerliMi('oneri_eposta', 'x', { durum: 'talep', baslangic: bas, oneri_at: null }, simdi), false)
  })
})

describe('eposta — logistics only, guardian wording by age, action links', () => {
  const g = { hastaAdi: 'Ali Veli', doktorAdi: 'Dr. Ayşe Kaya', randevuIso: '2026-10-07T08:00:00.000Z', bugunIso: '2026-10-05', linkler: { geliyorum: 'https://x/g', ertele: 'https://x/e', iptal: 'https://x/i' } }
  it('confirmation carries the three links and the signature', () => {
    const m = randevuEpostasi('onay_eposta', g)
    assert.match(m.konu, /Randevunuz onaylandı · Dr\. Ayşe Kaya/)
    for (const l of ['https://x/g', 'https://x/e', 'https://x/i']) assert.ok(m.metin.includes(l))
    assert.ok(m.metin.includes('Merhaba Ali Veli,'))
  })
  it('a minor is addressed through the guardian, never by first name', () => {
    const m = randevuEpostasi('gun_once', { ...g, veliDili: true })
    assert.ok(m.metin.startsWith('Merhaba,'))
    assert.ok(m.metin.includes('Ali Veli adına randevunuz'))
  })
  it('no links when the secret is missing', () => {
    assert.ok(!randevuEpostasi('onay_eposta', { ...g, linkler: {} }).metin.includes('http'))
  })
  it('logged as the existing message types', () => {
    assert.equal(kayitTuru('gun_once'), 'randevu_hatirlatma')
    assert.equal(kayitTuru('red_eposta'), 'randevu_iptali')
    assert.equal(kayitTuru('onay_eposta'), 'randevu_degisikligi')
  })
})

describe('mime — optional attachment keeps the plain message byte-identical', () => {
  const m = { alici: 'hasta@ornek.test', konu: 'Randevunuz onaylandı', metin: 'Merhaba' }
  it('without attachments: unchanged single-part text', () => {
    assert.equal(epostaMesaji(m), epostaMesaji({ ...m, ekler: [] }))
    assert.match(epostaMesaji(m), /Content-Type: text\/plain; charset="UTF-8"/)
  })
  it('with an .ics: multipart/mixed with the calendar part', () => {
    const r = epostaMesaji({ ...m, ekler: [{ ad: 'randevu.ics', tur: 'text/calendar; charset=UTF-8; method=PUBLISH', icerik: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n' }] })
    assert.match(r, /Content-Type: multipart\/mixed; boundary="notya_[0-9a-f]+"/)
    assert.match(r, /Content-Disposition: attachment; filename="randevu.ics"/)
  })
  it('drops an attachment with an unsafe name or type', () => {
    const r = epostaMesaji({ ...m, ekler: [{ ad: 'a"\r\nBcc: x', tur: 'text/calendar', icerik: 'x' }] })
    assert.equal(r, epostaMesaji(m))
  })
})
