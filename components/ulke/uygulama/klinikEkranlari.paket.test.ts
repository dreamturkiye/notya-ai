/**
 * NOTYA-ULKE-KLINIK-01 — THE SCREENS OF CLINIC ACCOUNTS, for whichever pack is active (run once per country folder).
 * Names no country: every expectation is read from the active pack. A pack without clinic accounts has nothing to
 * draw, and the test says so.
 *
 *   A. the clinic            create or join; the members with their positions; who is offered which control (the
 *                            owner, an administrator, a doctor, the front desk); invitations — a code shown once,
 *                            never in the list; the schedule, which has no place for a patient
 *   B. permissions           the form offers a member only what their position may hold and the pack has; THE
 *                            SENTENCE ABOUT THE LINK AND THE PIN is on the screen before the portal capability is
 *                            given; the lists; the record in the pack's words
 *   C. the front desk        the card is name, birth date, phone; each control only for a permission held; no
 *                            status "done"; the screen's source asks the server for nothing clinical
 *   D. shared and cover      read-only: no field, no button that changes anything; approved notes under the
 *                            template's own headings
 *   E. the shell             the clinic link where the pack has clinic accounts; the front desk's own navigation
 *   F. rules of the screens  every sentence is the pack's, in every form; no other country's term or letter
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { gorunurMetin, sizintiTara } from '@/lib/ulke/testing/sizintiTarayici'
import type { KlinikMetni } from '@/lib/ulke/arayuz'
import type { ErisimKaydi, KlinikDaveti, KlinikGorunumu, KlinikKonumu, KlinikUyesi } from '@/lib/ulke/klinikHesabi/tipler'
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
let A: typeof import('@/lib/ulke/arayuz')
let Y: typeof import('@/lib/ulke/arayuz/yerTutucu')
let Klinik: typeof import('./Klinik')
let Yetkiler: typeof import('./KlinikYetkiler')
let Paylasilan: typeof import('./KlinikPaylasilan')
let OnBuro: typeof import('./OnBuro')
let Kabuk: typeof import('./Kabuk')
let HEKIM_ROLU = ''

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])
const BEN = 'acc-me', DIGER = 'acc-other', ONB = 'acc-desk', MUT = 'acc-allied', SAHIP = 'acc-owner'
const uyeler = (): KlinikUyesi[] => [
  { hesapId: SAHIP, ad: 'QA Owner', konum: 'sahip', rol: HEKIM_ROLU || null },
  { hesapId: BEN, ad: 'QA Me', konum: 'hekim', rol: HEKIM_ROLU || null },
  { hesapId: DIGER, ad: 'QA Other Doctor', konum: 'hekim', rol: HEKIM_ROLU || null },
  { hesapId: MUT, ad: 'QA Allied', konum: 'muttefik', rol: null },
  { hesapId: ONB, ad: 'QA Desk', konum: 'on-buro', rol: null },
]
const klinik = (konum: KlinikKonumu): KlinikGorunumu => ({ id: 'k1', ad: 'QA Clinic', konum, uyeler: uyeler() })
const AYAR = { yetkiTurleri: ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet'] as never[], sahipHekimAdinaVerebilir: false, paylasimRolleri: [], vekaletAzamiGun: 9 }
const ciz = (x: React.ReactElement) => renderToStaticMarkup(x)
const say = (html: string, isaret: string) => html.split(isaret).length - 1

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  ACIK = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.klinikHesaplari === true && Boolean(arayuz?.klinikMetinleri)
  RANDEVU = ACIK && paket.ozellikler.randevu === true
  if (!ACIK) return
  FORMLAR = paket.uygulama?.diller ?? []
  HEKIM_ROLU = arayuz?.roller.find((r) => r.taraf !== 'klinik-muttefik')?.anahtar ?? ''
  A = await import('@/lib/ulke/arayuz')
  Y = await import('@/lib/ulke/arayuz/yerTutucu')
  Klinik = await import('./Klinik')
  Yetkiler = await import('./KlinikYetkiler')
  Paylasilan = await import('./KlinikPaylasilan')
  OnBuro = await import('./OnBuro')
  Kabuk = await import('./Kabuk')
})

describe('clinic accounts — the screens', () => {
  it('a pack without clinic accounts brings no catalogue for them and lists neither screen', async () => {
    const p = (await import('@/countries/active')).AKTIF_PAKET
    if (p.ozellikler.klinikHesaplari) return
    const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
    assert.equal(arayuz?.klinikMetinleri, undefined)
    if (p.rotalar !== 'hepsi') { assert.ok(!p.rotalar.sayfalar.includes('/clinic')); assert.ok(!p.rotalar.sayfalar.includes('/desk')) }
    assert.equal(p.uygulama?.klinikHesaplari, undefined)
  })

  it('A. an account in no clinic: create one, or join with a code — and each refusal in the pack\'s words', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil)
      const html = ciz(h(Klinik.KlinikGirisGorunumu, { k, ad: '', setAd: bos, kod: '', setKod: bos, kur: bos, katil: bos, bekliyor: false, hata: null }))
      for (const m of [k.giris.baslik, k.giris.kurBaslik, k.giris.katilBaslik, k.giris.kod, k.giris.katil, k.giris.kur]) assert.ok(gorunurMetin(html).includes(m), `${dil}: "${m}"`)
      assert.equal(say(html, 'data-eylem="klinige-katil"'), 1); assert.equal(say(html, 'data-eylem="klinik-kur"'), 1)
      for (const [hata, metin] of [['ad', k.giris.adGerekli], ['kod', k.giris.kodGecersiz], ['uye', k.giris.zatenUye], ['yapilamadi', k.giris.yapilamadi]] as const) {
        assert.ok(gorunurMetin(ciz(h(Klinik.KlinikGirisGorunumu, { k, ad: '', setAd: bos, kod: '', setKod: bos, kur: bos, katil: bos, bekliyor: false, hata }))).includes(metin), `${dil}: ${hata}`)
      }
      temiz(gorunurMetin(html), `clinic entry ${dil}`)
    }
  })

  it('A. the members: positions in the pack\'s words; WHO IS OFFERED WHICH CONTROL — the owner everybody but themselves, an administrator not the owner and not an administrator, a doctor and the front desk only "leave"', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil)
      const cizUye = (konum: KlinikKonumu, ben: string) => ciz(h(Klinik.UyelerGorunumu, { k, dil, klinik: klinik(konum), ben, onay: null, setOnay: bos, konumDegistir: bos, cikar: bos, bekliyor: false }))
      const sahip = cizUye('sahip', SAHIP)
      for (const p of ['sahip', 'hekim', 'muttefik', 'on-buro'] as const) assert.ok(gorunurMetin(sahip).includes(k.konum[p]), `${dil}: ${p}`)
      assert.ok(gorunurMetin(sahip).includes(k.klinik.konumAciklama), `${dil}: the screen must say that a position opens no patient`)
      assert.deepEqual([say(sahip, 'data-eylem="konum-degistir"'), say(sahip, 'data-eylem="uye-cikar"'), say(sahip, 'data-eylem="klinikten-ayril"')], [4, 4, 0], `${dil}: the owner`)
      // the owner's position is never offered
      assert.equal(say(sahip, 'value="sahip"'), 0)
      const yon = ciz(h(Klinik.UyelerGorunumu, { k, dil, klinik: { ...klinik('yonetici'), uyeler: [...uyeler(), { hesapId: 'acc-admin', ad: 'QA Admin', konum: 'yonetici', rol: null }, { hesapId: 'acc-admin2', ad: 'QA Admin Two', konum: 'yonetici', rol: null }] }, ben: 'acc-admin', onay: null, setOnay: bos, konumDegistir: bos, cikar: bos, bekliyor: false }))
      assert.deepEqual([say(yon, 'data-eylem="konum-degistir"'), say(yon, 'data-eylem="uye-cikar"'), say(yon, 'data-eylem="klinikten-ayril"')], [4, 4, 1], `${dil}: an administrator`)
      assert.equal(say(yon, 'value="yonetici"'), 0, `${dil}: an administrator is not offered "administrator" for anybody`)
      for (const [konum, ben] of [['hekim', BEN], ['on-buro', ONB], ['muttefik', MUT]] as const) {
        const html = cizUye(konum, ben)
        assert.deepEqual([say(html, 'data-eylem="konum-degistir"'), say(html, 'data-eylem="uye-cikar"'), say(html, 'data-eylem="klinikten-ayril"')], [0, 0, 1], `${dil}: ${konum}`)
      }
      // removing asks first, naming the member
      const onay = ciz(h(Klinik.UyelerGorunumu, { k, dil, klinik: klinik('sahip'), ben: SAHIP, onay: ONB, setOnay: bos, konumDegistir: bos, cikar: bos, bekliyor: false }))
      assert.ok(gorunurMetin(onay).includes(Y.yerine(k.klinik.cikarOnay, 'QA Desk')), dil)
      assert.equal(say(onay, 'data-eylem="cikar-onayla"'), 1)
      temiz(gorunurMetin(sahip), `members ${dil}`)
    }
  })

  it('A. the head of the clinic: a member who can have patients is led to "who can help" and "shared with me"; the front desk to its workspace', () => {
    if (!ACIK) return
    const k = A.klinikMetni(FORMLAR[0])
    const hekim = ciz(h(Klinik.KlinikBasligi, { k, klinik: klinik('hekim') }))
    assert.deepEqual([say(hekim, 'data-eylem="yetkileri-ac"'), say(hekim, 'data-eylem="paylasilani-ac"'), say(hekim, 'data-eylem="on-buroyu-ac"')], [1, 1, 0])
    assert.ok(gorunurMetin(hekim).includes(Y.yerine(k.klinik.konumunuz, k.konum.hekim)))
    const onBuro = ciz(h(Klinik.KlinikBasligi, { k, klinik: klinik('on-buro') }))
    assert.deepEqual([say(onBuro, 'data-eylem="yetkileri-ac"'), say(onBuro, 'data-eylem="paylasilani-ac"'), say(onBuro, 'data-eylem="on-buroyu-ac"')], [0, 0, RANDEVU ? 1 : 0])
  })

  it('A. invitations: the code is on the screen ONCE, in its own box; the list has statuses and no code; the owner\'s position is not offered', () => {
    if (!ACIK) return
    const davetler: KlinikDaveti[] = [
      { id: 'd1', konum: 'on-buro', durum: 'acik', olusturuldu: '2026-10-12T05:00:00.000Z', sonGecerlilik: '2026-10-19T05:00:00.000Z' },
      { id: 'd2', konum: 'hekim', durum: 'kullanildi', olusturuldu: '2026-10-11T05:00:00.000Z', sonGecerlilik: '2026-10-18T05:00:00.000Z' },
      { id: 'd3', konum: 'hekim', durum: 'iptal', olusturuldu: '2026-10-10T05:00:00.000Z', sonGecerlilik: '2026-10-17T05:00:00.000Z' },
      { id: 'd4', konum: 'muttefik', durum: 'suresi-doldu', olusturuldu: '2026-09-10T05:00:00.000Z', sonGecerlilik: '2026-09-17T05:00:00.000Z' },
    ]
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil)
      const KOD = 'QAQA-QAQA-QAQA-QAQA'
      const html = ciz(h(Klinik.DavetlerGorunumu, { k, konum: 'sahip', davetler, secili: 'hekim', setSecili: bos, olustur: bos, yeni: { kod: KOD, konum: 'on-buro', sonGecerlilik: '2026-10-19T05:00:00.000Z' }, kopyala: bos, geriAl: bos, bekliyor: false }))
      assert.equal(say(html, KOD), 1, `${dil}: the code is shown once`)
      assert.ok(gorunurMetin(html).includes(k.davet.birKez))
      for (const d of ['acik', 'kullanildi', 'iptal', 'suresi-doldu'] as const) assert.ok(gorunurMetin(html).includes(k.davet.durum[d]), `${dil}: ${d}`)
      assert.equal(say(html, 'data-eylem="davet-geri-al"'), 1, `${dil}: only an invitation that is still open can be withdrawn`)
      assert.equal(say(html, 'value="sahip"'), 0)
      assert.equal(say(html, 'value="yonetici"'), 1)
      const yon = ciz(h(Klinik.DavetlerGorunumu, { k, konum: 'yonetici', davetler: [], secili: 'hekim', setSecili: bos, olustur: bos, yeni: null, kopyala: bos, geriAl: bos, bekliyor: false }))
      assert.equal(say(yon, 'value="yonetici"'), 0, `${dil}: an administrator is not offered an administrator's invitation`)
      assert.ok(gorunurMetin(yon).includes(k.davet.listeBos))
      temiz(gorunurMetin(html), `invitations ${dil}`)
    }
  })

  it('A. the clinic\'s schedule: whose slot, when, its status — and the screen has no place for a patient', () => {
    if (!RANDEVU) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil), r = A.randevuMetni(dil)
      const veri = { gunler: ['2026-10-12'], bugun: '2026-10-12', hekimler: [{ hekimId: BEN, ad: 'QA Me' }, { hekimId: DIGER, ad: 'QA Other Doctor' }], dilimler: [{ hekimId: BEN, baslangic: '2026-10-12T05:00:00.000Z', bitis: '2026-10-12T05:30:00.000Z', gun: '2026-10-12', saat: '10:00', sureDk: 30, durum: 'planlandi' }] }
      const html = ciz(h(Klinik.KlinikTakvimGorunumu, { k, r, veri, gun: '2026-10-12', git: bos }))
      assert.ok(gorunurMetin(html).includes(k.takvim.aciklama) && gorunurMetin(html).includes('QA Me') && gorunurMetin(html).includes(r.durum.planlandi), dil)
      assert.ok(!gorunurMetin(html).includes('QA Other Doctor'), 'a member without an appointment that day is not listed')
      assert.ok(gorunurMetin(ciz(h(Klinik.KlinikTakvimGorunumu, { k, r, veri: { ...veri, dilimler: [] }, gun: '2026-10-12', git: bos }))).includes(k.takvim.bos))
    }
    const kaynak = kod('components/ulke/uygulama/Klinik.tsx')
    assert.doesNotMatch(kaynak, /hastaAdi|hastaId|\.neden\b|hasta\b\./, 'the clinic\'s screen reads something of a patient')
  })

  it('B. giving a permission: a member is offered only what their position may hold and the pack has; THE SENTENCE ABOUT THE LINK AND THE PIN is shown before the portal capability is given', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil)
      const diger = uyeler().filter((u) => u.hesapId !== BEN)
      const form = (alanId: string, tur: string, ek: Record<string, unknown> = {}) => ciz(h(Yetkiler.YetkiFormuGorunumu, { k, g: A.girdiMetni(dil), uyeler: diger, ayarlar: AYAR, alanId, setAlanId: bos, tur: tur as never, setTur: bos, hastalar: null, hastaQ: '', setHastaQ: bos, hastaAra: bos, hastaId: '', setHastaId: bos, bitisGun: '', setBitisGun: bos, gonder: bos, bekliyor: false, ...ek }))
      const secenekler = (html: string) => [...html.matchAll(/<option value="(on-buro-[a-z]+|paylasim|vekalet)"/g)].map((m) => m[1])
      assert.deepEqual(secenekler(form(ONB, '')), ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'], `${dil}: the front desk`)
      assert.deepEqual(secenekler(form(MUT, '')), ['paylasim'], `${dil}: an allied professional`)
      assert.deepEqual(secenekler(form(DIGER, '')), ['vekalet'], `${dil}: a doctor`)
      assert.deepEqual(secenekler(form(SAHIP, '')), ['vekalet'], `${dil}: the owner`)
      assert.deepEqual(Yetkiler.verilebilirTurler({ yetkiTurleri: ['paylasim'] as never[] }, { konum: 'on-buro' }), [], 'a capability the pack does not have is not offered')
      // each capability says what it lets the member do, before it is given
      for (const [alan, tur] of [[ONB, 'on-buro-randevu'], [ONB, 'on-buro-hasta'], [ONB, 'on-buro-portal'], [MUT, 'paylasim'], [DIGER, 'vekalet']] as const) {
        const html = form(alan, tur)
        assert.ok(gorunurMetin(html).includes(k.yetkiAciklama[tur]), `${dil}: ${tur} is not explained on the screen`)
        assert.equal(say(html, `data-alan="yetki-aciklamasi" data-tur="${tur}"`), 1)
      }
      // THE PLAIN SENTENCE: it names the PIN, in this form's own word for it.
      const pinSozcugu = /^[\p{L}\p{N}]+/u.exec(k.onBuro.pin.trim())?.[0] ?? ''
      assert.ok(pinSozcugu && gorunurMetin(form(ONB, 'on-buro-portal')).toLocaleLowerCase().includes(pinSozcugu.toLocaleLowerCase()), `${dil}: the doctor is not told that the member will see the PIN`)
      assert.ok(!gorunurMetin(form(ONB, 'on-buro-randevu')).includes(k.yetkiAciklama['on-buro-portal']))
      // a share asks for the patient; cover for its last day, with the pack's limit
      assert.equal(say(form(MUT, 'paylasim'), 'data-alan="yetki-hasta-arama"'), 1)
      assert.ok(form(MUT, 'paylasim', { hastalar: [{ id: 'p1', ad: 'QA Patient', otaIsmi: '' }] }).includes('QA Patient'))
      assert.ok(gorunurMetin(form(DIGER, 'vekalet')).includes(Y.yerine(k.yetki.bitisIpucu, 9)), dil)
      assert.ok(gorunurMetin(ciz(h(Yetkiler.YetkiFormuGorunumu, { k, g: A.girdiMetni(dil), uyeler: [], ayarlar: AYAR, alanId: '', setAlanId: bos, tur: '', setTur: bos, hastalar: null, hastaQ: '', setHastaQ: bos, hastaAra: bos, hastaId: '', setHastaId: bos, bitisGun: '', setBitisGun: bos, gonder: bos, bekliyor: false }))).includes(k.yetki.uyeYok))
      temiz(gorunurMetin(form(ONB, 'on-buro-portal')), `permission form ${dil}`)
    }
  })

  it('B. the lists and the record: a permission that stands can be withdrawn, one that ended cannot; the record says who did what, about whom, in the pack\'s words', () => {
    if (!ACIK) return
    const y = (ek: Record<string, unknown>) => ({ id: 'y1', tur: 'on-buro-randevu', hekimId: BEN, alanId: ONB, hastaId: null, baslangic: null, bitis: null, kaydedenId: BEN, olusturuldu: '2026-10-12T05:00:00.000Z', iptal: null, gecerli: true, alanAdi: 'QA Desk', hastaAdi: '', ...ek })
    const kayitlar: ErisimKaydi[] = [
      { id: 'k1', an: '2026-10-12T05:00:00.000Z', olay: 'verildi', tur: 'on-buro-randevu', ne: null, kisiId: BEN, kisiAdi: 'QA Me', alanId: ONB, alanAdi: 'QA Desk', hastaId: null, hastaAdi: '' },
      { id: 'k2', an: '2026-10-12T05:01:00.000Z', olay: 'okuma', tur: 'on-buro-randevu', ne: 'hasta-karti', kisiId: ONB, kisiAdi: 'QA Desk', alanId: ONB, alanAdi: 'QA Desk', hastaId: 'p1', hastaAdi: 'QA Patient' },
      { id: 'k3', an: '2026-10-12T05:02:00.000Z', olay: 'yazma', tur: 'on-buro-portal', ne: 'portal-baglantisi', kisiId: ONB, kisiAdi: 'QA Desk', alanId: ONB, alanAdi: 'QA Desk', hastaId: 'p1', hastaAdi: 'QA Patient' },
      { id: 'k4', an: '2026-10-12T05:03:00.000Z', olay: 'bitti', tur: 'on-buro-randevu', ne: null, kisiId: SAHIP, kisiAdi: 'QA Owner', alanId: ONB, alanAdi: 'QA Desk', hastaId: null, hastaAdi: '' },
    ]
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil)
      const verilen = ciz(h(Yetkiler.VerilenlerGorunumu, { k, verilen: [y({}), y({ id: 'y2', iptal: '2026-10-12T06:00:00.000Z', gecerli: false }), y({ id: 'y3', tur: 'paylasim', alanAdi: 'QA Allied', hastaId: 'p1', hastaAdi: 'QA Patient' }), y({ id: 'y4', tur: 'vekalet', alanAdi: 'QA Other Doctor', baslangic: '2026-10-11T19:00:00.000Z', bitis: '2026-10-14T19:00:00.000Z' })] as never, geriAl: bos, bekliyor: false }))
      assert.equal(say(verilen, 'data-eylem="yetki-geri-al"'), 3, `${dil}: a withdrawn permission has no button`)
      for (const m of [k.yetki.durumGecerli, k.yetki.durumBitti, k.yetkiTuru.paylasim, Y.yerine(k.yetki.hastaIcin, 'QA Patient')]) assert.ok(gorunurMetin(verilen).includes(m), `${dil}: "${m}"`)
      assert.ok(gorunurMetin(ciz(h(Yetkiler.VerilenlerGorunumu, { k, verilen: [], geriAl: bos, bekliyor: false }))).includes(k.yetki.verilenBos))
      const alinan = ciz(h(Yetkiler.AlinanlarGorunumu, { k, alinan: [{ ...y({}), hekimAdi: 'QA Other Doctor' }] as never, birak: bos, bekliyor: false }))
      assert.ok(gorunurMetin(alinan).includes(Y.yerine(k.yetki.hekimden, 'QA Other Doctor')) && say(alinan, 'data-eylem="yetki-birak"') === 1, dil)
      const kayit = gorunurMetin(ciz(h(Yetkiler.KayitGorunumu, { k, kayitlar })))
      for (const m of [Y.yerine(k.kayit.olay.verildi, k.yetkiTuru['on-buro-randevu'], 'QA Desk'), k.kayit.ne['hasta-karti'], k.kayit.ne['portal-baglantisi'], Y.yerine(k.kayit.olay.bitti, k.yetkiTuru['on-buro-randevu'], 'QA Desk'), Y.yerine(k.kayit.hasta, 'QA Patient'), 'QA Owner']) assert.ok(kayit.includes(m), `${dil}: the record lacks "${m}"`)
      assert.ok(gorunurMetin(ciz(h(Yetkiler.KayitGorunumu, { k, kayitlar: [] }))).includes(k.kayit.bos))
      temiz(kayit, `record ${dil}`)
    }
  })

  it('C. the front desk: the card is name, birth date and phone; each control is drawn only for a permission held; there is no "done"', () => {
    if (!RANDEVU) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil), r = A.randevuMetni(dil), m = A.uygulamaMetni(dil)
      const hekimler = [{ hekimId: BEN, ad: 'QA Me', yetkiler: ['on-buro-randevu', 'on-buro-portal'] as never[] }]
      const secim = ciz(h(OnBuro.HekimSecimiGorunumu, { k, hekimler, hekimId: BEN, sec: bos }))
      for (const x of [k.onBuro.baslik, k.onBuro.gordugunuz, k.yetkiTuru['on-buro-randevu'], k.yetkiTuru['on-buro-portal'], 'QA Me']) assert.ok(gorunurMetin(secim).includes(x), `${dil}: "${x}"`)
      assert.ok(!gorunurMetin(secim).includes(k.yetkiTuru['on-buro-hasta']), `${dil}: a permission that was not given is listed`)
      assert.ok(gorunurMetin(ciz(h(OnBuro.HekimSecimiGorunumu, { k, hekimler: [], hekimId: '', sec: bos }))).includes(k.onBuro.hekimYok))
      const randevu = (durum: string) => ({ id: `r-${durum}`, hastaId: 'p1', hastaAdi: 'QA Patient', baslangic: '2026-10-12T05:00:00.000Z', bitis: '2026-10-12T05:30:00.000Z', gun: '2026-10-12', saat: '10:00', sureDk: 30, durum, mesaiDisi: false })
      const gun = ciz(h(OnBuro.GunRandevulariGorunumu, { k, r, veri: { gun: '2026-10-12', bugun: '2026-10-12', randevular: ['planlandi', 'geldi', 'gelmedi', 'tamamlandi', 'iptal'].map(randevu) }, git: bos, durumDegistir: bos, bekliyor: false }))
      assert.equal(say(gun, 'data-eylem="durum-tamamlandi"'), 0, `${dil}: the front desk is offered "done"`)
      assert.deepEqual([say(gun, 'data-eylem="durum-geldi"'), say(gun, 'data-eylem="durum-gelmedi"'), say(gun, 'data-eylem="durum-iptal"'), say(gun, 'data-eylem="durum-planlandi"')], [2, 2, 3, 2], dil)
      assert.deepEqual(OnBuro.onBuroGecisleri('tamamlandi'), []); assert.deepEqual(OnBuro.onBuroGecisleri('iptal'), [])
      const hasta = { id: 'p1', ad: 'QA Patient', otaIsmi: 'QA Mid', dogumTarihi: '1990-05-05', telefon: '+000 11 22' }
      const kart = (yetkiler: string[], ek: Record<string, unknown> = {}) => ciz(h(OnBuro.HastaKartiGorunumu, { k, r, g: A.girdiMetni(dil), hasta, yetkiler: yetkiler as never[], form: { gun: '2026-10-12', saat: '10:00', sureDk: 30, yineDe: false }, setForm: bos, sureler: [15, 30], randevuAl: bos, portalVer: bos, formIste: bos, yeni: null, kopyala: bos, kapat: bos, bekliyor: false, portalVar: true, formVar: true, ...ek }))
      const tam = kart(['on-buro-randevu', 'on-buro-portal'])
      assert.ok(gorunurMetin(tam).includes('QA Patient QA Mid') && gorunurMetin(tam).includes('+000 11 22') && gorunurMetin(tam).includes(Y.yerine(k.onBuro.dogum, Kabuk.tarihYaz('1990-05-05'))), dil)
      assert.deepEqual([say(tam, 'data-eylem="on-buro-randevu-al"'), say(tam, 'data-eylem="on-buro-portal-ver"'), say(tam, 'data-eylem="on-buro-form-iste"')], [1, 1, 1])
      assert.deepEqual([say(kart(['on-buro-randevu']), 'data-eylem="on-buro-portal-ver"'), say(kart(['on-buro-portal']), 'data-eylem="on-buro-randevu-al"'), say(kart(['on-buro-hasta']), 'data-eylem=')], [0, 0, 0], `${dil}: a control without its permission`)
      assert.deepEqual([say(kart(['on-buro-portal'], { portalVar: false, formVar: false }), 'data-eylem="on-buro-portal-ver"')], [0], 'no portal in the country: no button')
      const yeni = kart(['on-buro-portal'], { yeni: { adres: 'https://qa.test/portal#TOKEN', pin: '123456' } })
      assert.ok(gorunurMetin(yeni).includes(k.onBuro.portalBirKez) && yeni.includes('123456') && yeni.includes('#TOKEN'), dil)
      const yeniHasta = ciz(h(OnBuro.YeniHastaGorunumu, { k, m, f: { ad: '', otaIsmi: '', dogumTarihi: '', cinsiyet: '', telefon: '', dil: paket.uygulama?.hastaDilleri[0] ?? '' }, setF: bos, kaydet: bos, bekliyor: false }))
      assert.ok(gorunurMetin(yeniHasta).includes(k.onBuro.yeniHasta) && gorunurMetin(yeniHasta).includes(m.yeniHasta.ad), dil)
      if (m.yeniHasta.ulusalKimlik) assert.ok(!gorunurMetin(yeniHasta).includes(m.yeniHasta.ulusalKimlik), `${dil}: the front desk is asked for an identity number`)
      temiz(gorunurMetin(tam + gun + secim + yeniHasta), `front desk ${dil}`)
    }
    // The workspace's source asks the server for nothing clinical and names no clinical field.
    const kaynak = kod('components/ulke/uygulama/OnBuro.tsx')
    assert.doesNotMatch(kaynak, /\/api\/ulke\/(hasta|not|muayene|hasta-formu|arac-kaydi|hasta-portali|randevu)\b/, 'the workspace calls a doctor\'s own route')
    assert.deepEqual([...new Set([...kaynak.matchAll(/['"`](\/api\/ulke\/[a-z\/-]+)/g)].map((x) => x[1]))], ['/api/ulke/klinik/on-buro'])
    assert.doesNotMatch(kaynak, /\.neden\b|seansId|notId|ulusalKimlik|icerik|transkript|cevaplar/, 'the workspace names a clinical field')
  })

  it('D. shared and cover are READ-ONLY: the approved note under the template\'s own headings; no field to type a note into and no button that changes anything of a patient', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil), m = A.uygulamaMetni(dil)
      const veri = { hasta: { id: 'p1', ad: 'QA Patient', otaIsmi: '', dogumTarihi: '1990-05-05' }, notlar: [{ notId: 'n1', muayeneTarihi: '2026-10-05T06:00:00.000Z', onayTarihi: '2026-10-05T07:00:00.000Z', dil, sablon: HEKIM_ROLU || A.genelSablon(), icerik: { s: 'QA-S text', o: 'QA-O text', a: 'QA-A text', p: 'QA-P text' }, alanAnahtarlari: [] }] }
      const html = ciz(h(Paylasilan.PaylasilanNotlarGorunumu, { k, m, dil, veri }))
      for (const x of ['QA Patient', 'QA-S text', 'QA-O text', 'QA-A text', 'QA-P text', k.paylasilan.saltOkunur, k.paylasilan.notlar]) assert.ok(gorunurMetin(html).includes(x), `${dil}: "${x}"`)
      assert.doesNotMatch(html, /<(input|textarea|select|button|form)\b/, `${dil}: the notes view has a control`)
      assert.ok(gorunurMetin(ciz(h(Paylasilan.PaylasilanNotlarGorunumu, { k, m, dil, veri: { ...veri, notlar: [] } }))).includes(k.paylasilan.notYok))
      const liste = ciz(h(Paylasilan.PaylasilanListeGorunumu, { k, ac: bos, girdiler: [
        { yetkiId: 'y1', tur: 'paylasim', hekimId: DIGER, hekimAdi: 'QA Other Doctor', hastaId: 'p1', bitis: null, hasta: { id: 'p1', ad: 'QA Patient', otaIsmi: '', dogumTarihi: '' } },
        { yetkiId: 'y2', tur: 'vekalet', hekimId: DIGER, hekimAdi: 'QA Other Doctor', hastaId: null, bitis: '2026-10-14T19:00:00.000Z' },
      ] }))
      for (const x of ['QA Patient', k.yetkiTuru.vekalet, Y.yerine(k.paylasilan.hekim, 'QA Other Doctor')]) assert.ok(gorunurMetin(liste).includes(x), `${dil}: "${x}"`)
      assert.ok(gorunurMetin(ciz(h(Paylasilan.PaylasilanListeGorunumu, { k, girdiler: [], ac: bos }))).includes(k.paylasilan.bos))
      const vekalet = ciz(h(Paylasilan.VekaletGorunumu, { k, r: RANDEVU ? A.randevuMetni(dil) : null, hekimAdi: 'QA Other Doctor', setQ: bos, ara: bos, hastaAc: bos, git: bos,
        d: { q: 'QA', hastalar: [{ id: 'p1', ad: 'QA Patient', otaIsmi: '', dogumTarihi: '1990-05-05' }], aramaKisa: true, gun: '2026-10-12', bugun: '2026-10-12', randevular: [{ id: 'r1', hastaId: 'p1', hastaAdi: 'QA Patient', baslangic: '', bitis: '', gun: '2026-10-12', saat: '10:00', sureDk: 30, neden: 'QA reason', durum: 'planlandi' }] } }))
      assert.ok(gorunurMetin(vekalet).includes(k.paylasilan.saltOkunur) && gorunurMetin(vekalet).includes(k.paylasilan.aramaKisa), dil)
      // the only controls of cover: the search, opening a patient, moving between days. No status button, no booking.
      assert.doesNotMatch(vekalet, /data-eylem="(durum-|on-buro-|randevu-al|yetki-)/, dil)
      temiz(gorunurMetin(html + liste + vekalet), `shared ${dil}`)
    }
    const kaynak = kod('components/ulke/uygulama/KlinikPaylasilan.tsx')
    assert.doesNotMatch(kaynak, /method:\s*'(POST|PATCH|PUT|DELETE)'/, 'the shared view sends something that is not a read')
    assert.deepEqual([...new Set([...kaynak.matchAll(/['"`](\/api\/ulke\/[a-z\/-]+)/g)].map((x) => x[1]))], ['/api/ulke/klinik/paylasilan'])
  })

  it('E. the shell: the clinic link for everybody where the pack has clinic accounts; a front-desk member\'s navigation is the workspace, the clinic and the settings — no doctor\'s screen', () => {
    if (!ACIK) return
    for (const dil of FORMLAR) {
      const k = A.klinikMetni(dil), m = A.uygulamaMetni(dil)
      const herkes = ciz(h(Kabuk.Cerceve, { dil, m, ad: 'QA', aktif: 'klinik', cikis: bos, children: null }))
      assert.ok(herkes.includes(`href="${Kabuk.YOL.klinik}"`) && gorunurMetin(herkes).includes(k.kabuk.klinik), dil)
      assert.ok(herkes.includes(`href="${Kabuk.YOL.hastalar}"`) && !herkes.includes(`href="${Kabuk.YOL.onBuro}"`), `${dil}: a doctor's navigation`)
      const onBuro = ciz(h(Kabuk.Cerceve, { dil, m, ad: 'QA', aktif: 'onBuro', cikis: bos, onBuro: true, children: null }))
      const baglantilar = [...onBuro.matchAll(/class="uza-sekme"[^>]*>|<a href="([^"]+)" class="uza-sekme"/g)].map((x) => x[1]).filter(Boolean)
      assert.deepEqual(baglantilar, [...(RANDEVU ? [Kabuk.YOL.onBuro] : []), Kabuk.YOL.klinik, Kabuk.YOL.ayarlar], `${dil}: the front desk's navigation`)
      for (const yol of [Kabuk.YOL.bugun, Kabuk.YOL.hastalar, Kabuk.YOL.takvim, Kabuk.YOL.araclar, Kabuk.YOL.muayene]) assert.ok(!onBuro.includes(`href="${yol}"`), `${dil}: the front desk is linked to ${yol}`)
      if (RANDEVU) assert.ok(gorunurMetin(onBuro).includes(k.kabuk.onBuro))
    }
  })

  it('F. every text of the catalogue, in every form: there, not a placeholder, and free of any other country\'s term or letter', () => {
    if (!ACIK) return
    const sayilar = FORMLAR.map((dil) => {
      const metinler = yaprak(A.klinikMetni(dil))
      for (const [yol, metin] of metinler) { assert.ok(metin.trim(), `${dil} ${yol} is empty`); temiz(metin, `clinic catalogue ${dil} ${yol}`) }
      return metinler.length
    })
    assert.ok(sayilar[0] >= 170, `only ${sayilar[0]} texts`)
    assert.deepEqual(sayilar, sayilar.map(() => sayilar[0]), 'the forms do not have the same number of texts')
    // The screens hold no sentence of their own: every quoted run of letters with a space in it is a class, a key or an address.
    for (const d of ['Klinik.tsx', 'KlinikYetkiler.tsx', 'KlinikPaylasilan.tsx', 'OnBuro.tsx']) {
      const metin = kod(`components/ulke/uygulama/${d}`)
      for (const m of metin.matchAll(/>\s*([A-Za-zА-Яа-я][^<>{}()=;]*)\s*<\//g)) assert.fail(`${d} holds text of its own between tags: "${m[1]}"`)
    }
  })
})
