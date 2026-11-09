#!/usr/bin/env node
/**
 * Ankara + İzmir secondary harvest — merge-safe.
 * Does NOT overwrite Istanbul korpus / call-ready.
 * Writes docs/growth/tr-ankara-izmir-leads.csv (+ JSON) and merges
 * new özel+telefon rows into tr-call-ready-leads.csv by URL.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = 350
const DS = 'https://www.doktorsitesi.com'
const DT = 'https://www.doktortakvimi.com'

const LISTELER = [
  { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'ankara', tip: 'dt', maxPages: 20, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/ankara` },
  { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'ankara', tip: 'dt', maxPages: 15, listBase: `${DT}/kadin-hastaliklari-ve-dogum/ankara` },
  { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'ankara', tip: 'dt', maxPages: 12, listBase: `${DT}/dermatoloji/ankara` },
  { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'izmir', tip: 'dt', maxPages: 20, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/izmir` },
  { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'izmir', tip: 'dt', maxPages: 15, listBase: `${DT}/kadin-hastaliklari-ve-dogum/izmir` },
  { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'izmir', tip: 'dt', maxPages: 12, listBase: `${DT}/dermatoloji/izmir` },
  { kaynak: 'doktorsitesi', brans: 'pediatri', sehir: 'ankara', tip: 'ds', maxPages: 12, listBase: `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/ankara` },
  { kaynak: 'doktorsitesi', brans: 'kadin-dogum', sehir: 'ankara', tip: 'ds', maxPages: 10, listBase: `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/ankara` },
  { kaynak: 'doktorsitesi', brans: 'dermatoloji', sehir: 'ankara', tip: 'ds', maxPages: 8, listBase: `${DS}/uzmanlik-alanlari/dermatoloji/ankara` },
  { kaynak: 'doktorsitesi', brans: 'pediatri', sehir: 'izmir', tip: 'ds', maxPages: 12, listBase: `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/izmir` },
  { kaynak: 'doktorsitesi', brans: 'kadin-dogum', sehir: 'izmir', tip: 'ds', maxPages: 10, listBase: `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/izmir` },
  { kaynak: 'doktorsitesi', brans: 'dermatoloji', sehir: 'izmir', tip: 'ds', maxPages: 8, listBase: `${DS}/uzmanlik-alanlari/dermatoloji/izmir` },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getir(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.text()
}

function metinTemiz(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  if (!lines.length) return []
  const cols = split(lines[0])
  return lines.slice(1).map((line) => {
    const vals = split(line)
    const o = {}
    cols.forEach((c, i) => { o[c] = vals[i] ?? '' })
    return o
  })
}
function split(line) {
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
  return vals
}
function csvYaz(rows, cols) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n'
}

function listLinks(html, tip) {
  const out = []
  if (tip === 'ds') {
    for (const m of html.matchAll(/href="(https:\/\/www\.doktorsitesi\.com\/[^"]+)"/gi)) {
      const u = m[1].split('#')[0]
      if (/\/uzmanlik-alanlari\//.test(u)) continue
      if (/\/(blog|video|soru|hastane|poliklinik|arama)\//.test(u)) continue
      // profile-like: host/slug/... 
      if (/doktorsitesi\.com\/[a-z0-9-]+\/[a-z0-9-]+/i.test(u)) out.push(u)
    }
  } else {
    for (const m of html.matchAll(/href="(\/profil\/[^"?#]+)"/gi)) {
      out.push(`${DT}${m[1]}`)
    }
  }
  return [...new Set(out)]
}

function ozelMi(html) {
  const t = html.toLowerCase()
  if (/özel\s+muayene|ozel\s+muayene|muayenehane|private practice/i.test(html)) return 'evet'
  if (/devlet\s+hastan|şehir\s+hastan|egitim\s+ve\s+arastirma|eğitim\s+ve\s+araştırma/i.test(html) && !/muayenehane/i.test(html)) return 'hayir_veya_belirsiz'
  return 'hayir_veya_belirsiz'
}

function telFrom(html) {
  const tels = []
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) tels.push(m[1])
  for (const m of html.matchAll(/"(?:telephone|phone)"\s*:\s*"([^"]+)"/gi)) tels.push(m[1])
  for (const m of html.matchAll(/(?:(?:\+90|0)\s*)?(5\d{2}[\s./-]*\d{3}[\s./-]*\d{2}[\s./-]*\d{2})/g)) tels.push(m[1])
  for (const m of html.matchAll(/0?850[\s./-]*\d{3}[\s./-]*\d{2}[\s./-]*\d{2}/g)) tels.push(m[0])
  const norm = (raw) => {
    let d = String(raw).replace(/\D/g, '')
    if (d.startsWith('90') && d.length >= 12) d = d.slice(2)
    if (d.startsWith('0') && d.length === 11) d = d.slice(1)
    if (d.length === 10) return `+90${d}`
    return ''
  }
  const all = [...new Set(tels.map(norm).filter(Boolean))]
  // prefer GSM 5xx over 850
  const gsm = all.find((t) => t.startsWith('+905') && !t.startsWith('+90588') && !t.startsWith('+90500'))
  return gsm || all[0] || ''
}

function isimFrom(html, url) {
  const og = html.match(/property="og:title"\s+content="([^"]+)"/i)
  if (og) return metinTemiz(og[1].split('|')[0].split('-')[0])
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1) return metinTemiz(h1[1])
  return metinTemiz(url.split('/').filter(Boolean).slice(-2, -1)[0] || url)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(ART, { recursive: true })
  const gorulen = new Set()
  const kuyruk = []

  for (const liste of LISTELER) {
    let bos = 0
    for (let page = 1; page <= liste.maxPages; page++) {
      const url = page === 1 ? liste.listBase : `${liste.listBase}/${page}`
      process.stderr.write(`list ${liste.sehir} ${liste.brans} p${page}\n`)
      try {
        const html = await getir(url)
        const found = listLinks(html, liste.tip)
        let ek = 0
        for (const u of found) {
          if (gorulen.has(u)) continue
          gorulen.add(u)
          kuyruk.push({ url: u, meta: liste })
          ek++
        }
        process.stderr.write(`  +${ek} queue=${kuyruk.length}\n`)
        if (!found.length || ek === 0) {
          bos++
          if (bos >= 2) break
        } else bos = 0
      } catch (e) {
        process.stderr.write(`  fail ${e.message}\n`)
        break
      }
      await sleep(DELAY_MS)
    }
  }

  const leads = []
  let i = 0
  for (const { url, meta } of kuyruk) {
    i++
    process.stderr.write(`profile ${i}/${kuyruk.length} ${url}\n`)
    try {
      const html = await getir(url)
      const telefon = telFrom(html)
      const ozel = ozelMi(html)
      let skor = ozel === 'evet' ? 80 : 40
      if (telefon.startsWith('+905') && !telefon.startsWith('+90588')) skor += 15
      leads.push({
        skor: String(skor),
        isim: isimFrom(html, url),
        brans: meta.brans,
        sehir: meta.sehir,
        ilce: '',
        telefon,
        adres: '',
        website: '',
        ozel_muayenehane: ozel,
        kaynak: meta.kaynak,
        url,
        demo_cta: 'https://www.notya.io/demo (Cal: https://cal.com/han-mamur-sugmbo/demo-tr)',
        trial_cta: 'https://www.notya.io',
        durum: 'yeni',
        outreach_durum: '',
        outreach_tarih: '',
      })
    } catch (e) {
      process.stderr.write(`  fail ${e.message}\n`)
    }
    await sleep(DELAY_MS)
  }

  const map = new Map()
  for (const r of leads) {
    const k = (r.url || r.isim).toLowerCase()
    const prev = map.get(k)
    if (!prev || Number(r.skor) > Number(prev.skor) || (r.telefon && !prev.telefon)) map.set(k, r)
  }
  const sirali = [...map.values()].sort((a, b) => Number(b.skor) - Number(a.skor))
  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'adres', 'website', 'ozel_muayenehane', 'kaynak', 'url', 'demo_cta', 'trial_cta', 'durum', 'outreach_durum', 'outreach_tarih']
  writeFileSync(join(OUT, 'tr-ankara-izmir-leads.csv'), csvYaz(sirali, cols))
  writeFileSync(join(OUT, 'tr-ankara-izmir-leads.json'), JSON.stringify({ tarih: new Date().toISOString(), leads: sirali }, null, 2))

  // Merge call-ready: özel + telefon, by URL, do not remove Istanbul
  const crPath = join(OUT, 'tr-call-ready-leads.csv')
  const existing = existsSync(crPath) ? parseCsv(readFileSync(crPath, 'utf8')) : []
  const byUrl = new Map(existing.map((r) => [r.url, r]))
  let added = 0
  for (const r of sirali) {
    if (r.ozel_muayenehane !== 'evet' || !r.telefon) continue
    if (!byUrl.has(r.url)) {
      byUrl.set(r.url, r)
      added++
    }
  }
  const merged = [...byUrl.values()]
  writeFileSync(crPath, csvYaz(merged, cols))
  writeFileSync(join(ART, 'tr-ankara-izmir-ozet.json'), JSON.stringify({
    tarih: new Date().toISOString(),
    profil: leads.length,
    tekil: sirali.length,
    ozel: sirali.filter((x) => x.ozel_muayenehane === 'evet').length,
    call_ready_added: added,
    call_ready_total: merged.length,
  }, null, 2))
  console.log(JSON.stringify({
    profil: leads.length,
    tekil: sirali.length,
    ozel: sirali.filter((x) => x.ozel_muayenehane === 'evet').length,
    call_ready_added: added,
  }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
