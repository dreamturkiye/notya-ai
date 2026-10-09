/**
 * NOTYA-ULKE-KLINIK-01 — the mutation checks of clinic accounts (scripts/ulke-klinik-mutasyon.mjs) cannot rot.
 *
 * That script takes one check at a time out of the server code and expects lib/ulke/klinikHesabi/klinik.paket.test.ts
 * to fail. It finds each check by its text. This test holds every one of those texts to the source: if a check is
 * renamed, reformatted or removed, the suite fails here and says which mutant lost its target — instead of the
 * script quietly testing nothing. It also keeps the list from shrinking below what the job promised: the grant
 * check, the record, the front desk's answers, and the country.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const KOK = resolve(__dirname, '../../..')
type Mutant = [string, [string, string, string][]]

describe('clinic accounts — the mutation script still aims at code that exists', () => {
  it('every mutant finds each of its targets exactly once, changes it, and names a file of the clinic code or of the country door', async () => {
    const M = (await import(pathToFileURL(join(KOK, 'scripts/ulke-klinik-mutasyon.mjs')).href)) as { MUTANTLAR: Mutant[]; uygula: (d: Mutant[1]) => Map<string, string> }
    assert.ok(M.MUTANTLAR.length >= 30)
    assert.equal(new Set(M.MUTANTLAR.map(([ad]) => ad)).size, M.MUTANTLAR.length, 'two mutants share a name')
    for (const [ad, degisiklikler] of M.MUTANTLAR) {
      assert.doesNotThrow(() => M.uygula(degisiklikler), `${ad}: a target is no longer in the source`)
      for (const [dosya, bul, koy] of degisiklikler) {
        assert.notEqual(bul, koy, ad)
        assert.match(dosya, /^lib\/ulke\/(klinikHesabi\/(yetki|klinik|onBuro|paylasim)|uygulama\/tablolar|sunucuOturum)\.ts$/, ad)
      }
    }
    const adlar = M.MUTANTLAR.map(([ad]) => ad).join('\n')
    for (const konu of [/^grant check:/m, /^record:/m, /^front desk:/m, /^country:/m, /^share \/ cover:/m]) assert.match(adlar, konu, 'a whole group of mutants is gone')
    assert.ok(M.MUTANTLAR.filter(([ad]) => ad.startsWith('grant check:')).length >= 12)
  })
})
