#!/usr/bin/env node
/**
 * Enrich existing lead CSVs for WhatsApp mobiles.
 * Prefers Doktorsitesi socialMedia type=whatsapp and tel: 5xx on profile pages.
 * Writes docs/growth/tr-whatsapp-next-batch.csv (merge, dedupe).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = 280

const ZATEN_GONDERILEN = new Set([
  '+905448358595', '+905549042883', '+905348489034', '+905058498433',
  '+905458150451', '+905451321419', '+905057900571',
  // Cengiz — yarın, yine de batch'te tut ama işaretle
])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  if (!lines.length) return []
  const cols = lines[0].split(',').map((c) => c.replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const vals = []
    let cur = '', q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; continue }
        q = !q; continue
      }
      if (ch === ',' && !q) { vals.push(cur); cur = ''; continue }
      cur += ch
    }
    vals.push(cur)
    const o = {}
    cols.forEach((c, i) => { o[c] = vals[i] ?? '' })
    return o
  })
}

function normMobile(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('90') && d.length >= 12) d = d.slice(2)
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  if (d.length !== 10 || !d.startsWith('5')) return ''
  if (/^5(88|83|00|55{5})/.test(d)) return ''
  if (new Set(d.slice(3)).size <= 1) return ''
  return `+90${d}`
}

function extractWhatsappMobiles(html) {
  const out = []
  // Explicit WhatsApp social links (Doktorsitesi)
  for (const m of html.matchAll(/"type"\s*:\s*"whatsapp"[^}]*"url"\s*:\s*"([^"]+)"/gi)) {
    const n = normMobile(m[1]); if (n) out.push(n)
  }
  for (const m of html.matchAll(/"url"\s*:\s*"([^"]+)"[^}]*"type"\s*:\s*"whatsapp"/gi)) {
    const n = normMobile(m[1]); if (n) out.push(n)
  }
  for (const m of html.matchAll(/wa\.me\/(\d{10,13})/gi)) {
    const n = normMobile(m[1]); if (n) out.push(n)
  }
  for (const m of html.matchAll(/href="tel:([^"]+)"/gi)) {
    const n = normMobile(m[1]); if (n) out.push(n)
  }
  for (const m of html.matchAll(/"(?:telephone|phone)"\s*:\s*"([^"]+)"/gi)) {
    const n = normMobile(m[1]); if (n) out.push(n)
  }
  return [...new Set(out)]
}

async function getir(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.text()
}

function csvYaz(rows, cols) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n'
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(ART, { recursive: true })
  const sources = [
    join(OUT, 'tr-istanbul-pedi-leads.csv'),
    join(OUT, 'tr-call-ready-leads.csv'),
    join(OUT, 'tr-whatsapp-next-batch.csv'),
  ]
  const byUrl = new Map()
  for (const p of sources) {
    if (!existsSync(p)) continue
    for (const r of parseCsv(readFileSync(p, 'utf8'))) {
      const url = r.url || ''
      if (!url) continue
      if (!byUrl.has(url) || (r.skor && Number(r.skor) > Number(byUrl.get(url).skor || 0))) {
        byUrl.set(url, r)
      }
    }
  }
  const leads = [...byUrl.values()].filter((r) =>
    ['pediatri', 'kadin-dogum', 'dermatoloji'].includes(r.brans) && (r.sehir === 'istanbul' || !r.sehir),
  )
  // Prefer özel + no mobile yet, KD/derm/pedi
  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  leads.sort((a, b) => (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9) || Number(b.skor || 0) - Number(a.skor || 0))

  const hits = []
  const existingBatch = existsSync(join(OUT, 'tr-whatsapp-next-batch.csv'))
    ? parseCsv(readFileSync(join(OUT, 'tr-whatsapp-next-batch.csv'), 'utf8'))
    : []
  for (const e of existingBatch) {
    const m = normMobile(e.mobil_yeni || e.telefon)
    if (m && !ZATEN_GONDERILEN.has(m)) hits.push({ ...e, mobil_yeni: m, telefon: m })
  }

  const seenTel = new Set(hits.map((h) => h.mobil_yeni))
  let i = 0
  for (const r of leads) {
    i++
    if (i > 800) break
    process.stderr.write(`enrich ${i}/${Math.min(leads.length, 800)} ${r.isim || r.url}\n`)
    try {
      const html = await getir(r.url)
      const mobiles = extractWhatsappMobiles(html).filter((m) => !ZATEN_GONDERILEN.has(m) && !seenTel.has(m))
      if (mobiles.length) {
        const m = mobiles[0]
        seenTel.add(m)
        hits.push({
          skor: r.skor || '',
          isim: r.isim,
          brans: r.brans,
          sehir: r.sehir || 'istanbul',
          ilce: r.ilce || '',
          telefon: m,
          mobil_yeni: m,
          url: r.url,
          durum: r.isim?.includes('Cengiz Sağıroğlu') ? 'yarin' : 'yeni',
          kaynak_enrich: 'profile',
        })
        process.stderr.write(`  HIT ${m}\n`)
      }
    } catch (e) {
      process.stderr.write(`  fail ${e.message}\n`)
    }
    await sleep(DELAY_MS)
  }

  // Dedupe by mobile
  const map = new Map()
  for (const h of hits) {
    const k = h.mobil_yeni || h.telefon
    if (!k || ZATEN_GONDERILEN.has(k)) continue
    if (!map.has(k)) map.set(k, h)
  }
  const sirali = [...map.values()].sort((a, b) => {
    const pri2 = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
    return (pri2[a.brans] ?? 9) - (pri2[b.brans] ?? 9) || String(a.isim).localeCompare(String(b.isim), 'tr')
  })

  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'mobil_yeni', 'url', 'durum']
  const csv = csvYaz(sirali, cols)
  writeFileSync(join(OUT, 'tr-whatsapp-next-batch.csv'), csv)
  writeFileSync(join(ART, 'tr-whatsapp-next-batch.csv'), csv)
  const ozet = {
    tarih: new Date().toISOString(),
    whatsapp_mobil_adet: sirali.length,
    brans: Object.fromEntries(['kadin-dogum', 'dermatoloji', 'pediatri'].map((b) => [b, sirali.filter((x) => x.brans === b).length])),
    sonraki: 'Cengiz Sağıroğlu yarın 10:00 TR; sessiz saat 20:00+',
  }
  writeFileSync(join(OUT, 'tr-whatsapp-next-batch.ozet.json'), JSON.stringify(ozet, null, 2))
  writeFileSync(join(ART, 'enrich-ozet.json'), JSON.stringify(ozet, null, 2))
  console.log(JSON.stringify(ozet, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
