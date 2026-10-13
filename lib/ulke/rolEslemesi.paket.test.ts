/**
 * NOTYA-ULKE-OZEL-01 — A COUNTRY'S ROLE LIST AND THE ROLE TABLE, for whichever pack is active (run once per country
 * folder). Names no country.
 *
 * A country may now have roles of its own (docs/COUNTRY-PACK-HOWTO.md, "Country-only tools and roles"). What keeps
 * that traceable is countries/rol-eslemesi.json: the forty shared roles, and under `ulkeyeOzel` every difference a
 * country has, with the shared role each of its own roles behaves like. This test holds the ACTIVE pack to it:
 *
 *   - a country the table does not list under `ulkeyeOzel` has EXACTLY its column of the table, in its order —
 *     so no country can drift from the shared list unnoticed;
 *   - a country that is listed has exactly the table's roles for it, each of its own roles with the kind and the
 *     `gibi` the table states;
 *   - a role that behaves like another has something to behave like: the kit finds its note template and its intake
 *     questions (the pack check says so too; here it is asked of the running pack).
 *
 * The pre-split application (Türkiye) has no role list in a pack and nothing to check here; its side of the table is
 * held by lib/ulke/rolEslemesi.test.ts.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { icerikAnahtari, rolunGibisi } from './arayuz/rolIcerigi'
import { sablonMu } from './arayuz/notSablonu'
import type { UlkeArayuzu } from './arayuz/tipler'
import { rolTablosunuOku, rolTablosuSorunlari, type RolSutunu } from './testing/rolTablosu'
import type { UlkeKlinigi, UlkePaketi } from './tipler'

let paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK
})

/** The column of the table a pack's keys are read from: the table's own word for it, else by the pack's language. */
function sutunu(p: UlkePaketi): RolSutunu | null {
  const t = rolTablosunuOku()
  if (t.ulkeyeOzel?.[p.kod]) return t.ulkeyeOzel[p.kod].sutun
  if (p.diller.some((d) => d.startsWith('en-'))) return 'en'
  // otherwise: the column that carries the country's own code, where the table has one
  return (['en', 'tr', 'uz'] as const).find((s) => s === p.kod) ?? null
}

describe('the active pack\'s roles and the role table (countries/rol-eslemesi.json)', () => {
  it('the pack has exactly the roles the table gives its country: its column, with the differences the table states', (t) => {
    const roller = paket.uygulama?.roller
    if (!arayuz || !roller) { t.skip('this pack brings no role list (the pre-split application)'); return }
    const sutun = sutunu(paket)
    if (!sutun) { t.skip('the table has no column for this country\'s keys yet'); return }
    assert.deepEqual(rolTablosuSorunlari(rolTablosunuOku(), paket.kod, sutun, roller, arayuz.roller), [])
  })

  it('a role that behaves like another finds a note template or intake questions through it — and no chain', (t) => {
    if (!arayuz) { t.skip('this pack brings no role list (the pre-split application)'); return }
    for (const r of arayuz.roller) {
      const gibi = rolunGibisi(arayuz.roller, r.anahtar)
      if (!gibi) continue
      assert.equal(rolunGibisi(arayuz.roller, gibi), null, `${r.anahtar} → ${gibi}: a chain`)
      const sablon = icerikAnahtari(arayuz.roller, r.anahtar, arayuz.notSablonlari.rolAlanlari)
      const form = klinik?.hastaFormu ? icerikAnahtari(arayuz.roller, r.anahtar, klinik.hastaFormu.roller) : null
      assert.ok(sablon !== null || form !== null, `${r.anahtar} behaves like "${gibi}" and finds nothing there`)
      if (sablon !== null) assert.equal(sablonMu(arayuz.notSablonlari, arayuz.roller, r.anahtar), true, `${r.anahtar}: its notes are written with a template`)
    }
  })
})
