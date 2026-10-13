/**
 * NOTYA-ULKE-MESAJ-01 — THE SCREENS OF THE MESSAGES BETWEEN A DOCTOR AND A PATIENT, for whichever pack is active
 * (run once per country folder). Names no country: every expectation is read from the active pack's catalogue
 * (MesajMetni). A pack without the catalogue has nothing to draw, and the test says so.
 *
 *   A. the patient's side   THE EMERGENCY NOTICE IS ALWAYS THERE (loading, failed, none, open, closed), with the
 *                           pack's number where it states one and with none where it does not; a patient who cannot
 *                           answer is told so in plain words and is given NO text box; unread marks; the answer box
 *   B. the doctor's side    the card (nothing yet, a conversation, unread, read marks), "nobody is notified", "no
 *                           link that works", THE CLOSING WARNING BEFORE THE CONFIRMATION, the home screen's list
 *   C. rules of the screens every sentence is the pack's; the patient's section imports nothing of the signed-in
 *                           application; the screens are mounted only where the country has messages
 *   D. catalogue and leak   the same shape and placeholders in every form; no digit in the emergency notice; no
 *                           other country's term or letter
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { MesajMetni } from '@/lib/ulke/arayuz'
import type { HastaMesajGorunumu, HekimMesajGorunumu, Yazisma } from '@/lib/ulke/mesaj/sabitler'
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
let C: typeof import('@/lib/ulke/mesaj/sabitler')
let Hasta: typeof import('./portal/Mesajlar')
let Sayfa: typeof import('./portal/PortalSayfasi')
let Hekim: typeof import('./uygulama/HastaMesajlari')
let Kabuk: typeof import('./uygulama/Kabuk')
let Ortak: typeof import('./mesajOrtak')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const G1 = '2026-10-12T05:00:00.000Z', G2 = '2026-10-12T06:30:00.000Z', G3 = '2026-10-13T07:00:00.000Z'
const QA = 'QA-MESSAGE-TEXT'
const NUMARA = '0 800 QA'.replace(' QA', ' 555')

const acik = (): Yazisma => ({ id: 'y1', olusturuldu: G1, kapandi: null, mesajlar: [
  { id: 'm1', gonderen: 'hekim', metin: `${QA} from the doctor <b>not markup</b>`, an: G1, okundu: G2 },
  { id: 'm2', gonderen: 'hasta', metin: `${QA} from the patient`, an: G2, okundu: null },
  { id: 'm3', gonderen: 'hekim', metin: `${QA} second from the doctor`, an: G3, okundu: null },
] })
const kapali = (): Yazisma => ({ id: 'y0', olusturuldu: G1, kapandi: G2, mesajlar: [{ id: 'm0', gonderen: 'hekim', metin: `${QA} of the closed one`, an: G1, okundu: G1 }] })

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true && Boolean(arayuz?.mesajMetinleri)
  FORMLAR = paket.uygulama?.diller ?? []
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); B = await import('@/lib/ulke/arayuz/bicim'); Y = await import('@/lib/ulke/arayuz/yerTutucu'); C = await import('@/lib/ulke/mesaj/sabitler')
  Hasta = await import('./portal/Mesajlar'); Sayfa = await import('./portal/PortalSayfasi'); Hekim = await import('./uygulama/HastaMesajlari'); Kabuk = await import('./uygulama/Kabuk'); Ortak = await import('./mesajOrtak')
})

const x = (dil: DilKodu): MesajMetni => A.mesajMetni(dil)
const hastaEkrani = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Sayfa.PortalCercevesi, { dil, children: ic }))
const hekimEkrani = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil, m: A.uygulamaMetni(dil), ad: 'QA Doctor', aktif: 'hastalar', cikis: bos, children: ic }))
type HastaEk = Partial<Parameters<typeof import('./portal/Mesajlar').PortalMesajGorunumu>[0]>
const hastaBolumu = (dil: DilKodu, g: HastaMesajGorunumu | null, ek: HastaEk = {}) => hastaEkrani(dil, h(Hasta.PortalMesajGorunumu, { x: x(dil).hasta, g, acilNumara: null, saatDilimi: paket.saatDilimi, metin: '', setMetin: bos, gonder: bos, bekliyor: false, hata: null, ...ek }))
type HekimEk = Partial<Parameters<typeof import('./uygulama/HastaMesajlari').HastaMesajGorunumu>[0]>
const hekimKarti = (dil: DilKodu, g: HekimMesajGorunumu | null, ek: HekimEk = {}) => hekimEkrani(dil, h(Hekim.HastaMesajGorunumu, { x: x(dil).hekim, g, metin: '', setMetin: bos, gonder: bos, bekliyor: false, hata: null, kapatSorulan: null, kapatIste: bos, kapatOnayla: bos, kapatVazgec: bos, ...ek }))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const var_ = (html: string, metin: string, ne: string) => assert.ok(html.includes(esc(metin)), `${ne}: "${metin}" is not on the screen`)
const yok = (html: string, metin: string, ne: string) => assert.ok(!html.includes(esc(metin)), `${ne}: "${metin}" is on the screen`)
const say = (html: string, re: RegExp) => (html.match(re) ?? []).length

describe('the messages\' screens — the patient\'s side', () => {
  it('a pack without the messages\' catalogue has nothing to draw', async () => {
    if (ACIK) return
    assert.ok(!(await import('@/countries/active/arayuz')).AKTIF_ARAYUZ?.mesajMetinleri || !paket.ozellikler.hastaPortali)
  })

  it('NOT FOR EMERGENCIES — ALWAYS: while loading, when the messages cannot be read, with none, with an open and with a closed conversation, in every form', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hasta
      const haller: [string, string][] = [
        ['loading', hastaBolumu(dil, null)],
        ['could not be read', hastaBolumu(dil, null, { yuklenemedi: true })],
        ['no conversation', hastaBolumu(dil, { yazismalar: [], yazabilir: false })],
        ['open', hastaBolumu(dil, { yazismalar: [acik()], yazabilir: true })],
        ['closed', hastaBolumu(dil, { yazismalar: [kapali()], yazabilir: false })],
        ['an error under the box', hastaBolumu(dil, { yazismalar: [acik()], yazabilir: true }, { hata: 'gonderilemedi' })],
      ]
      for (const [ad, html] of haller) {
        var_(html, s.acil, `${dil} ${ad}`)
        assert.equal(say(html, /data-alan="mesaj-acil"/g), 1, `${dil} ${ad}: the notice is drawn exactly once`)
        // Where the pack states no number, none is shown — and no sentence that would need one.
        assert.doesNotMatch(html, /data-acil-numara=/, `${dil} ${ad}`)
        yok(html, s.acilNumara.split('%')[0].trim() || s.acilNumara, `${dil} ${ad}: the number's sentence without a number`)
        var_(html, s.yanitSuresi, `${dil} ${ad}`)
        temiz(gorunurMetin(html), `patient messages ${dil} ${ad}`)
      }
      // The notice comes before any message and before the text box.
      const a = hastaBolumu(dil, { yazismalar: [acik()], yazabilir: true })
      assert.ok(a.indexOf('data-alan="mesaj-acil"') < a.indexOf('data-mesaj="m1"') && a.indexOf('data-alan="mesaj-acil"') < a.indexOf('<textarea'), `${dil}: the notice is not first`)
      // With the pack's number: the sentence carries it, written as the pack states it.
      const n = hastaBolumu(dil, { yazismalar: [], yazabilir: false }, { acilNumara: NUMARA })
      var_(n, `${s.acil} ${Y.yerine(s.acilNumara, NUMARA)}`, `${dil} with a number`)
      assert.match(n, new RegExp(`data-acil-numara="${NUMARA}"`))
    }
  })

  it('THE PACK\'S OWN SETTING decides the number: the page hands the section what the pack states, or nothing', () => {
    if (!ACIK) return
    const n = paket.uygulama?.portal?.acilNumara
    assert.equal(Sayfa.portalAcilNumarasi(), typeof n === 'string' && n.trim() ? n.trim() : null)
    assert.match(kod('components/ulke/portal/PortalSayfasi.tsx'), /<PortalMesajlar dil=\{dil\} iste=\{iste\} acilNumara=\{portalAcilNumarasi\(\)\}/)
  })

  it('A PATIENT CANNOT START A CONVERSATION: with none open the section says so in plain words and has NO text box and NO send button', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hasta
      const hic = hastaBolumu(dil, { yazismalar: [], yazabilir: false })
      for (const m of [s.baslik, s.aciklama, s.yok, s.baslatamaz]) var_(hic, m, `${dil} none`)
      yok(hic, s.kapali, `${dil} none: "closed" where nothing was ever open`)
      assert.match(hic, /data-alan="portal-mesajlar"[^>]*data-yazabilir="hayir"/)
      assert.match(hic, /data-alan="mesaj-baslatamaz"/)
      const kapanmis = hastaBolumu(dil, { yazismalar: [kapali()], yazabilir: false })
      for (const m of [s.kapali, s.baslatamaz, Y.yerine(s.kapandi, B.tarihYaz(G2, paket.saatDilimi)), `${QA} of the closed one`]) var_(kapanmis, m, `${dil} closed`)
      yok(kapanmis, s.yok, `${dil} closed`)
      for (const html of [hic, kapanmis, hastaBolumu(dil, null), hastaBolumu(dil, null, { yuklenemedi: true })]) {
        assert.doesNotMatch(html, /<textarea|data-eylem="portal-mesaj-gonder"|<form/, `${dil}: a text box is offered where no answer is possible`)
        yok(html, s.gonder, `${dil}`)
      }
      var_(hastaBolumu(dil, null, { yuklenemedi: true }), s.yuklenemedi, `${dil} failed`)
    }
  })

  it('AN OPEN CONVERSATION: who wrote what and when, the doctor\'s unread message marked as new, the count, the answer box — a message is text, never markup', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hasta
      const html = hastaBolumu(dil, { yazismalar: [acik(), kapali()], yazabilir: true })
      for (const m of [s.hekim, s.siz, s.yaz, s.gonder, s.yeni, Y.yerine(s.okunmamis, 1), `${B.tarihYaz(G1, paket.saatDilimi)} ${B.saatYaz(G1, paket.saatDilimi)}`, `${QA} from the patient`, `${QA} from the doctor <b>not markup</b>`]) var_(html, m, `${dil} open`)
      assert.doesNotMatch(html, /<b>not markup<\/b>/, 'a message\'s text was drawn as markup')
      for (const m of [s.baslatamaz, s.yok, s.kapali]) yok(html, m, `${dil} open`)
      assert.match(html, /data-alan="portal-mesajlar" data-okunmamis="1" data-yazabilir="evet"/)
      // newest conversation first; inside one, oldest message first
      assert.ok(html.indexOf('data-yazisma="y1"') < html.indexOf('data-yazisma="y0"'))
      assert.ok(html.indexOf('data-mesaj="m1"') < html.indexOf('data-mesaj="m2"') && html.indexOf('data-mesaj="m2"') < html.indexOf('data-mesaj="m3"'))
      // only the DOCTOR's unread message is "new" for the patient; the patient's own messages carry no read mark here
      assert.equal(say(html, /data-okunmamis="evet"/g), 1)
      assert.match(html, /data-mesaj="m3" data-gonderen="hekim" data-okunmamis="evet"/)
      assert.doesNotMatch(html, /data-okundu=/, 'the patient is shown whether the doctor has read their message')
      assert.equal(say(html, /<textarea/g), 1); assert.match(html, new RegExp(`<textarea[^>]*maxLength="${C.MESAJ_AZAMI}"`))
      assert.equal(say(html, /data-eylem="portal-mesaj-gonder"/g), 1)
      for (const [hata, metin] of [['bos', s.bosMesaj], ['uzun', Y.yerine(s.cokUzun, C.MESAJ_AZAMI)], ['limit', s.limit], ['kapali', s.kapali], ['gonderilemedi', s.gonderilemedi]] as const) var_(hastaBolumu(dil, { yazismalar: [acik()], yazabilir: true }, { hata }), metin, `${dil} ${hata}`)
      var_(hastaBolumu(dil, { yazismalar: [acik()], yazabilir: true }, { bekliyor: true }), s.gonderiliyor, `${dil} sending`)
      temiz(gorunurMetin(html), `patient messages ${dil}`)
    }
  })

  it('"read up to here" is said with the newest message that was drawn, and unread counts only what the OTHER side wrote', () => {
    if (!ACIK) return
    assert.equal(Ortak.sonMesajAni([acik(), kapali()]), G3)
    assert.equal(Ortak.sonMesajAni([]), '')
    assert.equal(Ortak.okunmamisSayisi([acik(), kapali()], 'hasta'), 1)
    assert.equal(Ortak.okunmamisSayisi([acik(), kapali()], 'hekim'), 1)
    assert.equal(C.mesajMetniAl('  a\r\nb\r\r\n\n\nc\u0007  '), 'a\nb\n\nc')
    assert.equal(C.mesajMetniAl(12), '')
  })
})

describe('the messages\' screens — the doctor\'s side', () => {
  it('THE CARD, nothing written yet: what it is, THAT NOBODY IS NOTIFIED, "no messages yet", the text box — and no conversation', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hekim
      const html = hekimKarti(dil, { yazismalar: [], erisim: 'acik' })
      for (const m of [s.baslik, s.aciklama, s.bildirimYok, s.bos, s.yaz, s.gonder]) var_(html, m, `${dil} empty`)
      for (const m of [s.erisimYok, s.kapat, s.kapatUyari, s.yuklenemedi]) yok(html, m, `${dil} empty`)
      assert.match(html, /data-alan="mesaj-bildirim-yok"/)
      assert.match(html, /id="mesajlar"/)
      assert.equal(say(html, /<textarea/g), 1)
      // not loaded: nothing is offered; could not be read: said
      const yuk = hekimKarti(dil, null)
      assert.doesNotMatch(yuk, /<textarea|data-eylem=/)
      var_(yuk, s.bildirimYok, `${dil} loading`)
      var_(hekimKarti(dil, null, { yuklenemedi: true }), s.yuklenemedi, `${dil} failed`)
      temiz(gorunurMetin(html), `doctor messages ${dil}`)
    }
  })

  it('A PATIENT WITHOUT A LINK THAT WORKS cannot read: the card says so for no link, a locked one and one that is over — and not for an open one', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hekim
      for (const erisim of ['yok', 'kilitli', 'suresi-doldu'] as const) {
        const html = hekimKarti(dil, { yazismalar: [acik()], erisim })
        var_(html, s.erisimYok, `${dil} ${erisim}`)
        assert.match(html, new RegExp(`data-alan="mesaj-erisim-yok" data-erisim="${erisim}"`))
        // the doctor may still write: the patient reads it once access is given
        assert.equal(say(html, /<textarea/g), 1)
      }
      assert.doesNotMatch(hekimKarti(dil, { yazismalar: [acik()], erisim: 'acik' }), /data-alan="mesaj-erisim-yok"/)
    }
  })

  it('A CONVERSATION: who wrote what, the patient\'s unread message marked as new with its count, "read / not read yet" under the doctor\'s own', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hekim
      const html = hekimKarti(dil, { yazismalar: [acik(), kapali()], erisim: 'acik' })
      for (const m of [s.siz, s.hasta, s.acik, Y.yerine(s.kapali, B.tarihYaz(G2)), s.yeni, Y.yerine(s.okunmamisAdet, 1), s.okundu, s.okunmadi, s.kapat, `${QA} from the patient`, `${QA} from the doctor <b>not markup</b>`, `${QA} of the closed one`]) var_(html, m, `${dil} conversation`)
      assert.doesNotMatch(html, /<b>not markup<\/b>/)
      assert.match(html, /data-alan="hasta-mesajlari" data-okunmamis="1"/)
      assert.equal(say(html, /data-okunmamis="evet"/g), 1)
      assert.match(html, /data-mesaj="m2" data-gonderen="hasta" data-okunmamis="evet"/)
      assert.match(html, /data-mesaj="m1" data-gonderen="hekim" data-benim="evet"[\s\S]*?data-okundu="evet"/)
      assert.match(html, /data-mesaj="m3" data-gonderen="hekim" data-benim="evet"[\s\S]*?data-okundu="hayir"/)
      // "close" is offered for the open conversation only
      assert.equal(say(html, /data-eylem="mesaj-kapat"/g), 1)
      assert.ok(html.indexOf('data-eylem="mesaj-kapat"') < html.indexOf('data-yazisma="y0"'))
      yok(html, s.kapatUyari, `${dil}: the warning before anybody asked`)
      for (const [hata, metin] of [['bos', s.bosMesaj], ['uzun', Y.yerine(s.cokUzun, C.MESAJ_AZAMI)], ['limit', s.limit], ['gonderilemedi', s.gonderilemedi], ['yapilamadi', s.yapilamadi]] as const) var_(hekimKarti(dil, { yazismalar: [acik()], erisim: 'acik' }, { hata }), metin, `${dil} ${hata}`)
      var_(hekimKarti(dil, { yazismalar: [kapali()], erisim: 'acik' }, { kapatildi: true }), s.kapatildi, `${dil} closed notice`)
      temiz(gorunurMetin(html), `doctor messages ${dil}`)
    }
  })

  it('CLOSING: WHAT IT DOES IS SHOWN BEFORE THE CONFIRMATION — the warning, "yes, close" and "cancel" replace the button, for that conversation only', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hekim
      const html = hekimKarti(dil, { yazismalar: [acik(), kapali()], erisim: 'acik' }, { kapatSorulan: 'y1' })
      for (const m of [s.kapatUyari, s.kapatOnay, s.vazgec]) var_(html, m, `${dil} confirm`)
      assert.ok(html.indexOf(esc(s.kapatUyari)) < html.indexOf('data-eylem="mesaj-kapat-onayla"'), `${dil}: the warning comes after the confirmation`)
      assert.equal(say(html, /data-eylem="mesaj-kapat"/g), 0, 'the plain button is still there beside the confirmation')
      assert.equal(say(html, /data-eylem="mesaj-kapat-onayla"/g), 1); assert.equal(say(html, /data-eylem="mesaj-kapat-vazgec"/g), 1)
      // asked about a conversation that is not on the screen: nothing is confirmed
      assert.equal(say(hekimKarti(dil, { yazismalar: [acik()], erisim: 'acik' }, { kapatSorulan: 'another' }), /mesaj-kapat-onayla/g), 0)
    }
  })

  it('THE HOME SCREEN: the patients whose messages are unread, each a link to that patient\'s messages — and NOTHING AT ALL while there is none', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const s = x(dil).hekim
      assert.equal(renderToStaticMarkup(h(Hekim.OkunmamisMesajlarGorunumu, { x: s, liste: [] })), '')
      const html = hekimEkrani(dil, h(Hekim.OkunmamisMesajlarGorunumu, { x: s, liste: [{ hastaId: 'h-1', hastaAdi: 'QA Patient One', adet: 2, son: G2 }, { hastaId: 'h-2', hastaAdi: 'QA Patient Two', adet: 1, son: G1 }] }))
      for (const m of [s.okunmamisBaslik, 'QA Patient One', 'QA Patient Two', Y.yerine(s.okunmamisAdet, 2), Y.yerine(s.okunmamisAdet, 1)]) var_(html, m, `${dil} home`)
      assert.match(html, new RegExp(`href="${Kabuk.YOL.hasta.replace(/[/]/g, '\\/')}\\?id=h-1#mesajlar" data-mesaj-hastasi="h-1"`))
      assert.doesNotMatch(html, new RegExp(QA), 'the home screen shows the text of a message')
      temiz(gorunurMetin(html), `home messages ${dil}`)
    }
  })
})

describe('the messages\' screens — rules', () => {
  const DOSYALAR = ['components/ulke/mesajOrtak.tsx', 'components/ulke/portal/Mesajlar.tsx', 'components/ulke/uygulama/HastaMesajlari.tsx', 'lib/ulke/mesaj/mesaj.ts', 'lib/ulke/mesaj/sabitler.ts', 'lib/ulke/mesaj/denetim.ts', 'app/api/ulke/hasta-mesajlari/route.ulke.ts', 'app/api/ulke/portal/mesaj/route.ulke.ts']

  it('EVERY SENTENCE IS THE PACK\'S: the kit\'s files carry no text of their own and write no address by hand', () => {
    for (const d of DOSYALAR) {
      const k = kod(d)
      assert.doesNotMatch(k, /[^\x00-\x7F—–·…‹›«»]/, `${d} carries a letter outside ASCII: text belongs in a pack`)
      if (!d.endsWith('sabitler.ts')) assert.doesNotMatch(k, /['"`]\/(calendar|visit|patient|today|settings|portal|api\/ulke)\b/, `${d} writes an address by hand`)
      assert.doesNotMatch(k, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${d} has a sentence written into the screen`)
    }
  })

  it('the patient\'s section imports nothing of the signed-in application and asks the server with the page\'s own helper only; the shared list is a leaf', () => {
    for (const d of ['components/ulke/portal/Mesajlar.tsx', 'components/ulke/mesajOrtak.tsx']) {
      const k = kod(d)
      assert.doesNotMatch(k, /from '\.\.\/uygulama\/|from '\.\/uygulama\/|from '@\/components\/ulke\/uygulama|istemciSupabase|supabase|Authorization|localStorage|sessionStorage|document\.cookie/, `${d} reaches for the doctor's application or a browser store`)
      assert.doesNotMatch(k, /\bfetch\(/, `${d}: every request goes through the page's helper (same origin, the cookie, the link's mark)`)
      assert.doesNotMatch(k, /mesaj\/mesaj'|countries\/active\/klinik|lib\/ai/, `${d} imports the server's rules into the browser`)
    }
    assert.doesNotMatch(kod('components/ulke/mesajOrtak.tsx'), /lib\/ulke\/arayuz|\.\/portal\/|\.\/uygulama\//, 'the shared list imports a catalogue or a screen')
    // a message is drawn as text: no screen of this feature writes markup from a string
    for (const d of ['components/ulke/mesajOrtak.tsx', 'components/ulke/portal/Mesajlar.tsx', 'components/ulke/uygulama/HastaMesajlari.tsx']) assert.doesNotMatch(kod(d), /dangerouslySetInnerHTML|innerHTML/, d)
  })

  it('the screens are mounted where they belong, and only where the country has messages', () => {
    const hastalar = kod('components/ulke/uygulama/Hastalar.tsx'), bugun = kod('components/ulke/uygulama/Bugun.tsx'), sayfa = kod('components/ulke/portal/PortalSayfasi.tsx')
    assert.match(hastalar, /mesajlar=\{ozellikAcik\('hastaPortali'\) && ozellikAcik\('hastaMesajlari'\) \? <HastaMesajKarti u=\{u\} hastaId=\{veri\.hasta\.id\}/)
    assert.match(bugun, /mesajlar=\{ozellikAcik\('hastaPortali'\) && ozellikAcik\('hastaMesajlari'\) \? <OkunmamisMesajlarKarti u=\{u\} \/> : null\}/)
    assert.match(sayfa, /mesajlar=\{ozellikAcik\('hastaMesajlari'\) \? <PortalMesajlar /)
    // on the patient's page the section is drawn only after sign-in: it sits inside the signed-in view and nowhere else
    assert.equal((sayfa.match(/<PortalMesajlar /g) ?? []).length, 1)
    assert.match(sayfa, /asama === 'sayfa' && icerik \? \(\s*<PortalSayfaGorunumu[\s\S]*?<PortalMesajlar /)
    // the card marks as read only up to the newest message it drew
    for (const d of ['components/ulke/uygulama/HastaMesajlari.tsx', 'components/ulke/portal/Mesajlar.tsx']) assert.match(kod(d), /kadar: son/, `${d} does not say up to where it has read`)
  })
})

describe('the messages\' screens — the catalogue', () => {
  it('is the same shape in every form, each entry is there, a sentence keeps its placeholders in every form, the emergency notice holds no digit, and nothing of another country is in it', () => {
    if (!ACIK) return
    const ilk = yaprak(x(FORMLAR[0]))
    assert.equal(ilk.length, 49, `${ilk.length} entries`)
    for (const dil of FORMLAR) {
      const y = yaprak(x(dil))
      assert.deepEqual(y.map((e) => e[0]), ilk.map((e) => e[0]), `${dil}: not the same keys as ${FORMLAR[0]}`)
      for (let n = 0; n < y.length; n++) {
        assert.ok(y[n][1].trim().length > 0, `${dil}/${y[n][0]} is empty`)
        assert.deepEqual([...y[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), [...ilk[n][1].matchAll(/%\d?/g)].map((e) => e[0]).sort(), `${dil}/${y[n][0]}: the placeholders differ from ${FORMLAR[0]}`)
        temiz(y[n][1], `messages catalogue ${dil}/${y[n][0]}`)
      }
      const s = x(dil).hasta
      for (const t of [s.acil, s.acilNumara, s.baslatamaz, s.yanitSuresi]) assert.doesNotMatch(t, /\d/, `${dil}: a digit in a sentence a patient relies on`)
      assert.match(s.acilNumara, /%(?!\d)/, `${dil}: the number's sentence has no place for the number`)
      assert.doesNotMatch(s.acil, /%/, `${dil}: the notice itself carries no value`)
      for (const k of ['cokUzun', 'okunmamis', 'kapandi'] as const) assert.match(s[k], /%(?!\d)/, `${dil}/hasta.${k}`)
      for (const k of ['cokUzun', 'okunmamisAdet', 'kapali'] as const) assert.match(x(dil).hekim[k], /%(?!\d)/, `${dil}/hekim.${k}`)
    }
  })
})
