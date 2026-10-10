/**
 * NOTYA-ULKE-DENETIM-01 — THE KIT'S OWN DATE, TIME AND NUMBER FIELDS, for whichever pack is active (run once per
 * country folder). Names no country: every expectation is read from the active pack (its date pattern, its clock, its
 * two number marks, its words).
 *
 *   A. a day        three labelled fields in the order of the pack's pattern, the pack's mark between them, the
 *                   numeric keypad, never a browser's own date field; "not a day" in the pack's sentence
 *   B. a time       the pack's clock: 24-hour → hour and minute; 12-hour → hour, minute and an explicit choice of
 *                   the half of the day, written as the screens write it beside every time
 *   C. a number     read by the pack's two marks; what cannot be read is said in the pack's sentence with two
 *                   examples written the pack's way, and never shown as a number
 *   D. the screens  every screen that asks for a day, a time or a number draws these fields: new patient, booking,
 *                   working pattern, a tool, keeping a tool's result, the intake form
 *   E. a short day  the patient's appointment buttons and the week view write the day, never a cut-off year
 *   F. the words    in every form of the pack, with the places for the examples, and nothing of another country
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { GirdiMetni } from '@/lib/ulke/arayuz'
import type { HastaFormuGorunumu } from '@/lib/ulke/intake/tipler'
import type { DilKodu, UlkePaketi } from '@/lib/ulke/tipler'

const h = React.createElement
const bos = () => {}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let paket: UlkePaketi
let ACIK = false
let FORMLAR: readonly DilKodu[] = []
let A: typeof import('@/lib/ulke/arayuz')
let B: typeof import('@/lib/ulke/arayuz/bicim')
let S: typeof import('@/lib/ulke/arayuz/sayi')
let Y: typeof import('@/lib/ulke/arayuz/yerTutucu')
let Z: typeof import('@/lib/ulke/arayuz/zamanGirdisi')
let ZM: typeof import('@/lib/ulke/uygulama/zaman')
let Tarih: typeof import('./TarihGirisi')
let Saat: typeof import('./SaatGirisi')
let Sayi: typeof import('./SayiGirisi')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const g = (dil: DilKodu): GirdiMetni => A.girdiMetni(dil)
/** The ids of the fields a person can type or choose in, in the order they are drawn. */
const alanlar = (html: string) => [...html.matchAll(/<(?:input|select) id="([^"]+)"/g)].map((m) => m[1])
const deger = (html: string, id: string) => new RegExp(`<input id="${kacis(id)}"[^>]*value="([^"]*)"`).exec(html)?.[1] ?? null
const BROWSER_ALANI = /type="(date|time|datetime-local|month|week)"/

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && Boolean(arayuz)
  FORMLAR = paket.uygulama?.diller ?? []
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); B = await import('@/lib/ulke/arayuz/bicim'); S = await import('@/lib/ulke/arayuz/sayi'); Y = await import('@/lib/ulke/arayuz/yerTutucu')
  Z = await import('@/lib/ulke/arayuz/zamanGirdisi'); ZM = await import('@/lib/ulke/uygulama/zaman')
  Tarih = await import('./TarihGirisi'); Saat = await import('./SaatGirisi'); Sayi = await import('./SayiGirisi')
})

