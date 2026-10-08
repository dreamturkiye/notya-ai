#!/usr/bin/env node
/**
 * NOTYA-ULKE-01 — ratchet against new mixing of Turkish text into shared code.
 *
 *   node scripts/ulke-turkce-tavan.mjs            count, compare with the recorded ceiling, exit 1 when above it
 *   node scripts/ulke-turkce-tavan.mjs --yaz      record a LOWER count as the new ceiling (refuses to raise it)
 *   node scripts/ulke-turkce-tavan.mjs --liste    also print the files
 *
 * What is counted: git-tracked source files (.ts .tsx .mts .js .jsx .mjs) OUTSIDE countries/tr that carry Turkish text
 * a person could see — a string literal, a template string or JSX text containing one of the letters ç ğ ı ö ş ü İ
 * (either case). Comments and identifiers are not counted. Test files, scripts and docs are not shipped and are not
 * counted.
 *
 * THIS IS A PROXY, not a language detector: those letters are how Turkish text is recognised. It misses Turkish written
 * without them ("Tetkik", "Hasta") and would count another language that shares a letter (Azerbaijani will) — when a
 * country with such a language is added, give this script that country's folder to skip as well.
 *
 * The ceiling may only go down. New Turkish text belongs in countries/tr (docs/COUNTRY-PACK-SPLIT-PLAN.md).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const KOK = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'))
const TAVAN_DOSYASI = join(KOK, 'countries', 'turkce-tavan.json')
const ts = createRequire(import.meta.url)('typescript')

const HARF = /[çğıöşüİÇĞÖŞÜ]/
const UZANTI = /\.(ts|tsx|mts|js|jsx|mjs)$/
/** Not counted: Türkiye's own pack, and files that never reach a user. */
const HARIC = /^(countries\/tr\/|scripts\/|docs\/|backups\/|public\/|memory\/|node_modules\/)|(^|\/)(tests?|testing|__tests__)\/|\.test\.(ts|tsx|mts)$|\.kos\.ts$|\.d\.ts$/

function izlenenDosyalar() {
  const cikti = execFileSync('git', ['ls-files', '-z'], { cwd: KOK, maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
  return cikti.split('\0').filter((d) => d && UZANTI.test(d) && !HARIC.test(d)).sort()
}

/** true = a string literal, template string or JSX text in this file carries a Turkish letter. */
function gorunurTurkceVar(yol, kaynak) {
  if (!HARF.test(kaynak)) return false
  const tur = /\.(tsx|jsx)$/.test(yol) ? ts.ScriptKind.TSX : /\.(js|mjs)$/.test(yol) ? ts.ScriptKind.JS : ts.ScriptKind.TS
  const sf = ts.createSourceFile(yol, kaynak, ts.ScriptTarget.Latest, false, tur)
  let bulundu = false
  const gez = (dugum) => {
    if (bulundu) return
    switch (dugum.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TemplateHead:
      case ts.SyntaxKind.TemplateMiddle:
      case ts.SyntaxKind.TemplateTail:
      case ts.SyntaxKind.JsxText:
        if (HARF.test(dugum.text ?? '')) bulundu = true
        return
      default:
        ts.forEachChild(dugum, gez)
    }
  }
  gez(sf)
  return bulundu
}

export function turkceSay() {
  const dosyalar = izlenenDosyalar()
  const gorunur = []
  let herhangi = 0
  for (const d of dosyalar) {
    const kaynak = readFileSync(join(KOK, d), 'utf8')
    if (HARF.test(kaynak)) herhangi++
    if (gorunurTurkceVar(d, kaynak)) gorunur.push(d)
  }
  return { taranan: dosyalar.length, gorunur, herhangi }
}

export function tavanOku() {
  return JSON.parse(readFileSync(TAVAN_DOSYASI, 'utf8'))
}

const dogrudan = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (dogrudan) {
  const argv = process.argv.slice(2)
  const { taranan, gorunur, herhangi } = turkceSay()
  let kayit = null
  try { kayit = tavanOku() } catch { /* first run */ }
  console.log(`[ulke-turkce-tavan] ${gorunur.length} of ${taranan} source files outside countries/tr carry user-visible Turkish text`)
  console.log('  (proxy: a string, template or JSX text containing ç ğ ı ö ş ü İ — not a language detector; comments and identifiers ignored)')
  console.log(`  for reference, ${herhangi} files contain one of those letters anywhere, comments included`)
  if (argv.includes('--liste')) for (const d of gorunur) console.log(`  ${d}`)
  if (argv.includes('--yaz')) {
    if (kayit && gorunur.length > kayit.tavan) {
      console.error(`  refusing to RAISE the ceiling (${kayit.tavan} → ${gorunur.length}). Move the new Turkish text into countries/tr.`)
      process.exit(1)
    }
    const yeni = {
      aciklama: 'Ceiling for source files outside countries/tr that carry user-visible Turkish text (letters ç ğ ı ö ş ü İ in a string, template or JSX text — a proxy). May only go down. scripts/ulke-turkce-tavan.mjs',
      tavan: gorunur.length,
      taranan,
      harfIcerenHerhangi: herhangi,
      kayit: new Date().toISOString().slice(0, 10),
    }
    writeFileSync(TAVAN_DOSYASI, JSON.stringify(yeni, null, 2) + '\n')
    console.log(`  ceiling recorded: ${yeni.tavan}`)
    process.exit(0)
  }
  if (!kayit) { console.error('  no ceiling recorded yet — run with --yaz'); process.exit(1) }
  if (gorunur.length > kayit.tavan) {
    console.error(`  ABOVE the ceiling of ${kayit.tavan}. New Turkish text belongs in countries/tr — see docs/COUNTRY-PACK-SPLIT-PLAN.md.`)
    process.exit(1)
  }
  if (gorunur.length < kayit.tavan) console.log(`  below the ceiling of ${kayit.tavan} — lower it: node scripts/ulke-turkce-tavan.mjs --yaz`)
  else console.log(`  at the ceiling of ${kayit.tavan}`)
}
