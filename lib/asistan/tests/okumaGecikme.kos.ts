/**
 * NOTYA-AYSE-ARAC-PARITE-05 — RUN the read-tool latency measurement.
 *
 *   npm run olcum:okuma-araci:kuru                      stand-in model (no key needed)
 *   OPENROUTER_API_KEY=… npm run olcum:okuma-araci      the real primary model
 *     [AYSE_OLCUM_TEKRAR=10] [AYSE_OLCUM_KANAL=yazi|ses]
 *
 * The database is the in-memory scene and every patient is synthetic: nothing is read from or written to production.
 * Output: .denetim-out/okuma-gecikme[-kuru].jsonl and .md (gitignored); a real run also writes
 * docs/denetim/<date>-okuma-gecikme.md. Not part of `npm test` — it is not a *.test.ts file.
 */
import { gercekModelAc, sahneHazirla } from './ayseSahne'
import { it } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { gecikmeOzeti, gecikmeRaporu, okumaGecikmesiniOlc, vekilOkuma, type Kanal } from './okumaGecikme'
import { MODEL_HIZLI } from '../../ai/modeller'

const KURU = process.env.AYSE_OLCUM_KURU === '1'
const TEKRAR = Math.max(1, Number(process.env.AYSE_OLCUM_TEKRAR) || 10)
const KANAL = process.env.AYSE_OLCUM_KANAL as Kanal | undefined

it('Ayşe okuma aracı gecikme ölçümü', { timeout: 60 * 60_000 }, async (t) => {
  await sahneHazirla()
  if (!gercekModelAc(KURU ? vekilOkuma : undefined)) {
    console.log('ÖLÇÜM KOŞMADI: OPENROUTER_API_KEY yok. (NOT RUN — no credentials here; use olcum:okuma-araci:kuru for the stand-in.)')
    t.skip('OPENROUTER_API_KEY yok')
    return
  }
  const satirlar = await okumaGecikmesiniOlc({ tekrar: TEKRAR, ...(KANAL ? { kanallar: [KANAL] } : {}) })
  const cikti = path.join(process.cwd(), '.denetim-out')
  fs.mkdirSync(cikti, { recursive: true })
  const ad = `okuma-gecikme${KURU ? '-kuru' : ''}`
  fs.writeFileSync(path.join(cikti, `${ad}.jsonl`), satirlar.map((s) => JSON.stringify(s)).join('\n') + '\n')
  const tarih = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const rapor = gecikmeRaporu({ tarih, model: KURU ? 'vekil (stand-in)' : (process.env.NOTYA_MODEL_HIZLI || MODEL_HIZLI), vekil: KURU, tekrar: TEKRAR, satirlar })
  const hedef = KURU ? path.join(cikti, `${ad}.md`) : path.join(process.cwd(), 'docs', 'denetim', `${tarih}-okuma-gecikme.md`)
  fs.mkdirSync(path.dirname(hedef), { recursive: true })
  fs.writeFileSync(hedef, rapor)
  console.log(JSON.stringify({ hepsi: gecikmeOzeti(satirlar), yazi: gecikmeOzeti(satirlar, 'yazi'), ses: gecikmeOzeti(satirlar, 'ses') }))
  console.log(`Rapor: ${path.relative(process.cwd(), hedef)}`)
})
