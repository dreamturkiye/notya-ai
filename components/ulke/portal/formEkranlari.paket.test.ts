/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM'S SCREENS, for whichever pack is active (run once per country folder). Names
 * no country: every expectation is read from the active pack's catalogue (FormMetni). The QUESTIONS drawn here are
 * synthetic — a screen must draw whatever the server hands it, and a pack's own questions have their own tests.
 * A pack without the form's catalogue has nothing to draw, and the test says so.
 *
 *   A. the patient's side   the card on the page (waiting, begun, reopened, sent); the consent step shows no question;
 *                           one part at a time with every question type, the unit, the required mark, progress,
 *                           "next" / "send" with its warning; what is missing; after sending: text only, no field
 *   B. the doctor's side    the card (nothing yet, asked, begun, sent), the invitation with and without a link,
 *                           THE NEW-LINK WARNING BEFORE THE CONFIRMATION, the answers under "said by the patient,
 *                           not verified", reopen, withdraw, earlier forms; the visit screen's view
 *   C. rules of the screens every sentence is the pack's; the patient's form imports nothing of the signed-in
 *                           application; the cards are mounted only where the country has the form
 *   D. catalogue and leak   the same shape and placeholders in every form; no other country's term or letter
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { FormMetni, PortalMetni } from '@/lib/ulke/arayuz'
import type { Cevaplar, HastaFormuGorunumu, HekimFormu } from '@/lib/ulke/intake/tipler'
import type { DilKodu, UlkePaketi } from '@/lib/ulke/tipler'

const KOK = resolve(__dirname, '../../..')
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
let Hasta: typeof import('./HastaFormu')
let Sayfa: typeof import('./PortalSayfasi')
let Kart: typeof import('../uygulama/HastaFormuKarti')
let Kabuk: typeof import('../uygulama/Kabuk')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const GUN = '2026-10-12T05:00:00.000Z'
const QA = 'QA-ANSWER-TEXT'

/** A form of two parts with one question of every type, as the server would hand it over in the form `dil`. */
function form(dil: DilKodu, ek: Partial<HastaFormuGorunumu> = {}): HastaFormuGorunumu {
  const b = paket.uygulama!.birimler
  return {
    id: 'f1', durum: 'taslak', veli: false, dil, gonderildi: null,
    riza: { metin: 'QA-CONSENT-SENTENCE', kabul: true },
    bolumler: [
      { anahtar: 'bir', baslik: 'QA-PART-ONE', sorular: [
        { anahtar: 'q_uzun', tur: 'uzun-metin', metin: 'QA-Q-LONG', yardim: 'QA-HELP-LONG', zorunlu: true, secenekler: null, ayrinti: null, birim: null },
        { anahtar: 'q_kisa', tur: 'kisa-metin', metin: 'QA-Q-SHORT', yardim: null, zorunlu: false, secenekler: null, ayrinti: null, birim: null },
        { anahtar: 'q_tek', tur: 'tek-secim', metin: 'QA-Q-ONE', yardim: null, zorunlu: false, secenekler: [{ anahtar: 'a', ad: 'QA-OPT-A', tek: false }, { anahtar: 'b', ad: 'QA-OPT-B', tek: false }], ayrinti: null, birim: null },
        { anahtar: 'q_cok', tur: 'cok-secim', metin: 'QA-Q-MANY', yardim: null, zorunlu: false, secenekler: [{ anahtar: 'x', ad: 'QA-OPT-X', tek: false }, { anahtar: 'y', ad: 'QA-OPT-Y', tek: false }, { anahtar: 'yok', ad: 'QA-OPT-NONE', tek: true }], ayrinti: null, birim: null },
      ] },
      { anahtar: 'iki', baslik: 'QA-PART-TWO', sorular: [
        { anahtar: 'q_eh', tur: 'evet-hayir', metin: 'QA-Q-YESNO', yardim: null, zorunlu: true, secenekler: null, ayrinti: 'QA-DETAIL-LABEL', birim: null },
        { anahtar: 'q_tarih', tur: 'tarih', metin: 'QA-Q-DATE', yardim: null, zorunlu: false, secenekler: null, ayrinti: null, birim: null },
        { anahtar: 'q_boy', tur: 'sayi', metin: 'QA-Q-HEIGHT', yardim: null, zorunlu: false, secenekler: null, ayrinti: null, birim: { kod: b.boy, ad: A.formMetni(dil).birim[b.boy], enAz: 20, enCok: 260, ondalik: true } },
      ] },
    ],
    cevaplar: {},
    ...ek,
  }
}
const CEVAPLAR = (): Cevaplar => ({ q_uzun: `${QA} long`, q_tek: 'b', q_cok: ['x', 'y'], q_eh: { e: true, a: `${QA} detail` }, q_tarih: '2026-03-04', q_boy: { n: 172.5, b: paket.uygulama!.birimler.boy } })

