/**
 * NOTYA-TURKCE-01 rapor: kullanıcıya görünen İngilizce ve ASCII-Türkçe metinleri sayar.
 *   npx tsx scripts/turkce-tara.mts [klasör …] [--json yol] [--liste]
 * Varsayılan klasörler: app components lib core specialties (Mali ve Avukat hariç).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { dosyaTara, metinAdaylari, type Bulgu } from '../lib/turkce/turkceDenetim.ts'
import { genisAsciiBul } from '../lib/turkce/genisTarama.ts'

const KOK = resolve(import.meta.dirname, '..')
const argv = process.argv.slice(2)
const jsonYol = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null
const liste = argv.includes('--liste')
const klasorler = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--json')
const HEDEF = klasorler.length ? klasorler : ['app', 'components', 'lib', 'core', 'specialties']
const HARIC = /(^|\/)(mali|mali-tools|avukat|sandbox)(\/|$)|\.test\.|node_modules|\/tests?\//

const dosyalar: string[] = []
const gez = (d: string) => {
  for (const ad of readdirSync(d)) {
    const yol = join(d, ad)
    const goreli = relative(KOK, yol)
    if (HARIC.test(goreli)) continue
    if (statSync(yol).isDirectory()) gez(yol)
    else if (/\.(ts|tsx|mts)$/.test(ad) && !ad.endsWith('.d.ts')) dosyalar.push(goreli)
  }
}
HEDEF.forEach((k) => gez(join(KOK, k)))

const genis = argv.includes('--genis')
const tum: Bulgu[] = []
for (const d of dosyalar) {
  const kaynak = readFileSync(join(KOK, d), 'utf8')
  const bulgular = dosyaTara(kaynak, d)
  tum.push(...bulgular)
  if (!genis) continue
  // Geniş tarama: sözlük tabanlı ASCII-Türkçe adayları (liste dışı kelimeler); aynı satır iki kez sayılmaz.
  const var_ = new Set(bulgular.filter((b) => b.tur === 'ascii').map((b) => b.satir))
  for (const a of metinAdaylari(kaynak, d)) {
    if (var_.has(a.satir)) continue
    const k = genisAsciiBul(a.metin)
    if (k) { tum.push({ tur: 'ascii', dosya: d, satir: a.satir, kelime: `${k.ascii} → ${k.dogru} (geniş)`, metin: a.metin.replace(/\s+/g, ' ').trim().slice(0, 160) }); var_.add(a.satir) }
  }
}

const say = (t: string) => tum.filter((b) => b.tur === t).length
console.log(`dosya: ${dosyalar.length}  ascii: ${say('ascii')}  ingilizce: ${say('ingilizce')}`)
const klasorSay = new Map<string, number>()
for (const b of tum) {
  const k = b.dosya.split('/').slice(0, 2).join('/')
  klasorSay.set(k, (klasorSay.get(k) ?? 0) + 1)
}
for (const [k, n] of [...klasorSay].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`)
if (liste) for (const b of tum) console.log(`${b.tur}\t${b.dosya}:${b.satir}\t[${b.kelime}]\t${b.metin}`)
if (jsonYol) writeFileSync(jsonYol, JSON.stringify(tum, null, 1))
