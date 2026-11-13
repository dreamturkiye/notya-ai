/**
 * PREMATUR-ULKE-01 (2026-11-13) — Uzbekistan: what is specific to this pack's prematurity module. The module's generic checks (routes, doctor
 * isolation, country keys, empty state, the protocol rule, the roles) run for every pack in lib/ulke/prematur/prematur.paket.test.ts.
 *
 *   - the three tiles are on, and are given to paediatrics (the baby's plan and list) and to obstetrics and gynaecology (the early-birth record) only;
 *   - NO NATIONAL SOURCE WAS READ: every item is "follow your local protocol", no criterion, no date, no threshold and no source is stated;
 *   - NO RUSSIAN TEXT WAS WRITTEN: the Russian form shows the Uzbek Latin text word for word, and this is said, not hidden. When a Russian
 *     text is written this test is changed in the same change (docs/OPEN-COMMITMENTS.md, PREMATUR-ULKE-01).
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_ARACLAR } from './index'
import { UZ_PREMATUR } from './prematur'
import { UZ_PREMATUR_AGACI } from '../prematurMetinleri'

describe('Uzbekistan — the prematurity module', () => {
  it('the three tiles are on, and only paediatrics and obstetrics-gynaecology are given them', () => {
    const roller = (k: string) => UZ_ARACLAR.araclar.find((a) => a.anahtar === k)?.roller
    assert.deepEqual(roller('prematur-takip'), ['pediatri'])
    assert.deepEqual(roller('prematur-kohort'), ['pediatri'])
    assert.deepEqual(roller('erken-dogum'), ['kadin-hastaliklari-dogum'])
    assert.deepEqual(UZ_ARACLAR.prematur?.roller, { bebek: ['pediatri'], gebelik: ['kadin-hastaliklari-dogum'] })
  })

  it('no source was read: every item is "follow your local protocol", and no criterion, date, threshold or source is stated', () => {
    for (const k of UZ_PREMATUR.protokol.kurallar) {
      assert.equal(k.yerel, true, k.kod)
      assert.equal(k.kriter, null, k.kod)
      assert.deepEqual(k.zamanlamalar, [], k.kod)
      assert.deepEqual(k.kaynaklar, [], k.kod)
    }
    const e = UZ_PREMATUR.erkenDogum
    assert.equal(e.serviks, null)
    assert.equal(e.steroid, null)
    assert.deepEqual(e.kaynaklar, [])
  })

  it('the Russian form is the Uzbek Latin text (nothing was written in Russian), the Cyrillic form is a text of its own', () => {
    const lat = UZ_PREMATUR.metinler['uz-Latn']
    const kir = UZ_PREMATUR.metinler['uz-Cyrl']
    const rus = UZ_PREMATUR.metinler.ru
    assert.ok(lat && kir && rus)
    assert.deepEqual(rus, lat)
    assert.notDeepEqual(kir, lat)
    assert.equal(UZ_PREMATUR_AGACI.bebek.baslik['uz-Cyrl'], 'Муддатидан олдин туғилган чақалоқни кузатиш режаси')
    assert.match(kir!.gebelik.gerekce.yerel, /[Ѐ-ӿ]/)
    assert.doesNotMatch(kir!.bebek.baslik, /[A-Za-z]/)
  })
})