function hekimFormu(ek: Partial<HekimFormu> = {}): HekimFormu {
  return {
    id: 'hf1', durum: 'gonderildi', veli: false, rolAdi: 'QA-ROLE', randevuId: null, olusturuldu: GUN, guncellendi: null, gonderildi: GUN, yenidenAcildi: null, surumFarkli: false,
    bolumler: [{ baslik: 'QA-PART-ONE', satirlar: [{ soru: 'QA-Q-LONG', cevap: `${QA} long` }, { soru: 'QA-Q-ONE', cevap: 'QA-OPT-B' }] }],
    ...ek,
  }
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true && Boolean(arayuz?.formMetinleri)
  FORMLAR = paket.uygulama?.diller ?? []
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); B = await import('@/lib/ulke/arayuz/bicim'); Y = await import('@/lib/ulke/arayuz/yerTutucu')
  Hasta = await import('./HastaFormu'); Sayfa = await import('./PortalSayfasi'); Kart = await import('../uygulama/HastaFormuKarti'); Kabuk = await import('../uygulama/Kabuk')
})

const f = (dil: DilKodu): FormMetni => A.formMetni(dil)
const p = (dil: DilKodu): PortalMetni => A.portalMetni(dil)
const tarih = (iso: string) => B.tarihYaz(iso)
const hastaEkrani = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Sayfa.PortalCercevesi, { dil, children: ic }))
const hekimEkrani = (dil: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil, m: A.uygulamaMetni(dil), ad: 'QA Doctor', aktif: 'hastalar', cikis: bos, children: ic }))
type FormEk = Partial<Parameters<typeof import('./HastaFormu').HastaFormuGorunumu>[0]>
const formEkrani = (dil: DilKodu, fo: HastaFormuGorunumu, ek: FormEk = {}) => hastaEkrani(dil, h(Hasta.HastaFormuGorunumu, { f: f(dil), form: fo, cevaplar: fo.cevaplar, sayilar: {}, bolum: 0, riza: fo.riza.kabul, setRiza: bos, rizaHatasi: false, kayit: 'yok', gonderim: 'yok', eksik: [], degistir: bos, hamDegistir: bos, git: bos, gonder: bos, kapat: bos, ...ek }))
type KartEk = Partial<Parameters<typeof import('../uygulama/HastaFormuKarti').HastaFormuKartiGorunumu>[0]>
const kartEkrani = (dil: DilKodu, ek: KartEk = {}) => hekimEkrani(dil, h(Kart.HastaFormuKartiGorunumu, { f: f(dil), p: p(dil), formlar: [], davet: null, bekliyor: false, bildirim: null, onayBekliyor: false, iste: bos, yeniBaglantiSor: bos, yeniBaglantiVazgec: bos, yenidenAc: bos, geriCek: bos, kopyala: bos, ...ek }))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const var_ = (html: string, metin: string, ne: string) => assert.ok(html.includes(esc(metin)), `${ne}: "${metin}" is not on the screen`)
const yok = (html: string, metin: string, ne: string) => assert.ok(!html.includes(esc(metin)), `${ne}: "${metin}" is on the screen`)

