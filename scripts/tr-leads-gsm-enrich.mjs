#!/usr/bin/env node
/**
 * GSM / cep / WhatsApp mobile enrich for TR outreach leads.
 *
 * Pulls profile pages and extracts real 5xx mobiles (GSM). Landline 0850 and
 * shared Doktortakvimi click-to-call 588… are rejected. Ledger phones/names
 * are never re-queued.
 *
 * Usage:
 *   node scripts/tr-leads-gsm-enrich.mjs
 *   node scripts/tr-leads-gsm-enrich.mjs --limit 500
 *   node scripts/tr-leads-gsm-enrich.mjs --prefer ds   # doktorsitesi first
 *
 * Writes:
 *   docs/growth/tr-whatsapp-next-batch.csv
 *   docs/growth/tr-gsm-enrich-hits.csv
 *   docs/growth/tr-gsm-enrich.ozet.json
 *   patches telefon on matching rows in tr-call-ready-leads.csv
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = Number(process.env.NOTYA_ENRICH_DELAY_MS || 260)

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1] || 600) : 600
const PREFER_DS = args.includes('--prefer') ? args[args.indexOf('--prefer') + 1] === 'ds' : true
const TARGET_HITS = Number(process.env.NOTYA_ENRICH_TARGET_HITS || 80)

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

/** Real TR GSM only — reject 0850 landline hubs and shared 588 click-to-call. */
function normGsm(raw) {
  const d = digits(raw)
  if (d.length !== 10 || !d.startsWith('5')) return ''
  // shared / fake / operator hubs
  if (/^5(88|83|00)/.test(d)) return ''
  if (d.startsWith('850')) return ''
  // repeated-digit / placeholder spam (…0000, …9999, all same after prefix)
  if (new Set(d.slice(3)).size <= 1) return ''
  if (/0000$|9999$|00000|11111|22222/.test(d)) return ''
  return `+90${d}`
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
  const phones = new Set()
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
  // early-batch hard seed
  for (const p of [
    '5448358595', '5348489034', '5058498433', '5458150451', '5305910620',
    '5162223828', '5397938221', '5549042883', '5451321419', '5057900571',
    '5414418195',
  ]) phones.add(p)
  return { phones, names }
}

/** Site-wide / widget GSM noise seen on many Doktorsitesi pages — never treat as a doctor mobile. */
const GSM_BLOCKLIST = new Set([
  '+905465989211', // recurring DS widget
  '+905017287587', // leaked Aysun line on unrelated profiles
  '+905294117500',
  '+905885648727',
])

/** TR GSM body: 5XX XXX XX XX (dots/spaces/dashes allowed). */
const GSM_BODY = String.raw`5\d{2}[\s./-]*\d{3}[\s./-]*\d{2}[\s./-]*\d{2}`

/**
 * Extract GSM candidates from a profile HTML.
 * Priority: explicit WhatsApp → wa.me → tel: 5xx → labeled cep/gsm/mobil → bare 05xx.
 */
