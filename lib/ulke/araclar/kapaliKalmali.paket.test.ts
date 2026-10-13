/**
 * NOTYA-ULKE-ARAC-DUZELTME-01 — TOOLS THAT MUST STAY OFF, for whichever pack is active (run once per country folder).
 * Names no country.
 *
 * countries/kapali-kalmali-araclar.json lists the tools of the kit whose known fault could not be corrected because
 * its primary source could not be opened. Held here, for the ACTIVE pack:
 *
 *   - no listed tool is switched on — unless the country had it on when it was listed and is named for it under
 *     `acikKalan` (this job may not switch a tool off in any country; the owner does);
 *   - `acikKalan` can only shrink: a key that stands there for this country while the tool is no longer on fails;
 *   - the list itself is well-formed: every listed key is a tool of the kit, and says what is wrong, which source is
 *     needed and when it was listed.
 *
 * The list is EMPTY today (every source the corrections needed was opened); the test is what keeps the next entry honest.
 * The pre-split application (Türkiye) has no tools area in a pack: there is nothing to check for it.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { kitAraci } from './katalog'
import type { UlkeAraclari } from './tipler'
import type { UlkePaketi } from '../tipler'

const KOK = resolve(__dirname, '../../..')
type Liste = { aciklama: string; araclar: Record<string, { hata: string; kaynak: string; tarih: string }>; acikKalan: Record<string, string[]> }
const LISTE = JSON.parse(readFileSync(join(KOK, 'countries/kapali-kalmali-araclar.json'), 'utf8')) as Liste

/** What the rule answers for one pack: the listed tools it has on without being named for them, and the names that no longer hold. */
export function kapaliKalmaliSorunlari(liste: Pick<Liste, 'araclar' | 'acikKalan'>, kod: string, acik: readonly string[]): string[] {
  const izinli = liste.acikKalan[kod] ?? []
  return [
    ...acik.filter((k) => k in liste.araclar && !izinli.includes(k)).map((k) => `"${k}" is on the list of tools that must stay off and is switched on in "${kod}"`),
    ...izinli.filter((k) => !acik.includes(k)).map((k) => `"${k}" is named as still on in "${kod}" and is not: remove it from acikKalan (the list only shrinks)`),
    ...izinli.filter((k) => !(k in liste.araclar)).map((k) => `"${k}" is named as still on in "${kod}" and is not on the list at all`),
  ]
}

let paket: UlkePaketi
let a: UlkeAraclari | null = null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  a = paket.ozellikler.araclar && arayuz?.araclar ? arayuz.araclar : null
})

describe('tools that must stay off (countries/kapali-kalmali-araclar.json)', () => {
  it('the list is well-formed: every key is a tool of the kit and says what is wrong, which source is needed, and when', () => {
    assert.ok(LISTE.aciklama.length > 100)
    for (const [k, v] of Object.entries(LISTE.araclar)) {
      assert.ok(kitAraci(k), `"${k}" is not a tool of the kit`)
      assert.ok(v.hata?.trim() && v.kaynak?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(v.tarih ?? ''), `"${k}": hata, kaynak and tarih (YYYY-MM-DD)`)
    }
    for (const [kod, anahtarlar] of Object.entries(LISTE.acikKalan)) { assert.match(kod, /^[a-z]{2}$/); assert.ok(Array.isArray(anahtarlar) && new Set(anahtarlar).size === anahtarlar.length, kod) }
  })

  it('THE ACTIVE PACK switches on no listed tool (but one it is named for), and is named for none it no longer has on', () => {
    const acik = (a?.araclar ?? []).map((p) => p.anahtar)
    assert.deepEqual(kapaliKalmaliSorunlari(LISTE, paket.kod, acik), [])
  })

  it('the rule is not blind: a listed tool that is on is named; a country named for it is let through; a name that no longer holds is refused', () => {
    const liste = { araclar: { 'doz-hesabi': { hata: 'x', kaynak: 'y', tarih: '2026-10-10' } }, acikKalan: { aa: ['doz-hesabi'] } }
    assert.deepEqual(kapaliKalmaliSorunlari(liste, 'bb', ['pasi']), [])
    assert.match(kapaliKalmaliSorunlari(liste, 'bb', ['pasi', 'doz-hesabi'])[0], /"doz-hesabi" is on the list of tools that must stay off and is switched on in "bb"/)
    assert.deepEqual(kapaliKalmaliSorunlari(liste, 'aa', ['pasi', 'doz-hesabi']), [])
    assert.match(kapaliKalmaliSorunlari(liste, 'aa', ['pasi'])[0], /named as still on in "aa" and is not/)
    assert.match(kapaliKalmaliSorunlari({ araclar: {}, acikKalan: { aa: ['pasi'] } }, 'aa', ['pasi'])[0], /is not on the list at all/)
  })
})
