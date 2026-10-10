/**
 * NOTYA-ULKE-EN-01 — ROLE KEYS ACROSS COUNTRIES: countries/rol-eslemesi.json is held to all three sides.
 *
 * The five English-speaking packs share ONE set of role keys, in English (countries/_dil/en/klinik/roller.ts). The
 * Turkish product and the Uzbek pack use the product's original keys. The table maps each English key to both, so a
 * core fix made for one specialty can be traced across countries (docs/COUNTRY-PACK-ROLE-KEYS.md).
 *
 * FORTY ROWS, NONE MISSING, NONE EXTRA, on every side:
 *   en   exactly the language set's 40 keys, in its order
 *   tr   exactly the Turkish product's roles: the 30 specialties of lib/asistan/specialistsCatalog.ts and the 10 clinic
 *        roles of lib/ai/personas/klinik_uzmanlar.ts — READ AS TEXT, never imported (the clinic list calls its
 *        dermatology "dermatoloji"; the product key of that clinic role is "klinik-dermatoloji")
 *   uz   exactly the Uzbek pack's 40 roles
 * and the kind of each role (doctor specialty, clinic doctor, clinic allied profession) is the same on every side.
 *
 * NOTYA-ULKE-OZEL-01 — A COUNTRY MAY HAVE A ROLE LIST OF ITS OWN. The forty rows stay what the countries share; the
 * table's section `ulkeyeOzel` lists, per country, the shared roles it does not have and the roles only it has, each
 * with the shared role it behaves like. `en` and `uz` above then read "the column, with that country's differences";
 * a country that is not listed has exactly its column. No real country is listed yet: the one entry is the kit's test
 * country (lib/ulke/testing/ornekUlke/), which shows the form. Each pack against the table, with its role
 * definitions: lib/ulke/rolEslemesi.paket.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { TUM_ULKELER } from '@/countries/tumu'
import { EN_ROL_SATIRLARI, EN_ROLLER } from '@/countries/_dil/en/klinik/roller'
import { rolFarkiSorunlari, tablodakiRoller, type RolTablosu } from './testing/rolTablosu'
import { ULKE_KODLARI } from './tipler'

const KOK = resolve(__dirname, '../..')
type Satir = { en: string; tr: string; uz: string; taraf: string }
const TABLO = JSON.parse(readFileSync(join(KOK, 'countries/rol-eslemesi.json'), 'utf8')) as RolTablosu & { roller: Satir[] }

function turkRolleri(): { doktor: string[]; klinik: string[] } {
  const katalog = readFileSync(join(KOK, 'lib/asistan/specialistsCatalog.ts'), 'utf8')
  const doktor = [...katalog.matchAll(/specialtyKey: '([^']+)'/g)].map((m) => m[1])
  const klinikKaynak = readFileSync(join(KOK, 'lib/ai/personas/klinik_uzmanlar.ts'), 'utf8')
  const klinik = [...klinikKaynak.matchAll(/^  "([a-z-]+)": \{ name: "/gm)].map((m) => (m[1] === 'dermatoloji' ? 'klinik-dermatoloji' : m[1]))
  return { doktor, klinik }
}

describe('role keys across countries (countries/rol-eslemesi.json)', () => {
  it('forty rows, each complete, no key twice on any side', () => {
    assert.equal(TABLO.roller.length, 40)
    for (const r of TABLO.roller) for (const k of ['en', 'tr', 'uz', 'taraf'] as const) assert.match(r[k], /^[a-z]+(-[a-z]+)*$/, JSON.stringify(r))
    for (const k of ['en', 'tr', 'uz'] as const) assert.equal(new Set(TABLO.roller.map((r) => r[k])).size, 40, k)
  })

  it('en: exactly the language set\'s 40 keys, in its order, with its kinds', () => {
    assert.deepEqual(TABLO.roller.map((r) => r.en), [...EN_ROLLER])
    assert.deepEqual(TABLO.roller.map((r) => r.taraf), EN_ROL_SATIRLARI.map((r) => r.taraf))
  })

  it('tr: exactly the Turkish product\'s roles — 30 specialties and 10 clinic roles, none missing, none extra', () => {
    const { doktor, klinik } = turkRolleri()
    assert.equal(doktor.length, 30)
    assert.equal(klinik.length, 10)
    assert.deepEqual(TABLO.roller.filter((r) => r.taraf === 'doktor').map((r) => r.tr).sort(), [...doktor].sort())
    assert.deepEqual(TABLO.roller.filter((r) => r.taraf !== 'doktor').map((r) => r.tr).sort(), [...klinik].sort())
  })

  /** A pack's roles against the table: its column in its order — or, for a country listed under `ulkeyeOzel`, the column with that country's differences. */
  const tabloylaAyni = (kod: string, sutun: 'en' | 'uz', roller: readonly string[]) => {
    const beklenen = tablodakiRoller(TABLO, kod, sutun)
    if (!TABLO.ulkeyeOzel?.[kod]) assert.deepEqual([...roller], beklenen, kod)
    else assert.deepEqual([...roller].sort(), [...beklenen].sort(), kod)
  }

  it('uz: exactly the Uzbek pack\'s roles — the 40 of its column in the pack\'s order, with whatever the table lists as Uzbekistan\'s own', () => {
    tabloylaAyni('uz', 'uz', TUM_ULKELER.uz.paket.uygulama?.roller ?? [])
  })

  it('every English-speaking pack on the branch uses the shared key set — with exactly the differences the table lists for it, and no other', () => {
    for (const kod of ULKE_KODLARI) {
      const p = TUM_ULKELER[kod].paket
      if (!p.diller.some((d) => d.startsWith('en-'))) continue
      tabloylaAyni(kod, 'en', p.uygulama?.roller ?? [])
      // a country the table does not list has the shared forty themselves
      if (!TABLO.ulkeyeOzel?.[kod]) assert.deepEqual([...(p.uygulama?.roller ?? [])], [...EN_ROLLER], kod)
    }
  })

  it('a country\'s own roles (`ulkeyeOzel`): well-formed; only a country of the product or the kit\'s test country; never the Turkish product', () => {
    for (const kod of Object.keys(TABLO.ulkeyeOzel ?? {})) {
      assert.ok(kod === 'xx' || (ULKE_KODLARI as readonly string[]).includes(kod), `"${kod}" is no country`)
      assert.notEqual(kod, 'tr', 'the Turkish product\'s roles are its own lists: they are read from its source, not from this section')
      assert.deepEqual(rolFarkiSorunlari(TABLO, kod), [], kod)
    }
    // TODAY NO REAL COUNTRY DIFFERS FROM ITS COLUMN: the one entry is the test country, which is in no build.
    assert.deepEqual(Object.keys(TABLO.ulkeyeOzel ?? {}), ['ca', 'gb', 'us', 'xx'])
  })

  it('the table is data beside the packs: no application code, no pack and no language set reads it', () => {
    const tarama = (dizin: string, cikti: string[] = []): string[] => {
      for (const ad of require('node:fs').readdirSync(dizin) as string[]) {
        if (['node_modules', '.next', '.git', '.claude', 'docs', 'backups', 'public'].includes(ad)) continue
        const yol = join(dizin, ad)
        if ((require('node:fs').statSync(yol) as { isDirectory(): boolean }).isDirectory()) tarama(yol, cikti)
        else if (/\.(ts|tsx|mjs|js|cjs|mts)$/.test(ad) && readFileSync(yol, 'utf8').includes('rol-eslemesi')) cikti.push(yol.slice(KOK.length + 1))
      }
      return cikti
    }
    const okuyanlar = tarama(KOK)
    // Tests, scripts and the tests' own helpers (lib/ulke/testing/) read it. Any other file may only NAME it in a comment.
    for (const f of okuyanlar) {
      if (/\.test\.tsx?$/.test(f) || f.startsWith('scripts/') || f.startsWith('lib/ulke/testing/')) continue
      assert.doesNotMatch(readFileSync(join(KOK, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1'), /rol-eslemesi/, `${f} reads the table`)
    }
    // the language set and the Uzbek pack only NAME the file, in a comment
    for (const f of ['countries/_dil/en/klinik/roller.ts', 'countries/uz/klinik/branslar.ts']) assert.ok(okuyanlar.includes(f), f)
  })
})
