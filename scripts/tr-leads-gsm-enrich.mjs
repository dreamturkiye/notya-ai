#!/usr/bin/env node
/**
 * WhatsApp-verified GSM enrich for TR outreach.
 *
 * ONLY accepts mobiles from Doktorsitesi socialMedia {type:"whatsapp", url:"905…"}.
 * Bare 5xx regex scrapes are REJECTED — they were wrong/non-mobile noise
 * (2026-11-09 wave4 failures: Matanat, Aytaç, Budak, …).
 *
 * 0850 appointment lines and shared 588 hubs are never used.
 *
 * Usage:
 *   node scripts/tr-leads-gsm-enrich.mjs --limit 200
 *
 * Writes: tr-gsm-enrich-hits.csv, tr-whatsapp-next-batch.csv, tr-whatsapp-wave4.csv
 * Patches matching call-ready telefon when WA-verified.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = Number(process.env.NOTYA_ENRICH_DELAY_MS || 240)

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1] || 250) : 250

/** Known shared / wrong WA widgets that appear on multiple DS profiles */
const GSM_BLOCKLIST = new Set([
  '+905017287587', // Aysun Fırat line leaked onto unrelated profiles
  '+905465989211',
  '+905294117500',
  '+905885648727',
])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  if (!lines.length) return []
  const cols = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line)
    const o = {}
    cols.forEach((c, i) => { o[c] = vals[i] ?? '' })
    return o
  })
}
function splitCsvLine(line) {
  const vals = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; continue }
      q = !q
      continue
    }
    if (ch === ',' && !q) { vals.push(cur); cur = ''; continue }
    cur += ch
  }
  vals.push(cur)
  return vals
}
function csvYaz(rows, cols) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n'
}

function digits(raw) {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('90') && d.length >= 12) d = d.slice(2)
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  return d
}

function normGsm(raw) {
  const d = digits(raw)
  if (d.length !== 10 || !d.startsWith('5')) return ''
  if (/^5(88|83|00)/.test(d)) return ''
  if (/0000$|9999$|00000|11111/.test(d)) return ''
  if (new Set(d.slice(3)).size <= 1) return ''
  const m = `+90${d}`
  if (GSM_BLOCKLIST.has(m)) return ''
  return m
}

function normName(n) {
  n = String(n || '').toLowerCase().trim()
  const tr = { ı: 'i', İ: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u' }
  for (const [a, b] of Object.entries(tr)) n = n.split(a).join(b)
  n = n.replace(/\s+/g, ' ')
  n = n.replace(/^(doc\.?\s*dr\.?|prof\.?\s*dr\.?|op\.?\s*dr\.?|uzm\.?\s*dr\.?|dr\.?\s*ogr\.?\s*uyesi|dr\.?)\s*/i, '')
  n = n.replace(/\s*\(.*\)$/, '').trim()
  return n
}

function loadLedgerBlocked() {
  const phones = new Set([...GSM_BLOCKLIST].map((p) => digits(p)))
  const names = new Set()
  const path = join(OUT, 'tr-outreach-ledger.csv')
  if (!existsSync(path)) return { phones, names }
  for (const r of parseCsv(readFileSync(path, 'utf8'))) {
    const d = (r.durum || '').toLowerCase()
    if (!['gitti', 'zaten_gitti', 'wa_yok', 'gitmedi'].includes(d)) continue
    const p = digits(r.telefon)
    if (p) phones.add(p)
    const nn = r.isim_norm || normName(r.isim)
    if (nn) names.add(nn)
  }
  return { phones, names }
}

/**
 * ONLY WhatsApp-verified mobiles from Doktorsitesi socialMedia.
 * No bare 5xx scrapes.
 */
function extractWhatsappGsm(html) {
  const found = []
  const patterns = [
    /\[\{\\"url\\":\\"(\d{10,13})\\",\\"type\\":\\"whatsapp\\"\}\]/g,
    /\[\{\\"type\\":\\"whatsapp\\",\\"url\\":\\"(\d{10,13})\\"\}\]/g,
    /\\"url\\":\\"(\d{10,13})\\",\\"type\\":\\"whatsapp\\"/g,
    /\\"type\\":\\"whatsapp\\",\\"url\\":\\"(\d{10,13})\\"/g,
    /"url":"(\d{10,13})","type":"whatsapp"/g,
    /"type":"whatsapp","url":"(\d{10,13})"/g,
    /wa\.me\/(\d{10,13})/gi,
  ]
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const g = normGsm(m[1])
      if (g) found.push(g)
    }
  }
  // Deliberately NO bare 5xx scrapes and NO ld+json telephone fallback.
  // Only socialMedia type=whatsapp (or wa.me). Bare digits were wrong numbers.
  return [...new Set(found)]
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

