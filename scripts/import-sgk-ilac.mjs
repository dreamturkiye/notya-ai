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
 * with two title rows above the header, so the header is found by content rather than position.
 *
 * Usage:
 *   node scripts/import-sgk-ilac.mjs <dosya1.xlsx> [dosya2.xlsx ...]
 *
 * Output: data/sgk-ilaclar.json
 *
 * ÇIKARILANLAR rows REMOVE products, so applying deltas in date order keeps the file honest — a
 * drug withdrawn from reimbursement must stop appearing as SGK-covered, or the doctor prescribes
 * something the patient will be charged for.
 */
import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'

const OUT = path.join(process.cwd(), 'data', 'sgk-ilaclar.json')

/** SGK writes "PAROL 500 MG 20 TABLET" — the brand is the leading word(s) before strength/form. */
function parcala(ilacAdi) {
  const ad = String(ilacAdi || '').trim()
  // Strength marks the end of the brand: 500 MG, %2.32, 10 MG/5 ML …
  const m = ad.match(/^(.*?)(?=\s+(?:%|\d))/)
  const marka = (m ? m[1] : ad).trim()
  return { ad, marka: marka || ad }
}

function sheetToRows(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
  // Find the header row by content — SGK puts one or two title rows above it.
  const hi = raw.findIndex((r) => r.some((c) => String(c || '').trim() === 'İlaç Adı'))
  if (hi === -1) return []
  const header = raw[hi].map((c) => String(c || '').trim())
  const col = (name) => header.findIndex((h) => h === name)
  const ci = { kamu: col('Kamu No'), barkod: col('Güncel Barkod'), ad: col('İlaç Adı'), esdeger: col('Eşdeğer İlaç Grubu') }
  if (ci.ad === -1) return []
  return raw.slice(hi + 1)
    .filter((r) => r && String(r[ci.ad] || '').trim())
    .map((r) => {
      const { ad, marka } = parcala(r[ci.ad])
      return {
        kamuNo: String(r[ci.kamu] ?? '').trim(),
        barkod: String(r[ci.barkod] ?? '').trim(),
        ad,
        marka,
        esdegerGrubu: String(r[ci.esdeger] ?? '').trim(),
        sgk: true,
      }
    })
}

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Kullanım: node scripts/import-sgk-ilac.mjs <dosya.xlsx> [...]')
  process.exit(1)
}

// Keyed by barcode so re-running is idempotent and deltas overwrite cleanly.
const byBarkod = new Map()
if (fs.existsSync(OUT)) {
  for (const d of JSON.parse(fs.readFileSync(OUT, 'utf8')).ilaclar || []) byBarkod.set(d.barkod || d.ad, d)
  console.log(`mevcut kayıt: ${byBarkod.size}`)
}

let eklenen = 0, cikarilan = 0
for (const f of files) {
  const wb = XLSX.readFile(f)
  for (const name of wb.SheetNames) {
    const rows = sheetToRows(wb.Sheets[name])
    if (!rows.length) continue
    const cikar = /ÇIKARILAN/i.test(name)
    for (const r of rows) {
      const key = r.barkod || r.ad
      if (cikar) { if (byBarkod.delete(key)) cikarilan++ }
      else { byBarkod.set(key, r); eklenen++ }
    }
    console.log(`  ${path.basename(f)} :: ${name} -> ${rows.length} satır${cikar ? ' (çıkarma)' : ''}`)
  }
}

const ilaclar = [...byBarkod.values()].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify({ guncelleme: new Date().toISOString().slice(0, 10), kaynak: 'SGK EK-4/A', ilaclar }, null, 0))

console.log(`\neklenen/güncellenen: ${eklenen} | çıkarılan: ${cikarilan}`)
console.log(`toplam kayıt: ${ilaclar.length}`)
console.log(`yazıldı: ${OUT}`)