function extractGsm(html) {
  const scored = [] // {m, score}
  const push = (raw, score) => {
    const m = normGsm(raw)
    if (!m || GSM_BLOCKLIST.has(m)) return
    scored.push({ m, score })
  }

  for (const m of html.matchAll(/"type"\s*:\s*"whatsapp"[^}]*"url"\s*:\s*"([^"]+)"/gi)) push(m[1], 100)
  for (const m of html.matchAll(/"url"\s*:\s*"([^"]+)"[^}]*"type"\s*:\s*"whatsapp"/gi)) push(m[1], 100)
  for (const m of html.matchAll(/wa\.me\/(\+?\d{10,15})/gi)) push(m[1], 95)
  for (const m of html.matchAll(/api\.whatsapp\.com\/send\?[^"'\s]*phone=(\+?\d{10,15})/gi)) push(m[1], 95)

  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) push(m[1], 80)
  for (const m of html.matchAll(/"(?:telephone|phone|mobile|cellPhone|gsm)"\s*:\s*"([^"]+)"/gi)) push(m[1], 75)

  // Labeled Turkish: Cep / GSM / Mobil / WhatsApp near a number
  for (const m of html.matchAll(
    new RegExp(
      String.raw`(?:cep(?:\s*tel(?:efon)?)?|gsm|mobil(?:\s*tel(?:efon)?)?|whats?\s*app)\s*[:\-]?\s*(?:<[^>]+>\s*)*(?:\+?90\s*)?0?${GSM_BODY}`,
      'gi',
    ),
  )) {
    push(m[0], 90)
  }

  // Bare TR mobiles — with or without leading 0 / +90 (Doktorsitesi often uses 546.598.92.11)
  for (const m of html.matchAll(new RegExp(String.raw`(?:\+?90\s*)?0?(${GSM_BODY})`, 'g'))) {
    push(m[1], 55)
  }

  // Pick best score per number
  const best = new Map()
  for (const { m, score } of scored) {
    if (!best.has(m) || best.get(m) < score) best.set(m, score)
  }
  return [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([m, score]) => ({ m, score }))
}
async function getir(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.text()
}

function isRealGsmAlready(tel) {
  const m = normGsm(tel)
  return Boolean(m)
}

function loadQueue(blocked) {
  const sources = [
    join(OUT, 'tr-call-ready-leads.csv'),
    join(OUT, 'tr-istanbul-pedi-leads.csv'),
    join(OUT, 'tr-whatsapp-wave4.csv'),
    join(OUT, 'tr-whatsapp-next-batch.csv'),
  ]
  const byUrl = new Map()
  for (const p of sources) {
    if (!existsSync(p)) continue
    for (const r of parseCsv(readFileSync(p, 'utf8'))) {
      const url = (r.url || '').trim()
      if (!url.startsWith('http')) continue
      if (!['pediatri', 'kadin-dogum', 'dermatoloji'].includes(r.brans)) continue
      const nn = normName(r.isim)
      if (nn && blocked.names.has(nn)) continue
      const existing = normGsm(r.telefon || r.mobil_yeni || '')
      if (existing && blocked.phones.has(digits(existing))) continue
      // skip if already has unique real GSM
      if (existing && !blocked.phones.has(digits(existing))) continue
      const ozel = (r.ozel_muayenehane || '').toLowerCase()
      if (ozel && !['evet', 'yes', 'true', ''].includes(ozel)) continue
      // Doktortakvimi list pages almost never expose unique GSM (588 hub only).
      // Prefer / only scan Doktorsitesi unless --all-sources
      const isDs = url.includes('doktorsitesi.com')
      if (PREFER_DS && !isDs && !args.includes('--all-sources')) continue
      const prev = byUrl.get(url)
      if (!prev || Number(r.skor || 0) > Number(prev.skor || 0)) byUrl.set(url, r)
    }
  }
  let leads = [...byUrl.values()]
  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  leads.sort((a, b) => {
    const aDs = (a.url || '').includes('doktorsitesi') ? 0 : 1
    const bDs = (b.url || '').includes('doktorsitesi') ? 0 : 1
    if (PREFER_DS && aDs !== bDs) return aDs - bDs
    return (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9)
      || Number(b.skor || 0) - Number(a.skor || 0)
      || String(a.isim).localeCompare(String(b.isim), 'tr')
  })
  return leads.slice(0, LIMIT)
}
function patchCallReady(hits) {
  const path = join(OUT, 'tr-call-ready-leads.csv')
  if (!existsSync(path)) return 0
  const rows = parseCsv(readFileSync(path, 'utf8'))
  if (!rows.length) return 0
  const cols = Object.keys(rows[0])
  const byUrl = new Map(hits.map((h) => [h.url, h]))
  const byName = new Map(hits.map((h) => [normName(h.isim), h]))
  let n = 0
  for (const r of rows) {
    const h = byUrl.get(r.url) || byName.get(normName(r.isim))
    if (!h) continue
    if (normGsm(r.telefon) === h.telefon) continue
    r.telefon = h.telefon
    if (cols.includes('outreach_durum') && !(r.outreach_durum || '').includes('gitti')) {
      r.outreach_durum = r.outreach_durum || 'yeni'
    }
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
    `gsm-enrich queue=${queue.length} limit=${LIMIT} ledgerPhones=${blocked.phones.size} names=${blocked.names.size}\n`,
  )

  // seed with existing wave4 / next-batch clean mobiles
  const hits = []
  const seenTel = new Set([...blocked.phones].map((p) => `+90${p}`))
  const telHitCount = new Map()

  for (const seedPath of ['tr-whatsapp-wave4.csv', 'tr-whatsapp-next-batch.csv']) {
    const p = join(OUT, seedPath)
    if (!existsSync(p)) continue
    for (const r of parseCsv(readFileSync(p, 'utf8'))) {
      const m = normGsm(r.mobil_yeni || r.telefon)
      if (!m || seenTel.has(m) || blocked.names.has(normName(r.isim))) continue
      seenTel.add(m)
      hits.push({
        skor: r.skor || '',
        isim: r.isim,
        brans: r.brans,
        sehir: r.sehir || 'istanbul',
        ilce: r.ilce || '',
        telefon: m,
        mobil_yeni: m,
        url: r.url || '',
        durum: r.durum || 'yeni',
        gsm_score: 100,
        kaynak_enrich: 'seed',
      })
    }
  }

  let i = 0
  let fail = 0
  /** @type {Map<string, Set<string>>} phone → profile URLs where it appeared */
  const phoneUrls = new Map()
  /** @type {{row: any, cands: {m:string,score:number}[]}[]} */
  const pending = []

  for (const r of queue) {
    i++
    const short = (r.isim || r.url || '').slice(0, 60)
    process.stderr.write(`enrich ${i}/${queue.length} pending=${pending.length} ${short}\n`)
    try {
      const html = await getir(r.url)
      const cands = extractGsm(html).filter((c) => !blocked.phones.has(digits(c.m)))
      for (const c of cands) {
        if (!phoneUrls.has(c.m)) phoneUrls.set(c.m, new Set())
        phoneUrls.get(c.m).add(r.url)
      }
      if (cands.length) pending.push({ row: r, cands })
    } catch (e) {
      fail++
      process.stderr.write(`  fail ${e.message}\n`)
    }
    await sleep(DELAY_MS)
  }

  // Second pass: only keep GSMs unique to a single profile URL
  const uniquePhones = new Set(
    [...phoneUrls.entries()].filter(([, urls]) => urls.size === 1).map(([m]) => m),
  )
  process.stderr.write(
    `unique GSM candidates=${uniquePhones.size} (dropped shared=${phoneUrls.size - uniquePhones.size})\n`,
  )

  for (const { row: r, cands } of pending) {
    const chosen = cands.find((c) => uniquePhones.has(c.m) && !seenTel.has(c.m))
    if (!chosen) continue
    seenTel.add(chosen.m)
    telHitCount.set(chosen.m, 1)
    hits.push({
      skor: r.skor || '',
      isim: r.isim,
      brans: r.brans,
      sehir: r.sehir || 'istanbul',
      ilce: r.ilce || '',
      telefon: chosen.m,
      mobil_yeni: chosen.m,
      url: r.url,
      durum: 'yeni',
      gsm_score: chosen.score,
      kaynak_enrich: 'profile',
    })
    process.stderr.write(`  GSM ${chosen.m} score=${chosen.score} ← ${r.isim}\n`)
  }

  const clean = hits
  // Dedupe by phone, prefer higher gsm_score / KD
  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  const map = new Map()
  for (const h of clean) {
    const prev = map.get(h.telefon)
    if (!prev
      || (h.gsm_score || 0) > (prev.gsm_score || 0)
      || (pri[h.brans] ?? 9) < (pri[prev.brans] ?? 9)) {
      map.set(h.telefon, h)
    }
  }
  const sirali = [...map.values()].sort((a, b) =>
    (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9)
    || Number(b.skor || 0) - Number(a.skor || 0)
    || String(a.isim).localeCompare(String(b.isim), 'tr'),
  )

  // Preserve Hazel as siradaki if present
  for (const h of sirali) {
    if (/hazel/i.test(h.isim) && /kuzey/i.test(h.isim)) h.durum = 'siradaki'
    else if (h.durum === 'siradaki') h.durum = 'yeni'
  }
  if (!sirali.some((h) => h.durum === 'siradaki') && sirali[0]) sirali[0].durum = 'siradaki'

  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'mobil_yeni', 'url', 'durum', 'gsm_score', 'kaynak_enrich']
  const batchCols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'mobil_yeni', 'url', 'durum']
  writeFileSync(join(OUT, 'tr-gsm-enrich-hits.csv'), csvYaz(sirali, cols))
  writeFileSync(join(OUT, 'tr-whatsapp-next-batch.csv'), csvYaz(sirali, batchCols))
  writeFileSync(join(ART, 'tr-whatsapp-next-batch.csv'), csvYaz(sirali, batchCols))
  writeFileSync(join(ART, 'tr-gsm-enrich-hits.csv'), csvYaz(sirali, cols))

  const patched = patchCallReady(sirali.filter((h) => h.kaynak_enrich === 'profile' || h.kaynak_enrich === 'seed'))

  const ozet = {
    tarih: new Date().toISOString(),
    scanned: i,
    fail,
    whatsapp_mobil_adet: sirali.length,
    profile_new: sirali.filter((h) => h.kaynak_enrich === 'profile').length,
    call_ready_patched: patched,
    brans: Object.fromEntries(
      ['kadin-dogum', 'dermatoloji', 'pediatri'].map((b) => [b, sirali.filter((x) => x.brans === b).length]),
    ),
    siradaki: sirali.find((h) => h.durum === 'siradaki') || sirali[0] || null,
    not: 'GSM-only enrich (5xx). 0850/588 rejected. Ledger excluded. Mobiles usually have WhatsApp.',
  }
  writeFileSync(join(OUT, 'tr-gsm-enrich.ozet.json'), JSON.stringify(ozet, null, 2))
  writeFileSync(join(ART, 'enrich-ozet.json'), JSON.stringify(ozet, null, 2))
  console.log(JSON.stringify(ozet, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
