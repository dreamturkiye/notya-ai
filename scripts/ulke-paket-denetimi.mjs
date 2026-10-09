#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — "TO BE SUPPLIED" SCAN, before a country is built.
 *
 * WHERE IT RUNS: from the country's own build file, countries/<code>/derleme.mjs, which calls `paketTamOlmali('<code>')`.
 * next.config.mjs loads that file ONLY for the country being built, so a build with no NOTYA_COUNTRY (Türkiye) never
 * runs this and `prebuild` in package.json does not mention it. By hand:
 *
 *   node scripts/ulke-paket-denetimi.mjs [--ulke <code>] [--kok <dir>] [--ozet]
 *
 * A new country's folder is written by scripts/ulke-yeni.mjs with every piece of content as `eksik('…')` and every
 * undecided setting as `eksikAyar('…')` (lib/ulke/eksik.ts). This script reads the files of the country being built
 * (NOTYA_COUNTRY, or --ulke) and stops the build while any of them is left, printing EXACTLY WHAT IS MISSING:
 * file, line, and the hint that says what belongs there. Nothing is compiled first, so the list arrives in a second.
 *
 * It reads text only (no TypeScript is loaded). What cannot be seen in text — a setting at odds with another, a
 * catalogue entry that was deleted — is caught by the type check and by the pack check when the country's root
 * layout loads (lib/ulke/paketDenetimi.ts).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const al = (ad) => (argv.includes(ad) ? argv[argv.indexOf(ad) + 1] : null)
const KOK = resolve(al('--kok') || join(dirname(fileURLToPath(import.meta.url)), '..'))

/** Every marker left in one country's folder: { dosya, satir, ipucu }. */
export function eksikleriBul(kod, kok = KOK) {
  const dizin = join(kok, 'countries', kod)
  if (!existsSync(dizin)) throw new Error(`countries/${kod}/ does not exist`)
  const bulunan = []
  const gez = (d) => {
    for (const ad of readdirSync(d).sort()) {
      const yol = join(d, ad)
      if (statSync(yol).isDirectory()) { gez(yol); continue }
      if (!/\.(ts|tsx|mjs)$/.test(ad) || /\.test\.tsx?$/.test(ad)) continue
      readFileSync(yol, 'utf8').split('\n').forEach((satir, i) => {
        // The definition's own file is not content; a pack only CALLS these.
        for (const m of satir.matchAll(/\beksik(Ayar)?(?:<[^>]*>)?\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g)) bulunan.push({ dosya: relative(kok, yol).split(sep).join('/'), satir: i + 1, tur: m[1] ? 'setting' : 'text', ipucu: m[3] })
        if (/⟦SUPPLY⟧/.test(satir) && !/\beksik(Ayar)?\(/.test(satir)) bulunan.push({ dosya: relative(kok, yol).split(sep).join('/'), satir: i + 1, tur: 'text', ipucu: satir.trim().slice(0, 100) })
      })
    }
  }
  gez(dizin)
  return bulunan
}

/** The list as a message: a count per file, then every place with its hint. */
export function eksikListesi(kod, eksikler, ozet = false) {
  const dosyaBasina = new Map()
  for (const e of eksikler) dosyaBasina.set(e.dosya, (dosyaBasina.get(e.dosya) ?? 0) + 1)
  const satirlar = [`[ulke-paket-denetimi] Country pack "${kod}" cannot be built: ${eksikler.length} item(s) are still to be supplied.`, '']
  for (const [dosya, n] of dosyaBasina) satirlar.push(`  ${String(n).padStart(4)}  ${dosya}`)
  if (!ozet) { satirlar.push(''); for (const e of eksikler) satirlar.push(`  ${e.dosya}:${e.satir}  [${e.tur}]  ${e.ipucu}`) }
  satirlar.push('', `Replace each eksik('…') with the country's own text and each eksikAyar('…') with the decided value.`)
  satirlar.push(`What each item is and who should supply it: docs/COUNTRY-PACK-HOWTO.md and docs/COUNTRY-PACK-${kod.toUpperCase()}.md.`)
  return satirlar.join('\n')
}

/**
 * Called by countries/<code>/derleme.mjs. Stops whatever loaded that file (the build of THAT country) while anything
 * in the pack is still marked, with the whole list as the message. There is no switch that lets it through.
 */
export function paketTamOlmali(kod, kok = KOK) {
  const eksikler = eksikleriBul(kod, kok)
  if (!eksikler.length) return
  const mesaj = eksikListesi(kod, eksikler)
  console.error(`\n${mesaj}\n`)
  const hata = new Error(`Country pack "${kod}" cannot be built: ${eksikler.length} item(s) are still to be supplied (the list is printed above).`)
  hata.stack = hata.message
  throw hata
}

const dogrudan = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (dogrudan) {
  const kod = al('--ulke') || process.env.NOTYA_COUNTRY || 'tr'
  if (!/^[a-z]{2}$/.test(kod)) { console.error(`[ulke-paket-denetimi] "${kod}" is not a country code`); process.exit(1) }
  const eksikler = eksikleriBul(kod)
  if (!eksikler.length) { console.log(`[ulke-paket-denetimi] "${kod}": nothing is marked "to be supplied"`); process.exit(0) }
  console.error(eksikListesi(kod, eksikler, argv.includes('--ozet')))
  process.exit(1)
}
