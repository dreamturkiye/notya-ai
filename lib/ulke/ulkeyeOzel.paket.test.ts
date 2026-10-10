/**
 * NOTYA-ULKE-OZEL-01 — WHAT ONE COUNTRY ADDS REACHES NO OTHER, for whichever pack is active (run once per country
 * folder). Names no country.
 *
 * A country can now have roles and tools of its own (docs/COUNTRY-PACK-HOWTO.md, "Country-only tools and roles").
 * The kit's test country "xx" (lib/ulke/testing/ornekUlke/) has both, uses every extension point, and is in no
 * build. Held here, for the ACTIVE pack:
 *
 *   A. NOTHING OF THE TEST COUNTRY IS IN THIS PACK: none of its roles is a role here, none of its tools, link-out
 *      tiles, placeholders, mechanisms or quantities is here, and no text of this pack names one of its keys.
 *   B. THIS PACK'S OWN TOOLS ARE ITS OWN: every key that carries a country's code carries THIS country's, and is on
 *      the list wall rule D7 enforces (countries/yasak-araclar.json) — so no other country, no language set and no
 *      kit file can name it; and the list holds no key of this country that the pack no longer has.
 *   C. A TOOL OF THE PACK HAS A MECHANISM, and every switched-on tool is free or permitted where its licence is stated.
 *      WHERE THE COUNTRY STATES NOTHING OF ITS OWN ABOUT A TOOL, THE TOOL IS THE KIT'S AND NOTHING ELSE: the very same
 *      definition, and — for every sample input — the very same result the kit's arithmetic gives when called
 *      directly. So the path a country's own numbers, bands and tools go through adds nothing for a tool that uses
 *      none of them.
 *   D. LICENCES: a pack either states the licence of every tool and placeholder, or is one of the countries that
 *      existed before the rule (countries/lisans-borcu.json) — a list that can only shrink.
 *
 * The pre-split application (Türkiye) has no tools area in a pack; A holds for it trivially and the rest has nothing
 * to check.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { kitAraci } from './araclar/katalog'
import { aracCalistir, hesabinAraci, paketinAraci, paketinTanimi, type GorunurArac } from './araclar/paket'
import { LISANS_ACIK, type UlkeAraclari } from './araclar/tipler'
import { anahtarUlkesi, ulkeyeOzelAnahtarlar } from './araclar/ulkeyeOzel'
import type { UlkeArayuzu } from './arayuz/tipler'
import { ORNEK_BUGUN, ornekGirdiler } from './testing/aracOrnekleri'
import { XX, XX_OLCULER, XX_OZEL_ARACLAR, XX_OZEL_ROLLER, XX_TANIMLAR } from './testing/ornekUlke'
import type { UlkeKlinigi, UlkePaketi } from './tipler'

const KOK = resolve(__dirname, '../..')
const LISTE = JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, unknown>
const BORC = JSON.parse(readFileSync(join(KOK, 'countries/lisans-borcu.json'), 'utf8')) as { ulkeler: string[] }

let paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null
let a: UlkeAraclari | null = null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK
  a = paket.ozellikler.araclar && arayuz?.araclar ? arayuz.araclar : null
})

describe('A. nothing of the kit\'s test country is in this pack', () => {
  it('the active pack is a real country, never the test country', () => {
    assert.notEqual(paket.kod, XX)
    assert.doesNotMatch(paket.iz, /:xx:/)
  })

  it('none of the test country\'s ROLES is a role here — not in the list, not in the names, not in a template, not in the intake form', () => {
    const roller = new Set<string>([...(paket.uygulama?.roller ?? []), ...(arayuz?.roller.map((r) => r.anahtar) ?? []), ...Object.keys(arayuz?.notSablonlari.rolAlanlari ?? {}), ...(arayuz?.notSablonlari.cocukRolleri ?? []), ...Object.keys(klinik?.hastaFormu?.roller ?? {}), ...(klinik?.sablonlar ?? [])])
    for (const r of XX_OZEL_ROLLER) assert.ok(!roller.has(r), `"${r}" is a role of the test country and appears in "${paket.kod}"`)
    for (const r of arayuz?.roller ?? []) assert.ok(!XX_OZEL_ROLLER.includes(r.gibi ?? ''), `${r.anahtar} behaves like a role of the test country`)
    // no tool and no placeholder of this pack is given to one of them either
    for (const p of a?.araclar ?? []) for (const r of p.roller ?? []) assert.ok(!XX_OZEL_ROLLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of a?.yuvalar ?? []) for (const r of y.roller ?? []) assert.ok(!XX_OZEL_ROLLER.includes(r), `${y.anahtar}: ${r}`)
  })

  it('none of the test country\'s TOOLS is here: no tool, no link-out tile, no placeholder, no mechanism, no quantity', () => {
    const anahtarlar = new Set<string>([...(a?.araclar ?? []).map((p) => p.anahtar), ...(a?.yuvalar ?? []).map((y) => y.anahtar), ...(a?.kendiAraclari ?? []).map((t) => t.anahtar)])
    for (const k of [...XX_OZEL_ARACLAR, ...XX_TANIMLAR.map((t) => t.anahtar)]) assert.ok(!anahtarlar.has(k), `"${k}" is a tool of the test country and appears in "${paket.kod}"`)
    for (const k of anahtarlar) assert.notEqual(anahtarUlkesi(k, XX), XX, `"${k}" carries the test country's code`)
    for (const k of Object.keys(XX_OLCULER)) { assert.ok(!(k in (a?.olculer ?? {})), k); assert.ok(!(k in (a?.labBirimleri ?? {})), k) }
  })

  it('no text and no setting of this pack names a key of the test country', () => {
    // everything the pack states that can be written down: settings, role names, templates, every tool and placeholder
    const yazi = JSON.stringify([paket.uygulama ?? null, arayuz?.roller ?? null, arayuz?.notSablonlari ?? null, a ?? null, klinik?.hastaFormu ?? null], (_k, v) => (typeof v === 'function' ? undefined : v))
    for (const k of [...XX_OZEL_ARACLAR, ...XX_OZEL_ROLLER, ...Object.keys(XX_OLCULER)]) assert.ok(!yazi.includes(`"${k}"`), `"${k}" is named in "${paket.kod}"`)
  })
})

describe('B. this pack\'s own tools are its own, and listed', () => {
  it('a key that carries a country\'s code carries THIS country\'s', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    for (const k of ulkeyeOzelAnahtarlar(a, paket.kod)) assert.equal(anahtarUlkesi(k, paket.kod), paket.kod, `"${k}" carries another country's code`)
    for (const p of a.araclar) if (p.baglanti || (a.kendiAraclari ?? []).some((x) => x.anahtar === p.anahtar)) assert.equal(anahtarUlkesi(p.anahtar, paket.kod), paket.kod, `${p.anahtar}: a tool only this country has carries its code`)
    for (const x of a.kendiAraclari ?? []) assert.equal(kitAraci(x.anahtar), null, `${x.anahtar}: a mechanism of the pack's own under a key of the kit`)
  })

  it('every one of them is on the list wall rule D7 enforces, under this country — and the list holds none of this country\'s that the pack no longer has', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    const kendi = ulkeyeOzelAnahtarlar(a, paket.kod)
    const listede = Array.isArray(LISTE[paket.kod]) ? (LISTE[paket.kod] as string[]) : []
    for (const k of kendi) assert.ok(listede.includes(k), `"${k}" is a tool of "${paket.kod}" alone and is not listed for it in countries/yasak-araclar.json: another country could name it`)
    // the other way round, for the keys that carry the country's code (a state or payer tool of the pre-split application carries none)
    for (const k of listede) if (anahtarUlkesi(k, paket.kod) === paket.kod) assert.ok(kendi.includes(k), `"${k}" is listed for "${paket.kod}" and the pack has no such tool or placeholder`)
  })
})

describe('C. every tool of this pack has a mechanism and may be on', () => {
  it('the kit\'s, the pack\'s own, or — for a link-out tile — none to find; and a stated licence is free or permitted', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    for (const p of a.araclar) {
      assert.ok(paketinTanimi(a, p), `${p.anahtar}: no mechanism`)
      if (p.lisans) assert.ok(LISANS_ACIK.includes(p.lisans.durum), `${p.anahtar}: switched on with the licence state "${p.lisans.durum}"`)
    }
  })

  it('WHERE THE COUNTRY STATES NOTHING OF ITS OWN, A TOOL IS THE KIT\'S AND NOTHING ELSE: the same definition, and for every sample the same result as the kit\'s arithmetic called directly', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    let karsilastirilan = 0
    for (const p of a.araclar) {
      const kit = kitAraci(p.anahtar)
      // a tool of the kit for which the country restates no band and no option
      if (!kit || p.baglanti || p.uyarlama) continue
      const x: GorunurArac = paketinAraci(a, p.anahtar)!
      assert.equal(x.tanim, kit, `${p.anahtar}: the pack is handed something other than the kit's own definition`)
      // …and whose numbers, where it has any, are plain numbers (a laboratory value with its unit is converted: tested where a pack has one)
      const sayilar = p.parametreler ?? {}
      if (kit.tur === 'ekran' || (kit.tablolar ?? []).length || Object.values(sayilar).some((v) => typeof v !== 'number') || (kit.parametreler ?? []).some((k) => typeof sayilar[k] !== 'number')) continue
      for (const g of ornekGirdiler(kit, 25)) {
        assert.deepEqual(aracCalistir(x, g, ORNEK_BUGUN, a), kit.hesapla(g, { bugun: ORNEK_BUGUN, p: sayilar as Record<string, number> }), `${p.anahtar}: ${JSON.stringify(g)}`)
        karsilastirilan++
      }
      // the gate hands out the same definition, for every role that has the tool
      for (const rol of [null, ...(paket.uygulama?.roller ?? [])]) { const y = hesabinAraci(a, rol, p.anahtar); if (y) assert.equal(y.tanim, kit, `${p.anahtar} for ${rol}`) }
    }
    assert.ok(karsilastirilan > 0 || !a.araclar.some((p) => kitAraci(p.anahtar)?.tur !== 'ekran'), 'nothing was compared')
  })
})

describe('D. licences: stated for every tool and placeholder, or the country is on the list that can only shrink', () => {
  it('countries/lisans-borcu.json and the pack agree', (t) => {
    if (!a) { t.skip('this pack has no tools area'); return }
    const borclu = BORC.ulkeler.includes(paket.kod)
    const tam = a.lisansTam === true
    const eksikler = [...a.araclar.filter((p) => !p.lisans).map((p) => p.anahtar), ...a.yuvalar.filter((y) => !y.lisans).map((y) => `placeholder ${y.anahtar}`)]
    if (!borclu) {
      assert.equal(tam, true, `"${paket.kod}" is not on the list of countries that existed before the rule: it states the licence of every tool and placeholder (lisansTam: true)`)
      assert.deepEqual(eksikler, [])
    } else {
      // on the list: it has not stated them all yet. The day it has, it leaves the list.
      assert.ok(!tam || eksikler.length > 0, `"${paket.kod}" states every licence: take it off countries/lisans-borcu.json`)
    }
    // listed or not: a tool only this country has, and a link-out tile, state their licence
    for (const p of a.araclar) if (anahtarUlkesi(p.anahtar, paket.kod) === paket.kod) assert.ok(p.lisans, `${p.anahtar}: a tool of the country's own states its licence`)
    for (const y of a.yuvalar) if (anahtarUlkesi(y.anahtar, paket.kod) === paket.kod) assert.ok(y.lisans, `${y.anahtar}: a placeholder of the country's own states its licence`)
  })
})