describe('the intake form\'s screens — the patient\'s side', () => {
  it('a pack without the form\'s catalogue has nothing to draw', async () => {
    if (ACIK) return
    assert.ok(!(await import('@/countries/active/arayuz')).AKTIF_ARAYUZ?.formMetinleri || !paket.ozellikler.hastaPortali)
  })

  it('THE CARD on the patient\'s page: waiting → "begin"; begun → "continue"; reopened says so; sent → the day and "my answers" — in every form', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hasta
      const kart = (ozet: { durum: 'bekliyor' | 'taslak' | 'gonderildi'; veli: boolean; gonderildi: string | null; yenidenAcildi: boolean }) => hastaEkrani(dil, h(Hasta.PortalFormKarti, { f: f(dil), ozet, ac: bos }))
      const bekleyen = kart({ durum: 'bekliyor', veli: false, gonderildi: null, yenidenAcildi: false })
      for (const m of [x.bekliyorBaslik, x.bekliyorAciklama, x.baslat]) var_(bekleyen, m, `${dil} waiting`)
      for (const m of [x.veliAciklama, x.devam, x.yenidenAcildi, x.cevaplarim]) yok(bekleyen, m, `${dil} waiting`)
      assert.match(bekleyen, /data-alan="portal-form-karti" data-form-durumu="bekliyor"/)
      // The same card for a parent or guardian speaks about the child.
      const veli = kart({ durum: 'bekliyor', veli: true, gonderildi: null, yenidenAcildi: false })
      var_(veli, x.veliAciklama, `${dil} guardian`); yok(veli, x.bekliyorAciklama, `${dil} guardian`)
      const taslak = kart({ durum: 'taslak', veli: false, gonderildi: null, yenidenAcildi: true })
      for (const m of [x.devam, x.yenidenAcildi]) var_(taslak, m, `${dil} draft`)
      yok(taslak, x.baslat, `${dil} draft`)
      const giden = kart({ durum: 'gonderildi', veli: false, gonderildi: GUN, yenidenAcildi: false })
      for (const m of [x.gonderildiBaslik, Y.yerine(x.gonderildi, tarih(GUN)), x.cevaplarim]) var_(giden, m, `${dil} sent`)
      for (const m of [x.baslat, x.devam, x.bekliyorAciklama]) yok(giden, m, `${dil} sent`)
      for (const html of [bekleyen, veli, taslak, giden]) { temiz(gorunurMetin(html), `form card ${dil}`); assert.equal((html.match(/data-eylem="form-ac"/g) ?? []).length, 1) }
    }
  })

  it('THE CONSENT STEP comes before the first question: the pack\'s sentence, a tick-box, and NO question on the screen', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hasta
      const html = formEkrani(dil, form(dil, { durum: 'bekliyor', riza: { metin: 'QA-CONSENT-SENTENCE', kabul: false } }), { bolum: -1, riza: false })
      for (const m of [x.bekliyorBaslik, x.bekliyorAciklama, x.rizaBaslik, 'QA-CONSENT-SENTENCE', x.rizaKabul, x.baslat]) var_(html, m, `${dil} consent`)
      assert.match(html, /<input type="checkbox" name="form-riza"\/>/, 'the consent box must start unticked')
      assert.doesNotMatch(html, /data-soru=|QA-Q-|QA-PART-/, 'a question is shown before consent')
      yok(html, x.rizaGerekli, `${dil} consent`)
      var_(formEkrani(dil, form(dil, { durum: 'bekliyor', riza: { metin: 'QA-CONSENT-SENTENCE', kabul: false } }), { bolum: -1, riza: false, rizaHatasi: true }), x.rizaGerekli, `${dil} consent refused`)
      // A guardian reads the guardian's line.
      var_(formEkrani(dil, form(dil, { veli: true, riza: { metin: 'QA-CONSENT-SENTENCE', kabul: false } }), { bolum: -1, riza: false }), x.veliAciklama, `${dil} guardian consent`)
    }
  })

  it('ONE PART AT A TIME, with every question type: the question, its help, the required mark, options, the unit, progress, and "next"', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hasta
      const fo = form(dil)
      const bir = formEkrani(dil, fo)
      for (const m of ['QA-PART-ONE', 'QA-Q-LONG', 'QA-HELP-LONG', 'QA-Q-SHORT', 'QA-Q-ONE', 'QA-OPT-A', 'QA-OPT-B', 'QA-Q-MANY', 'QA-OPT-X', 'QA-OPT-NONE', Y.yerine(x.bolum, 1, 2), x.ileri, x.kapat]) var_(bir, m, `${dil} part one`)
      for (const m of ['QA-PART-TWO', 'QA-Q-YESNO', x.gonder, x.gonderUyari, x.geri]) yok(bir, m, `${dil} part one`)
      assert.deepEqual([...bir.matchAll(/data-soru="([a-z_]+)" data-tur="([a-z-]+)"/g)].map((y) => `${y[1]}:${y[2]}`), ['q_uzun:uzun-metin', 'q_kisa:kisa-metin', 'q_tek:tek-secim', 'q_cok:cok-secim'])
      // Required is said in words beside the question, once per required question.
      assert.equal(bir.split(esc(`(${x.zorunlu})`)).length - 1, 1, `${dil}: the required mark`)
      const iki = formEkrani(dil, fo, { bolum: 1 })
      for (const m of ['QA-PART-TWO', 'QA-Q-YESNO', x.evet, x.hayir, 'QA-Q-DATE', 'QA-Q-HEIGHT', f(dil).birim[paket.uygulama!.birimler.boy], Y.yerine(x.bolum, 2, 2), x.gonder, x.gonderUyari, x.geri]) var_(iki, m, `${dil} part two`)
      yok(iki, x.ileri, `${dil} part two`); yok(iki, 'QA-DETAIL-LABEL', `${dil}: the detail is asked only after "yes"`)
      assert.match(iki, new RegExp(`<input[^>]*data-birim="${paket.uygulama!.birimler.boy}"[^>]*inputMode="decimal"`), 'the number field must carry the pack\'s unit')
      // NOTYA-ULKE-DENETIM-01b — the date question is the kit's own field in the pack's order, never the browser's
      assert.match(iki, new RegExp(`<fieldset id="uzf-q_tarih" class="uza-parcali" data-girdi="tarih" data-desen="${paket.bicim.tarihDeseni.replace(/[.]/g, '\\.')}" data-durum="bos"`))
      assert.doesNotMatch(iki, /type="(date|time|datetime-local)"/)
      for (const html of [bir, iki]) { temiz(gorunurMetin(html), `form ${dil}`); assert.doesNotMatch(html.slice(html.indexOf('data-alan="hasta-formu"')), /href=|<a /, 'the form must not lead away from itself') }
    }
  })

  it('answers are shown as they stand: chosen options marked, the detail after "yes", the saved line, and what is missing after a refused send', () => {
    if (!ACIK) return
    const dil = FORMLAR[0], x = f(dil).hasta
    const fo = form(dil, { cevaplar: CEVAPLAR() })
    const bir = formEkrani(dil, fo, { kayit: 'kaydedildi' })
    assert.match(bir, new RegExp(`data-secili="evet"><input type="checkbox" name="uzf-q_tek-b"`))
    assert.equal((bir.match(/data-secili="evet"/g) ?? []).length, 3, 'one single choice and two of the multiple choice')
    var_(bir, `${QA} long`, 'answer'); var_(bir, x.kaydedildi, 'saved'); assert.match(bir, /data-kayit="kaydedildi"/)
    // the height as a person of this country types it: with the pack's own decimal mark
    const boy = `172${paket.bicim.ondalikAyraci}5`
    const iki = formEkrani(dil, fo, { bolum: 1, sayilar: { q_boy: boy } })
    for (const m of ['QA-DETAIL-LABEL', `${QA} detail`]) var_(iki, m, 'detail after yes')
    assert.ok(iki.includes(`value="${boy}"`)); assert.doesNotMatch(iki, /data-hata="sayi-/, 'the pack\'s own way of writing the number is read')
    assert.match(iki, /<fieldset id="uzf-q_tarih"[^>]*data-durum="tamam" data-deger="2026-03-04"/, 'the stored day stands in the date field')
    // A number outside the range is said beside its field, with the range.
    var_(formEkrani(dil, fo, { bolum: 1, sayilar: { q_boy: '9999' } }), Y.yerine(x.sayiGecersiz, '20', '260'), 'range')
    // Refused: the sentence, and each missing question marked.
    const eksik = formEkrani(dil, form(dil), { gonderim: 'eksik', eksik: ['q_uzun'] })
    var_(eksik, x.eksik, 'missing'); assert.match(eksik, /data-soru="q_uzun" data-tur="uzun-metin" data-eksik="evet"/)
    assert.equal((eksik.match(/data-eksik="evet"/g) ?? []).length, 1)
    for (const [ek, metin] of [[{ kayit: 'hata' }, x.kaydedilemedi], [{ gonderim: 'hata' }, x.gonderilemedi], [{ kayit: 'kaydediliyor' }, x.kaydediliyor], [{ bolum: 1, gonderim: 'gonderiliyor' }, x.gonderiliyor]] as const) var_(formEkrani(dil, fo, ek as FormEk), metin, JSON.stringify(ek))
  })

  it('AFTER SENDING: the questions with the answers as text, "cannot be changed", and not one field, tick-box or send button', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hasta
      const html = formEkrani(dil, form(dil, { durum: 'gonderildi', gonderildi: GUN, cevaplar: CEVAPLAR() }))
      for (const m of [x.cevaplarim, Y.yerine(x.gonderildi, tarih(GUN)), x.degistirilemez, 'QA-PART-ONE', 'QA-PART-TWO', 'QA-Q-LONG', `${QA} long`, 'QA-OPT-B', 'QA-OPT-X; QA-OPT-Y', `${x.evet}: ${QA} detail`, tarih('2026-03-04'), x.kapat]) var_(html, m, `${dil} read-only`)
      assert.match(html, new RegExp(`data-cevap="q_boy">172[.,]5 ${esc(f(dil).birim[paket.uygulama!.birimler.boy])}<`), 'the number with the pack\'s decimal mark and unit')
      // A question without an answer is not listed; nothing can be typed, ticked or sent.
      yok(html, 'QA-Q-SHORT', `${dil} read-only`)
      assert.doesNotMatch(html, /<input|<textarea|<select|data-eylem="form-(gonder|ileri|geri|baslat)"/)
      assert.match(html, /data-alan="hasta-formu" data-form-durumu="gonderildi"/)
      temiz(gorunurMetin(html), `form read-only ${dil}`)
    }
  })

  it('the helpers: a typed number read by THE PACK\'S number rules, never guessed; an answer as text for every type; nothing for no answer', () => {
    if (!ACIK) return
    // NOTYA-ULKE-DENETIM-01a — the pack's own decimal mark is read; the other mark is not turned into it
    const o = paket.bicim.ondalikAyraci
    assert.deepEqual(['172', `172${o}5`, ` 36${o}6 `, '', 'abc', '1,2,3', '1e3'].map(Hasta.sayiCoz), [172, 172.5, 36.6, null, null, null, null])
    if (o === '.' && paket.bicim.binlikAyraci === ',') assert.deepEqual(['172,5', '1,5', '1,500', '12,345.6'].map(Hasta.sayiCoz), [null, null, 1500, 12345.6], 'where the comma groups thousands it is never a decimal mark')
    if (o === ',' && paket.bicim.binlikAyraci === ' ') assert.deepEqual(['172,5', '172.5', '1.500', '1 500', '1,500'].map(Hasta.sayiCoz), [172.5, 172.5, null, 1500, 1.5], 'where the comma is the decimal mark, a point is read only where it cannot be thousands')
    const dil = FORMLAR[0], fo = form(dil), q = (k: string) => fo.bolumler.flatMap((b) => b.sorular).find((s) => s.anahtar === k)!
    assert.equal(Hasta.gorunumCevapMetni(q('q_eh'), { e: false }, f(dil)), f(dil).hasta.hayir)
    assert.equal(Hasta.gorunumCevapMetni(q('q_eh'), { e: true }, f(dil)), f(dil).hasta.evet)
    assert.equal(Hasta.gorunumCevapMetni(q('q_cok'), ['yok'], f(dil)), 'QA-OPT-NONE')
    for (const k of ['q_uzun', 'q_tek', 'q_cok', 'q_eh', 'q_tarih', 'q_boy']) assert.equal(Hasta.gorunumCevapMetni(q(k), undefined, f(dil)), '', k)
    assert.equal(Hasta.gorunumCevapMetni(q('q_tek'), 'not-an-option', f(dil)), '')
  })
})

