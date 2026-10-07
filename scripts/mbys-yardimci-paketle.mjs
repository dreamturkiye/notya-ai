// MBYS-YARDIMCI-02 — build step: pack extensions/mbys-yardimci into .mbys-paket/mbys-yardimci.zip (runs in `prebuild`).
// The zip is served only to signed-in doctors by /api/doktor/araclar/enabiz/mbys/yardimci; it is not committed.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAKET_YOLU, UZANTI_DIZINI, klasoruPaketle } from '../lib/enabiz/mbys/zipPaket.mjs'

const kok = join(dirname(fileURLToPath(import.meta.url)), '..')
const hedef = join(kok, PAKET_YOLU)
mkdirSync(dirname(hedef), { recursive: true })
const zip = klasoruPaketle(join(kok, UZANTI_DIZINI))
writeFileSync(hedef, zip)
console.info(`[mbys-yardimci-paketle] ${zip.length} bayt → ${PAKET_YOLU}`)
