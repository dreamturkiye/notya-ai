#!/usr/bin/env node
/**
 * SGK İLAÇ LİSTESİ İMPORT — scripts/import-sgk-ilac.mjs
 *
 * Turns SGK's published "Bedeli Ödenecek İlaçlar Listesi" (EK-4/A) spreadsheets into the dataset
 * the medication search reads. Handles BOTH shapes SGK publishes:
 *   - the consolidated list (one sheet, every reimbursed product)
 *   - the weekly delta files (EKLENENLER / DÜZENLENENLER / AKTİFLENENLER / ÇIKARILANLAR)
 *
 * Verified against the real 2026/12 delta: columns are
 *   Kamu No | Güncel Barkod | İlaç Adı | Eski Barkod-1 | Eski Barkod-2 | Eşdeğer İlaç Grubu |
 *   Terapötik Referans Grubu | Listeye Giriş Tarihi | Aktiflenme Tarihi
 * and against the consolidated list in force from 02.10.2026: one sheet,
 *   Kamu No | Güncel Barkod | İlaç Adı | Eski Barkodlar | Eşdeğer İlaç Grubu | Terapötik Referans Grubu |
 *   Listeye Giriş Tarihi | Aktiflenme Tarihi | Pasiflenme Tarihi | …
 * with one or two title rows above the header, so the header is found by content rather than position.
 *
 * Usage:
 *   node scripts/import-sgk-ilac.mjs [--tam-liste] [--liste-tarihi=YYYY-AA-GG] [--cikti=yol] [--rapor=yol] <dosya1.xlsx> [dosya2.xlsx ...]
 *
 *   --tam-liste      the file is the consolidated list: a catalogue product it no longer names is marked
 *                    not reimbursed. Leave it out for weekly delta files.
 *   --liste-tarihi   the date the list is in force from; written as `guncelleme` and used for the passive check.
 *   --cikti          write somewhere other than data/sgk-ilaclar.json (dry run).
 *   --rapor          also write the difference (added / removed / passive / renamed) as JSON.
 *
 * Output: data/sgk-ilaclar.json
 *
 * NOTYA-SUT-RAPOR-01i (2026-10-10). The merge rules live in scripts/lib/sgk-liste.mjs and are tested in
 * lib/ilac/sgkListe.test.ts:
 *   (a) etkenMadde / atc / etkenKaynak / ruhsatAskida come from TİTCK (scripts/import-titck-etken.mjs) and are kept
 *       by barcode — this import used to replace the whole record and lose them;
 *   (b) "Pasiflenme Tarihi" is honoured: a product passive on the list is stored as not reimbursed;
 *   (c) a product withdrawn from the list (ÇIKARILANLAR sheet, or missing from the full list) is stored as not
 *       reimbursed, not deleted and not left as covered — a drug withdrawn from reimbursement must stop appearing
 *       as SGK-covered, or the doctor prescribes something the patient will be charged for.
 * A product that is new on the list has no active ingredient until the next TİTCK import; nothing is guessed.
 */
import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'
import { barkodlar, listeyiBirlestir, tarihleriCoz } from './lib/sgk-liste.mjs'

const VARSAYILAN = path.join(process.cwd(), 'data', 'sgk-ilaclar.json')

const bayraklar = process.argv.slice(2).filter((a) => a.startsWith('--'))
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const deger = (ad) => (bayraklar.find((b) => b.startsWith(`--${ad}=`)) || '').split('=').slice(1).join('=') || null
const tamListe = bayraklar.includes('--tam-liste')
const listeTarihi = deger('liste-tarihi')
const OUT = deger('cikti') ? path.resolve(deger('cikti')) : VARSAYILAN
const RAPOR = deger('rapor') ? path.resolve(deger('rapor')) : null

if (!files.length || (listeTarihi && !/^\d{4}-\d{2}-\d{2}$/.test(listeTarihi))) {
  console.error('Kullanım: node scripts/import-sgk-ilac.mjs [--tam-liste] [--liste-tarihi=YYYY-AA-GG] [--cikti=yol] [--rapor=yol] <dosya.xlsx> [...]')
  process.exit(1)
}

/** A date column cell: spreadsheet serial number → {y,m,d}; text is left for tarihleriCoz. */
function tarihHucre(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const t = XLSX.SSF.parse_date_code(v)
    return t ? tarihleriCoz({ y: t.y, m: t.m, d: t.d }) : []
  }
  return tarihleriCoz(v)
}

