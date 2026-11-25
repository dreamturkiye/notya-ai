/**
 * AKKS watched-file manifest (core/akks/izleme.ts).
 *
 *   npx tsx scripts/akks/izle.mts --denetle          exit 1 when a watched file changed since the last acknowledgement
 *   npx tsx scripts/akks/izle.mts --yaz "<reason>"   re-stamp core/akks/izlenen.json and append the line to
 *                                                     docs/AKKS-KAPI-KAYDI.md (the change still has to pass the gate run
 *                                                     the nightly cron starts after deploy — see docs/AKKS.md "Gate")
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { manifestFarki, manifestOzeti, type IzlenenManifest } from '../../core/akks/izleme'
import { simdikiDosyalar as dosyalar } from '../../lib/akks/izlemeDosyalari'

const KOK = path.resolve(new URL('.', import.meta.url).pathname, '..', '..')
const MANIFEST = path.join(KOK, 'core', 'akks', 'izlenen.json')
const KAYIT = path.join(KOK, 'docs', 'AKKS-KAPI-KAYDI.md')

const arg = process.argv
if (arg.includes('--denetle')) {
  const kayitli = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as IzlenenManifest
  const f = manifestFarki(kayitli.dosyalar, dosyalar(KOK))
  const n = f.degisen.length + f.eklenen.length + f.silinen.length
  if (n) { console.error(`AKKS: ${n} watched file(s) changed: ${[...f.degisen, ...f.eklenen, ...f.silinen].join(', ')}`); process.exit(1) }
  console.log(`AKKS manifest up to date (${kayitli.ozet})`)
} else if (arg.includes('--yaz')) {
  const neden = arg[arg.indexOf('--yaz') + 1]
  if (!neden || neden.startsWith('--')) { console.error('--yaz "<what changed>" is required'); process.exit(2) }
  const yeni = dosyalar(KOK)
  const ozet = manifestOzeti(yeni)
  const m: IzlenenManifest = { dosyalar: yeni, ozet, guncelleme: new Date().toISOString().slice(0, 10), not: neden.slice(0, 300) }
  fs.writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`)
  let taban = ''
  try { taban = execSync('git rev-parse --short HEAD', { cwd: KOK }).toString().trim() } catch { /* not a git checkout */ }
  if (!fs.existsSync(KAYIT)) fs.writeFileSync(KAYIT, '# AKKS gate log\n\nEvery acknowledged change to an AKKS-watched file (core/akks/izleme.ts). The nightly AKKS cron runs the tracking set as a gate run for each new manifest hash after deploy; the result is on /kurucu/ayse-kalite.\n\n')
  fs.appendFileSync(KAYIT, `- ${m.guncelleme} · manifest ${ozet} · base ${taban || '—'} · ${m.not}\n`)
  console.log(`AKKS manifest written: ${ozet}`)
} else {
  console.error('usage: --denetle | --yaz "<reason>"')
  process.exit(2)
}
