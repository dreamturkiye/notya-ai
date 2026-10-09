/**
 * NOTYA-ULKE-SABLON-01 — writes ./sekil.json: THE SHAPE of everything a country pack must say, with no text in it.
 *
 *   NOTYA_COUNTRY=<a complete pack> npx --yes tsx scripts/ulke-sablon/sekil-uret.mts            write the file
 *   NOTYA_COUNTRY=<a complete pack> npx --yes tsx scripts/ulke-sablon/sekil-uret.mts --denetle  exit 1 if the file is stale
 *
 * WHY A FILE. The keys a pack must fill are TypeScript types (lib/ulke/arayuz/metinTipleri.ts, acilisTipleri.ts,
 * lib/ulke/tipler.ts → YuzeyAnahtarlari), and types do not exist when the scaffold (scripts/ulke-yeni.mjs) runs. So
 * the shape is read ONCE from a pack that already satisfies those types and stored here as key paths only:
 *
 *   "$m"            a text to supply                       "$m:%,%1"   …that carries these placeholders
 *   {"$sabit": x}   copied as it is (a number in a badge, an enum of the layout, an id) — language-neutral
 *   {"$capa": k}    the anchor of the landing section k (the pack's own word, said once in `capalar`)
 *   {"$dil": kind}  a record with one entry per language of the NEW country (kind says which list)
 *   {"$istege": c}  a key that is required only under the condition c; written as a comment by the scaffold
 *
 * NO TEXT OF ANY COUNTRY IS COPIED: every sentence becomes "$m". lib/ulke/paket.paket.test.ts compares this file
 * with every complete pack on each test run, so a key added to the kit cannot be forgotten here.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AKTIF_PAKET } from '@/countries/active'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { iskelet, paketSekli } from '@/lib/ulke/testing/paketSekli'

const BURASI = dirname(fileURLToPath(import.meta.url))
const SEKIL_DOSYASI = join(BURASI, 'sekil.json')

const dogrudan = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (dogrudan) {
  const yeni = JSON.stringify(paketSekli(AKTIF_PAKET, AKTIF_ARAYUZ), null, 1) + '\n'
  if (process.argv.includes('--denetle')) {
    const eski = JSON.parse(readFileSync(SEKIL_DOSYASI, 'utf8'))
    const ayni = JSON.stringify(iskelet({ ...eski, _: 0 })) === JSON.stringify(iskelet({ ...JSON.parse(yeni), _: 0 }))
    console.log(ayni ? `[sekil] up to date with "${AKTIF_PAKET.kod}"` : `[sekil] STALE against "${AKTIF_PAKET.kod}": run scripts/ulke-sablon/sekil-uret.mts`)
    process.exit(ayni ? 0 : 1)
  }
  writeFileSync(SEKIL_DOSYASI, yeni)
  const say = (x: unknown): number => (typeof x === 'string' ? (x.startsWith('$m') ? 1 : 0) : Array.isArray(x) ? x.reduce((n: number, y) => n + say(y), 0) : x && typeof x === 'object' ? Object.values(x).reduce((n: number, y) => n + say(y), 0) : 0)
  const s = JSON.parse(yeni)
  console.log(`[sekil] written from "${AKTIF_PAKET.kod}": core surfaces ${Object.values(s.cekirdek as Record<string, string[]>).reduce((n, l) => n + l.length, 0)} texts, application ${say(s.uygulama)}, appointments ${say(s.randevu)}, landing ${say(s.acilis)} (per language form)`)
}
