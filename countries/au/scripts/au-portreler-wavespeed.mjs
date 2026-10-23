#!/usr/bin/env node
/**
 * AU-PORTRE-02 — generate the 44 Australian persona portraits with WaveSpeed (AI-generated FICTIONAL people).
 *   WAVESPEED_API_KEY=... node countries/au/scripts/au-portreler-wavespeed.mjs [--only <slug>] [--dry-run] [--model <id>] [--size 2048*2048] [--force]
 * Flow per persona: submit prompt -> poll -> download -> ./portre-ham/<slug>.png -> WebP 1024x1024 <=120 KB in public/portreler/au/
 * -> slug added to AU_PORTRE_URETILDI in countries/au/klinik/portreler.ts. Resume-safe: finished slugs are skipped (--force redoes them).
 * Needs `sharp` (npm i --no-save sharp). The key is read from the environment only and is never printed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_MODEL, DEFAULT_SIZE, buildRequest, submitTask, pollTask, downloadImage, mapLimit, uretildiGuncelle } from '../../../scripts/lib/wavespeed-portre.mjs'

const args = process.argv.slice(2)
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }
const dry = args.includes('--dry-run'), force = args.includes('--force')
const only = val('--only'), model = val('--model') || DEFAULT_MODEL, size = val('--size') || DEFAULT_SIZE

let manifest
try { manifest = await import('../klinik/portreler.ts') } catch {
  if (process.env.PORTRE_TSX_CHILD) { console.error('cannot load portreler.ts (run: npx tsx countries/au/scripts/au-portreler-wavespeed.mjs ...)'); process.exit(1) }
  const r = spawnSync('npx', ['--yes', 'tsx', process.argv[1], ...args], { stdio: 'inherit', env: { ...process.env, PORTRE_TSX_CHILD: '1' } })
  process.exit(r.status ?? 1)
}
const { AU_PORTRE_MANIFESTI, PORTRE_BOYUT, PORTRE_AZAMI_BAYT } = manifest
const listFile = join(process.cwd(), 'countries/au/klinik/portreler.ts')
const ham = join(process.cwd(), 'portre-ham'), pub = join(process.cwd(), 'public/portreler/au')
let todo = Object.values(AU_PORTRE_MANIFESTI)
if (only) { todo = todo.filter((g) => g.rol === only); if (!todo.length) { console.error(`unknown slug: ${only}`); process.exit(2) } }

if (dry) {
  for (const g of todo) console.log(JSON.stringify({ slug: g.rol, ...buildRequest(g, { model, size }) }, null, 2))
  console.log(`\n(dry run) ${todo.length} request(s), no network, no key needed.`)
  process.exit(0)
}
const key = process.env.WAVESPEED_API_KEY?.trim()
if (!key) { console.error('WAVESPEED_API_KEY is not set in the environment.'); process.exit(2) }
const { default: sharp } = await import('sharp').catch(() => { console.error('sharp missing: run `npm i --no-save sharp`'); process.exit(2) })
mkdirSync(ham, { recursive: true }); mkdirSync(pub, { recursive: true })

const done = (g) => existsSync(join(pub, g.dosya)) && statSync(join(pub, g.dosya)).size <= PORTRE_AZAMI_BAYT
const toGen = todo.filter((g) => force || !(done(g) || existsSync(join(ham, `${g.rol}.png`))))
console.log(`${todo.length} persona(s); ${todo.length - toGen.length} already generated; generating ${toGen.length} with ${model} (${toGen.length} image(s) billed).`)

const res = await mapLimit(toGen, 3, async (g) => {
  const id = await submitTask(buildRequest(g, { model, size }), key)
  const url = await pollTask(id, key)
  writeFileSync(join(ham, `${g.rol}.png`), await downloadImage(url))
  console.log(`generated ${g.rol}`)
})
for (const r of res.filter((x) => !x.ok)) console.error(`FAILED ${r.item.rol}: ${r.error}`)

const ok = []
for (const g of todo) {
  const src = join(ham, `${g.rol}.png`)
  if (!existsSync(src)) continue
  if (force || !done(g)) {
    let q = 82, buf
    do { buf = await sharp(src).resize(PORTRE_BOYUT, PORTRE_BOYUT, { fit: 'cover', position: 'top' }).webp({ quality: q }).toBuffer(); q -= 6 } while (buf.length > PORTRE_AZAMI_BAYT && q > 30)
    writeFileSync(join(pub, g.dosya), buf)
  }
  ok.push(g.rol)
}
writeFileSync(listFile, uretildiGuncelle(readFileSync(listFile, 'utf8'), ok))
console.log(`\nAU_PORTRE_URETILDI updated in countries/au/klinik/portreler.ts: ${ok.length} slug(s) listed.`)
console.log(`Failed: ${res.filter((x) => !x.ok).length}. Re-run the same command to retry only the failed ones.`)
console.log('Next: git add public/portreler/au countries/au/klinik/portreler.ts && git commit -m "feat(au): persona portraits" && git push origin HEAD:release/au')
process.exit(res.some((x) => !x.ok) ? 1 : 0)
