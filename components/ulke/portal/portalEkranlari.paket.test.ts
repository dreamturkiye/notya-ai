/**
 * NOTYA-ULKE-PORTAL-01 — THE PORTAL'S SCREENS, for whichever pack is active (run once per country folder). Names
 * no country: every expectation is read from the active pack. A pack without the portal has nothing to draw, and
 * the test says so.
 *
 *   A. the patient's side     the PIN page names nobody; the page shows the patient's own name, the doctor and the
 *                             role as the pack names it, appointments as the country writes them, shared summaries,
 *                             the request and its outcome — in every language form, and nothing of the doctor's
 *   B. the doctor's side      access (given once, renewed, withdrawn, locked, ended, the record), the summary
 *                             (draft, shared, taken back), requests on the calendar and their answer
 *   C. rules of the screens   every sentence is the pack's; the patient's page imports nothing of the signed-in
 *                             application; the page is never indexed or cached; every link leads to a real page
 *   D. leak test              no other country's term or letter in any catalogue entry or on any screen
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { PortalMetni, RandevuMetni, UygulamaMetni } from '@/lib/ulke/arayuz'
import type { BekleyenIstek, HastaOzeti, PortalIcerigi } from '@/lib/ulke/portal/tipler'
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
let RANDEVU = false
let FORMLAR: readonly DilKodu[] = []
let ON_EK = ''
let A: typeof import('@/lib/ulke/arayuz')
let B: typeof import('@/lib/ulke/arayuz/bicim')
let Z: typeof import('@/lib/ulke/uygulama/zaman')
let S: typeof import('@/lib/ulke/portal/sabitler')
let Y: typeof import('@/lib/ulke/arayuz/yerTutucu')
let Sayfa: typeof import('./PortalSayfasi')
let Erisim: typeof import('../uygulama/PortalErisimi')
let Ozet: typeof import('../uygulama/PortalOzeti')
let Istek: typeof import('../uygulama/PortalIstekleri')
let Kabuk: typeof import('../uygulama/Kabuk')

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
/** 2026-10-12 is a Monday. */
const PZT = '2026-10-12'
const SAL = '2026-10-13'
const HASTA_ADI = 'QA Patient Portal'
const HEKIM_ADI = 'QA Doctor Portal'
const OZET_METNI = 'QA-SUMMARY line one.\nQA-SUMMARY line two.'
const TOKEN = 'A'.repeat(43)

function icerik(dil: DilKodu, ek: Partial<PortalIcerigi> = {}): PortalIcerigi {
  return {
    dil, hasta: { ad: HASTA_ADI }, hekim: { ad: HEKIM_ADI, rol: 'QA-ROLE' },
    randevular: RANDEVU ? [{ gun: PZT, saat: '14:30', sureDk: 30 }] : null,
    saatDilimi: null,
    ozetler: [{ id: 'o1', gun: PZT, metin: OZET_METNI }],
    istek: RANDEVU ? { gunler: [PZT, SAL, '2026-10-14'], son: null } : null,
    bitis: '2026-10-12T10:00:00.000Z',
    ...ek,
  }
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true && Boolean(arayuz?.portalMetinleri)
  RANDEVU = ACIK && paket.ozellikler.randevu === true
  FORMLAR = paket.uygulama?.diller ?? []
  ON_EK = paket.yolOnEki ?? ''
  if (!ACIK) return
  A = await import('@/lib/ulke/arayuz'); B = await import('@/lib/ulke/arayuz/bicim'); Z = await import('@/lib/ulke/uygulama/zaman')
  S = await import('@/lib/ulke/portal/sabitler'); Y = await import('@/lib/ulke/arayuz/yerTutucu')
  Sayfa = await import('./PortalSayfasi'); Erisim = await import('../uygulama/PortalErisimi'); Ozet = await import('../uygulama/PortalOzeti'); Istek = await import('../uygulama/PortalIstekleri'); Kabuk = await import('../uygulama/Kabuk')
})

const p = (f: DilKodu): PortalMetni => A.portalMetni(f)
const m = (f: DilKodu): UygulamaMetni => A.uygulamaMetni(f)
const r = (f: DilKodu): RandevuMetni | null => (RANDEVU ? A.randevuMetni(f) : null)
const gun = (g: string) => Z.gunYazDesenle(g, B.tarihDeseni())
const hastaSayfasi = (f: DilKodu, i: PortalIcerigi, ek: Record<string, unknown> = {}) => renderToStaticMarkup(h(Sayfa.PortalCercevesi, { dil: f, children: h(Sayfa.PortalSayfaGorunumu, { p: p(f), r: r(f), icerik: i, form: { gunler: [], neden: '' }, setForm: bos, istekGonder: bos, istekBekliyor: false, istekHatasi: null, cikis: bos, ...ek }) }))
const hekimEkrani = (f: DilKodu, ic: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil: f, m: m(f), ad: HEKIM_ADI, aktif: 'hastalar', cikis: bos, children: ic }))