describe('A. a day is typed in the pack\'s own order', () => {
  it('three labelled fields in the order of the pack\'s pattern, its mark between them, the stored day in them, and no browser date field', () => {
    if (!ACIK) return
    const d = Z.tarihDuzeni(paket.bicim.tarihDeseni)
    const AD = { DD: 'gun', MM: 'ay', YYYY: 'yil' } as const
    for (const dil of FORMLAR) {
      const m = g(dil)
      const html = renderToStaticMarkup(h(Tarih.TarihGirisi, { id: 'qa-t', etiket: 'QA-DATE-LABEL', deger: '2019-03-07', degistir: bos, m, ad: 'qa', alan: 'qa-alan', zorunlu: true }))
      assert.deepEqual(alanlar(html), d.sira.map((k) => `qa-t-${AD[k]}`), `${dil}: the fields stand in the order ${paket.bicim.tarihDeseni}`)
      // each part has its own label, in the pack's words, tied to its own field
      for (const k of d.sira) assert.match(html, new RegExp(`<label class="uza-parca-ad" for="qa-t-${AD[k]}">${kacis(esc(m[AD[k]]))}</label>`), `${dil}: label of ${k}`)
      assert.deepEqual([deger(html, 'qa-t-gun'), deger(html, 'qa-t-ay'), deger(html, 'qa-t-yil')], ['07', '03', '2019'])
      // read from left to right the three fields spell the day exactly as the pack writes it
      assert.equal(d.sira.map((k) => deger(html, `qa-t-${AD[k]}`)).join(d.ayrac), ZM.gunYazDesenle('2019-03-07', paket.bicim.tarihDeseni))
      assert.equal(html.split(`<span class="uza-parca-ayrac" aria-hidden="true">${esc(d.ayrac)}</span>`).length - 1, 2, `${dil}: the pack's mark between the parts`)
      assert.match(html, new RegExp(`<fieldset id="qa-t" class="uza-parcali" data-girdi="tarih" data-alan="qa-alan" data-desen="${kacis(esc(paket.bicim.tarihDeseni))}" data-durum="tamam" data-deger="2019-03-07">`))
      assert.match(html, /<legend class="uza-etiket">QA-DATE-LABEL<\/legend>/)
      assert.match(html, /<input type="hidden" name="qa" value="2019-03-07"\/>/, 'the value a form carries is the ISO day')
      // the numeric keypad on a phone; the year takes four digits, the others two
      assert.equal(html.split('inputMode="numeric"').length - 1 || html.split('inputmode="numeric"').length - 1, 3)
      assert.match(html, /<input id="qa-t-yil"[^>]*maxLength="4"|<input id="qa-t-yil"[^>]*maxlength="4"/i)
      assert.equal((html.match(/aria-required="true"/g) ?? []).length, 3)
      assert.doesNotMatch(html, BROWSER_ALANI, 'never the browser\'s own date field')
      assert.doesNotMatch(html, /role="alert"/, 'a real day shows no message')
      temiz(gorunurMetin(html), `date field ${dil}`)
    }
  })

  it('nothing typed: empty parts and no message; asked to send without a day: the pack\'s own sentence, tied to the parts', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const m = g(dil)
      const bosHali = renderToStaticMarkup(h(Tarih.TarihGirisi, { id: 'qa-t', etiket: 'QA', deger: '', degistir: bos, m }))
      assert.match(bosHali, /data-durum="bos"/); assert.doesNotMatch(bosHali, /role="alert"|data-deger=/)
      assert.deepEqual([deger(bosHali, 'qa-t-gun'), deger(bosHali, 'qa-t-ay'), deger(bosHali, 'qa-t-yil')], ['', '', ''])
      // the mark a field hands over for "not a day" is never drawn as a day
      const isaretli = renderToStaticMarkup(h(Tarih.TarihGirisi, { id: 'qa-t', etiket: 'QA', deger: Z.GIRDI_GECERSIZ, degistir: bos, m }))
      assert.deepEqual([deger(isaretli, 'qa-t-gun'), deger(isaretli, 'qa-t-ay'), deger(isaretli, 'qa-t-yil')], ['', '', ''])
      const hatali = renderToStaticMarkup(h(Tarih.TarihGirisi, { id: 'qa-t', etiket: 'QA', deger: '', degistir: bos, m, hata: true }))
      assert.match(hatali, new RegExp(`<p id="qa-t-hata" class="uza-ipucu uza-girdi-hata" role="alert" data-hata="tarih">${kacis(esc(m.tarihGecersiz))}</p>`), dil)
      assert.equal((hatali.match(/aria-invalid="true" aria-describedby="qa-t-hata"/g) ?? []).length, 3, 'the message is tied to each part')
    }
  })
})

