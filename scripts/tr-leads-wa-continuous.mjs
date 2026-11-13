#!/usr/bin/env node
/**
 * Continuous WA-verified lead scraper for TR outreach.
 *
 * - Harvests Doktorsitesi list pages across major cities
 * - Extracts ONLY socialMedia type=whatsapp (same rules as tr-leads-gsm-enrich.mjs)
 * - APPENDS new unique phones to docs/growth/tr-whatsapp-wa-pool.csv
 * - NEVER overwrites the active send queue (tr-whatsapp-wave4.csv)
 * - Tracks scanned URLs in docs/growth/tr-wa-scanned-urls.txt
 *
 * Usage:
 *   node scripts/tr-leads-wa-continuous.mjs
 *   NOTYA_ENRICH_DELAY_MS=200 NOTYA_WA_LOOP=1 node scripts/tr-leads-wa-continuous.mjs
 *
 * Env:
 *   NOTYA_ENRICH_DELAY_MS  delay between profile fetches (default 220)
 *   NOTYA_WA_BATCH         profiles per enrich pass (default 250)
 *   NOTYA_WA_LOOP          if 1, loop forever (sleep between passes)
 *   NOTYA_WA_SLEEP_MS      sleep between loops (default 15000)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = Number(process.env.NOTYA_ENRICH_DELAY_MS || 220)
const BATCH = Number(process.env.NOTYA_WA_BATCH || 250)
const LOOP = process.env.NOTYA_WA_LOOP === '1'
const SLEEP_MS = Number(process.env.NOTYA_WA_SLEEP_MS || 15_000)
const DS = 'https://www.doktorsitesi.com'

const GSM_BLOCKLIST = new Set([
  '+905017287587',
  '+905465989211',
  '+905294117500',
  '+905885648727',
])

const CITY_LISTS = [
  ['pediatri', 'istanbul', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/istanbul`, 8],
  ['kadin-dogum', 'istanbul', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/istanbul`, 8],
  ['dermatoloji', 'istanbul', `${DS}/uzmanlik-alanlari/dermatoloji/istanbul`, 6],
  ['pediatri', 'ankara', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/ankara`, 10],
  ['kadin-dogum', 'ankara', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/ankara`, 8],
  ['dermatoloji', 'ankara', `${DS}/uzmanlik-alanlari/dermatoloji/ankara`, 6],
  ['pediatri', 'izmir', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/izmir`, 10],
  ['kadin-dogum', 'izmir', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/izmir`, 8],
  ['dermatoloji', 'izmir', `${DS}/uzmanlik-alanlari/dermatoloji/izmir`, 6],
  ['pediatri', 'bursa', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/bursa`, 6],
  ['kadin-dogum', 'bursa', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/bursa`, 5],
  ['dermatoloji', 'bursa', `${DS}/uzmanlik-alanlari/dermatoloji/bursa`, 4],
  ['pediatri', 'antalya', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/antalya`, 6],
  ['kadin-dogum', 'antalya', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/antalya`, 5],
  ['dermatoloji', 'antalya', `${DS}/uzmanlik-alanlari/dermatoloji/antalya`, 4],
  ['pediatri', 'adana', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/adana`, 5],
  ['kadin-dogum', 'adana', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/adana`, 4],
  ['dermatoloji', 'adana', `${DS}/uzmanlik-alanlari/dermatoloji/adana`, 3],
  ['pediatri', 'gaziantep', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/gaziantep`, 4],
  ['kadin-dogum', 'gaziantep', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/gaziantep`, 4],
  ['pediatri', 'konya', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/konya`, 4],
  ['kadin-dogum', 'konya', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/konya`, 4],
  ['pediatri', 'mersin', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/mersin`, 3],
  ['kadin-dogum', 'mersin', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/mersin`, 3],
  ['pediatri', 'eskisehir', `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/eskisehir`, 3],
  ['kadin-dogum', 'eskisehir', `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/eskisehir`, 3],
]

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

function loadScanned() {
  const path = join(OUT, 'tr-wa-scanned-urls.txt')
  if (!existsSync(path)) return new Set()
  return new Set(readFileSync(path, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
}
function saveScanned(set) {
  writeFileSync(join(OUT, 'tr-wa-scanned-urls.txt'), [...set].sort().join('\n') + '\n')
}

function nameFromUrl(u) {
  const slug = u.split('/')[3] || ''
  let title = ''
  let s = slug
  if (s.startsWith('prof-dr-')) { title = 'Prof. Dr. '; s = s.slice(8) }
  else if (s.startsWith('doc-dr-')) { title = 'Doç. Dr. '; s = s.slice(7) }
  else if (s.startsWith('op-dr-')) { title = 'Op. Dr. '; s = s.slice(6) }
  else if (s.startsWith('uzm-dr-')) { title = 'Uzm. Dr. '; s = s.slice(7) }
  else if (s.startsWith('dr-')) { title = 'Dr. '; s = s.slice(3) }
  return title + s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function listLinks(html, sehir) {
  const out = new Set()
  const re = /https:\/\/www\.doktorsitesi\.com\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+/gi
  for (const m of html.matchAll(re)) {
    const u = m[0].toLowerCase()
    if (/\/(makale|soru|blog|uzmanlik-alanlari|arama|iletisim)\//i.test(u)) continue
    if (!u.endsWith('/' + sehir)) continue
    out.add(m[0].split('?')[0])
  }
  return [...out]
}

function loadPool() {
  const path = join(OUT, 'tr-whatsapp-wa-pool.csv')
  if (!existsSync(path)) return []
  return parseCsv(readFileSync(path, 'utf8'))
}
function savePool(rows) {
  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'url', 'durum', 'kaynak_enrich', 'eklendi']
  writeFileSync(join(OUT, 'tr-whatsapp-wa-pool.csv'), csvYaz(rows, cols))
}

function mergeIntoWave(pool, blocked) {
  // Keep active wave4 rows that are still usable; append new pool rows not already present.
  const wavePath = join(OUT, 'tr-whatsapp-wave4.csv')
  const existing = existsSync(wavePath) ? parseCsv(readFileSync(wavePath, 'utf8')) : []
  const byPhone = new Map()
  for (const r of existing) {
    const d = digits(r.telefon)
    if (!d) continue
    byPhone.set(d, r)
  }
  let added = 0
  for (const r of pool) {
    const d = digits(r.telefon)
    if (!d || blocked.phones.has(d)) continue
    if (blocked.names.has(normName(r.isim))) continue
    if (byPhone.has(d)) continue
    const row = {
      skor: r.skor || '85',
      isim: r.isim,
      brans: r.brans,
      sehir: r.sehir,
      ilce: r.ilce || '',
      telefon: r.telefon,
      url: r.url,
      durum: 'yeni',
    }
    byPhone.set(d, row)
    added++
  }
  // Preserve gitti rows at top of history? Keep all; send script filters.
  const rows = [...byPhone.values()]
  // Prefer non-gitti first for human readability of "siradaki"
  const pri = { siradaki: 0, yeni: 1, gitti: 9 }
  rows.sort((a, b) => (pri[a.durum] ?? 5) - (pri[b.durum] ?? 5)
    || String(a.isim).localeCompare(String(b.isim), 'tr'))
  // Ensure one siradaki if none
  if (!rows.some((r) => r.durum === 'siradaki')) {
    const nxt = rows.find((r) => (r.durum || '') === 'yeni'
      && !blocked.phones.has(digits(r.telefon))
      && !blocked.names.has(normName(r.isim)))
    if (nxt) nxt.durum = 'siradaki'
  }
  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'url', 'durum']
  writeFileSync(wavePath, csvYaz(rows, cols))
  return added
}

async function harvestLists(knownUrls) {
  let added = 0
  const catalogPath = join(OUT, 'tr-call-ready-leads.csv')
  const rows = existsSync(catalogPath) ? parseCsv(readFileSync(catalogPath, 'utf8')) : []
  const cols = rows[0] ? Object.keys(rows[0]) : [
    'skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'adres', 'website',
    'ozel_muayenehane', 'kaynak', 'url', 'demo_cta', 'trial_cta', 'durum',
    'outreach_durum', 'outreach_tarih',
  ]
  const byUrl = new Map(rows.map((r) => [r.url, r]))
  for (const [brans, sehir, base, maxPages] of CITY_LISTS) {
    let empty = 0
    for (let p = 1; p <= maxPages; p++) {
      const url = p === 1 ? base : `${base}?sayfa=${p}`
      process.stderr.write(`list ${brans} ${sehir} p${p}\n`)
      try {
        const html = await getir(url)
        const links = listLinks(html, sehir)
        if (!links.length) {
          empty++
          if (empty >= 2) break
          continue
        }
        empty = 0
        let pageAdd = 0
        for (const u of links) {
          knownUrls.add(u)
          if (byUrl.has(u)) continue
          const clean = {}
          for (const c of cols) clean[c] = ''
          Object.assign(clean, {
            skor: '85',
            isim: nameFromUrl(u),
            brans,
            sehir,
            ozel_muayenehane: 'evet',
            kaynak: 'doktorsitesi',
            url: u,
            demo_cta: 'https://www.notya.io/demo',
            trial_cta: 'https://www.notya.io',
            durum: 'yeni',
            outreach_durum: 'yeni',
          })
          rows.push(clean)
          byUrl.set(u, clean)
          added++
          pageAdd++
        }
        process.stderr.write(`  links=${links.length} new=${pageAdd}\n`)
      } catch (e) {
        process.stderr.write(`  fail ${e.message}\n`)
      }
      await sleep(DELAY_MS)
    }
  }
  writeFileSync(catalogPath, csvYaz(rows, cols))
  return { added, total: rows.length }
}

async function enrichPass(blocked, scanned) {
  const sources = [
    join(OUT, 'tr-call-ready-leads.csv'),
    join(OUT, 'tr-istanbul-pedi-leads.csv'),
    join(OUT, 'tr-ankara-izmir-leads.csv'),
  ]
  const candidates = []
  const seenUrl = new Set()
  for (const p of sources) {
    if (!existsSync(p)) continue
    for (const r of parseCsv(readFileSync(p, 'utf8'))) {
      const url = (r.url || '').trim()
      if (!url.includes('doktorsitesi.com')) continue
      if (!['pediatri', 'kadin-dogum', 'dermatoloji'].includes(r.brans)) continue
      if (scanned.has(url) || seenUrl.has(url)) continue
      if (blocked.names.has(normName(r.isim))) continue
      seenUrl.add(url)
      candidates.push(r)
    }
  }
  const pri = { 'kadin-dogum': 0, dermatoloji: 1, pediatri: 2 }
  candidates.sort((a, b) => (pri[a.brans] ?? 9) - (pri[b.brans] ?? 9)
    || Number(b.skor || 0) - Number(a.skor || 0)
    || String(a.isim).localeCompare(String(b.isim), 'tr'))
  const queue = candidates.slice(0, BATCH)
  process.stderr.write(`enrich queue=${queue.length} remaining_unscanned≈${candidates.length} scanned=${scanned.size}\n`)

  const phoneUrls = new Map()
  const pending = []
  let withWa = 0, fail = 0
  for (let i = 0; i < queue.length; i++) {
    const r = queue[i]
    process.stderr.write(`enrich ${i + 1}/${queue.length} waHits=${withWa} ${String(r.isim).slice(0, 50)}\n`)
    try {
      const html = await getir(r.url)
      scanned.add(r.url)
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
      scanned.add(r.url) // don't infinite-retry hard fails this loop
      process.stderr.write(`  fail ${e.message}\n`)
    }
    await sleep(DELAY_MS)
  }
  saveScanned(scanned)

  const unique = new Set(
    [...phoneUrls.entries()].filter(([, urls]) => urls.size === 1).map(([m]) => m),
  )
  const pool = loadPool()
  const poolPhones = new Set(pool.map((r) => digits(r.telefon)))
  const now = new Date().toISOString()
  let newHits = 0
  for (const { row: r, mobiles } of pending) {
    const m = mobiles.find((x) => unique.has(x) && !poolPhones.has(digits(x)) && !blocked.phones.has(digits(x)))
    if (!m) continue
    poolPhones.add(digits(m))
    pool.push({
      skor: r.skor || '85',
      isim: r.isim || nameFromUrl(r.url),
      brans: r.brans,
      sehir: r.sehir || '',
      ilce: r.ilce || '',
      telefon: m,
      url: r.url,
      durum: 'yeni',
      kaynak_enrich: 'whatsapp_social',
      eklendi: now,
    })
    newHits++
  }
  savePool(pool)
  const waveAdded = mergeIntoWave(pool, blocked)
  const ozet = {
    tarih: now,
    scanned_this_pass: queue.length,
    fail,
    profiles_with_wa: withWa,
    new_unique_wa: newHits,
    pool_total: pool.length,
    wave_appended: waveAdded,
    unscanned_left: Math.max(0, candidates.length - queue.length),
  }
  mkdirSync(ART, { recursive: true })
  writeFileSync(join(OUT, 'tr-wa-continuous.ozet.json'), JSON.stringify(ozet, null, 2))
  writeFileSync(join(ART, 'wa-continuous.ozet.json'), JSON.stringify(ozet, null, 2))
  appendFileSync(join(ART, 'wa-continuous.log'), `${now} ${JSON.stringify(ozet)}\n`)
  console.log(JSON.stringify(ozet, null, 2))
  return ozet
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(ART, { recursive: true })
  let pass = 0
  do {
    pass++
    process.stderr.write(`\n=== continuous pass ${pass} ===\n`)
    const blocked = loadLedgerBlocked()
    const scanned = loadScanned()
    const known = new Set(scanned)
    // Also seed known from call-ready
    const cr = join(OUT, 'tr-call-ready-leads.csv')
    if (existsSync(cr)) {
      for (const r of parseCsv(readFileSync(cr, 'utf8'))) {
        if (r.url) known.add(r.url)
      }
    }
    const harvest = await harvestLists(known)
    process.stderr.write(`harvest added=${harvest.added} catalog=${harvest.total}\n`)
    const ozet = await enrichPass(blocked, scanned)
    if (!LOOP) break
    if (ozet.unscanned_left === 0 && harvest.added === 0) {
      process.stderr.write(`idle — nothing new; sleep ${SLEEP_MS}ms then re-harvest\n`)
    }
    await sleep(SLEEP_MS)
  } while (LOOP)
}

main().catch((e) => { console.error(e); process.exit(1) })