describe('the intake form\'s screens — the doctor\'s side', () => {
  it('THE CARD, nothing asked yet: what the form is, "not asked yet", one button — and no answer, no invitation', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hekim
      const html = kartEkrani(dil)
      for (const m of [x.baslik, x.aciklama, x.durumYok, x.iste]) var_(html, m, `${dil} empty card`)
      for (const m of [x.cevaplar, x.beyan, x.davetBaslik, x.geriCek, x.yenidenAc, x.yeniBaglanti, x.yeniBaglantiUyari]) yok(html, m, `${dil} empty card`)
      assert.match(html, /data-alan="hasta-formu-karti" data-form-durumu="yok"/)
      temiz(gorunurMetin(html), `doctor card ${dil}`)
      // Not loaded: the card offers nothing.
      assert.doesNotMatch(kartEkrani(dil, { formlar: null, baglantiHatasi: 'QA-CONNECTION' }), /data-eylem=/)
    }
  })

  it('ASKED, with a link made in this step: the invitation in the patient\'s form, the link and the PIN once, and how nothing is sent', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hekim, pe = p(dil).erisim
      const hastaDili = FORMLAR[FORMLAR.length - 1]
      const adres = 'https://notya.test/portal?dil=x#' + 'A'.repeat(43)
      const metin = (await_ => await_)(A.formMetni(hastaDili).davet.metin.replace('%1', 'QA Doctor').replace('%2', adres))
      const html = kartEkrani(dil, { formlar: [hekimFormu({ durum: 'bekliyor', bolumler: null, gonderildi: null })], davet: { dil: hastaDili, metin, adres, pin: '123456', yeniForm: true }, davetDilAdi: 'QA-LANGUAGE-NAME' })
      for (const m of [Y.yerine(x.durumBekliyor, tarih(GUN)), x.istendi, pe.birKez, pe.baglanti, pe.pin, x.davetBaslik, `${x.davetDil}: QA-LANGUAGE-NAME`, x.davetIzoh, x.geriCek]) var_(html, m, `${dil} asked`)
      assert.match(html, new RegExp(`<textarea[^>]*lang="${hastaDili}"[^>]*data-alan="form-davet-metni" data-dil="${hastaDili}"[^>]*>${esc(metin).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</textarea>`), 'the invitation must be marked with the patient\'s language form')
      assert.match(html, /data-alan="portal-pin"/); assert.ok(html.includes('value="123456"'))
      assert.ok(!metin.includes('123456'), 'the PIN is in the invitation')
      // A link was made: there is nothing to renew, so no "new link" and no warning.
      for (const m of [x.yeniBaglanti, x.yeniBaglantiUyari, x.baglantiVar, x.acikVar]) yok(html, m, `${dil} asked`)
      temiz(gorunurMetin(html).replace(metin, ''), `doctor card asked ${dil}`)
    }
  })

  it('A PATIENT WHO ALREADY HAS A LINK: the card says the link cannot be shown again; THE NEW-LINK WARNING IS SHOWN BEFORE THE CONFIRMATION', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hekim
      const davet = { dil, metin: A.formMetni(dil).davet.baglantisizAdsiz, adres: null, pin: null, yeniForm: false }
      const formlar = [hekimFormu({ durum: 'taslak', bolumler: null, gonderildi: null, guncellendi: GUN })]
      const once = kartEkrani(dil, { formlar, davet })
      for (const m of [Y.yerine(x.durumTaslak, tarih(GUN)), x.acikVar, x.baglantiVar, davet.metin, x.yeniBaglanti]) var_(once, m, `${dil} has a link`)
      // Step one: the button only OFFERS a new link. No warning yet, and nothing that confirms.
      assert.match(once, /data-eylem="yeni-baglanti"/)
      assert.doesNotMatch(once, /data-eylem="yeni-baglanti-onay"|data-alan="portal-pin"|data-alan="portal-baglanti"/)
      yok(once, x.yeniBaglantiUyari, `${dil} before asking`)
      // Step two: what a new link does is on the screen TOGETHER WITH the button that confirms — and a way back.
      const sor = kartEkrani(dil, { formlar, davet, onayBekliyor: true })
      for (const m of [x.yeniBaglantiUyari, x.yeniBaglantiOnay, x.vazgec]) var_(sor, m, `${dil} confirm`)
      assert.ok(sor.indexOf(esc(x.yeniBaglantiUyari)) < sor.indexOf('data-eylem="yeni-baglanti-onay"'), 'the warning must come before the button that confirms')
      assert.match(sor, /role="alert"[^>]*>[^<]*/)
      assert.match(sor, /data-eylem="yeni-baglanti-vazgec"/)
      assert.doesNotMatch(sor, /data-eylem="yeni-baglanti"[ >]/, 'the offer is replaced by the question')
      temiz(gorunurMetin(sor), `doctor card confirm ${dil}`)
    }
    // The screen file: the request for a new link is sent only from the confirming button.
    const k = kod('components/ulke/uygulama/HastaFormuKarti.tsx')
    assert.match(k, /onClick=\{yeniBaglantiSor\} data-eylem="yeni-baglanti"/)
    assert.match(k, /onClick=\{\(\) => iste\(true\)\} data-eylem="yeni-baglanti-onay"/)
    assert.equal((k.match(/iste\(true\)/g) ?? []).length, 1, 'a new link may be asked for from one place only')
  })

  it('THE ANSWERS: "said by the patient, not verified" FIRST, then the answers; "not used for the note"; reopen with what it means', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hekim
      const html = kartEkrani(dil, { formlar: [hekimFormu()] })
      for (const m of [Y.yerine(x.durumGonderildi, tarih(GUN)), x.cevaplar, x.beyan, 'QA-ROLE', 'QA-PART-ONE', 'QA-Q-LONG', `${QA} long`, 'QA-OPT-B', x.notaGirmez, x.yenidenAc, x.yenidenAcUyari, x.iste]) var_(html, m, `${dil} answers`)
      assert.ok(html.indexOf(esc(x.beyan)) < html.indexOf(esc(`${QA} long`)), 'whose words these are must be said before the first answer')
      for (const m of [x.veliBeyani, x.geriCek, x.surumFarkli, x.oncekiler]) yok(html, m, `${dil} answers`)
      assert.match(html, /data-alan="hasta-formu-karti" data-form-durumu="gonderildi"/)
      // A guardian's form says so; a changed question set says so.
      const veli = kartEkrani(dil, { formlar: [hekimFormu({ veli: true, surumFarkli: true })] })
      var_(veli, x.veliBeyani, `${dil} guardian`); yok(veli, x.beyan, `${dil} guardian`); var_(veli, x.surumFarkli, `${dil} version`)
      assert.match(veli, /data-alan="form-cevaplari" data-form="hf1" data-veli="evet"/)
      temiz(gorunurMetin(html), `doctor card answers ${dil}`)
    }
  })

  it('an open form shows NO answer; with an open form the old one cannot be reopened; earlier forms fold away; notices', () => {
    if (!ACIK) return
    const dil = FORMLAR[0], x = f(dil).hekim
    const acik = kartEkrani(dil, { formlar: [hekimFormu({ id: 'yeni', durum: 'bekliyor', bolumler: null, gonderildi: null }), hekimFormu({ id: 'eski' })] })
    var_(acik, x.geriCek, 'open'); var_(acik, `${QA} long`, 'the earlier submitted form is still read')
    yok(acik, x.yenidenAc, 'reopen while another is open')
    assert.match(acik, /data-form-durumu="bekliyor"/)
    const iki = kartEkrani(dil, { formlar: [hekimFormu({ id: 'a' }), hekimFormu({ id: 'b', bolumler: [{ baslik: 'QA-OLD-PART', satirlar: [{ soru: 'QA-OLD-Q', cevap: 'QA-OLD-A' }] }] })] })
    assert.match(iki, /<details[^>]*data-alan="form-oncekiler">/); var_(iki, x.oncekiler, 'earlier'); var_(iki, 'QA-OLD-A', 'earlier')
    assert.equal((iki.match(/data-alan="form-beyan"/g) ?? []).length, 2, 'every shown form carries the line about whose words it is')
    for (const [bildirim, metin] of [['yeniden-acildi', x.yenidenAcildi], ['geri-cekildi', x.geriCekildi], ['yapilamadi', x.yapilamadi], ['kopyalandi', p(dil).erisim.kopyalandi], ['kopyalanamadi', p(dil).erisim.kopyalanamadi]] as const) var_(kartEkrani(dil, { bildirim }), metin, bildirim)
    var_(kartEkrani(dil, { bekliyor: true }), x.bekliyor, 'busy')
  })

  it('THE VISIT SCREEN: the last submitted form under the same line, read-only, "not used for the note" — and nothing at all where there is none', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const x = f(dil).hekim
      const ekran = (formlar: HekimFormu[] | null) => hekimEkrani(dil, h(Kart.MuayeneFormuGorunumu, { f: f(dil), formlar }))
      const html = ekran([hekimFormu({ id: 'acik', durum: 'taslak', bolumler: null, gonderildi: null }), hekimFormu()])
      for (const m of [x.cevaplar, x.beyan, `${QA} long`, x.notaGirmez]) var_(html, m, `${dil} visit`)
      assert.match(html, /data-alan="muayene-formu"/)
      assert.doesNotMatch(html.slice(html.indexOf('data-alan="muayene-formu"')), /<button|data-eylem=/, 'the visit screen only reads')
      for (const bosluk of [null, [], [hekimFormu({ durum: 'bekliyor', bolumler: null, gonderildi: null })]]) assert.doesNotMatch(ekran(bosluk), /muayene-formu|form-beyan/, 'nothing is drawn without a submitted form')
      temiz(gorunurMetin(html), `visit view ${dil}`)
    }
  })
})

