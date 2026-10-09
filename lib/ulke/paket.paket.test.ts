/**
 * NOTYA-ULKE-SABLON-01 — EVERY PACK IS COMPLETE. Runs once per country folder (scripts/ulke-test.mjs sets
 * NOTYA_COUNTRY), so a new country is held to it the day its folder appears.
 *
 *   1. The pack check (lib/ulke/paketDenetimi.ts) finds nothing: no missing catalogue entry, no setting absent or at
 *      odds with another, nothing still marked "to be supplied".
 *   2. The check itself is not blind: taking one piece away from this pack, of each kind, is reported by name.
 *   3. No file of the pack carries a "to be supplied" marker (what `prebuild` scans for).
 *   4. The scaffold's shape file (scripts/ulke-sablon/sekil.json) lists exactly the keys this pack fills.
 *   5. The country's root layout runs the check when it loads, so an incomplete pack cannot be built; the marker
 *      scan runs from the country's own build file and never from package.json.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EKSIK_ISARETI, eksik, eksikAyar } from './eksik'
import { paketiDenetle, sorunlariYaz } from './paketDenetimi'
import { iskelet, paketSekli } from './testing/paketSekli'
import type { UlkeArayuzu } from './arayuz/tipler'
import type { UlkeKlinigi, UlkePaketi } from './tipler'

const KOK = resolve(__dirname, '../..')
let paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK
})

describe('every pack is complete', () => {
  it('the pack check finds nothing missing in this pack', () => {
    const sorunlar = paketiDenetle(paket, arayuz, klinik)
    assert.deepEqual(sorunlar, [], sorunlariYaz(paket.kod, sorunlar))
  })

  it('no file of the pack carries a "to be supplied" marker', async () => {
    // The same scan a country build runs (scripts/ulke-paket-denetimi.mjs), so the test and the build cannot disagree.
    const { eksikleriBul } = await import(pathToFileURL(join(KOK, 'scripts/ulke-paket-denetimi.mjs')).href) as { eksikleriBul: (kod: string, kok: string) => { dosya: string; satir: number; ipucu: string }[] }
    assert.deepEqual(eksikleriBul(paket.kod, KOK).map((e) => `${e.dosya}:${e.satir}`), [])
  })

  it('the check is not blind: each kind of gap in THIS pack is reported by name', () => {
    if (paket.ozellikler.bolunmemisUygulama) return // the pre-split application brings nothing through the kit
    const klon = <T,>(x: T): T => {
      // functions are kept by reference; everything else is copied, so the real pack is never touched
      const gez = (v: unknown): unknown => (Array.isArray(v) ? v.map(gez) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, w]) => [k, gez(w)])) : v)
      return gez(x) as T
    }
    const yerler = (p: UlkePaketi, a: UlkeArayuzu | null, k: UlkeKlinigi | null) => paketiDenetle(p, a, k).map((x) => `${x.yer}: ${x.sorun}`)
    const iceriyor = (liste: string[], parca: string) => assert.ok(liste.some((x) => x.includes(parca)), `expected a report naming "${parca}", got:\n${liste.join('\n') || '(nothing)'}`)

    // a core surface entry marked "to be supplied"
    { const p = klon(paket); const d = p.acikDiller[0]; const y = p.yuzeyler[0]; const k = (p.metinler[d] as Record<string, Record<string, string>>)[y]; const anahtar = Object.keys(k)[0]; k[anahtar] = eksik('x'); iceriyor(yerler(p, arayuz, klinik), `metinler[${d}].${y}.${anahtar}: to be supplied`) }
    // a setting marked "to be supplied", an impossible time zone, a date pattern without a year
    { const p = klon(paket); p.saatDilimi = 'Mars/Olympus'; p.bicim.tarihDeseni = 'DD.MM'; iceriyor(yerler(p, arayuz, klinik), 'saatDilimi: not a time zone'); iceriyor(yerler(p, arayuz, klinik), 'bicim.tarihDeseni') }
    if (!paket.ozellikler.cekirdekMuayene || !arayuz || !paket.uygulama) return
    const d = paket.uygulama.diller[0]
    // the application: a missing catalogue, an empty entry, a marker, a language without a name
    { const a = klon(arayuz); delete (a.metinler as Record<string, unknown>)[d]; iceriyor(yerler(paket, a, klinik), `arayuz.metinler[${d}]: no application catalogue`) }
    { const a = klon(arayuz); (a.metinler[d] as unknown as { kabuk: { bugun: string } }).kabuk.bugun = ' '; iceriyor(yerler(paket, a, klinik), `arayuz.metinler[${d}].kabuk.bugun: empty text`) }
    { const a = klon(arayuz); (a.metinler[d] as unknown as { kabuk: { bugun: string } }).kabuk.bugun = eksik('Today'); iceriyor(yerler(paket, a, klinik), `arayuz.metinler[${d}].kabuk.bugun: to be supplied`) }
    { const a = klon(arayuz); const t = paket.uygulama.dilGruplari[0].temel; delete (a.metinler[d] as unknown as { diller: Record<string, string> }).diller[t]; iceriyor(yerler(paket, a, klinik), `arayuz.metinler[${d}].diller.${t}`) }
    // settings of the application
    { const p = klon(paket); p.uygulama!.saatDilimleri = ['Europe/London'].filter((z) => z !== p.saatDilimi); p.uygulama!.saatBicimi = eksikAyar('24 or 12'); p.uygulama!.veliYasi = 40; p.uygulama!.birimler = { agirlik: 'st' as never, boy: 'cm', sicaklik: 'C' }
      const l = yerler(p, arayuz, klinik); for (const x of ['uygulama.saatDilimleri: must hold the pack\'s default', 'uygulama.saatBicimi: to be supplied: 24 or 12', 'uygulama.veliYasi', 'uygulama.birimler.agirlik']) iceriyor(l, x) }
    { const p = klon(paket); p.uygulama!.dilGruplari = [...p.uygulama!.dilGruplari, { temel: 'xx', bicimler: [{ yazi: 'Latn', dil: d }, { yazi: 'Cyrl', dil: d }] }]; iceriyor(yerler(p, arayuz, klinik), 'uygulama.dilGruplari') }
    // a role without a name, a template field without a label, a role the pack lists and the content does not
    if (arayuz.roller.length) {
      const r = arayuz.roller[0].anahtar
      { const a = klon(arayuz); delete (a.roller[0].ad as Record<string, string>)[d]; iceriyor(yerler(paket, a, klinik), `arayuz.roller.${r}.ad.${d}`) }
      { const a = klon(arayuz); (a as unknown as { roller: unknown[] }).roller = a.roller.slice(1); iceriyor(yerler(paket, a, klinik), `the role "${r}" of uygulama.roller has no name`) }
    }
    const alanlar = Object.keys(arayuz.notSablonlari.alanlar)
    if (alanlar.length) { const a = klon(arayuz); (a.notSablonlari.alanlar[alanlar[0]].ad as Record<string, string>)[d] = eksik('label'); iceriyor(yerler(paket, a, klinik), `arayuz.notSablonlari.alanlar.${alanlar[0]}.ad.${d}: to be supplied`) }
    // the clinical half: no instruction for a template, an instruction still to be supplied
    if (klinik) {
      { const k = { ...klinik, notTalimati: () => null }; iceriyor(yerler(paket, arayuz, k), `klinik.notTalimati(${d}, ${klinik.sablonlar[0]}): no instruction`) }
      { const k = { ...klinik, notTalimati: () => eksik('instruction') }; iceriyor(yerler(paket, arayuz, k), `klinik.notTalimati(${d}, ${klinik.sablonlar[0]}): to be supplied`) }
      { const k = { ...klinik, riza: { ...klinik.riza, surum: '' } }; iceriyor(yerler(paket, arayuz, k), 'klinik.riza.surum') }
    }
    // the patient portal: no catalogue, an entry to be supplied, a sentence that lost its placeholder, no link validity,
    // the page not listed, no instruction for the summary, and the portal without the application
    if (paket.ozellikler.hastaPortali && arayuz.portalMetinleri) {
      { const a = klon(arayuz); delete (a.portalMetinleri as Record<string, unknown>)[d]; iceriyor(yerler(paket, a, klinik), `arayuz.portalMetinleri[${d}]: the patient portal is on and this form has no portal catalogue`) }
      { iceriyor(yerler(paket, { ...arayuz, portalMetinleri: undefined }, klinik), `arayuz.portalMetinleri[${d}]`) }
      { const a = klon(arayuz); (a.portalMetinleri![d] as unknown as { sayfa: { acil: string } }).sayfa.acil = eksik('emergency line'); iceriyor(yerler(paket, a, klinik), `arayuz.portalMetinleri[${d}].sayfa.acil: to be supplied`) }
      { const a = klon(arayuz); (a.portalMetinleri![d] as unknown as { giris: { pinYanlis: string } }).giris.pinYanlis = 'Wrong.'; iceriyor(yerler(paket, a, klinik), `arayuz.portalMetinleri[${d}].giris.pinYanlis: must hold "%"`) }
      { const a = klon(arayuz); (a.portalMetinleri![d] as unknown as { sayfa: { istekKabul: string } }).sayfa.istekKabul = 'Booked: %1.'; iceriyor(yerler(paket, a, klinik), `arayuz.portalMetinleri[${d}].sayfa.istekKabul: must hold "%2"`) }
      { const p = klon(paket); delete p.uygulama!.portal; iceriyor(yerler(p, arayuz, klinik), 'uygulama.portal: the patient portal is switched on') }
      { const p = klon(paket); p.uygulama!.portal = { baglantiGecerlilikGun: 0 }; iceriyor(yerler(p, arayuz, klinik), 'uygulama.portal.baglantiGecerlilikGun: must be a whole number of days') }
      { const p = klon(paket); p.uygulama!.portal = { baglantiGecerlilikGun: eksikAyar('days') }; iceriyor(yerler(p, arayuz, klinik), 'uygulama.portal.baglantiGecerlilikGun: to be supplied: days') }
      if (paket.rotalar !== 'hepsi') { const p = klon(paket); const rt = p.rotalar as unknown as { sayfalar: string[] }; rt.sayfalar = rt.sayfalar.filter((x) => x !== '/portal'); iceriyor(yerler(p, arayuz, klinik), 'rotalar.sayfalar: the patient portal is on and "/portal" is not listed') }
      { const p = klon(paket); p.uygulama!.saatDilimleri = [...new Set([p.saatDilimi, 'Europe/London', 'Asia/Tokyo'])]; const a = klon(arayuz); delete (a.portalMetinleri![d] as unknown as { sayfa: { saatDilimi?: string } }).sayfa.saatDilimi; iceriyor(yerler(p, a, klinik), `arayuz.portalMetinleri[${d}].sayfa.saatDilimi: the country has several time zones`) }
      if (klinik) {
        { const k = { ...klinik, hastaOzetiTalimati: undefined }; iceriyor(yerler(paket, arayuz, k), 'klinik.hastaOzetiTalimati: the patient portal is on') }
        { const k = { ...klinik, hastaOzetiTalimati: () => null }; iceriyor(yerler(paket, arayuz, k), `klinik.hastaOzetiTalimati(${d}): no instruction`) }
        { const k = { ...klinik, hastaOzetiTalimati: () => eksik('instruction') }; iceriyor(yerler(paket, arayuz, k), `klinik.hastaOzetiTalimati(${d}): to be supplied`) }
      }
      { const p = klon(paket); delete (p.ozellikler as Record<string, unknown>).cekirdekMuayene; iceriyor(yerler(p, arayuz, klinik), 'ozellikler.hastaPortali: the patient portal needs the signed-in application') }
    }
    // the landing page
    if (paket.ozellikler.acilisSayfasi && arayuz.acilis) {
      const f = arayuz.acilis.diller[0]
      { const a = klon(arayuz); delete (a.acilis!.icerik as Record<string, unknown>)[f]; iceriyor(yerler(paket, a, klinik), `acilis.icerik[${f}]: no copy`) }
      { const a = klon(arayuz); (a.acilis!.icerik[f] as unknown as { kahraman: { baslik: string } }).kahraman.baslik = eksik('headline'); iceriyor(yerler(paket, a, klinik), `acilis.icerik[${f}].kahraman.baslik: to be supplied`) }
      { iceriyor(yerler(paket, { ...arayuz, acilis: null }, klinik), 'acilis: the landing page is switched on') }
      // the price section: a plan of the copy without a price, a price without a plan, an amount that is not one, a text without the place for it
      const planlar = arayuz.acilis.icerik[f]!.narx.gruplar.flatMap((g) => g.rejalar.map((r) => r.id))
      if (planlar.length) {
        { const a = klon(arayuz); delete (a.acilis!.fiyatlar as Record<string, unknown>)[planlar[0]]; iceriyor(yerler(paket, a, klinik), `acilis.fiyatlar.${planlar[0]}: the "${f}" copy names this plan`) }
        { const a = klon(arayuz); (a.acilis!.fiyatlar as Record<string, unknown>)['no-such-plan'] = { aylik: null, oneCikan: false }; iceriyor(yerler(paket, a, klinik), 'acilis.fiyatlar.no-such-plan: is in the price list') }
        { const a = klon(arayuz); (a.acilis!.fiyatlar as Record<string, { aylik: unknown }>)[planlar[0]].aylik = 0.5; iceriyor(yerler(paket, a, klinik), `acilis.fiyatlar.${planlar[0]}.aylik`) }
        { const a = klon(arayuz); (a.acilis!.icerik[f] as unknown as { narx: { oylik: string } }).narx.oylik = 'a month'; iceriyor(yerler(paket, a, klinik), `acilis.icerik[${f}].narx.oylik`) }
      }
    }
    // the application on, and a half of the pack missing altogether
    iceriyor(yerler(paket, null, klinik), 'the pack brings no content for the shared screens')
    iceriyor(yerler(paket, arayuz, null), 'klinik: the application is switched on')
    // … and the real pack was not touched by any of it
    assert.deepEqual(paketiDenetle(paket, arayuz, klinik), [])
  })

  it('the scaffold\'s shape file lists exactly the keys this pack fills (a key added to the kit cannot be forgotten there)', () => {
    if (paket.ozellikler.bolunmemisUygulama || !arayuz || !arayuz.acilis || !arayuz.portalMetinleri || !paket.uygulama) return
    const dosya = JSON.parse(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8'))
    const simdi = paketSekli(paket, arayuz)
    for (const bolum of ['cekirdek', 'uygulama', 'randevu', 'portal', 'acilis']) assert.deepEqual(iskelet(dosya[bolum]), iskelet(simdi[bolum]), `scripts/ulke-sablon/sekil.json is stale in "${bolum}": run NOTYA_COUNTRY=${paket.kod} npx tsx scripts/ulke-sablon/sekil-uret.mts`)
    // the file holds key paths only: no sentence of this pack, no letter outside ASCII
    assert.doesNotMatch(readFileSync(join(KOK, 'scripts/ulke-sablon/sekil.json'), 'utf8'), /[^\x00-\x7F]/)
  })

  it('the country root layout runs the check when it loads; the marker cannot be mistaken for content', () => {
    const duzen = readFileSync(join(KOK, 'app/layout.ulke.tsx'), 'utf8')
    assert.match(duzen, /^aktifPaketiDenetle\(\)$/m, 'app/layout.ulke.tsx must call the pack check at module level')
    assert.ok(existsSync(join(KOK, 'scripts/ulke-paket-denetimi.mjs')), 'the scan for "to be supplied" markers is missing')
    // The scan runs from the country's OWN build file; the pre-split application (Türkiye) has no such call …
    const derleme = readFileSync(join(KOK, 'countries', paket.kod, 'derleme.mjs'), 'utf8')
    if (paket.ozellikler.bolunmemisUygulama) assert.doesNotMatch(derleme, /^import |paketTamOlmali\(|ulkeDerlemeKapisi\(/m, 'the pre-split application\'s build file stays plain data')
    else assert.match(derleme, new RegExp(`^ulkeDerlemeKapisi\\('${paket.kod}'\\)$`, 'm'), `countries/${paket.kod}/derleme.mjs must call ulkeDerlemeKapisi('${paket.kod}')`)
    // … and package.json never runs it: what a build with no country set runs before and after `next build` is not this job's to change.
    const betikler = JSON.parse(readFileSync(join(KOK, 'package.json'), 'utf8')).scripts as Record<string, string>
    for (const ad of ['prebuild', 'build', 'postbuild']) assert.doesNotMatch(betikler[ad] ?? '', /ulke/, `package.json "${ad}" must not run a country check: a build with no country set runs what main runs`)
    assert.equal(betikler.prebuild, 'node scripts/vad-varliklari.mjs')
    assert.equal(betikler.postbuild, undefined)
    assert.equal(betikler['build:ulke'], 'node scripts/ulke-derle.mjs')
    assert.equal(eksik('Today'), `${EKSIK_ISARETI} Today`)
    assert.match(EKSIK_ISARETI, /^⟦[A-Z]+⟧$/, 'the marker is bracketed in signs no catalogue uses, so it cannot be mistaken for content')
  })
})
