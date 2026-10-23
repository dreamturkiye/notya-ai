/** AU-PORTRE-01: manifest covers all 44 personas, gender matches the name, every produced portrait exists and is within budget. */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AU_PAKETI } from '../index'
import { AU_ASISTAN_ADLARI } from './asistanAdlari'
import { AU_PORTRE_MANIFESTI, AU_PORTRE_URETILDI, PORTRE_AZAMI_BAYT, auPortreYolu } from './portreler'

const KADIN = new Set(['Olivia', 'Priya', 'Sarah', 'Grace', 'Mei', 'Hannah', 'Isabella', 'Chloe', 'Amelia', 'Fiona', 'Emily', 'Zara', 'Natalie', 'Sophie', 'Laura', 'Margaret', 'Anika', 'Victoria', 'Emma', 'Ruby', 'Jasmine', 'Rebecca'])
const ERKEK = new Set(['James', 'Marcus', 'David', 'Andrew', 'Nathan', 'Callum', 'Rajesh', 'Simon', 'Benjamin', 'Lachlan', 'Oliver', 'Ethan', 'Jack', 'Ryan', 'Henry', 'Daniel', 'Felix', 'Thomas', 'Adrian', 'Joshua', 'Connor', 'Liam'])
const roller = Object.keys(AU_ASISTAN_ADLARI)

describe('AU persona portraits', () => {
  it('the manifest covers all 44 personas, one file each', () => {
    assert.equal(roller.length, 44)
    assert.deepEqual(Object.keys(AU_PORTRE_MANIFESTI).sort(), [...roller].sort())
    assert.equal(new Set(Object.values(AU_PORTRE_MANIFESTI).map((g) => g.dosya)).size, 44)
  })
  it('gender of the prompt matches the given name (female / male)', () => {
    for (const rol of roller) {
      const a = AU_ASISTAN_ADLARI[rol as keyof typeof AU_ASISTAN_ADLARI]
      const g = AU_PORTRE_MANIFESTI[rol as keyof typeof AU_PORTRE_MANIFESTI]
      assert.ok(KADIN.has(a.kisaAd) || ERKEK.has(a.kisaAd), `${a.kisaAd} not in name lists`)
      assert.equal(g.cinsiyet, KADIN.has(a.kisaAd) ? 'kadin' : 'erkek', rol)
      assert.match(g.istem, g.cinsiyet === 'kadin' ? /Australian woman/ : /Australian man/, rol)
      assert.match(g.istem, /fictional/, rol)
    }
  })
  it('every produced portrait exists on disk, is WebP-named and within the size budget', () => {
    for (const rol of AU_PORTRE_URETILDI) {
      const f = join(process.cwd(), 'public/portreler/au', `${rol}.webp`)
      assert.ok(existsSync(f), `missing ${f}`)
      assert.ok(statSync(f).size <= PORTRE_AZAMI_BAYT, `${rol} over budget`)
      assert.equal(auPortreYolu(rol), `/portreler/au/${rol}.webp`)
    }
    assert.equal(auPortreYolu('no-such-role'), null)
  })
  it('every persona with a produced file resolves to an existing root-relative file under the /au-prefixed pack', () => {
    for (const rol of roller) {
      const yol = auPortreYolu(rol)
      assert.ok(yol, `no portrait for ${rol}`)
      assert.ok(existsSync(join(process.cwd(), 'public', yol as string)), `file for ${rol} missing`)
      assert.equal(AU_PAKETI.yolOnEki, '/au')
      assert.ok((yol as string).startsWith('/'), `${rol}: portrait path is root-relative, so ulkeYolu adds the /au prefix`)
    }
  })
})