describe('B. a time of day is typed on the pack\'s own clock', () => {
  it('24-hour: hour and minute and nothing else; 12-hour: hour, minute and the half of the day, in the words the screens write beside a time', () => {
    if (!ACIK) return
    const b = paket.uygulama!.saatBicimi
    assert.equal(B.saatBicimi(), b)
    for (const dil of FORMLAR) {
      const m = g(dil)
      const ciz = (saat: string, ek: Record<string, unknown> = {}) => renderToStaticMarkup(h(Saat.SaatGirisi, { id: 'qa-s', etiket: 'QA-TIME-LABEL', deger: saat, degistir: bos, m, ad: 'qa', ...ek }))
      const html = ciz('14:30')
      for (const k of ['saat', 'dakika'] as const) assert.match(html, new RegExp(`<label class="uza-parca-ad" for="qa-s-${k}">${kacis(esc(m[k]))}</label>`), `${dil}: label of ${k}`)
      assert.match(html, new RegExp(`data-girdi="saat" data-saat-bicimi="${b}" data-durum="tamam" data-deger="14:30"`))
      assert.match(html, /<input type="hidden" name="qa" value="14:30"\/>/, 'the value a form carries is 24-hour HH:MM, whatever the clock')
      assert.doesNotMatch(html, BROWSER_ALANI, 'never the browser\'s own time field')
      if (b === 24) {
        assert.deepEqual(alanlar(html), ['qa-s-saat', 'qa-s-dakika'])
        assert.deepEqual([deger(html, 'qa-s-saat'), deger(html, 'qa-s-dakika')], ['14', '30'])
        assert.doesNotMatch(html, /<select/, 'a 24-hour clock asks for no half of the day')
        assert.deepEqual([deger(ciz('00:05'), 'qa-s-saat'), deger(ciz('00:05'), 'qa-s-dakika')], ['00', '05'])
      } else {
        const y = B.gunYarisiAdlari()
        assert.ok(y.oo && y.os && y.oo !== y.os, 'the platform must know the two halves of the day in the pack\'s locale')
        // the same words that stand beside every time on the screens
        assert.ok(B.saatGoster('09:00').includes(y.oo) && B.saatGoster('15:00').includes(y.os))
        assert.deepEqual(alanlar(html), ['qa-s-saat', 'qa-s-dakika', 'qa-s-yari'])
        assert.deepEqual([deger(html, 'qa-s-saat'), deger(html, 'qa-s-dakika')], ['2', '30'])
        assert.match(html, new RegExp(`<option value="">—</option><option value="oo">${kacis(esc(y.oo))}</option><option value="os" selected="">${kacis(esc(y.os))}</option>`), `${dil}: 14:30 is the second half of the day`)
        // THE EDGES: 12 before noon is midnight, 12 after noon is noon
        const gece = ciz('00:00'), ogle = ciz('12:00')
        assert.deepEqual([deger(gece, 'qa-s-saat'), deger(gece, 'qa-s-dakika')], ['12', '00']); assert.match(gece, /<option value="oo" selected="">/)
        assert.deepEqual([deger(ogle, 'qa-s-saat'), deger(ogle, 'qa-s-dakika')], ['12', '00']); assert.match(ogle, /<option value="os" selected="">/)
        // AN EXPLICIT CHOICE: an empty field has neither half chosen
        const bosHali = ciz('')
        assert.match(bosHali, /<option value="" selected="">—<\/option>/); assert.doesNotMatch(bosHali, /<option value="o[os]" selected/)
      }
      const hatali = ciz('', { hata: true })
      assert.match(hatali, new RegExp(`<p id="qa-s-hata" class="uza-ipucu uza-girdi-hata" role="alert" data-hata="saat">${kacis(esc(m.saatGecersiz))}</p>`), dil)
      assert.doesNotMatch(ciz(''), /role="alert"/)
      temiz(gorunurMetin(html + hatali), `time field ${dil}`)
    }
  })
})

