#!/usr/bin/env node
/**
 * NOTYA-ILAC-07 — etken madde + ATC from TİTCK — scripts/import-titck-etken.mjs
 *
 * SGK's EK-4/A (what import-sgk-ilac.mjs reads) carries NO active ingredient. Every one of the
 * 8.649 records had an empty `etkenMadde`, so the search's "by etken madde" promise was hollow:
 * "atorvastatin" returned nothing because no record contained the word.
 *
 * TİTCK publishes the "Ruhsatlı Beşeri Tıbbi Ürünler Listesi" weekly (titck.gov.tr/dinamikmodul/85)
 * with BARKOD | ÜRÜN ADI | ETKİN MADDE | ATC KODU per licensed product. Barcode is the join key —
 * the same barcode e-reçete records — so the match is exact, not fuzzy.
 *
 * Verified against the 21.08.2026 list: 23.001 products, 8.213 of our 8.649 barcodes match
 * directly (95%). For the rest, the eşdeğer grubu is used as a bridge: when every matched member
 * of a group shares one ATC code, the unmatched members of that group are the same molecule and
 * inherit it. ATC is used for that decision rather than the ingredient TEXT, because TİTCK writes
 * the same molecule several ways ("dekstroz anhidrat", "dekstroz anhidr", "carbohydrates") and a
 * text comparison would refuse to propagate what is plainly the same drug. What is left unmatched
 * stays unmatched and searchable by name — a wrong ingredient on a prescription tool is worse
 * than a missing one.
 *
 * Usage:
 *   node scripts/import-titck-etken.mjs <RuhsatliUrunlerListesi.xlsx>
 *
 * Reads and rewrites data/sgk-ilaclar.json in place. Idempotent: re-running with a newer TİTCK
 * file overwrites ingredient/ATC where the file has them and never blanks a value it cannot
 * improve on.
 */
import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const DATA = path.join(process.cwd(), 'data', 'sgk-ilaclar.json')

const file = process.argv[2]
if (!file) {
  console.error('Kullanım: node scripts/import-titck-etken.mjs <RuhsatliUrunlerListesi.xlsx>')
  process.exit(1)
}

/** TİTCK writes ingredient text inconsistently: trailing NBSP, doubled spaces, random casing. */
function temizle(s) {
  return String(s ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}
/** "atorvastatin kalsiyum" -> "Atorvastatin kalsiyum" — the UI shows this next to the brand. */
function basHarf(s) {
  return s ? s[0].toLocaleUpperCase('tr') + s.slice(1) : s
}

// ---- 1. read every sheet that has a BARKOD + ETKİN MADDE column ---------------------------------
const wb = XLSX.readFile(file)
const titck = new Map() // barkod -> { etken, atc, askida }
for (const name of wb.SheetNames) {
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false })
  const hi = raw.findIndex((r) => r.some((c) => temizle(c).toLocaleUpperCase('tr') === 'BARKOD'))
  if (hi === -1) continue
  const header = raw[hi].map((c) => temizle(c).toLocaleUpperCase('tr'))
  const col = (pred) => header.findIndex(pred)
  const ci = {
    barkod: col((h) => h === 'BARKOD'),
    etken: col((h) => h.startsWith('ETKİN MADDE')),
    atc: col((h) => h.startsWith('ATC')),
    askida: col((h) => h.startsWith('RUHSATI ASKIDA')),
  }
  if (ci.etken === -1) continue
  let n = 0
  for (const r of raw.slice(hi + 1)) {
    const barkod = temizle(r[ci.barkod])
    const etken = temizle(r[ci.etken])
    if (!/^\d{8,14}$/.test(barkod) || !etken) continue
    titck.set(barkod, {
      etken: basHarf(etken),
      atc: ci.atc === -1 ? '' : temizle(r[ci.atc]).toUpperCase(),
      askida: ci.askida === -1 ? 0 : Number(r[ci.askida] || 0),
    })
    n++
  }
  console.log(`  ${path.basename(file)} :: ${name} -> ${n} barkodlu ürün`)
}
console.log(`TİTCK toplam: ${titck.size} barkod\n`)

// ---- 2. direct barcode join --------------------------------------------------------------------
const veri = JSON.parse(fs.readFileSync(DATA, 'utf8'))
const ilaclar = veri.ilaclar || []
let dogrudan = 0
for (const d of ilaclar) {
  const t = titck.get(String(d.barkod || ''))
  if (!t) continue
  d.etkenMadde = t.etken
  if (t.atc) d.atc = t.atc
  d.etkenKaynak = 'titck'
  if (t.askida) d.ruhsatAskida = t.askida
  else delete d.ruhsatAskida
  dogrudan++
}

// ---- 3. eşdeğer grubu bridge — one ATC per group, or nothing --------------------------------------
const grup = new Map() // esdegerGrubu -> { atc: Set, etken: Map<string, count> }
for (const d of ilaclar) {
  if (d.etkenKaynak !== 'titck' || !d.esdegerGrubu) continue
  let g = grup.get(d.esdegerGrubu)
  if (!g) grup.set(d.esdegerGrubu, (g = { atc: new Set(), etken: new Map() }))
  if (d.atc) g.atc.add(d.atc)
  g.etken.set(d.etkenMadde, (g.etken.get(d.etkenMadde) || 0) + 1)
}
let koprulu = 0, belirsiz = 0, eslesmeyen = 0
for (const d of ilaclar) {
  if (d.etkenKaynak === 'titck') continue
  const g = d.esdegerGrubu ? grup.get(d.esdegerGrubu) : null
  if (!g || g.atc.size !== 1) { g && g.atc.size > 1 ? belirsiz++ : eslesmeyen++; continue }
  const [enSik] = [...g.etken.entries()].sort((a, b) => b[1] - a[1])[0]
  d.etkenMadde = enSik
  d.atc = [...g.atc][0]
  d.etkenKaynak = 'esdeger'
  koprulu++
}

// ---- 4. write ----------------------------------------------------------------------------------
// TİTCK names files "…Listesi21.08.2026_<uuid>.xlsx"; a hand-renamed copy may carry 2026-08-21.
const ad = path.basename(file)
const dmy = ad.match(/(\d{2})\.(\d{2})\.(\d{4})/)
const ymd = ad.match(/(\d{4})-(\d{2})-(\d{2})/)
veri.titck = dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : ymd ? ymd[0] : new Date().toISOString().slice(0, 10)
fs.writeFileSync(DATA, JSON.stringify(veri, null, 0))

const toplam = ilaclar.length
const pct = (n) => `${((100 * n) / toplam).toFixed(1)}%`
console.log(`barkodla doğrudan eşleşen : ${dogrudan} (${pct(dogrudan)})`)
console.log(`eşdeğer grubu köprüsüyle  : ${koprulu} (${pct(koprulu)})`)
console.log(`grubu çok anlamlı, atlandı: ${belirsiz}`)
console.log(`eşleşmeyen                : ${eslesmeyen}`)
console.log(`askıda ruhsat işaretlenen : ${ilaclar.filter((d) => d.ruhsatAskida).length}`)
console.log(`\nyazıldı: ${DATA} (TİTCK ${veri.titck})`)