/** Every link of a rendered screen leads to a page of THIS build: under the country's path, listed by the pack, with a route file. */
function baglantilarGercek(html: string, kaynak: string): number {
  const izin = paket.rotalar
  let n = 0
  for (const x of html.matchAll(/(?:href|action)="([^"]+)"/g)) {
    if (x[1].startsWith('https://fonts.googleapis.com/')) continue
    n++
    const adres = x[1].split('?')[0].split('#')[0]
    assert.ok(adres === ON_EK || adres.startsWith(`${ON_EK}/`), `${kaynak}: "${x[1]}" is outside this country's path`)
    const yol = adres.slice(ON_EK.length) || '/'
    if (izin !== 'hepsi') assert.ok(izin.sayfalar.includes(yol), `${kaynak}: links to ${x[1]}, which the pack does not list`)
    assert.ok(existsSync(join(KOK, 'app', yol === '/' ? '' : yol.slice(1), 'page.ulke.tsx')), `${kaynak}: ${x[1]} has no route file`)
  }
  return n
}

describe('the patient portal\'s screens — the patient\'s side', () => {
  it('a pack without the portal brings no portal catalogue and no page is served for it', async () => {
    if (ACIK) return
    const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
    assert.ok(!paket.ozellikler.hastaPortali || !arayuz?.portalMetinleri)
    if (paket.rotalar !== 'hepsi') assert.ok(!paket.rotalar.sayfalar.includes('/portal'))
  })

  it('THE PIN PAGE NAMES NOBODY: the form, the privacy line, and nothing about any patient — in every form', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const html = renderToStaticMarkup(h(Sayfa.PortalCercevesi, { dil: f, children: h(Sayfa.PortalGirisGorunumu, { p: p(f), pin: '', setPin: bos, gonder: bos, bekliyor: false, hata: null }) }))
      const g = gorunurMetin(html)
      for (const x of [p(f).giris.baslik, p(f).giris.aciklama, p(f).giris.pin, p(f).giris.gonder, p(f).giris.gizlilik]) assert.ok(g.includes(x), `${f}: "${x}" is not on the PIN page`)
      assert.match(html, new RegExp(`<div class="uza" lang="${f}"`))
      assert.match(html, new RegExp(`<input[^>]*name="pin"[^>]*inputMode="numeric"[^>]*maxLength="${S.PIN_HANE}"|<input[^>]*name="pin"[^>]*inputmode="numeric"[^>]*maxlength="${S.PIN_HANE}"`, 'i'))
      assert.match(html, /autoComplete="off"|autocomplete="off"/i, 'a PIN is not offered to a password manager')
      // The view is not GIVEN anything about a patient, so it cannot show it; and it links nowhere.
      assert.equal(baglantilarGercek(html, `PIN page (${f})`), 0)
      assert.doesNotMatch(html, /<a\b/)
      temiz(html, `PIN page (${f})`); temiz(g, `PIN page, visible text (${f})`)
    }
  })

  it('the PIN page says what went wrong in plain words: wrong PIN with the tries left, too fast, not six digits, the session that ended', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const ciz = (ek: Record<string, unknown>) => gorunurMetin(renderToStaticMarkup(h(Sayfa.PortalGirisGorunumu, { p: p(f), pin: '', setPin: bos, gonder: bos, bekliyor: false, hata: null, ...ek })))
      assert.ok(ciz({ hata: { kod: 'PIN_YANLIS', kalan: 3 } }).includes(Y.yerine(p(f).giris.pinYanlis, 3)))
      assert.ok(ciz({ hata: { kod: 'PIN_BICIMI' } }).includes(Y.yerine(p(f).giris.pinBicimi, S.PIN_HANE)))
      assert.ok(ciz({ hata: { kod: 'YAVAS' } }).includes(p(f).giris.yavas))
      assert.ok(ciz({ hata: { kod: 'BAGLANTI' } }).includes(p(f).giris.baglanti))
      assert.ok(ciz({ hata: { kod: 'HATA' } }).includes(p(f).giris.hata))
      assert.ok(ciz({ oturumBitti: true }).includes(p(f).sayfa.oturumBitti))
      assert.ok(!ciz({}).includes(p(f).sayfa.oturumBitti))
      assert.ok(ciz({ bekliyor: true }).includes(p(f).giris.gonderiliyor))
      // A link that does not work, or locked: one sentence, no form to try again with.
      for (const [durum, metin] of [['gecersiz', p(f).giris.gecersiz], ['kilitli', p(f).giris.kilitli], ['yukleniyor', p(f).giris.yukleniyor]] as const) {
        const html = renderToStaticMarkup(h(Sayfa.PortalDurumGorunumu, { p: p(f), durum }))
        assert.ok(gorunurMetin(html).includes(metin), `${f}/${durum}`)
        assert.doesNotMatch(html, /<input|<form|<button/, `${f}/${durum}: nothing to type into`)
      }
    }
  })

  it('THE PATIENT\'S PAGE: their name, the doctor and the role, the appointment as the country writes it, the shared summary — in every form', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const html = hastaSayfasi(f, icerik(f))
      const g = gorunurMetin(html)
      assert.ok(g.includes(Y.yerine(p(f).sayfa.selam, HASTA_ADI)), `${f}: the patient's name`)
      assert.ok(g.includes(`${HEKIM_ADI} · QA-ROLE`), `${f}: the doctor and the role`)
      assert.ok(g.includes(p(f).sayfa.hekim) && g.includes(p(f).sayfa.yalniz) && g.includes(p(f).sayfa.acil) && g.includes(p(f).sayfa.cikis))
      // the summary: the day of the visit in the pack's own pattern, the text with its line break kept
      assert.ok(g.includes(Y.yerine(p(f).sayfa.muayene, gun(PZT))), `${f}: the visit's day`)
      assert.ok(html.includes('<p class="uza-not-metin">QA-SUMMARY line one.\nQA-SUMMARY line two.</p>'))
      if (RANDEVU) {
        const rm = r(f) as RandevuMetni
        // the appointment: weekday by name, day in the pack's pattern, time as the country writes a time of day
        assert.ok(g.includes(`${A.gunAdi(rm, 1, true)}, ${gun(PZT)}`), `${f}: the appointment's day`)
        assert.ok(g.includes(B.saatGoster('14:30')) && g.includes(`30 ${rm.form.dakika}`), `${f}: the appointment's time`)
        assert.ok(g.includes(p(f).sayfa.istekBaslik) && g.includes(Y.yerine(p(f).sayfa.istekAciklama, S.ISTEK_GUN_AZAMI)) && g.includes(p(f).sayfa.istekGonder))
        assert.equal([...html.matchAll(/<input type="checkbox" name="gunler"/g)].length, 3, 'one box per day the patient may choose')
        assert.match(html, new RegExp(`maxLength="${S.ISTEK_NEDEN_AZAMI}"`, 'i'))
      } else {
        assert.ok(!html.includes('data-alan="portal-randevular"') && !html.includes('data-alan="portal-istek"'), 'a country without appointments shows neither')
      }
      // no time-zone line where the page was given none
      { const dilimli = p(f).sayfa.saatDilimi; if (dilimli) assert.ok(!g.includes(dilimli.split('%')[0].trim() || '\u0000')) }
      // THE PAGE LINKS NOWHERE: no way from a patient's page into the doctor's application, and nothing to another site.
      assert.equal(baglantilarGercek(html, `patient's page (${f})`), 0)
      assert.doesNotMatch(html, /<a\b/)
      temiz(html, `patient's page (${f})`); temiz(g, `patient's page, visible text (${f})`)
    }
  })

  it('an empty page says so; several time zones are named; nothing is drawn for what the page was not given', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const g = gorunurMetin(hastaSayfasi(f, icerik(f, { ozetler: [], randevular: RANDEVU ? [] : null })))
      assert.ok(g.includes(p(f).sayfa.ozetYok))
      if (RANDEVU) assert.ok(g.includes(p(f).sayfa.randevuYok))
      assert.ok(!g.includes('QA-SUMMARY'))
      const dilimli = p(f).sayfa.saatDilimi
      if (RANDEVU && dilimli) assert.ok(gorunurMetin(hastaSayfasi(f, icerik(f, { saatDilimi: 'America/New_York' }))).includes(Y.yerine(dilimli, 'America/New York')))
    }
  })

  it('THE REQUEST and its outcome: waiting, booked (while that appointment is still to come), declined — and the form\'s own errors', () => {
    if (!ACIK || !RANDEVU) return
    for (const f of FORMLAR) {
      const s = p(f).sayfa
      const rm = r(f) as RandevuMetni
      const gunler = [PZT, SAL]
      const bekleyen = hastaSayfasi(f, icerik(f, { istek: { gunler: [PZT, SAL], son: { durum: 'bekliyor', gunler, olusturuldu: '2026-10-10T08:00:00.000Z', randevu: null } } }))
      assert.ok(gorunurMetin(bekleyen).includes(s.istekBekliyor))
      assert.ok(gorunurMetin(bekleyen).includes(Y.yerine(s.istekGunler, gunler.map((x) => Sayfa.portalGunu(rm, x)).join('; '))))
      assert.doesNotMatch(bekleyen, /name="gunler"|data-eylem="portal-istek"/, `${f}: one request at a time — no second form while one waits`)
      // booked: said while the appointment is among the upcoming ones …
      const kabul = hastaSayfasi(f, icerik(f, { istek: { gunler: [SAL], son: { durum: 'kabul', gunler, olusturuldu: 'x', randevu: { gun: PZT, saat: '14:30' } } } }))
      assert.ok(gorunurMetin(kabul).includes(Y.yerine(s.istekKabul, Sayfa.portalGunu(rm, PZT), B.saatGoster('14:30'))), `${f}: the booked appointment`)
      assert.match(kabul, /name="gunler"/, 'a new request can be sent')
      // … and not any more once it is not (over, moved or cancelled): the list of appointments is what is true
      const gecmis = gorunurMetin(hastaSayfasi(f, icerik(f, { randevular: [], istek: { gunler: [SAL], son: { durum: 'kabul', gunler, olusturuldu: 'x', randevu: { gun: PZT, saat: '14:30' } } } })))
      assert.ok(!gecmis.includes(Y.yerine(s.istekKabul, Sayfa.portalGunu(rm, PZT), B.saatGoster('14:30'))))
      const red = hastaSayfasi(f, icerik(f, { istek: { gunler: [SAL], son: { durum: 'red', gunler, olusturuldu: 'x', randevu: null } } }))
      assert.ok(gorunurMetin(red).includes(s.istekRed)); assert.match(red, /name="gunler"/)
      for (const [hata, metin] of [['gun', s.istekGunGerekli], ['cok', Y.yerine(s.istekCokGun, S.ISTEK_GUN_AZAMI)], ['gonderilemedi', s.istekGonderilemedi], ['baglanti', p(f).giris.baglanti]] as const) {
        assert.ok(gorunurMetin(hastaSayfasi(f, icerik(f), { istekHatasi: hata })).includes(metin), `${f}/${hata}`)
      }
      // a chosen day is marked; the label is the short weekday and the day
      const secili = hastaSayfasi(f, icerik(f), { form: { gunler: [SAL], neden: '' } })
      assert.match(secili, new RegExp(`data-secili="evet"[^>]*title="${A.gunAdi(rm, 2, true)}, ${gun(SAL).replace(/[.]/g, '\\.')}"`))
    }
  })

  it('NOTHING OF THE DOCTOR\'S on the patient\'s page: the view is given a summary\'s text and never a note, a reason, a phone or an id', () => {
    if (!ACIK) return
    // The type the page is given has no place for them …
    const tip = kod('lib/ulke/portal/tipler.ts')
    const sayfaTipi = tip.slice(tip.indexOf('export type PortalIcerigi'), tip.indexOf('export type PortalErisimi'))
    assert.doesNotMatch(sayfaTipi, /\bneden\b|telefon|kimlik|hastaId|doktorId|notId|icerik|transkript|\bs:|\bo:|\ba:|\bp:/, 'the page\'s data has a field it must not have')
    // … and the screen reads nothing else: no doctor route, no doctor session, no storage of the token.
    const ekran = kod('components/ulke/portal/PortalSayfasi.tsx')
    assert.doesNotMatch(ekran, /hasta-portali|HEKIM_PORTAL_API|Authorization|Bearer|supabase/i, 'the patient\'s page reaches for the doctor\'s side')
    assert.doesNotMatch(ekran, /localStorage|sessionStorage|document\.cookie|indexedDB/, 'the token and the PIN are kept in memory only')
    assert.doesNotMatch(ekran, /from '\.\.\/uygulama\/(?!uygulama\.css)|from '@\/lib\/ulke\/istemciSupabase'|from '@\/lib\/ulke\/sunucu/, 'the patient\'s page imports the signed-in application')
    assert.doesNotMatch(kod('components/ulke/portal/index.tsx'), /from '\.\.\/uygulama\/[A-Z]/)
    // The token: read from the fragment, sent in the body of the sign-in request, and nowhere else.
    assert.match(ekran, /window\.location\.hash/)
    assert.match(ekran, /iste\('\/giris', \{ token: token\.current, pin \}\)/)
    assert.equal([...ekran.matchAll(/token\.current/g)].length, 2, 'the token is set once and sent once')
    assert.doesNotMatch(ekran, /searchParams\.get\('token'\)|\?token=|console\./)
    // Every request says which link the page is open for, sends the cookie to this site only, and names no referrer.
    assert.match(ekran, /\[PORTAL_BAGLANTI_BASLIGI\]: ozet\.current/)
    assert.match(ekran, /credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer'/)
    assert.match(ekran, /crypto\.subtle\.digest\('SHA-256'/)
  })
})

describe('the patient portal\'s screens — the doctor\'s side', () => {
  const kayitlar = [
    { olay: 'erisim', an: '2026-10-10T06:00:00.000Z', ozetId: null }, { olay: 'giris', an: '2026-10-10T07:00:00.000Z', ozetId: null },
    { olay: 'paylasim', an: '2026-10-10T08:00:00.000Z', ozetId: 'o1' }, { olay: 'geri-alma', an: '2026-10-10T09:00:00.000Z', ozetId: 'o1' },
    { olay: 'kilit', an: '2026-10-11T06:00:00.000Z', ozetId: null }, { olay: 'iptal', an: '2026-10-11T07:00:00.000Z', ozetId: null },
  ] as import('@/lib/ulke/portal/tipler').PortalKaydi[]
  const erisim = (durum: 'yok' | 'acik' | 'kilitli' | 'suresi-doldu', sonGiris: string | null = null) => ({ erisim: { durum, olusturuldu: durum === 'yok' ? null : '2026-10-10T06:00:00.000Z', sonGecerlilik: durum === 'yok' ? null : '2026-11-09T06:00:00.000Z', sonGiris }, kayitlar: durum === 'yok' ? [] : kayitlar })
  const kart = (f: DilKodu, ek: Record<string, unknown>) => hekimEkrani(f, h(Erisim.PortalErisimGorunumu, { p: p(f), veri: erisim('yok'), yeni: null, bekliyor: false, bildirim: null, ver: bos, iptal: bos, kopyala: bos, ...ek }))

  it('ACCESS on the patient\'s file: none yet → "give access"; given → the link and the PIN, once, with how to hand them over', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const e = p(f).erisim
      const yok = kart(f, {})
      const gy = gorunurMetin(yok)
      for (const x of [e.baslik, e.aciklama, e.durumYok, e.ver, e.kayitlar, e.kayitYok]) assert.ok(gy.includes(x), `${f}: "${x}"`)
      assert.doesNotMatch(yok, /data-eylem="erisim-iptal"|data-alan="yeni-erisim"/, 'nothing to withdraw and nothing to copy before access is given')
      const adres = Erisim.portalAdresi('https://notya.test', `${S.PORTAL_SAYFASI}?dil=${f}#${TOKEN}`)
      assert.equal(adres, `https://notya.test${ON_EK}/portal?dil=${f}#${TOKEN}`, 'the address is this site, the country\'s path, the page, the token in the fragment')
      const verildi = kart(f, { veri: erisim('acik'), yeni: { adres, pin: '012345' } })
      const gv = gorunurMetin(verildi)
      for (const x of [e.birKez, e.baglanti, e.pin, e.kopyala, e.nasil, e.yenile, e.yenileUyari, e.iptal, e.sonGirisYok, Y.yerine(e.durumAcik, B.tarihYaz('2026-11-09T06:00:00.000Z'))]) assert.ok(gv.includes(x), `${f}: "${x}"`)
      assert.ok(verildi.includes(`value="${adres}"`) && verildi.includes('value="012345"'))
      // The link is shown as text to copy, never as something to follow from the doctor's own browser.
      assert.doesNotMatch(verildi, new RegExp(`href="[^"]*${S.PORTAL_SAYFASI}`))
      // the record, every event by its own name, with day and time as the country writes them
      for (const x of [e.olay.erisim, e.olay.giris, e.olay.paylasim, e.olay.geriAlma, e.olay.kilit, e.olay.iptal]) assert.ok(gv.includes(x), `${f}: record "${x}"`)
      assert.ok(gv.includes(`${B.tarihYaz('2026-10-10T07:00:00.000Z')} ${B.saatYaz('2026-10-10T07:00:00.000Z')}`))
      assert.ok(baglantilarGercek(verildi, `access card (${f})`) > 0)
      temiz(verildi, `access card (${f})`); temiz(gv, `access card, visible text (${f})`)
    }
  })

  it('ACCESS, the other states: signed in before, locked, ended, withdrawn, could not be done, copied', () => {
    if (!ACIK) return
    for (const f of FORMLAR) {
      const e = p(f).erisim
      const g = (ek: Record<string, unknown>) => gorunurMetin(kart(f, ek))
      assert.ok(g({ veri: erisim('acik', '2026-10-10T07:00:00.000Z') }).includes(Y.yerine(e.sonGiris, `${B.tarihYaz('2026-10-10T07:00:00.000Z')} ${B.saatYaz('2026-10-10T07:00:00.000Z')}`)))
      assert.ok(g({ veri: erisim('kilitli') }).includes(e.durumKilitli))
      assert.ok(g({ veri: erisim('suresi-doldu') }).includes(e.durumBitti))
      assert.ok(g({ bildirim: 'iptal' }).includes(e.iptalEdildi))
      assert.ok(g({ bildirim: 'yapilamadi' }).includes(e.yapilamadi))
      assert.ok(g({ bildirim: 'kopyalanamadi' }).includes(e.kopyalanamadi))
      assert.ok(g({ bildirim: 'pin-kopyalandi' }).includes(e.kopyalandi))
      assert.ok(g({ bekliyor: true }).includes(e.bekliyor))
      // Not loaded: the card offers nothing it cannot stand behind.
      assert.doesNotMatch(kart(f, { veri: null }), /data-eylem=/)
    }
  })

  it('THE SUMMARY under an approved note: nothing yet → "write a draft"; a draft → edit and share; shared → text, "take back", no editing', () => {
    if (!ACIK) return
    const ozet = (f: DilKodu, paylasildi: boolean): HastaOzeti => ({ id: 'o1', notId: 'n1', dil: f, metin: OZET_METNI, paylasildi, paylasimAni: paylasildi ? '2026-10-10T08:00:00.000Z' : null, guncellendi: '2026-10-10T07:30:00.000Z' })
    for (const f of FORMLAR) {
      const o = p(f).ozet
      const ciz = (veri: Record<string, unknown>, ek: Record<string, unknown> = {}) => hekimEkrani(f, h(Ozet.PortalOzetGorunumu, { p: p(f), m: m(f), veri: { ozet: null, dil: f, yazilabilir: true, ...veri } as import('../uygulama/PortalOzeti').OzetVerisi, metin: OZET_METNI, setMetin: bos, islem: null, bildirim: null, yaz: bos, kaydet: bos, paylas: bos, geriAl: bos, ...ek }))
      const dilSatiri = Y.yerine(o.dil, A.dilAdi(m(f), A.temelDil(f)))
      const yok = ciz({})
      for (const x of [o.baslik, o.aciklama, dilSatiri, o.yaz, o.erisimIpucu]) assert.ok(gorunurMetin(yok).includes(x), `${f}: "${x}"`)
      assert.doesNotMatch(yok, /<textarea|data-eylem="ozet-paylas"/, 'nothing to share before there is a text')
      assert.doesNotMatch(ciz({ yazilabilir: false }), /data-eylem="ozet-yaz"/, 'no instruction for this form: no draft is offered')

      const taslak = ciz({ ozet: ozet(f, false) })
      for (const x of [o.makine, o.etiket, o.paylasilmadi, o.paylas, o.kaydet, o.yenidenYaz]) assert.ok(gorunurMetin(taslak).includes(x), `${f}: "${x}"`)
      assert.match(taslak, new RegExp(`<textarea[^>]*lang="${f}"[^>]*>QA-SUMMARY line one\\.\nQA-SUMMARY line two\\.</textarea>`), 'the draft is editable, in the patient\'s form')
      assert.match(taslak, /data-paylasildi="hayir"/)
      assert.doesNotMatch(taslak, /data-eylem="ozet-geri-al"/)

      const paylasilan = ciz({ ozet: ozet(f, true) })
      const gp = gorunurMetin(paylasilan)
      for (const x of [Y.yerine(o.paylasildi, B.tarihYaz('2026-10-10T08:00:00.000Z')), o.geriAl, o.degistirmekIcin]) assert.ok(gp.includes(x), `${f}: "${x}"`)
      assert.match(paylasilan, /data-paylasildi="evet"/)
      assert.doesNotMatch(paylasilan, /<textarea|data-eylem="ozet-paylas"|data-eylem="ozet-kaydet"|data-eylem="ozet-yeniden-yaz"/, 'a shared summary offers nothing that could change it')

      for (const [b, metin] of [['KAYDEDILDI', o.kaydedildi], ['GERI_ALINDI', o.geriAlindi], ['OZET_YAZILAMADI', o.yazilamadi], ['KAYDEDILEMEDI', o.kaydedilemedi], ['BOS', o.bos], ['YAPILAMADI', o.yapilamadi]] as const) assert.ok(gorunurMetin(ciz({ ozet: ozet(f, false) }, { bildirim: b })).includes(metin), `${f}/${b}`)
      assert.ok(gorunurMetin(ciz({}, { islem: 'yaziliyor' })).includes(o.yaziliyor))
      temiz(taslak, `summary card (${f})`); temiz(gp, `summary card, visible text (${f})`)
    }
  })

  it('REQUESTS on the calendar: who, which days, the reason; "choose a time" opens the answer, where the doctor books or declines', () => {
    if (!ACIK || !RANDEVU) return
    const istek: BekleyenIstek = { id: '80000000-0000-4000-8000-000000000001', hastaId: '30000000-0000-4000-8000-000000000001', hastaAdi: HASTA_ADI, gunler: [PZT, SAL], neden: 'QA-PATIENTS-REASON', olusturuldu: '2026-10-10T08:00:00.000Z' }
    for (const f of FORMLAR) {
      const i = p(f).istek
      const rm = r(f) as RandevuMetni
      assert.equal(renderToStaticMarkup(h(Istek.IsteklerGorunumu, { p: p(f), r: rm, istekler: [], bekliyor: false, bildirim: null, reddet: bos })), '', 'no request: nothing is drawn on the calendar')
      const liste = hekimEkrani(f, h(Istek.IsteklerGorunumu, { p: p(f), r: rm, istekler: [istek], bekliyor: false, bildirim: null, reddet: bos }))
      const gl = gorunurMetin(liste)
      for (const x of [i.baslik, HASTA_ADI, `${i.neden}: QA-PATIENTS-REASON`, i.sec, i.reddet, Y.yerine(i.istekTarihi, B.tarihYaz(istek.olusturuldu)), `${A.gunAdi(rm, 1, true)}, ${gun(PZT)}; ${A.gunAdi(rm, 2, true)}, ${gun(SAL)}`]) assert.ok(gl.includes(x), `${f}: "${x}"`)
      assert.ok(liste.includes(`href="${ON_EK}/calendar?istek=${istek.id}"`))
      for (const [b, metin] of [['reddedildi', i.reddedildi], ['cevaplandi', i.cevaplandi], ['yapilamadi', i.yapilamadi]] as const) assert.ok(gorunurMetin(renderToStaticMarkup(h(Istek.IsteklerGorunumu, { p: p(f), r: rm, istekler: [], bekliyor: false, bildirim: b, reddet: bos }))).includes(metin), `${f}/${b}`)

      const cevap = (ek: Record<string, unknown> = {}) => hekimEkrani(f, h(Istek.IstekCevabiGorunumu, { p: p(f), r: rm, istek, a: { gun: gun(PZT), saat: '10:00', sureDk: 30 }, set: bos, zaman: h('input', { name: 'saat', defaultValue: '10:00' }), hataMetni: null, gonder: bos, reddet: bos, bekliyor: false, hata: null, ...ek }))
      const c = cevap()
      const gc = gorunurMetin(c)
      for (const x of [i.formBaslik, HASTA_ADI, 'QA-PATIENTS-REASON', i.kabul, i.reddet, rm.form.vazgec, `${rm.takvim.gunuAc}: ${A.gunAdi(rm, 1, true)}, ${gun(PZT)}`]) assert.ok(gc.includes(x), `${f}: "${x}"`)
      assert.match(c, new RegExp(`data-secili="evet"[^>]*data-istek-gunu="${PZT}"`), 'the day in the form is marked among the days the patient asked for')
      assert.ok(c.includes(`href="${ON_EK}/calendar?gun=${PZT}"`), 'the day\'s own calendar is one touch away')
      // A TAKEN TIME has no second button; a time outside the working hours offers the explicit "book anyway".
      const dolu = cevap({ hata: { kod: 'DOLU' }, hataMetni: rm.form.dolu })
      assert.ok(gorunurMetin(dolu).includes(rm.form.dolu)); assert.doesNotMatch(dolu, /data-eylem="istek-yine-de"/)
      const mesai = cevap({ hata: { kod: 'MESAI_DISI' }, hataMetni: rm.form.mesaiDisi })
      assert.ok(gorunurMetin(mesai).includes(rm.form.mesaiDisi)); assert.match(mesai, /data-eylem="istek-yine-de"/)
      assert.ok(gorunurMetin(cevap({ hata: { kod: 'CEVAPLANDI' } })).includes(i.cevaplandi))
      assert.ok(gorunurMetin(cevap({ hata: { kod: 'BASARISIZ' } })).includes(i.yapilamadi))
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Istek.IstekYokGorunumu, { p: p(f), r: rm, m: m(f), durum: 'yok' }))).includes(i.cevaplandi))
      assert.ok(baglantilarGercek(liste, `requests (${f})`) > 0 && baglantilarGercek(c, `answer (${f})`) > 0)
      temiz(liste, `requests (${f})`); temiz(c, `answer (${f})`); temiz(gl, `requests, visible text (${f})`); temiz(gc, `answer, visible text (${f})`)
    }
  })

  it('the cards are mounted where they belong, and only where the country has the portal', () => {
    if (!ACIK) return
    const hastalar = kod('components/ulke/uygulama/Hastalar.tsx'), not = kod('components/ulke/uygulama/Not.tsx'), takvim = kod('components/ulke/uygulama/Takvim.tsx')
    assert.match(hastalar, /portal=\{ozellikAcik\('hastaPortali'\) \? <PortalErisimKarti u=\{u\} hastaId=\{veri\.hasta\.id\} \/> : null\}/)
    // The summary card: an APPROVED note of a patient, nothing else.
    assert.match(not, /\{not\.onayli && not\.muayene\.hasta && ozellikAcik\('hastaPortali'\) \? <PortalOzetKarti /)
    assert.match(takvim, /const portal = ozellikAcik\('hastaPortali'\)/)
    assert.match(takvim, /p\.istek && portal \? <IstekCevabi /)
    assert.match(takvim, /\{portal \? <Istekler u=\{u\} r=\{r\} \/> : null\}/)
    // Sharing is one act for one summary: the screen sends a literal true or false, for this note, and nothing "for all".
    const ozet = kod('components/ulke/uygulama/PortalOzeti.tsx')
    assert.match(ozet, /'PUT', \{ paylas: true \}/); assert.match(ozet, /'PUT', \{ paylas: false \}/)
    assert.doesNotMatch(ozet + hastalar + not, /\{ paylas: (?!true \}|false \})|hepsiniPaylas|otomatik/i)
    // A changed text is saved before it is shared: the patient reads what the doctor saw.
    assert.match(ozet, /if \(degisti && !\(await degistir\('kaydediliyor', 'PATCH', \{ metin \}, 'KAYDEDILEMEDI'\)\)\) return/)
  })
})