describe('C. a number is read by the pack\'s own two marks, or refused in the pack\'s own words', () => {
  it('the pack\'s way of writing a number is read; the other way is said to be unreadable, with two examples written the pack\'s way', () => {
    if (!ACIK) return
    const kural = paket.bicim
    const [tamOrnek, ondalikOrnek] = S.sayiOrnekleri(kural)
    assert.deepEqual([tamOrnek, ondalikOrnek], [S.sayiYaz(1500), S.sayiYaz(1.5, 1)])
    assert.deepEqual([S.sayiCoz(tamOrnek), S.sayiCoz(ondalikOrnek)], [{ tamam: true, sayi: 1500 }, { tamam: true, sayi: 1.5 }], 'the examples the message shows are themselves read')
    for (const dil of FORMLAR) {
      const m = g(dil)
      const ciz = (metin: string) => renderToStaticMarkup(h(Sayi.SayiGirisi, { id: 'qa-n', deger: metin, degistir: bos, m, ek: { 'data-birim': 'kg' } }))
      const mesaj = `<p id="qa-n-okunamadi" class="uza-ipucu uza-girdi-hata" role="alert" data-hata="sayi-okunamadi">${esc(Y.yerine(m.sayiOkunamadi, tamOrnek, ondalikOrnek))}</p>`
      for (const iyi of [tamOrnek, ondalikOrnek, '72', '']) { const html = ciz(iyi); assert.doesNotMatch(html, /role="alert"|aria-invalid/, `${dil}: ${JSON.stringify(iyi)} is a number here`); assert.match(html, new RegExp(`data-okuma="${iyi ? 'tamam' : 'bos'}"`)) }
      // the other country's way of writing one and a half; letters
      const digerOndalik = kural.ondalikAyraci === '.' ? '1,5' : null
      for (const kotu of ['abc', '1.5.5', ...(digerOndalik ? [digerOndalik] : []), ...(kural.ondalikAyraci === ',' && kural.binlikAyraci !== '.' ? ['1.500'] : [])]) {
        const html = ciz(kotu)
        assert.ok(html.includes(mesaj), `${dil}: ${JSON.stringify(kotu)} must be refused with the pack's sentence, got ${html}`)
        assert.match(html, /data-okuma="okunamadi"[^>]*aria-invalid="true" aria-describedby="qa-n-okunamadi"|aria-invalid="true" aria-describedby="qa-n-okunamadi"[^>]*data-okuma="okunamadi"/)
      }
      const html = ciz('abc')
      assert.match(html, /<input data-birim="kg" id="qa-n" type="text" inputMode="decimal"|<input data-birim="kg" id="qa-n" type="text" inputmode="decimal"/i, 'a text field with the decimal keypad')
      temiz(gorunurMetin(html), `number field ${dil}`)
    }
  })
})

