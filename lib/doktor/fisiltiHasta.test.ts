/**
 * NOTYA-AYSE-ANALIZ-01 — the per-patient Fısıltı reader must call the SAME function the branch's kohort route calls
 * (the route Fısıltı fetches). This reads the route sources: a branch whose route is rewired to another function, a
 * branch added to Fısıltı without an entry here, or a route that changes which date it passes, fails here.
 * The behavioural check (tool output = what GET /api/doktor/fisilti reports) is lib/asistan/analizKabul.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { BRANS_KOHORTLARI } from './fisiltiHasta'
import { bransKohortRotasi, FISILTI_DESTEKLI_BRANSLAR } from './fisiltiOrtak'

const oku = (yol: string) => readFileSync(new URL(`../../${yol}`, import.meta.url), 'utf8')
const TRT = /Date\.now\(\) \+ 3 \* 3600e3/

describe('Fısıltı — tek hasta için aynı kohort fonksiyonu', () => {
  it('Fısıltı’nın desteklediği her branşın bir kaydı var; fazlası yok', () => {
    assert.deepEqual(Object.keys(BRANS_KOHORTLARI).sort(), [...FISILTI_DESTEKLI_BRANSLAR].sort())
  })

  for (const [brans, kayit] of Object.entries(BRANS_KOHORTLARI)) {
    it(`${brans}: kohort rotası ${kayit.ad}(…) çağırıyor, fonksiyon tek hasta listesi alıyor, tarih rotadakiyle aynı`, () => {
      const rota = bransKohortRotasi(brans)
      const rotaKaynak = oku(`app/api/doktor/${rota}/kohort/route.ts`)
      const motor = oku(`app/api/doktor/${rota}/_kohort.ts`)
      assert.ok(new RegExp(`await ${kayit.ad}\\(`).test(rotaKaynak), `rota ${kayit.ad} çağırmıyor`)
      assert.ok(new RegExp(`export async function ${kayit.ad}\\([^)]*sadece\\?: string\\[\\]`).test(motor), `${kayit.ad} tek hasta listesi (sadece) almıyor`)
      // Which clock the route reads: its own source, or the branch helper it imports its date function from.
      const ortak = existsSync(new URL(`../../app/api/doktor/${rota}/_ortak.ts`, import.meta.url)) ? oku(`app/api/doktor/${rota}/_ortak.ts`) : ''
      const rotaTrt = TRT.test(rotaKaynak) || (/bugunTr/.test(rotaKaynak) && TRT.test(ortak))
      assert.equal(Boolean(kayit.trt), rotaTrt, 'tarih saati (Türkiye / UTC) rotadakiyle aynı değil')
    })
  }
})
