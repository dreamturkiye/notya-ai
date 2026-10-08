/**
 * NOTYA-ULKE-01 — rewrites countries/tr/testing/doktor-araclari-anlik.json from the CURRENT registry.
 *
 *   npm run ulke:arac-anlik
 *
 * Run it only for a DELIBERATE change to Türkiye's tools (a new tile, new copy), in the same commit as that change:
 * lib/doktor/doktorAraclariUlke.test.ts compares every specialty's list with this file, so an accidental change to
 * Türkiye — for example while adding a tool for another country — fails the test instead of shipping.
 * Must run without NOTYA_COUNTRY (as Türkiye).
 */
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { doktorAraciBransaUygun, doktorAraclariGruplu, doktorAraclariListesi, TUM_DOKTOR_ARACLARI } from '../lib/doktor/doktorAraclari.ts'
import { BRANS_ETIKETLERI } from '../lib/intake/bransSorulari.ts'

if (process.env.NOTYA_COUNTRY && process.env.NOTYA_COUNTRY !== 'tr') throw new Error('run without NOTYA_COUNTRY: this is the Türkiye snapshot')

const KOK = resolve(import.meta.dirname, '..')
const kaynak = process.argv[2] || `working tree, ${new Date().toISOString().slice(0, 10)}`
const hamlar: (string | null)[] = [...Object.keys(BRANS_ETIKETLERI), 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'Çocuk Sağlığı ve Hastalıkları', 'İç Hastalıkları', 'genel', 'sac-ekimi', '', null]
const branslar: Record<string, unknown> = {}
for (const h of hamlar) {
  branslar[h === null ? '(null)' : h === '' ? '(bos)' : h] = {
    liste: doktorAraclariListesi(h).map((a) => a.route),
    gruplar: doktorAraclariGruplu(h).map((g) => ({ anahtar: g.anahtar, baslik: g.baslik, aciklama: g.aciklama, rotalar: g.araclar.map((a) => a.route) })),
    derinBaglanti: TUM_DOKTOR_ARACLARI.filter((a) => doktorAraciBransaUygun(a.route, h)).map((a) => a.route),
  }
}
const cikti = {
  kaynak,
  not: 'Every tool exactly as the registry holds it (without `ulkeler`), and for each raw specialty value the routes of the list, of the groups, and of the deep-link guard. Do not edit by hand: npm run ulke:arac-anlik.',
  araclar: TUM_DOKTOR_ARACLARI.map(({ ulkeler: _u, ...a }) => a),
  branslar,
}
writeFileSync(join(KOK, 'countries/tr/testing/doktor-araclari-anlik.json'), JSON.stringify(cikti, null, 1))
console.log(`snapshot written: ${cikti.araclar.length} tools, ${Object.keys(branslar).length} specialty values`)