describe('D. every screen that asks for a day, a time or a number draws the kit\'s own fields', () => {
  it('the new-patient form: the date of birth', async () => {
    if (!ACIK) return
    const Hastalar = await import('../uygulama/Hastalar')
    for (const dil of FORMLAR) {
      const html = renderToStaticMarkup(h(Hastalar.YeniHastaGorunumu, { m: A.uygulamaMetni(dil), dil, a: { ...Hastalar.BOS_HASTA, dogumTarihi: '2019-03-07' }, set: bos, gonder: bos, bekliyor: false, hata: null, telefonOrnek: paket.telefon.ornek }))
      assert.match(html, /<fieldset id="uza-h-dogum" class="uza-parcali" data-girdi="tarih"[^>]*data-deger="2019-03-07"/)
      assert.match(html, new RegExp(`<legend class="uza-etiket">${kacis(esc(A.uygulamaMetni(dil).yeniHasta.dogumTarihi))}</legend>`))
      assert.doesNotMatch(html, BROWSER_ALANI, dil)
    }
  })

  it('booking and the working pattern, where the country has appointments: the day and every time of day', async () => {
    if (!ACIK || !paket.ozellikler.randevu) return
    const T = await import('../uygulama/Takvim')
    for (const dil of FORMLAR) {
      const m = A.uygulamaMetni(dil), r = A.randevuMetni(dil)
      const form = renderToStaticMarkup(h(T.RandevuFormuGorunumu, { m, r, hasta: { id: 'p1', ad: 'QA Patient', otaIsmi: '' }, a: { gun: '2026-10-12', saat: '14:30', sureDk: 30, neden: '' }, set: bos, sureler: [15, 30], gonder: bos, bekliyor: false, hata: null, geri: '/calendar' }))
      assert.match(form, /<fieldset id="uza-rf-gun" class="uza-parcali" data-girdi="tarih"[^>]*data-deger="2026-10-12"/)
      assert.match(form, /<fieldset id="uza-rf-saat" class="uza-parcali" data-girdi="saat"[^>]*data-deger="14:30"/)
      assert.match(form, /<input type="hidden" name="gun" value="2026-10-12"\/>/); assert.match(form, /<input type="hidden" name="saat" value="14:30"\/>/)
      const duzen = renderToStaticMarkup(h(T.DuzenGorunumu, { m, r, a: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] }, set: bos, sureler: [15, 30], gonder: bos, bekliyor: false, hata: null, kaydedildi: false, kayitli: true }))
      for (const [id, saat] of [['uza-d-bas', '09:00'], ['uza-d-bit', '17:00'], ['uza-d-mola-bas-0', '12:00'], ['uza-d-mola-bit-0', '13:00']]) assert.match(duzen, new RegExp(`<fieldset id="${id}" class="uza-parcali" data-girdi="saat"[^>]*data-deger="${saat}"`), `${dil}: ${id}`)
      for (const html of [form, duzen]) assert.doesNotMatch(html, BROWSER_ALANI, dil)
    }
  })

  it('the intake form on the patient\'s page, where the country has it: a date question and a number question, in the patient\'s own form of the language', async () => {
    if (!ACIK || !paket.ozellikler.hastaFormu || !(await import('@/countries/active/arayuz')).AKTIF_ARAYUZ?.formMetinleri) return
    const Hasta = await import('../portal/HastaFormu')
    const birim = paket.uygulama!.birimler.boy
    for (const dil of FORMLAR) {
      const f = A.formMetni(dil), m = g(dil)
      const fo: HastaFormuGorunumu = {
        id: 'f1', durum: 'taslak', veli: false, dil, gonderildi: null, riza: { metin: 'QA-CONSENT', kabul: true }, cevaplar: {},
        bolumler: [{ anahtar: 'bir', baslik: 'QA-PART', sorular: [
          { anahtar: 'q_tarih', tur: 'tarih', metin: 'QA-Q-DATE', yardim: null, zorunlu: false, secenekler: null, ayrinti: null, birim: null },
          { anahtar: 'q_boy', tur: 'sayi', metin: 'QA-Q-HEIGHT', yardim: null, zorunlu: false, secenekler: null, ayrinti: null, birim: { kod: birim, ad: f.birim[birim], enAz: 20, enCok: 260, ondalik: true } },
        ] }],
      }
      const ciz = (sayilar: Record<string, string>, ek: Record<string, unknown> = {}) => renderToStaticMarkup(h(Hasta.HastaFormuGorunumu, { f, form: fo, cevaplar: {}, sayilar, bolum: 0, riza: true, setRiza: bos, rizaHatasi: false, kayit: 'yok', gonderim: 'yok', eksik: [], degistir: bos, hamDegistir: bos, git: bos, gonder: bos, kapat: bos, ...ek }))
      const html = ciz({ q_tarih: '2019-03-07', q_boy: S.sayiAlanMetni(172.5) })
      assert.match(html, /<fieldset id="uzf-q_tarih" class="uza-parcali" data-girdi="tarih"[^>]*data-deger="2019-03-07"/)
      assert.match(html, new RegExp(`<label class="uza-parca-ad" for="uzf-q_tarih-gun">${kacis(esc(m.gun))}</label>`), `${dil}: the patient reads the parts in their own form of the language`)
      assert.doesNotMatch(html, BROWSER_ALANI, dil); assert.doesNotMatch(html, /role="alert"/)
      // a height the country cannot read: the pack's sentence, and — asked to send — nothing is sent and the form says why
      const kotu = ciz({ q_boy: 'abc' }, { gonderim: 'okunamadi', eksik: ['q_boy'] })
      assert.ok(kotu.includes(esc(Y.yerine(m.sayiOkunamadi, ...S.sayiOrnekleri(paket.bicim)))), dil)
      assert.ok(gorunurMetin(kotu).includes(m.duzelt), `${dil}: the form says that something could not be read`)
      assert.match(kotu, /data-soru="q_boy" data-tur="sayi" data-eksik="evet"/)
      // read, but outside what the question accepts: the form's own sentence about the range, not "unreadable"
      const disarida = ciz({ q_boy: '999' })
      assert.ok(disarida.includes('data-hata="sayi-aralik"') && !disarida.includes('data-hata="sayi-okunamadi"'), dil)
      assert.equal(Hasta.okunamayanCevap(fo.bolumler[0].sorular[0], Z.GIRDI_GECERSIZ, undefined), true)
      assert.equal(Hasta.okunamayanCevap(fo.bolumler[0].sorular[0], '', undefined), false)
      assert.equal(Hasta.okunamayanCevap(fo.bolumler[0].sorular[1], 'abc', undefined), true)
      assert.equal(Hasta.okunamayanCevap(fo.bolumler[0].sorular[1], '172', { n: 172, b: birim }), false)
      temiz(gorunurMetin(html + kotu), `intake fields ${dil}`)
    }
    // a stored number is written back into its field the way this country types it, and read back as the same number
    for (const n of [172.5, 1.125, 36.6, 70, 1500]) assert.equal(Hasta.sayiCoz(S.sayiAlanMetni(n)), n, String(n))
  })
})

