/**
 * NOTYA-RANDEVU-V2 PR2 — Google Takvim: pure conversion + the sync engine against the fake database with a stubbed
 * Google API (no network). Synthetic data only.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-takvim-anahtari'

import { basHarfler, cakismaKarari, etkinlikBasligi, etkinlikKimligi, gelenEtkinlik, googleGovdesi, saklanirMi } from './donustur'
import { SahteVeritabani } from '../../../security/testing/sahteSupabase'
import { encryptPII, encrypt } from '../../../security/encryption'

describe('donustur — Notya ⇄ Google shapes', () => {
  it('title = initials by default (KVKK), full name only when chosen', () => {
    assert.equal(basHarfler('ali veli yılmaz'), 'A. V. Y.')
    assert.equal(basHarfler('  '), 'Hasta')
    assert.equal(basHarfler('İpek ışık'), 'İ. I.')
    assert.equal(etkinlikBasligi('Ayşe Kaya', false), 'A. K.')
    assert.equal(etkinlikBasligi('Ayşe Kaya', true), 'Ayşe Kaya')
  })
  it('event id is valid base32hex and stable per appointment', () => {
    const id = etkinlikKimligi('7D1A2C3E-4B5F-4A6B-8C9D-0E1F2A3B4C5D')
    assert.match(id, /^[0-9a-v]{5,1024}$/)
    assert.equal(id, etkinlikKimligi('7d1a2c3e-4b5f-4a6b-8c9d-0e1f2a3b4c5d'))
  })
  it('body carries no clinical field, only time, title and our private marker', () => {
    const b = googleGovdesi({ id: 'r1', baslangic: '2026-10-07T08:00:00.000Z', bitis: '2026-10-07T08:20:00.000Z' }, 'A. K.')
    assert.deepEqual(Object.keys(b).sort(), ['description', 'end', 'extendedProperties', 'start', 'status', 'summary', 'transparency'])
    assert.equal(b.description, 'Notya randevusu')
  })
  it('foreign events become busy blocks; free, cancelled and our own are told apart', () => {
    assert.deepEqual(gelenEtkinlik({ id: 'g1', start: { dateTime: '2026-10-07T08:00:00Z' }, end: { dateTime: '2026-10-07T09:00:00Z' } }),
      { tur: 'mesgul', disId: 'g1', bas: Date.parse('2026-10-07T08:00:00Z'), son: Date.parse('2026-10-07T09:00:00Z') })
    assert.equal(gelenEtkinlik({ id: 'g2', transparency: 'transparent', start: { dateTime: '2026-10-07T08:00:00Z' }, end: { dateTime: '2026-10-07T09:00:00Z' } }).tur, 'mesgul_sil')
    assert.equal(gelenEtkinlik({ id: 'g3', status: 'cancelled' }).tur, 'mesgul_sil')
    const n = gelenEtkinlik({ id: 'n0x', extendedProperties: { private: { notyaRandevuId: 'r1' } }, status: 'cancelled' })
    assert.equal(n.tur, 'notya')
    // all-day → Istanbul midnight bounds
    const a = gelenEtkinlik({ id: 'g4', start: { date: '2026-10-07' }, end: { date: '2026-10-08' } })
    assert.deepEqual(a, { tur: 'mesgul', disId: 'g4', bas: Date.parse('2026-10-06T21:00:00Z'), son: Date.parse('2026-10-07T21:00:00Z') })
  })
  it('conflict: our own echo is nothing; a move or a delete in Google is a proposal', () => {
    const e = { baslangic: '2026-10-07T08:00:00.000Z', bitis: '2026-10-07T08:20:00.000Z', durum: 'aktif' }
    assert.deepEqual(cakismaKarari(e, { bas: Date.parse(e.baslangic), son: Date.parse(e.bitis), silindi: false }), { tur: 'yok' })
    assert.equal(cakismaKarari(e, { bas: Date.parse('2026-10-07T09:00:00Z'), son: Date.parse('2026-10-07T09:20:00Z'), silindi: false }).tur, 'tasindi')
    assert.equal(cakismaKarari(e, { bas: null, son: null, silindi: true }).tur, 'silindi')
    assert.equal(cakismaKarari({ ...e, durum: 'silindi' }, { bas: null, son: null, silindi: true }).tur, 'yok', 'our own delete echo')
    assert.equal(cakismaKarari(null, { bas: 1, son: 2, silindi: false }).tur, 'yok', 'unknown id (other doctor / copied event) is ignored')
  })
  it('keeps busy blocks only around the booking window', () => {
    const simdi = Date.now()
    assert.equal(saklanirMi(simdi - 3 * 86400e3, simdi - 2 * 86400e3, simdi), false)
    assert.equal(saklanirMi(simdi + 86400e3, simdi + 86400e3 + 1, simdi), true)
  })
})

describe('senk — two-way sync against a stubbed Google', () => {
  const asil = globalThis.fetch
  let db: SahteVeritabani
  let istekler: { yontem: string; url: string; govde: any }[]
  let googleOlaylari: any[]
  let doktor: string
  let hasta: string

  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'qa-istemci'
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'qa-sir'
    db = new SahteVeritabani()
    istekler = []
    googleOlaylari = []
    doktor = randomUUID()
    hasta = db.ekle('patients', { doctor_id: doktor, name_encrypted: encrypt(JSON.stringify({ ad: 'Ayşe', soyad: 'Kaya' })) }).id as string
    db.ekle('google_takvim_baglantilari', { doktor_id: doktor, refresh_token_encrypted: encryptPII('qa-yenileme'), takvim_id: 'primary', durum: 'bagli', tam_ad: false, sync_token: null, sayfa_jetonu: null, kanal_id: null })
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const govde = init?.body && typeof init.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init?.body
      istekler.push({ yontem: init?.method || 'GET', url: String(url), govde })
      const yanit = (d: number, v: unknown) => new Response(d === 204 ? null : JSON.stringify(v), { status: d })
      if (String(url).startsWith('https://oauth2.googleapis.com/token')) return yanit(200, { access_token: 'qa-erisim' })
      if (String(url).includes('/events?') && (init?.method || 'GET') === 'GET') return yanit(200, { items: googleOlaylari, nextSyncToken: 'st-1', summary: 'qa@ornek.test' })
      if (String(url).includes('/events/watch')) return yanit(200, { resourceId: 'res-1', expiration: String(Date.now() + 7 * 86400e3) })
      if (init?.method === 'POST' && String(url).includes('/events?')) return yanit(200, { id: govde.id })
      if (init?.method === 'PATCH') return yanit(200, {})
      if (init?.method === 'DELETE') return yanit(204, null)
      return yanit(404, {})
    }) as typeof fetch
  })
  afterEach(() => { globalThis.fetch = asil })

  async function senk() {
    const { doktoruSenkle } = await import('./senk')
    return doktoruSenkle(db.istemci() as never, doktor, { bitis: Date.now() + 10_000 })
  }

  it('pushes a confirmed appointment with initials only, then removes it when cancelled', async () => {
    const bas = new Date(Date.now() + 2 * 86400e3).toISOString()
    const r = db.ekle('randevular', { doktor_id: doktor, patient_id: hasta, baslangic: bas, bitis: new Date(Date.parse(bas) + 20 * 60e3).toISOString(), durum: 'onaylandi', notlar: 'GIZLI-NOT' })
    const s = await senk()
    assert.equal(s.gonderilen, 1)
    const ek = istekler.find((x) => x.yontem === 'POST' && x.url.includes('/events?sendUpdates'))!
    assert.equal(ek.govde.summary, 'A. K.')
    assert.ok(!JSON.stringify(ek.govde).includes('GIZLI-NOT'), 'no note text to Google')
    assert.equal(db.tablo('randevu_google_eslesme')[0].durum, 'aktif')
    // a second run does not push again
    istekler = []
    await senk()
    assert.ok(!istekler.some((x) => x.yontem === 'POST' && x.url.includes('/events?sendUpdates')))
    // cancelled in Notya → event deleted
    r.durum = 'iptal'
    await senk()
    assert.ok(istekler.some((x) => x.yontem === 'DELETE'))
    assert.equal(db.tablo('randevu_google_eslesme')[0].durum, 'silindi')
  })

  it('imports foreign events as busy blocks without titles; our own moved event becomes a proposal', async () => {
    const bas = new Date(Date.now() + 2 * 86400e3)
    const r = db.ekle('randevular', { doktor_id: doktor, patient_id: hasta, baslangic: bas.toISOString(), bitis: new Date(bas.getTime() + 20 * 60e3).toISOString(), durum: 'onaylandi' })
    await senk() // push first
    googleOlaylari = [
      { id: 'yabanci', summary: 'Özel: diş hekimi', start: { dateTime: new Date(bas.getTime() + 3600e3).toISOString() }, end: { dateTime: new Date(bas.getTime() + 7200e3).toISOString() } },
      { id: etkinlikKimligi(String(r.id)), extendedProperties: { private: { notyaRandevuId: r.id } }, start: { dateTime: new Date(bas.getTime() + 86400e3).toISOString() }, end: { dateTime: new Date(bas.getTime() + 86400e3 + 20 * 60e3).toISOString() } },
    ]
    const s = await senk()
    assert.equal(s.oneri, 1)
    const blok = db.tablo('randevu_dis_mesgul')
    assert.equal(blok.length, 1)
    assert.ok(!JSON.stringify(blok).includes('diş hekimi'), 'no title stored')
    const o = db.tablo('randevu_takvim_onerileri')[0]
    assert.equal(o.tur, 'tasindi')
    assert.equal(r.baslangic, bas.toISOString(), 'never applied silently')
    assert.equal(db.tablo('google_takvim_baglantilari')[0].sync_token, 'st-1')
  })

  it('a copied private marker pointing at another doctor’s appointment is ignored', async () => {
    const baska = db.ekle('randevular', { doktor_id: randomUUID(), patient_id: null, baslangic: new Date().toISOString(), bitis: new Date(Date.now() + 60e3).toISOString(), durum: 'onaylandi' })
    googleOlaylari = [{ id: 'kopya', extendedProperties: { private: { notyaRandevuId: baska.id } }, status: 'cancelled' }]
    const s = await senk()
    assert.equal(s.oneri, 0)
    assert.equal(db.tablo('randevu_takvim_onerileri').length, 0)
  })

  it('opens a push channel and stores only a hash of its token', async () => {
    await senk()
    const b = db.tablo('google_takvim_baglantilari')[0]
    assert.ok(b.kanal_id)
    assert.match(String(b.kanal_jeton_hash), /^[0-9a-f]{64}$/)
    const izle = istekler.find((x) => x.url.includes('/events/watch'))!
    assert.notEqual(izle.govde.token, b.kanal_jeton_hash)
  })

  it('dormant without credentials: nothing is called', async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID
    const s = await senk()
    assert.equal(s.hata, 'erisim_yok')
    assert.equal(istekler.length, 0)
  })
})
