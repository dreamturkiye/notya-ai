/**
 * NOTYA-AYSE-ANALIZ-01 — the per-patient Fısıltı reader must call the SAME function the branch's kohort route calls
 * (the route Fısıltı fetches), and may import only engine files that do not write.
 *
 * This reads the sources of all 30 branches:
 *   • a registered branch: its route calls the registered function, the function takes one patient list, and the
 *     date it is given is the one the route passes;
 *   • the registry is EXACTLY the branches whose `_kohort.ts` has no write. A branch whose engine file writes (it
 *     shares the file with the reminder sender) may not be registered — the model turn would reach a write path
 *     (NOTYA-EYLEM-24). A branch whose sender is moved out must be registered — the tool then stops saying "not
 *     connected" for it.
 * The behavioural check (tool output = what GET /api/doktor/fisilti reports) is lib/asistan/analizKabul.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { BRANS_KOHORTLARI } from './fisiltiHasta'
import { bransKohortRotasi, FISILTI_DESTEKLI_BRANSLAR } from './fisiltiOrtak'

const oku = (yol: string) => readFileSync(new URL(`../../${yol}`, import.meta.url), 'utf8')
const TRT = /Date\.now\(\) \+ 3 \* 3600e3/
const YAZMA = /\.(insert|update|upsert|delete)\(/
const motor = (brans: string) => oku(`app/api/doktor/${bransKohortRotasi(brans)}/_kohort.ts`)

describe('Fısıltı — tek hasta için aynı kohort fonksiyonu', () => {
  it('kayıtlı branşlar: motor dosyası yazma içermeyen branşların TAMAMI, başkası değil', () => {
    const yazmayan = [...FISILTI_DESTEKLI_BRANSLAR].filter((b) => !YAZMA.test(motor(b))).sort()
    assert.deepEqual(Object.keys(BRANS_KOHORTLARI).sort(), yazmayan)
    assert.deepEqual(yazmayan, ['dahiliye', 'dermatoloji', 'goz-hastaliklari', 'kadin-hastaliklari-dogum', 'pediatri'])
    assert.equal(FISILTI_DESTEKLI_BRANSLAR.size, 30)
  })

  for (const [brans, kayit] of Object.entries(BRANS_KOHORTLARI)) {
    it(`${brans}: kohort rotası ${kayit.ad}(…) çağırıyor, fonksiyon tek hasta listesi alıyor, tarih rotadakiyle aynı`, () => {
      const rota = bransKohortRotasi(brans)
      const rotaKaynak = oku(`app/api/doktor/${rota}/kohort/route.ts`)
      assert.ok(new RegExp(`await ${kayit.ad}\\(`).test(rotaKaynak), `rota ${kayit.ad} çağırmıyor`)
      assert.ok(new RegExp(`export async function ${kayit.ad}\\([^)]*sadece\\?: string\\[\\]`).test(motor(brans)), `${kayit.ad} tek hasta listesi (sadece) almıyor`)
      // Which clock the route reads: its own source, or the branch helper it imports its date function from.
      const ortak = existsSync(new URL(`../../app/api/doktor/${rota}/_ortak.ts`, import.meta.url)) ? oku(`app/api/doktor/${rota}/_ortak.ts`) : ''
      const rotaTrt = TRT.test(rotaKaynak) || (/bugunTr/.test(rotaKaynak) && TRT.test(ortak))
      assert.equal(Boolean(kayit.trt), rotaTrt, 'tarih saati (Türkiye / UTC) rotadakiyle aynı değil')
    })
  }
})