describe('E. a short day is the day, never a cut-off year', () => {
  it('the patient\'s appointment buttons write the weekday and the whole day in the pack\'s pattern', async () => {
    if (!ACIK || !paket.ozellikler.randevu) return
    const Sayfa = await import('../portal/PortalSayfasi')
    for (const dil of FORMLAR) {
      const r = A.randevuMetni(dil)
      for (const gun of ['2026-10-10', '2026-10-11', '2026-10-17']) {
        const tam = ZM.gunYazDesenle(gun, paket.bicim.tarihDeseni)
        assert.equal(Sayfa.portalGunu(r, gun, false), `${A.gunAdi(r, ZM.haftaGunu(gun))} ${tam}`, `${dil}: the button of ${gun}`)
        assert.equal(Sayfa.portalGunu(r, gun), `${A.gunAdi(r, ZM.haftaGunu(gun), true)}, ${tam}`)
      }
      // two Saturdays a week apart can be told from each other
      assert.notEqual(Sayfa.portalGunu(r, '2026-10-10', false), Sayfa.portalGunu(r, '2026-10-17', false))
    }
  })

  it('the week view\'s short day holds the day and the month, in the pack\'s order', () => {
    if (!ACIK) return
    const kisa = ZM.gunYazYilsiz('2026-10-09', paket.bicim.tarihDeseni)
    assert.ok(kisa.includes('09') && kisa.includes('10') && !kisa.includes('2026'), kisa)
    assert.ok(ZM.gunYazDesenle('2026-10-09', paket.bicim.tarihDeseni).includes(kisa) || paket.bicim.tarihDeseni.startsWith('YYYY'), kisa)
  })
})

describe('F. the words of the fields', () => {
  it('every form of the pack has every word, the sentence for an unreadable number holds the two places for its examples, and no word is another country\'s', () => {
    if (!ACIK) return
    const ANAHTARLAR = ['gun', 'ay', 'yil', 'saat', 'dakika', 'tarihGecersiz', 'saatGecersiz', 'sayiOkunamadi', 'duzelt'] as const
    for (const dil of FORMLAR) {
      const m = g(dil) as unknown as Record<string, string>
      assert.deepEqual(Object.keys(m).sort(), [...ANAHTARLAR].sort(), dil)
      for (const k of ANAHTARLAR) assert.ok(typeof m[k] === 'string' && m[k].trim().length > 0, `${dil}: girdi.${k}`)
      assert.match(m.sayiOkunamadi, /%1(?!\d)/); assert.match(m.sayiOkunamadi, /%2(?!\d)/)
      for (const k of ANAHTARLAR) if (k !== 'sayiOkunamadi') assert.doesNotMatch(m[k], /%|\d/, `${dil}: girdi.${k} holds no value and no figure`)
      temiz(Object.values(m).join('\n'), `girdi ${dil}`)
    }
    // the words differ between the forms of a pack that has several (a form is never a copy of another)
    if (FORMLAR.length > 1) assert.equal(new Set(FORMLAR.map((dil) => g(dil).tarihGecersiz)).size, FORMLAR.length)
  })
})