describe('the intake form\'s screens — rules', () => {
  it('EVERY SENTENCE IS THE PACK\'S: the screen files carry no text of their own and write no address by hand', () => {
    for (const d of ['components/ulke/portal/HastaFormu.tsx', 'components/ulke/uygulama/HastaFormuKarti.tsx', 'lib/ulke/arayuz/formDaveti.ts', 'lib/ulke/intake/tipler.ts', 'lib/ulke/intake/sorular.ts', 'lib/ulke/intake/form.ts', 'lib/ulke/intake/icerik.ts', 'app/api/ulke/hasta-formu/route.ulke.ts', 'app/api/ulke/portal/form/route.ulke.ts']) {
      const k = kod(d)
      assert.doesNotMatch(k, /[^\x00-\x7F—–·…‹›«»]/, `${d} carries a letter outside ASCII: text belongs in a pack`)
      assert.doesNotMatch(k, /['"`]\/(calendar|visit|patient|today|settings|portal|api\/ulke)\b/, `${d} writes an address by hand`)
      assert.doesNotMatch(k, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${d} has a sentence written into the screen`)
    }
  })

  it('the patient\'s form imports nothing of the signed-in application, and asks the server with the page\'s own helper only', () => {
    const k = kod('components/ulke/portal/HastaFormu.tsx')
    assert.doesNotMatch(k, /from '\.\.\/uygulama\/|from '@\/components\/ulke\/uygulama|istemciSupabase|supabase|Authorization|localStorage|sessionStorage|document\.cookie/, 'the patient\'s form reaches for the doctor\'s application or a browser store')
    assert.doesNotMatch(k, /\bfetch\(/, 'every request goes through the page\'s helper (same origin, the cookie, the link\'s mark)')
    // It holds no question: nothing of a pack's clinical half can be imported into a browser file.
    for (const d of ['components/ulke/portal/HastaFormu.tsx', 'components/ulke/uygulama/HastaFormuKarti.tsx', 'components/ulke/portal/PortalSayfasi.tsx']) assert.doesNotMatch(kod(d), /countries\/active\/klinik|intake\/icerik|intake\/form'|intake\/sorular/, `${d} imports the questions or the server's rules into the browser`)
  })

  it('the cards are mounted where they belong, and only where the country has the form', () => {
    const hastalar = kod('components/ulke/uygulama/Hastalar.tsx'), takvim = kod('components/ulke/uygulama/Takvim.tsx'), muayene = kod('components/ulke/uygulama/Muayene.tsx'), sayfa = kod('components/ulke/portal/PortalSayfasi.tsx')
    assert.match(hastalar, /form=\{ozellikAcik\('hastaPortali'\) && ozellikAcik\('hastaFormu'\) \? <HastaFormuKarti u=\{u\} hastaId=\{veri\.hasta\.id\} \/> : null\}/)
    // On an appointment the form is asked FOR that appointment, and only while it is still to come.
    assert.match(takvim, /form=\{ozellikAcik\('hastaPortali'\) && ozellikAcik\('hastaFormu'\) && \(randevu\.durum === 'planlandi' \|\| randevu\.durum === 'geldi'\) \? <HastaFormuKarti u=\{u\} hastaId=\{randevu\.hastaId\} randevuId=\{randevu\.id\} \/> : null\}/)
    // The visit screen reads only: both of its views mount the read-only mode.
    assert.equal((muayene.match(/<HastaFormuKarti u=\{u\} hastaId=\{[a-z.]+\.id\} mod="muayene" \/>/g) ?? []).length, 2)
    assert.equal((muayene.match(/<HastaFormuKarti /g) ?? []).length, 2)
    assert.match(muayene, /const formAcik = \(\): boolean => ozellikAcik\('hastaPortali'\) && ozellikAcik\('hastaFormu'\)/)
    // The patient's page draws the card only when the server says there is a form, and the form replaces the page.
    assert.match(sayfa, /formKarti=\{icerik\.form \? <PortalFormKarti /)
    assert.match(sayfa, /asama === 'sayfa' && icerik && formAcik \? \(/)
  })
})

describe('the intake form\'s screens — the catalogue', () => {
  it('is the same shape in every form, each entry is there, a sentence keeps its placeholders in every form, and nothing of another country is in it', () => {
    if (!ACIK) return
    const ilk = yaprak(f(FORMLAR[0]))
    assert.ok(ilk.length >= 60, `only ${ilk.length} entries`)
    for (const dil of FORMLAR) {
      const y = yaprak(f(dil))
      assert.deepEqual(y.map((x) => x[0]), ilk.map((x) => x[0]), `${dil}: not the same keys as ${FORMLAR[0]}`)
      for (let n = 0; n < y.length; n++) {
        assert.ok(y[n][1].trim().length > 0, `${dil}/${y[n][0]} is empty`)
        assert.deepEqual([...y[n][1].matchAll(/%\d?/g)].map((x) => x[0]).sort(), [...ilk[n][1].matchAll(/%\d?/g)].map((x) => x[0]).sort(), `${dil}/${y[n][0]}: the placeholders differ from ${FORMLAR[0]}`)
        temiz(y[n][1], `form catalogue ${dil}/${y[n][0]}`)
      }
      const d = f(dil).davet
      // The invitation: the address is the last thing in the text; the texts for a patient who has a link name none.
      assert.match(d.metin, /%2$/, `${dil}: davet.metin must end with the address`); assert.match(d.metin, /%1/)
      assert.match(d.metinAdsiz, /%$/, `${dil}: davet.metinAdsiz must end with the address`)
      assert.match(d.baglantisiz, /%(?!\d)/); assert.doesNotMatch(d.baglantisizAdsiz, /%/)
      for (const t of Object.values(d)) assert.doesNotMatch(t, /\d{4,}/, `${dil}: a number is written into the invitation`)
      // Every unit the pack uses has a name.
      for (const kodu of Object.values(paket.uygulama!.birimler)) assert.ok(f(dil).birim[kodu]?.trim(), `${dil}: the pack's unit "${kodu}" has no name`)
    }
  })
})