function loadQueue(blocked) {
  const sources = [
    join(OUT, 'tr-call-ready-leads.csv'),
    join(OUT, 'tr-istanbul-pedi-leads.csv'),
  ]
  const byUrl = new Map()
  for (const p of sources) {
    if (!existsSync(p)) continue
    for (const r of parseCsv(readFileSync(p, 'utf8'))) {
      const url = (r.url || '').trim()
      if (!url.includes('doktorsitesi.com')) continue // WA social only reliable on DS
      if (!['pediatri', 'kadin-dogum', 'dermatoloji'].includes(r.brans)) continue
      if (blocked.names.has(normName(r.isim))) continue
      const ozel = (r.ozel_muayenehane || '').toLowerCase()
      if (ozel && !['evet', 'yes', 'true', ''].includes(ozel)) continue
      const prev = byUrl.get(url)
      if (!prev || Number(r.skor || 0) > Number(prev.skor || 0)) byUrl.set(url, r)
    }
  }
  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  return [...byUrl.values()]
    .sort((a, b) => (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9)
      || Number(b.skor || 0) - Number(a.skor || 0)
      || String(a.isim).localeCompare(String(b.isim), 'tr'))
    .slice(0, LIMIT)
}

function patchCallReady(hits) {
  const path = join(OUT, 'tr-call-ready-leads.csv')
  if (!existsSync(path)) return 0
  const rows = parseCsv(readFileSync(path, 'utf8'))
  if (!rows.length) return 0
  const cols = Object.keys(rows[0])
  const byUrl = new Map(hits.map((h) => [h.url, h]))
  let n = 0
  for (const r of rows) {
    const h = byUrl.get(r.url)
    if (!h) continue
    if (r.telefon === h.telefon) continue
    r.telefon = h.telefon
    n++
  }
  writeFileSync(path, csvYaz(rows, cols))
  return n
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(ART, { recursive: true })
  const blocked = loadLedgerBlocked()
  const queue = loadQueue(blocked)
  process.stderr.write(
    `wa-verified enrich queue=${queue.length} ledgerPhones=${blocked.phones.size}\n`,
  )

  const phoneUrls = new Map()
  const pending = []
  let i = 0, fail = 0, withWa = 0

  for (const r of queue) {
    i++
    process.stderr.write(`enrich ${i}/${queue.length} waHits=${withWa} ${String(r.isim).slice(0, 50)}\n`)
    try {
      const html = await getir(r.url)
      const mobiles = extractWhatsappGsm(html).filter((m) => !blocked.phones.has(digits(m)))
      if (mobiles.length) {
        withWa++
        for (const m of mobiles) {
          if (!phoneUrls.has(m)) phoneUrls.set(m, new Set())
          phoneUrls.get(m).add(r.url)
        }
        pending.push({ row: r, mobiles })
        process.stderr.write(`  WA ${mobiles.join(' ')}\n`)
      }
    } catch (e) {
      fail++
      process.stderr.write(`  fail ${e.message}\n`)
    }
    await sleep(DELAY_MS)
  }

  // Drop numbers that appear on >1 profile (shared widget)
  const unique = new Set(
    [...phoneUrls.entries()].filter(([, urls]) => urls.size === 1).map(([m]) => m),
  )
  process.stderr.write(`unique WA mobiles=${unique.size} shared_dropped=${phoneUrls.size - unique.size}\n`)

  const hits = []
  const seen = new Set()
  for (const { row: r, mobiles } of pending) {
    const m = mobiles.find((x) => unique.has(x) && !seen.has(x))
    if (!m) continue
    seen.add(m)
    hits.push({
      skor: r.skor || '90',
      isim: r.isim,
      brans: r.brans,
      sehir: r.sehir || 'istanbul',
      ilce: r.ilce || '',
      telefon: m,
      mobil_yeni: m,
      url: r.url,
      durum: 'yeni',
      kaynak_enrich: 'whatsapp_social',
      gsm_score: 100,
    })
  }

  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  hits.sort((a, b) => (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9)
    || Number(b.skor || 0) - Number(a.skor || 0)
    || String(a.isim).localeCompare(String(b.isim), 'tr'))
  if (hits[0]) hits[0].durum = 'siradaki'

  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'mobil_yeni', 'url', 'durum', 'gsm_score', 'kaynak_enrich']
  const batchCols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'mobil_yeni', 'url', 'durum']
  const waveCols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'url', 'durum']

  writeFileSync(join(OUT, 'tr-gsm-enrich-hits.csv'), csvYaz(hits, cols))
  writeFileSync(join(OUT, 'tr-whatsapp-next-batch.csv'), csvYaz(hits, batchCols))
  writeFileSync(join(OUT, 'tr-whatsapp-wave4.csv'), csvYaz(hits, waveCols))
  writeFileSync(join(ART, 'tr-whatsapp-next-batch.csv'), csvYaz(hits, batchCols))

  const patched = patchCallReady(hits)
  const ozet = {
    tarih: new Date().toISOString(),
    mode: 'whatsapp_social_only',
    scanned: i,
    fail,
    profiles_with_wa: withWa,
    whatsapp_mobil_adet: hits.length,
    call_ready_patched: patched,
    brans: Object.fromEntries(
      ['kadin-dogum', 'dermatoloji', 'pediatri'].map((b) => [b, hits.filter((x) => x.brans === b).length]),
    ),
    siradaki: hits[0] || null,
    not: 'Only Doktorsitesi socialMedia type=whatsapp (or ld+json GSM telephone). No bare 5xx scrapes.',
  }
  writeFileSync(join(OUT, 'tr-gsm-enrich.ozet.json'), JSON.stringify(ozet, null, 2))
  writeFileSync(join(ART, 'enrich-ozet.json'), JSON.stringify(ozet, null, 2))
  console.log(JSON.stringify(ozet, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
