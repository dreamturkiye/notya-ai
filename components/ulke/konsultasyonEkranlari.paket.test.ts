/**
 * NOTYA-ULKE-MESAJ-01 — THE SCREENS OF THE CONSULTATION BETWEEN DOCTORS, for whichever pack is active (run once per
 * country folder). Names no country: every expectation is read from the active pack's catalogue (KonsultasyonMetni).
 *
 *   A. the code            none yet → "create"; a code → shown in two halves, copy; THE NEW-CODE WARNING BEFORE THE
 *                          CONFIRMATION; "there is no list of doctors"
 *   B. asked of me         "only what was shared, a copy, nothing else of the patient" ALWAYS; who asked; the question;
 *                          the copy of a note (the template's own headings) or of a summary, as text; until when;
 *                          the answer box with "sent once" BEFORE sending; an answered and a closed one have no box;
 *                          NO PATIENT NAME AND NO LINK TO A FILE anywhere
 *   C. what I asked        the patient (a link on the tile, none on the patient's own file), the colleague, read /
 *                          not read, the answer, open / period over / closed; THE CLOSING WARNING BEFORE THE
 *                          CONFIRMATION with the pack's own number of days
 *   D. asking              the form on the patient's file: code and "find", the question, what to share, THE CONSENT
 *                          SENTENCE with its tick-box, "nobody is notified"; no note → only the question
 *   E. rules, catalogue    every sentence is the pack's; mounted only where the country has consultation; same shape
 *                          and placeholders in every form; nothing of another country
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { KonsultasyonMetni } from '@/lib/ulke/arayuz'
import type { GelenKonsultasyon, GidenKonsultasyon, PaylasilanKopya } from '@/lib/ulke/konsultasyon/sabitler'
import type { DilKodu, UlkePaketi } from '@/lib/ulke/tipler'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const KOK = resolve(__dirname, '../..')
const h = React.createElement
const bos = () => {}
const kod = (d: string) => readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
function yaprak(o: unknown, on = ''): [string, string][] {
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : yaprak(v, `${on}${k}.`)))
}

let paket: UlkePaketi
let ACIK = false
let FORMLAR: readonly DilKodu[] = []
let A: typeof import('@/lib/ulke/arayuz')
let B: typeof import('@/lib/ulke/arayuz/bicim')
let Y: typeof import('@/lib/ulke/arayuz/yerTutucu')
let C: typeof import('@/lib/ulke/konsultasyon/sabitler')
let E: typeof import('./uygulama/Konsultasyonlar')
let Kabuk: typeof import('./uygulama/Kabuk')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const G1 = '2026-10-12T05:00:00.000Z', G2 = '2026-10-14T06:30:00.000Z', G3 = '2026-11-11T05:00:00.000Z', G4 = '2026-10-28T06:30:00.000Z'
const QA = 'QA-CONSULT'
const HASTA_ADI = 'QA Patient Never Shown To The Colleague'
const notKopyasi = (): PaylasilanKopya => ({ tur: 'not', muayeneGunu: '2026-10-05', dil: FORMLAR[0], sablon: paket.uygulama?.roller?.[0] ?? A.genelSablon(), s: `${QA} copy S <u>not markup</u>`, o: `${QA} copy O`, a: `${QA} copy A`, p: `${QA} copy P`, alanlar: { no_such_field_of_this_pack: `${QA} unknown field` } })
const ozetKopyasi = (): PaylasilanKopya => ({ tur: 'ozet', muayeneGunu: '2026-10-05', dil: FORMLAR[0], metin: `${QA} summary copy` })
const gelen = (ek: Partial<GelenKonsultasyon> = {}): GelenKonsultasyon => ({ id: 'k1', isteyen: { ad: 'QA Doctor A', rol: 'QA-ROLE-A' }, soru: `${QA} question`, paylasimTuru: 'not', kopya: notKopyasi(), olusturuldu: G1, okundu: null, cevap: null, cevapAni: null, kapandi: null, okunabilir: G3, ...ek })
const giden = (ek: Partial<GidenKonsultasyon> = {}): GidenKonsultasyon => ({ id: 'k1', hastaId: 'h-1', hastaAdi: HASTA_ADI, meslektas: { ad: 'QA Doctor B', rol: 'QA-ROLE-B' }, soru: `${QA} question`, paylasimTuru: 'ozet', kopya: ozetKopyasi(), rizaSurumu: 'qa-riza', olusturuldu: G1, okundu: null, cevap: null, cevapAni: null, kapandi: null, sonGecerlilik: G3, erisimBitis: null, suresiDoldu: false, ...ek })

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && Boolean(arayuz?.konsultasyonMetinleri)
  FORMLAR = paket.uygulama?.diller ?? []
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); B = await import('@/lib/ulke/arayuz/bicim'); Y = await import('@/lib/ulke/arayuz/yerTutucu'); C = await import('@/lib/ulke/konsultasyon/sabitler')
  E = await import('./uygulama/Konsultasyonlar'); Kabuk = await import('./uygulama/Kabuk')
})

const x = (dil: DilKodu): KonsultasyonMetni => A.konsultasyonMetni(dil)
const cerceve = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil, m: A.uygulamaMetni(dil), ad: 'QA Doctor', aktif: 'araclar', cikis: bos, children: ic }))
type KodEk = Partial<Parameters<typeof import('./uygulama/Konsultasyonlar').KodKarti>[0]>
const kodKarti = (dil: DilKodu, k: string | null | undefined, ek: KodEk = {}) => cerceve(dil, h(E.KodKarti, { k: x(dil).kod, kod: k, bekliyor: false, bildirim: null, onaySoruluyor: false, uret: bos, yenileSor: bos, yenileVazgec: bos, kopyala: bos, ...ek }))
type GelenEk = Partial<Parameters<typeof import('./uygulama/Konsultasyonlar').GelenListesi>[0]>
const gelenListe = (dil: DilKodu, liste: GelenKonsultasyon[] | null, ek: GelenEk = {}) => cerceve(dil, h(E.GelenListesi, { x: x(dil), m: A.uygulamaMetni(dil), dil, liste, cevaplar: {}, setCevap: bos, gonder: bos, bekleyen: null, hata: null, ...ek }))
type GidenEk = Partial<Parameters<typeof import('./uygulama/Konsultasyonlar').GidenListesi>[0]>
const gidenListe = (dil: DilKodu, liste: GidenKonsultasyon[] | null, ek: GidenEk = {}) => cerceve(dil, h(E.GidenListesi, { x: x(dil), m: A.uygulamaMetni(dil), dil, liste, bekliyor: false, hastaBaglantisi: true, kapatSorulan: null, kapatIste: bos, kapatOnayla: bos, kapatVazgec: bos, ...ek }))
type IsteEk = Partial<Parameters<typeof import('./uygulama/Konsultasyonlar').KonsultasyonIsteGorunumu>[0]>
const isteKarti = (dil: DilKodu, ek: IsteEk = {}) => cerceve(dil, h(E.KonsultasyonIsteGorunumu, { x: x(dil), form: E.BOS_ISTEK, setForm: bos, notlar: [], meslektas: null, bul: bos, gonder: bos, bekliyor: false, hata: null, ...ek }))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const var_ = (html: string, metin: string, ne: string) => assert.ok(html.includes(esc(metin)), `${ne}: "${metin}" is not on the screen`)
const yok = (html: string, metin: string, ne: string) => assert.ok(!html.includes(esc(metin)), `${ne}: "${metin}" is on the screen`)
const say = (html: string, re: RegExp) => (html.match(re) ?? []).length

describe('consultation screens — the account\'s own code', () => {
  it('a pack without the consultation catalogue has nothing to draw', async () => {
    if (ACIK) return
    assert.ok(!(await import('@/countries/active/arayuz')).AKTIF_ARAYUZ?.konsultasyonMetinleri)
  })

  it('no code yet → what the code is for, THAT THERE IS NO LIST OF DOCTORS, and "create"; a code → shown in two halves with "copy" and "new code"', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = x(dil).kod
      const hic = kodKarti(dil, null)
      for (const m of [k.baslik, k.aciklama, k.yok, k.uret]) var_(hic, m, `${dil} no code`)
      assert.match(hic, /data-bolum="konsultasyon-kodu" data-kod-durumu="yok"/); assert.equal(say(hic, /data-eylem="kod-uret"/g), 1); assert.equal(say(hic, /data-eylem="kod-(kopyala|yenile)"/g), 0)
      const var2 = kodKarti(dil, 'ABCDE23456')
      for (const m of [k.aciklama, 'ABCDE-23456', k.kopyala, k.yenile]) var_(var2, m, `${dil} code`)
      for (const m of [k.yok, k.uret, k.yenileUyari]) yok(var2, m, `${dil} code`)
      assert.match(var2, /data-kod-durumu="var"/)
      assert.doesNotMatch(kodKarti(dil, undefined), /data-eylem=|data-kod-durumu=/, `${dil}: something is offered before the code is known`)
      for (const [bildirim, metin] of [['kopyalandi', k.kopyalandi], ['kopyalanamadi', k.kopyalanamadi], ['yapilamadi', k.yapilamadi]] as const) var_(kodKarti(dil, 'ABCDE23456', { bildirim }), metin, `${dil} ${bildirim}`)
      temiz(gorunurMetin(var2), `code ${dil}`)
    }
  })

  it('A NEW CODE: what it does to the old one is shown BEFORE the confirmation', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = x(dil).kod
      const html = kodKarti(dil, 'ABCDE23456', { onaySoruluyor: true })
      for (const m of [k.yenileUyari, k.yenileOnay, k.vazgec]) var_(html, m, `${dil} confirm`)
      assert.ok(html.indexOf(esc(k.yenileUyari)) < html.indexOf('data-eylem="kod-yenile-onayla"'))
      assert.equal(say(html, /data-eylem="kod-yenile"/g), 0); assert.equal(say(html, /data-eylem="kod-yenile-onayla"/g), 1)
    }
  })

  it('the code as it is typed and shown: two halves; spaces, a hyphen and lower case are forgiven; anything else is no code', () => {
    if (!ACIK) return
    assert.equal(C.koduYaz('ABCDE23456'), 'ABCDE-23456')
    for (const t of ['ABCDE23456', 'abcde-23456', ' abcde 23456 ', 'ABCDE - 23456']) assert.equal(C.koduDuzelt(t), 'ABCDE23456', t)
    for (const t of ['', 'ABCDE2345', 'ABCDE234567', 'ABCDE2345O', 'ABCDE23451', 'ABCDE2345I', 'ABCDE2345L', 'ABCDE2345%', null, 12]) assert.equal(C.koduDuzelt(t), null, String(t))
  })
})

describe('consultation screens — asked of me: the copy, and nothing else of the patient', () => {
  it('"ONLY WHAT WAS SHARED, A COPY, NOTHING ELSE" is said always: loading, none, some — and no patient name or link to a file is ever drawn', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const g = x(dil).gelen
      for (const [ad, html] of [['loading', gelenListe(dil, null)], ['none', gelenListe(dil, [])], ['some', gelenListe(dil, [gelen(), gelen({ id: 'k2', paylasimTuru: 'ozet', kopya: ozetKopyasi() }), gelen({ id: 'k3', paylasimTuru: 'yok', kopya: null })])]] as const) {
        var_(html, g.aciklama, `${dil} ${ad}`); var_(html, g.baslik, `${dil} ${ad}`)
        assert.equal(say(html, /data-alan="gelen-aciklama"/g), 1)
        yok(html, HASTA_ADI, `${dil} ${ad}`)
        assert.doesNotMatch(html, new RegExp(`href="${Kabuk.YOL.hasta.replace(/[/]/g, '\\/')}\\?`), `${dil} ${ad}: a link to a patient's file on the consulted doctor's list`)
        assert.doesNotMatch(html, /data-konsultasyon-hastasi=/)
        temiz(gorunurMetin(html), `asked of me ${dil} ${ad}`)
      }
      var_(gelenListe(dil, []), g.bos, `${dil} none`)
      var_(gelenListe(dil, null, { yuklenemedi: true }), x(dil).giden.yuklenemedi, `${dil} failed`)
    }
  })

  it('ONE CONSULTATION: who asked, "new", the question, the copy of the note under the template\'s own headings AS TEXT, that it is a copy, until when — and the answer box with "sent once" before the button', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const g = x(dil).gelen, m = A.uygulamaMetni(dil)
      const html = gelenListe(dil, [gelen()])
      const sablon = notKopyasi().tur === 'not' ? (notKopyasi() as { sablon: string }).sablon : ''
      for (const t of [Y.yerine(g.isteyen, 'QA Doctor A · QA-ROLE-A'), g.yeni, g.soru, `${QA} question`, g.paylasilan, Y.yerine(g.paylasimNot, B.tarihYaz('2026-10-05')), g.kopyaNotu, Y.yerine(g.okunabilir, B.tarihYaz(G3)), g.cevapEtiketi, g.cevapUyari, g.cevapGonder, `${QA} copy S <u>not markup</u>`, `${QA} copy O`, `${QA} copy A`, `${QA} copy P`]) var_(html, t, `${dil} one`)
      for (const b of ['s', 'o', 'a', 'p'] as const) var_(html, A.bolumAdi(sablon, b, dil) ?? m.not[b], `${dil}: the heading of section ${b}`)
      assert.doesNotMatch(html, /<u>not markup<\/u>/, 'the copy was drawn as markup')
      // LEAK RULE: a field key this pack does not define is not drawn, whatever arrives
      yok(html, `${QA} unknown field`, `${dil}: an unknown field of the copy`)
      assert.match(html, /data-konsultasyon="k1" data-durum="bekliyor"/); assert.match(html, /data-alan="konsultasyon-kopya" data-kopya="not"/)
      // nothing of the copy can be edited: the only field is the answer's
      assert.equal(say(html, /<textarea/g), 1); assert.equal(say(html, /<input/g), 0)
      assert.match(html, new RegExp(`<textarea[^>]*name="cevap"[^>]*maxLength="${C.CEVAP_AZAMI}"`))
      assert.ok(html.indexOf('data-alan="cevap-uyari"') < html.indexOf('data-eylem="konsultasyon-cevapla"'), `${dil}: "sent once" comes after the button`)
      for (const [kod2, metin] of [['bos', g.cevapBos], ['uzun', Y.yerine(g.cokUzun, C.CEVAP_AZAMI)], ['gonderilemedi', g.cevapGonderilemedi]] as const) var_(gelenListe(dil, [gelen()], { hata: { id: 'k1', kod: kod2 } }), metin, `${dil} ${kod2}`)
      yok(gelenListe(dil, [gelen()], { hata: { id: 'another', kod: 'bos' } }), g.cevapBos, `${dil}: another consultation's error`)
      var_(gelenListe(dil, [gelen()], { bekleyen: 'k1' }), g.cevapGonderiliyor, `${dil} sending`)
    }
  })

  it('the summary\'s copy and "only the question"; an ANSWERED one shows the answer and no box; a CLOSED one says so and has no box', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const g = x(dil).gelen
      const ozet = gelenListe(dil, [gelen({ paylasimTuru: 'ozet', kopya: ozetKopyasi(), okundu: G1 })])
      for (const t of [Y.yerine(g.paylasimOzet, B.tarihYaz('2026-10-05')), `${QA} summary copy`, g.kopyaNotu]) var_(ozet, t, `${dil} summary`)
      yok(ozet, `>${g.yeni}<`, `${dil}: "new" on one that was read`)
      const yalniz = gelenListe(dil, [gelen({ paylasimTuru: 'yok', kopya: null })])
      var_(yalniz, g.paylasimYok, `${dil} question only`); yok(yalniz, g.kopyaNotu, `${dil} question only`); assert.doesNotMatch(yalniz, /data-alan="konsultasyon-kopya"/)
      const cevapli = gelenListe(dil, [gelen({ okundu: G1, cevap: `${QA} my answer`, cevapAni: G2 })])
      for (const t of [Y.yerine(g.cevabiniz, B.tarihYaz(G2)), `${QA} my answer`]) var_(cevapli, t, `${dil} answered`)
      assert.equal(say(cevapli, /<textarea|data-eylem="konsultasyon-cevapla"/g), 0, `${dil}: an answer box on an answered consultation`)
      assert.match(cevapli, /data-durum="cevaplandi"/)
      const kapali = gelenListe(dil, [gelen({ okundu: G1, kapandi: G2, okunabilir: G4 })])
      for (const t of [g.kapali, Y.yerine(g.okunabilir, B.tarihYaz(G4))]) var_(kapali, t, `${dil} closed`)
      assert.equal(say(kapali, /<textarea|data-eylem="konsultasyon-cevapla"/g), 0, `${dil}: an answer box on a closed consultation`)
    }
  })
})

describe('consultation screens — what I asked', () => {
  it('the patient with a link on the tile, the colleague, not read / read, no answer / the answer, what was shared, and the three states', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const g = x(dil).giden
      const html = gidenListe(dil, [giden(), giden({ id: 'k2', okundu: G2, cevap: `${QA} the answer`, cevapAni: G2 }), giden({ id: 'k3', suresiDoldu: true }), giden({ id: 'k4', kapandi: G2, erisimBitis: G4, paylasimTuru: 'yok', kopya: null })])
      for (const t of [g.baslik, HASTA_ADI, Y.yerine(g.meslektas, 'QA Doctor B · QA-ROLE-B'), g.okunmadi, Y.yerine(g.okundu, B.tarihYaz(G2)), g.cevapYok, Y.yerine(g.cevap, B.tarihYaz(G2)), `${QA} the answer`, g.soru, `${QA} question`, g.paylasilan, `${QA} summary copy`,
        Y.yerine(g.durumAcik, B.tarihYaz(G3)), g.durumSuresiDoldu, Y.yerine(g.durumKapali, B.tarihYaz(G2), B.tarihYaz(G4)), g.kapat, x(dil).gelen.paylasimYok]) var_(html, t, `${dil} asked`)
      assert.match(html, new RegExp(`href="${Kabuk.YOL.hasta.replace(/[/]/g, '\\/')}\\?id=h-1" data-konsultasyon-hastasi="h-1"`))
      for (const [id, durum] of [['k1', 'acik'], ['k3', 'suresi-doldu'], ['k4', 'kapali']]) assert.match(html, new RegExp(`data-konsultasyon="${id}" data-durum="${durum}"`))
      // "close" for every consultation that is not closed — the expired one included — and for no closed one
      assert.equal(say(html, /data-eylem="konsultasyon-kapat"/g), 3)
      yok(html, Y.yerine(g.kapatUyari, E.kapanisSonrasiGun()), `${dil}: the warning before anybody asked`)
      // on the patient's own file the list names no patient and has no heading of its own
      const dosyada = gidenListe(dil, [giden()], { hastaBaglantisi: false, baslik: false })
      yok(dosyada, HASTA_ADI, `${dil} on the file`); yok(dosyada, `>${g.baslik}<`, `${dil} on the file`)
      var_(gidenListe(dil, []), g.bos, `${dil} none`); var_(gidenListe(dil, null, { yuklenemedi: true }), g.yuklenemedi, `${dil} failed`)
      var_(gidenListe(dil, [giden()], { kapatildi: true }), g.kapatildi, `${dil} closed notice`); var_(gidenListe(dil, [giden()], { hata: true }), g.yapilamadi, `${dil} error`)
      temiz(gorunurMetin(html), `what I asked ${dil}`)
    }
  })

  it('CLOSING: WHAT IT DOES IS SHOWN BEFORE THE CONFIRMATION, with the pack\'s own number of days — for that consultation only', () => {
    if (!ACIK) return
    assert.equal(E.kapanisSonrasiGun(), paket.uygulama!.konsultasyon!.kapanisSonrasiGun)
    for (const dil of FORMLAR) {
      const g = x(dil).giden
      const html = gidenListe(dil, [giden(), giden({ id: 'k2' })], { kapatSorulan: 'k2' })
      for (const t of [Y.yerine(g.kapatUyari, paket.uygulama!.konsultasyon!.kapanisSonrasiGun), g.kapatOnay, g.vazgec]) var_(html, t, `${dil} confirm`)
      assert.ok(html.indexOf('data-alan="konsultasyon-kapat-onay"') < html.indexOf('data-eylem="konsultasyon-kapat-onayla"'))
      assert.ok(html.indexOf('data-konsultasyon="k2"') < html.indexOf('data-alan="konsultasyon-kapat-onay"'))
      assert.equal(say(html, /data-eylem="konsultasyon-kapat"/g), 1); assert.equal(say(html, /data-eylem="konsultasyon-kapat-onayla"/g), 1)
    }
  })
})

describe('consultation screens — asking, on the patient\'s file', () => {
  it('THE FORM: what the colleague will see, the code and "find", the question with "the patient is not named", THE CONSENT SENTENCE with a tick-box, and "nobody is notified"', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const i = x(dil).iste
      const html = isteKarti(dil, { notlar: [{ notId: 'n1', gun: '2026-10-05', ozetVar: true }] })
      for (const t of [i.baslik, i.aciklama, i.kodEtiketi, i.bul, i.soruEtiketi, i.soruIpucu, i.paylasimEtiketi, i.secenekYok, i.secenekNot, i.secenekOzet, i.rizaBaslik, i.riza, i.bildirimYok, i.gonder]) var_(html, t, `${dil} form`)
      // the consent is a tick-box of its own, not ticked, with the pack's sentence as its label
      assert.match(html, new RegExp(`data-alan="konsultasyon-riza"[\\s\\S]*?<input type="checkbox" name="riza"/>[\\s\\S]*?${esc(i.riza).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
      assert.doesNotMatch(html, /name="riza"[^>]*checked/, `${dil}: the consent is ticked for the doctor`)
      assert.ok(html.indexOf('data-alan="konsultasyon-riza"') < html.indexOf('data-eylem="konsultasyon-iste"'), `${dil}: the consent comes after the button`)
      assert.match(html, new RegExp(`<textarea[^>]*name="soru"[^>]*maxLength="${C.SORU_AZAMI}"`))
      // folded away until the doctor opens it
      assert.doesNotMatch(html, /<details[^>]*data-alan="konsultasyon-iste"[^>]* open/)
      if (paket.ozellikler.araclar) { assert.match(html, /href="[^"]*\?arac=konsultasyonlar" data-eylem="konsultasyonlari-ac"/); var_(html, i.tumu, `${dil} link`) }
      temiz(gorunurMetin(html), `asking ${dil}`)
    }
  })

  it('the colleague found by the code is named; a note is chosen by its day; a visit without a summary says so; no approved note → only the question can be sent', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const i = x(dil).iste
      const notlar = [{ notId: 'n1', gun: '2026-10-08', ozetVar: false }, { notId: 'n2', gun: '2026-10-05', ozetVar: true }]
      var_(isteKarti(dil, { meslektas: { ad: 'QA Doctor B', rol: 'QA-ROLE-B' } }), Y.yerine(i.bulundu, 'QA Doctor B · QA-ROLE-B'), `${dil} found`)
      const notlu = isteKarti(dil, { notlar, form: { ...E.BOS_ISTEK, paylasimTuru: 'not', notId: 'n1' } })
      for (const t of [i.notSec, B.tarihYaz('2026-10-08'), B.tarihYaz('2026-10-05')]) var_(notlu, t, `${dil} note`)
      yok(notlu, i.ozetYok, `${dil} note`)
      var_(isteKarti(dil, { notlar, form: { ...E.BOS_ISTEK, paylasimTuru: 'ozet', notId: 'n1' } }), i.ozetYok, `${dil}: a visit without a summary`)
      yok(isteKarti(dil, { notlar, form: { ...E.BOS_ISTEK, paylasimTuru: 'ozet', notId: 'n2' } }), i.ozetYok, `${dil}: a visit with a summary`)
      const notsuz = isteKarti(dil, { notlar: [] })
      var_(notsuz, i.onayliNotYok, `${dil} no note`); assert.equal(say(notsuz, /name="konsultasyon-paylasim"/g), 1, `${dil}: a note is offered where the patient has none`)
      assert.doesNotMatch(notsuz, /<select/)
      for (const [hata, metin] of [['meslektas', i.meslektasGerekli], ['bulunamadi', i.bulunamadi], ['soru', i.soruBos], ['uzun', Y.yerine(i.cokUzun, C.SORU_AZAMI)], ['riza', i.rizaGerekli], ['ozet', i.ozetYok], ['limit', i.limit], ['gonderilemedi', i.gonderilemedi]] as const) var_(isteKarti(dil, { hata }), metin, `${dil} ${hata}`)
      var_(isteKarti(dil, { gonderildi: true }), i.gonderildi, `${dil} sent`); var_(isteKarti(dil, { bekliyor: true }), i.gonderiliyor, `${dil} sending`)
    }
  })

  it('THE HOME SCREEN says how many wait for an answer, with the way to them — and nothing while none waits', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const g = x(dil).gelen
      assert.equal(renderToStaticMarkup(h(E.BekleyenKonsultasyonGorunumu, { g, adet: 0 })), '')
      const html = cerceve(dil, h(E.BekleyenKonsultasyonGorunumu, { g, adet: 2 }))
      var_(html, Y.yerine(g.bekleyen, 2), `${dil} home`); var_(html, g.ac, `${dil} home`)
      assert.match(html, /data-alan="bugun-konsultasyon" data-adet="2"/); assert.match(html, /href="[^"]*\?arac=konsultasyonlar"/)
    }
  })
})

describe('consultation screens — rules and the catalogue', () => {
  it('EVERY SENTENCE IS THE PACK\'S: the kit\'s files carry no text of their own, write no address by hand and reach for no model', () => {
    for (const d of ['components/ulke/uygulama/Konsultasyonlar.tsx', 'lib/ulke/konsultasyon/konsultasyon.ts', 'lib/ulke/konsultasyon/sabitler.ts', 'lib/ulke/konsultasyon/denetim.ts', 'app/api/ulke/konsultasyon/route.ulke.ts']) {
      const k = kod(d)
      assert.doesNotMatch(k, /[^\x00-\x7F—–·…‹›«»]/, `${d} carries a letter outside ASCII: text belongs in a pack`)
      if (!d.endsWith('sabitler.ts')) assert.doesNotMatch(k, /['"`]\/(calendar|visit|patient|today|settings|portal|tools|api\/ulke)\b/, `${d} writes an address by hand`)
      assert.doesNotMatch(k, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${d} has a sentence written into the screen`)
      assert.doesNotMatch(k, /lib\/ai|modelGecidi|dangerouslySetInnerHTML|innerHTML/, `${d} reaches for a model or writes markup from a string`)
    }
    // the screen imports no server rule: nothing of the consultation library but its client-safe shapes
    assert.doesNotMatch(kod('components/ulke/uygulama/Konsultasyonlar.tsx'), /konsultasyon\/konsultasyon'|countries\/active\/klinik/)
  })

  it('the tile opens the kit\'s own screen; the card and the home line are mounted only where the country has consultation', () => {
    assert.match(kod('components/ulke/uygulama/Araclar.tsx'), /x\.tanim\.ekran === 'konsultasyonlar' \? <Konsultasyonlar u=\{u\} \/>/)
    assert.match(kod('components/ulke/uygulama/Hastalar.tsx'), /konsultasyon=\{ozellikAcik\('konsultasyon'\) \? <KonsultasyonKarti u=\{u\} hastaId=\{veri\.hasta\.id\} \/> : null\}/)
    assert.match(kod('components/ulke/uygulama/Bugun.tsx'), /konsultasyon=\{ozellikAcik\('konsultasyon'\) && ozellikAcik\('araclar'\) \? <BekleyenKonsultasyonlarKarti u=\{u\} \/> : null\}/)
    // the form cannot be sent without the tick: the screen stops it before the request, and the request says `riza: true` only then
    const k = kod('components/ulke/uygulama/Konsultasyonlar.tsx')
    assert.match(k, /if \(!form\.riza\) \{ setHata\('riza'\); return \}/)
    assert.equal((k.match(/riza: true/g) ?? []).length, 1)
  })

  it('the catalogue is the same shape in every form, each entry is there, a sentence keeps its placeholders in every form, and nothing of another country is in it', () => {
    if (!ACIK) return
    const ilk = yaprak(x(FORMLAR[0]))
    assert.equal(ilk.length, 82, `${ilk.length} entries`)
    for (const dil of FORMLAR) {
      const y = yaprak(x(dil))
      assert.deepEqual(y.map((e) => e[0]), ilk.map((e) => e[0]), `${dil}: not the same keys as ${FORMLAR[0]}`)
      for (let n = 0; n < y.length; n++) {
        assert.ok(y[n][1].trim().length > 0, `${dil}/${y[n][0]} is empty`)
        assert.deepEqual([...y[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), [...ilk[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), `${dil}/${y[n][0]}: the placeholders differ from ${FORMLAR[0]}`)
        temiz(y[n][1], `consultation catalogue ${dil}/${y[n][0]}`)
      }
      assert.doesNotMatch(x(dil).iste.riza, /%/, `${dil}: the consent sentence carries a value`)
      assert.match(x(dil).giden.durumKapali, /%1[\s\S]*%2|%2[\s\S]*%1/); assert.match(x(dil).giden.kapatUyari, /%(?!\d)/)
    }
  })
})
