/**
 * NOTYA-INTAKE-EPOSTA-02 — the intake invitation from the doctor's connected mailbox: designed template, consent
 * rule, bilgi_formu only, one send per invitation, log row. Fake sender and in-memory Supabase; no network.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-kutudan-anahtari'
globalThis.fetch = (async () => { throw new Error('ağ yok') }) as typeof fetch

type K = typeof import('./bilgiFormuKutudan')
let K: K
before(async () => { K = await import('./bilgiFormuKutudan') })

type Hz = import('./hazirlik').Hazirlik
const LINK = 'https://www.notya.io/intake/qa-token'
function hazirlik(o: Omit<Partial<Hz>, 'hasta'> & { hasta?: Partial<Hz['hasta']> } = {}): Hz {
  return {
    tur: 'bilgi_formu',
    mesaj: { konu: 'Hasta bilgi formu · Dr. QA', metin: `Merhaba\n${LINK}` },
    sonKanal: null, randevuId: null, asiId: null, kuyrukId: null, randevu: null, link: LINK,
    ...o,
    hasta: { id: 'hasta-1', ad: 'QA Hasta', telefon: '', eposta: 'qa-hasta@ornek.test', veliDili: false, izinWhatsapp: null, izinEposta: true, izinKaydedilebilir: true, ...(o.hasta || {}) } as Hz['hasta'],
  }
}

type Istek = import('./otomatik').OtomatikGonderimIstegi
function gonderici(cagrilar: Istek[], ok = true): import('./otomatik').OtomatikGonderici {
  return {
    kanal: 'eposta', saglayici: 'eposta', hazirMi: async () => true,
    gonder: async (i) => { cagrilar.push(i); return ok ? { ok: true, saglayici: 'gmail', saglayiciMesajId: 'gm-1' } : { ok: false, hata: 'E-posta şu an gönderilemedi.' } },
  }
}
const oturum = { doktorId: 'doktor-1', rol: 'doktor' as const, userId: 'doktor-1' }
const secenek = { doktorAdi: 'Dr. QA', doktorBransi: null }

describe('bilgiFormuIstegi', () => {
  it('builds the designed mail (text + HTML) for a consenting patient', () => {
    const r = K.bilgiFormuIstegi(hazirlik(), 'doktor-1', 'Dr. QA')
    assert.ok('istek' in r)
    assert.equal(r.istek.alici, 'qa-hasta@ornek.test')
    assert.ok(r.istek.html?.includes('Formu doldur'))
    assert.ok(r.istek.metin.includes(LINK))
  })
  it('refuses without e-posta consent (same rule as the automatic sender)', () => {
    const r = K.bilgiFormuIstegi(hazirlik({ hasta: { izinEposta: false } }), 'doktor-1', 'Dr. QA')
    assert.ok('hata' in r && r.durum === 409)
  })
  it('refuses every other message type', () => {
    const r = K.bilgiFormuIstegi(hazirlik({ tur: 'randevu_hatirlatma' }), 'doktor-1', 'Dr. QA')
    assert.ok('hata' in r && r.durum === 400)
  })
  it('a link that is not ours goes as text only', () => {
    const r = K.bilgiFormuIstegi(hazirlik({ link: 'https://ornek.test/x' }), 'doktor-1', 'Dr. QA')
    assert.ok('istek' in r && !r.istek.html)
  })
})

describe('bilgiFormuKutudanGonder', () => {
  it('sends once, logs the send, and a repeat tap does not send again', async () => {
    const db = new SahteVeritabani()
    const cagrilar: Istek[] = []
    const kilit = new K.TekrarKilidi()
    const d = { hazirla: (async () => hazirlik()) as never, gonderici: async () => gonderici(cagrilar), kilit, simdi: () => 1_000 }
    const [a, b] = await Promise.all([
      K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { patientId: 'hasta-1', link: LINK }, secenek, d),
      K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { patientId: 'hasta-1', link: LINK }, secenek, d),
    ])
    const c = await K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { patientId: 'hasta-1', link: LINK }, secenek, { ...d, simdi: () => 30_000 })
    assert.equal(cagrilar.length, 1)
    assert.ok(a.ok && !a.tekrar && a.alici === 'qa-hasta@ornek.test')
    assert.ok(b.ok && b.tekrar)
    assert.ok(c.ok && c.tekrar)
    const kayit = db.tablo('iletisim_kayitlari')
    assert.equal(kayit.length, 1)
    assert.equal(kayit[0].durum, 'gonderildi')
    assert.equal(kayit[0].kanal, 'eposta')
    assert.equal(kayit[0].tur, 'bilgi_formu')
  })
  it('a failed send is not locked: the next tap tries again', async () => {
    const db = new SahteVeritabani()
    const cagrilar: Istek[] = []
    const kilit = new K.TekrarKilidi()
    const base = { hazirla: (async () => hazirlik()) as never, kilit, simdi: () => 1_000 }
    const a = await K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { link: LINK }, secenek, { ...base, gonderici: async () => gonderici(cagrilar, false) })
    const b = await K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { link: LINK }, secenek, { ...base, gonderici: async () => gonderici(cagrilar, true) })
    assert.ok(!a.ok && a.durum === 502)
    assert.ok(b.ok && !b.tekrar)
    assert.equal(cagrilar.length, 2)
  })
  it('no connected mailbox → nothing sent', async () => {
    const db = new SahteVeritabani()
    const r = await K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { link: LINK }, secenek, { hazirla: (async () => hazirlik()) as never, gonderici: async () => null, kilit: new K.TekrarKilidi() })
    assert.ok(!r.ok && r.durum === 409)
  })
  it('an ownership error from iletisimHazirla is passed through (foreign patient → 404)', async () => {
    const db = new SahteVeritabani()
    const cagrilar: Istek[] = []
    const r = await K.bilgiFormuKutudanGonder(db.istemci() as never, oturum, { patientId: 'yabanci' }, secenek, { hazirla: (async () => ({ durum: 404, hata: 'Hasta bulunamadı.' })) as never, gonderici: async () => gonderici(cagrilar), kilit: new K.TekrarKilidi() })
    assert.ok(!r.ok && r.durum === 404)
    assert.equal(cagrilar.length, 0)
  })
})
