#!/usr/bin/env npx tsx
/**
 * FOTO-AI-01 — evaluation harness CLI. Scores the clinical-photo AI against a fixture set and prints a report.
 * Procedure for the clinician evaluator: docs/FOTO-AI-DEGERLENDIRME.md. This is NOT clinical validation.
 *
 *   npm run foto-ai:harness                                  scripted run of the bundled synthetic fixture (no network, no images)
 *   npm run foto-ai:harness -- --fixture benim.json --sahte  scripted run of your fixture (answers come from "yanit")
 *   npm run foto-ai:harness -- --fixture benim.json --gorsel-dizini ~/foto-set        LIVE run: real model, your images
 *       (live mode needs the app's AI environment, e.g.  npx tsx --env-file=.env.local scripts/foto-ai-harness.mts ...)
 *
 *   --json                 print the machine-readable score instead of the text report
 *   --min-duyarlilik 0.95  exit 1 when red-flag recall is below this (default: no gate; clinical thresholds are for the clinician to set)
 *   --min-sema 0.95        exit 1 when schema validity is below this
 *   --kacirilan-abstain 0  exit 1 when more than this many missed abstains occur
 *
 * Exit codes: 0 ran (and every gate that was given passed) · 1 a gate failed · 2 bad input.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { olguSetiDogrula } from '../lib/doktor/muayeneEk/foto/harness/olgu'
import { olgulariKos } from '../lib/doktor/muayeneEk/foto/harness/kos'
import { puanla, raporMetni } from '../lib/doktor/muayeneEk/foto/harness/puanla'
import { FOTO_AI_SURUMU } from '../lib/doktor/muayeneEk/foto/sema'

const args = process.argv.slice(2)
const deger = (ad: string): string | undefined => { const i = args.indexOf(`--${ad}`); return i >= 0 ? args[i + 1] : undefined }
const var_ = (ad: string): boolean => args.includes(`--${ad}`)

const varsayilan = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../lib/doktor/muayeneEk/foto/harness/ornek.fixture.json')
const fixtureYolu = path.resolve(deger('fixture') ?? varsayilan)
const gorselDizini = deger('gorsel-dizini') ? path.resolve(deger('gorsel-dizini')!) : null
const sahte = var_('sahte') || (!gorselDizini && fixtureYolu === varsayilan)

if (!sahte && !gorselDizini) {
  console.error('Canlı koşu için --gorsel-dizini gerekli (görüntüler depoda tutulmaz). Sahte model için --sahte kullanın.')
  process.exit(2)
}

let ham: unknown
try { ham = JSON.parse(fs.readFileSync(fixtureYolu, 'utf8')) } catch (e) {
  console.error(`Fixture okunamadı: ${fixtureYolu} (${(e as Error).message})`)
  process.exit(2)
}
const d = olguSetiDogrula(ham)
if (!d.set) {
  console.error('Fixture geçersiz:\n- ' + d.hatalar.join('\n- '))
  process.exit(2)
}

const sonuclar = await olgulariKos(d.set, {
  sahte,
  gorselOku: (dosya) => {
    if (!gorselDizini) return null
    const tam = path.resolve(gorselDizini, dosya)
    if (path.dirname(tam) !== gorselDizini) return null // a file name only, never a path out of the folder
    try { return fs.readFileSync(tam) } catch { return null }
  },
})
const puan = puanla(sonuclar)

if (var_('json')) console.log(JSON.stringify({ kume: d.set.ad, surum: FOTO_AI_SURUMU, kaynak: sahte ? 'scripted' : 'canli', puan }, null, 2))
else {
  console.log(raporMetni(puan, d.set.ad, { sahte, surum: FOTO_AI_SURUMU }))
  const hatali = sonuclar.filter((s) => s.durum === 'hata')
  if (hatali.length) {
    console.log('\nŞEMA/GÖRÜNTÜ HATALARI:')
    for (const s of hatali) console.log(`  - ${s.olgu.id}: ${(s.hatalar ?? []).slice(0, 2).join(' | ')}`)
  }
}

let cikis = 0
const sayi = (ad: string): number | null => { const v = deger(ad); return v === undefined ? null : Number(v) }
const minD = sayi('min-duyarlilik'), minS = sayi('min-sema'), maxK = sayi('kacirilan-abstain')
if (minD != null && (puan.bayrakDuyarlilik.oran ?? 0) < minD) { console.error(`KAPI: kırmızı bayrak duyarlılığı ${puan.bayrakDuyarlilik.oran} < ${minD}`); cikis = 1 }
if (minS != null && (puan.semaGecerliligi.oran ?? 0) < minS) { console.error(`KAPI: şema geçerliliği ${puan.semaGecerliligi.oran} < ${minS}`); cikis = 1 }
if (maxK != null && puan.abstain.kacirilanAbstain > maxK) { console.error(`KAPI: kaçırılan abstain ${puan.abstain.kacirilanAbstain} > ${maxK}`); cikis = 1 }
process.exit(cikis)