function sheetToRows(ws, cikarma) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
  // Find the header row by content — SGK puts one or two title rows above it.
  const hi = raw.findIndex((r) => r.some((c) => String(c || '').trim() === 'İlaç Adı'))
  if (hi === -1) return []
  const header = raw[hi].map((c) => String(c || '').trim())
  const col = (name) => header.findIndex((h) => h === name)
  const ci = {
    kamu: col('Kamu No'), barkod: col('Güncel Barkod'), ad: col('İlaç Adı'), esdeger: col('Eşdeğer İlaç Grubu'),
    aktif: col('Aktiflenme Tarihi'), pasif: col('Pasiflenme Tarihi'),
  }
  const eskiSutunlar = header.map((h, i) => (/^Eski Barkod/.test(h) ? i : -1)).filter((i) => i !== -1)
  if (ci.ad === -1) return []
  return raw.slice(hi + 1)
    .filter((r) => r && String(r[ci.ad] || '').trim())
    .map((r) => ({
      kamuNo: String(r[ci.kamu] ?? '').trim(),
      barkod: String(r[ci.barkod] ?? '').trim(),
      ad: String(r[ci.ad] ?? '').trim(),
      esdegerGrubu: String(r[ci.esdeger] ?? '').trim(),
      eskiBarkodlar: eskiSutunlar.flatMap((i) => barkodlar(r[i])),
      aktiflenme: ci.aktif === -1 ? [] : tarihHucre(r[ci.aktif]),
      pasiflenme: ci.pasif === -1 ? [] : tarihHucre(r[ci.pasif]),
      cikarma,
    }))
}

const veri = fs.existsSync(VARSAYILAN) ? JSON.parse(fs.readFileSync(VARSAYILAN, 'utf8')) : {}
const mevcut = veri.ilaclar || []
console.log(`mevcut kayıt: ${mevcut.length}`)

const satirlar = []
for (const f of files) {
  const wb = XLSX.readFile(f)
  for (const name of wb.SheetNames) {
    const cikar = /ÇIKARILAN/i.test(name)
    const rows = sheetToRows(wb.Sheets[name], cikar)
    if (!rows.length) continue
    satirlar.push(...rows)
    console.log(`  ${path.basename(f)} :: ${name} -> ${rows.length} satır${cikar ? ' (çıkarma)' : ''}`)
  }
}
if (!satirlar.length) {
  console.error('Dosyalarda "İlaç Adı" başlıklı satır bulunamadı; katalog değiştirilmedi.')
  process.exit(1)
}

const { ilaclar, rapor } = listeyiBirlestir(mevcut, satirlar, { tamListe, listeTarihi })

fs.mkdirSync(path.dirname(OUT), { recursive: true })
// Every other top-level field (e.g. `titck`, the date of the TİTCK export the ingredients came from) is kept.
fs.writeFileSync(OUT, JSON.stringify({ ...veri, guncelleme: listeTarihi || new Date().toISOString().slice(0, 10), kaynak: 'SGK EK-4/A', ilaclar }, null, 0))
if (RAPOR) fs.writeFileSync(RAPOR, JSON.stringify(rapor, null, 1))

const n = (a) => a.length
console.log(`\nlisteye yeni giren      : ${n(rapor.eklenen)} (etken maddesiz: ${n(rapor.etkensizYeni)})`)
console.log(`barkodu değişen         : ${n(rapor.yenidenBarkodlanan)}`)
console.log(`listeden çıkan          : ${n(rapor.cikarilan)}`)
console.log(`listede pasif           : ${n(rapor.pasif)} (tarihi belirsiz, ödenen sayıldı: ${n(rapor.pasifBelirsiz)})`)
console.log(`yeniden ödenen          : ${n(rapor.yenidenOdenen)}`)
console.log(`adı değişen             : ${n(rapor.adiDegisen)} | eşdeğer grubu değişen: ${n(rapor.esdegerDegisen)}`)
console.log(`etken maddesi korunan   : ${rapor.etkenKorunan}`)
console.log(`toplam kayıt: ${rapor.toplam} | SGK öder: ${rapor.odenen} | ödemez: ${rapor.odenmeyen} | etken maddeli: ${rapor.etkenli}`)
console.log(`yazıldı: ${OUT}`)
