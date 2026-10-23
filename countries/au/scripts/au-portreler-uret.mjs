#!/usr/bin/env node
/**
 * AU-PORTRE-01 — portrait pipeline for the Australian assistant personas.
 *   node countries/au/scripts/au-portreler-uret.mjs --liste            print role, name, gender and the generation prompt for each persona
 *   node countries/au/scripts/au-portreler-uret.mjs --json > m.json    same, as JSON (feed to any image generator, 1:1)
 *   node countries/au/scripts/au-portreler-uret.mjs --isle <src_dir>   convert <src_dir>/<role>.(png|jpg|jpeg|webp) to public/portreler/au/<role>.webp
 *                                                         (1024x1024 centre-top crop, WebP, <=120 KB) and print the roles to add to AU_PORTRE_URETILDI
 *   node countries/au/scripts/au-portreler-uret.mjs --durum            produced / total
 * --isle needs `sharp` (npm i --no-save sharp). Run through tsx so the TypeScript manifest loads: npx tsx countries/au/scripts/au-portreler-uret.mjs ...
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AU_PORTRE_MANIFESTI, AU_PORTRE_URETILDI, PORTRE_BOYUT, PORTRE_AZAMI_BAYT } from '../klinik/portreler.ts'

const cikti = join(process.cwd(), 'public/portreler/au')
const m = Object.values(AU_PORTRE_MANIFESTI)
const arg = process.argv[2]
if (arg === '--liste') for (const g of m) console.log(`${g.rol}\t${g.tamAd}\t${g.cinsiyet}\n  ${g.istem}\n`)
else if (arg === '--json') console.log(JSON.stringify(m, null, 2))
else if (arg === '--durum') console.log(`${AU_PORTRE_URETILDI.size}/${m.length} listed; ${m.filter((g) => existsSync(join(cikti, g.dosya))).length}/${m.length} files on disk`)
else if (arg === '--isle') {
  const kaynak = process.argv[3]
  if (!kaynak) { console.error('usage: --isle <src_dir>'); process.exit(2) }
  const { default: sharp } = await import('sharp')
  mkdirSync(cikti, { recursive: true })
  const yapilan = []
  for (const g of m) {
    const f = readdirSync(kaynak).find((n) => n.replace(/\.[a-z]+$/i, '') === g.rol)
    if (!f) continue
    let q = 82, buf
    do { buf = await sharp(join(kaynak, f)).resize(PORTRE_BOYUT, PORTRE_BOYUT, { fit: 'cover', position: 'top' }).webp({ quality: q }).toBuffer(); q -= 6 } while (buf.length > PORTRE_AZAMI_BAYT && q > 30)
    await sharp(buf).toFile(join(cikti, g.dosya)); yapilan.push(g.rol)
    console.log(`${g.rol}: ${(statSync(join(cikti, g.dosya)).size / 1024).toFixed(0)} KB`)
  }
  console.log(`\nAdd to AU_PORTRE_URETILDI:\n${yapilan.map((r) => `'${r}'`).join(', ')}`)
} else { console.error('see header'); process.exit(2) }