describe('the patient portal\'s screens — rules', () => {
  it('EVERY SENTENCE IS THE PACK\'S: the screen files carry no text of their own and write no address by hand', () => {
    for (const d of ['components/ulke/portal/PortalSayfasi.tsx', 'components/ulke/portal/index.tsx', 'components/ulke/uygulama/PortalErisimi.tsx', 'components/ulke/uygulama/PortalOzeti.tsx', 'components/ulke/uygulama/PortalIstekleri.tsx', 'components/ulke/uygulama/pano.ts', 'app/portal/page.ulke.tsx', 'lib/ulke/arayuz/yerTutucu.ts', 'lib/ulke/portal/tipler.ts']) {
      const k = kod(d)
      assert.doesNotMatch(k, /[^\x00-\x7F—–·…‹›«»]/, `${d} carries a letter outside ASCII: text belongs in a pack`)
      assert.doesNotMatch(k, /['"`]\/(calendar|visit|patient|today|settings|portal|api\/ulke)\b/, `${d} writes an address by hand`)
      // No sentence in JSX: text between tags is always an expression.
      assert.doesNotMatch(k, />\s*[A-Za-z][a-z]+ [a-z]+[^<{]*</, `${d} has a sentence written into the screen`)
    }
  })

  it('the catalogue is the same shape in every form, each entry is there, and a sentence keeps its placeholders in every form', () => {
    if (!ACIK) return
    const ilk = yaprak(p(FORMLAR[0]))
    assert.ok(ilk.length >= 95, `only ${ilk.length} entries`)
    for (const f of FORMLAR) {
      const y = yaprak(p(f))
      assert.deepEqual(y.map((x) => x[0]), ilk.map((x) => x[0]), `${f}: not the same keys as ${FORMLAR[0]}`)
      for (let n = 0; n < y.length; n++) {
        assert.ok(y[n][1].trim().length > 0, `${f}/${y[n][0]} is empty`)
        assert.deepEqual([...y[n][1].matchAll(/%\d?/g)].map((x) => x[0]).sort(), [...ilk[n][1].matchAll(/%\d?/g)].map((x) => x[0]).sort(), `${f}/${y[n][0]}: the placeholders differ from ${FORMLAR[0]}`)
        temiz(y[n][1], `portal catalogue ${f}/${y[n][0]}`)
      }
      // The emergency line carries a number a patient can dial.
      assert.match(p(f).sayfa.acil, /\d{2,}/, `${f}: the emergency line names no number`)
    }
  })

  it('a catalogue sentence takes its values as they are: one, several, and nothing in a value is read as a pattern', () => {
    if (!ACIK) return
    assert.equal(Y.yerine('Tries left: %', 3), 'Tries left: 3')
    assert.equal(Y.yerine('%1 at %2 (%1)', 'Mon', '10:00'), 'Mon at 10:00 (Mon)')
    assert.equal(Y.yerine('Hello, %', 'A$&B $1 %'), 'Hello, A$&B $1 %')
    assert.equal(Y.yerine('%1 / %2', '$&', '%1'), '$& / %1')
    assert.equal(Y.yerine('No place here', 'x'), 'No place here')
  })

  it('THE PAGE IS NEVER INDEXED OR CACHED: the route file, the middleware\'s headers, and "not found" where the pack has no portal', async () => {
    const sayfa = readFileSync(join(KOK, 'app/portal/page.ulke.tsx'), 'utf8')
    assert.match(sayfa, /^export const dynamic = 'force-dynamic'$/m)
    assert.match(sayfa, /robots: \{ index: false, follow: false \}, referrer: 'no-referrer'/)
    assert.match(sayfa, /!ozellikAcik\('hastaPortali'\) \|\| !AKTIF_ARAYUZ\?\.portalMetinleri \|\| !rotaAcikMi\(ulkePaketi\(\)\.rotalar, PORTAL_SAYFASI\)\) notFound\(\)/)
    // The page reads nothing of the request: the token is in the fragment, which never reaches a server.
    assert.doesNotMatch(kod('app/portal/page.ulke.tsx'), /searchParams|headers\(\)|cookies\(\)|params\b/)
    if (paket.rotalar === 'hepsi') return
    const { middleware } = await import('../../../middleware.ulke')
    const { NextRequest } = await import('next/server')
    const res = middleware(new NextRequest(`https://notya.test/portal?dil=${paket.varsayilanDil}`))
    if (!ACIK) { assert.equal(res.status, 404, 'a pack without the portal has no /portal'); return }
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0')
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer')
    assert.match(res.headers.get('x-robots-tag') ?? '', /noindex/)
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    // Only that page: another page of the application keeps the usual referrer policy.
    const baska = middleware(new NextRequest('https://notya.test/login'))
    assert.equal(baska.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
    for (const yol of ['/portal/x', '/portal/demo', '/portals']) assert.equal(middleware(new NextRequest(`https://notya.test${yol}`)).status, 404, yol)
  })
})
