#!/usr/bin/env node
/**
 * Free lead harvest — TR private practices (pediatri + KD + derm) from public listings.
 * Sources: Doktortakvimi + Doktorsitesi. Output: docs/growth/tr-istanbul-pedi-leads.csv (+ JSON).
 * Demo CTA: Dr. Gökhan Mamur Cal.com (US remote). No dernek lists. Paced + User-Agent.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'docs/growth')
const ART = '/opt/cursor/artifacts/tr-pedi-leads'
const UA = 'NotyaLeadResearch/1.0 (research; kaan@notya.io)'
const DELAY_MS = 350
const DEMO = 'https://www.notya.io/demo'
const CAL = 'https://cal.com/han-mamur-sugmbo/demo-tr'
const TRIAL = 'https://www.notya.io'

const DS = 'https://www.doktorsitesi.com'
const DT = 'https://www.doktortakvimi.com'

const IST_ILCELER = [
  'kadikoy', 'besiktas', 'sisli', 'uskudar', 'atasehir', 'bakirkoy', 'maltepe', 'pendik',
  'umraniye', 'sariyer', 'beylikduzu', 'basaksehir', 'bahcelievler', 'fatih', 'kartal',
  'gaziosmanpasa', 'kucukcekmece', 'avcilar', 'tuzla', 'cekmekoy', 'sancaktepe', 'eyupsultan',
]

/** @type {{ kaynak: string, brans: string, sehir: string, listBase: string, tip: 'ds'|'dt', maxPages: number }[]} */
const LISTELER = [
  // İstanbul city-wide — deep pagination
  { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'istanbul', tip: 'dt', maxPages: 60, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/istanbul` },
  { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'istanbul', tip: 'dt', maxPages: 50, listBase: `${DT}/kadin-hastaliklari-ve-dogum/istanbul` },
  { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'istanbul', tip: 'dt', maxPages: 40, listBase: `${DT}/dermatoloji/istanbul` },
  // İstanbul ilçe listeleri (daha fazla tekil profil)
  ...IST_ILCELER.flatMap((ilce) => [
    { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'istanbul', tip: 'dt', maxPages: 8, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/${ilce}` },
    { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'istanbul', tip: 'dt', maxPages: 6, listBase: `${DT}/kadin-hastaliklari-ve-dogum/${ilce}` },
    { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'istanbul', tip: 'dt', maxPages: 5, listBase: `${DT}/dermatoloji/${ilce}` },
  ]),
  // Doktorsitesi İstanbul
  { kaynak: 'doktorsitesi', brans: 'pediatri', sehir: 'istanbul', tip: 'ds', maxPages: 40, listBase: `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/istanbul` },
  { kaynak: 'doktorsitesi', brans: 'kadin-dogum', sehir: 'istanbul', tip: 'ds', maxPages: 30, listBase: `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/istanbul` },
  { kaynak: 'doktorsitesi', brans: 'dermatoloji', sehir: 'istanbul', tip: 'ds', maxPages: 25, listBase: `${DS}/uzmanlik-alanlari/dermatoloji/istanbul` },
  // Ankara + İzmir — secondary (İstanbul primary; lighter pagination)
  { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'ankara', tip: 'dt', maxPages: 25, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/ankara` },
  { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'ankara', tip: 'dt', maxPages: 20, listBase: `${DT}/kadin-hastaliklari-ve-dogum/ankara` },
  { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'ankara', tip: 'dt', maxPages: 15, listBase: `${DT}/dermatoloji/ankara` },
  { kaynak: 'doktortakvimi', brans: 'pediatri', sehir: 'izmir', tip: 'dt', maxPages: 25, listBase: `${DT}/cocuk-sagligi-ve-hastaliklari/izmir` },
  { kaynak: 'doktortakvimi', brans: 'kadin-dogum', sehir: 'izmir', tip: 'dt', maxPages: 20, listBase: `${DT}/kadin-hastaliklari-ve-dogum/izmir` },
  { kaynak: 'doktortakvimi', brans: 'dermatoloji', sehir: 'izmir', tip: 'dt', maxPages: 15, listBase: `${DT}/dermatoloji/izmir` },
  { kaynak: 'doktorsitesi', brans: 'pediatri', sehir: 'ankara', tip: 'ds', maxPages: 15, listBase: `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/ankara` },
  { kaynak: 'doktorsitesi', brans: 'kadin-dogum', sehir: 'ankara', tip: 'ds', maxPages: 12, listBase: `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/ankara` },
  { kaynak: 'doktorsitesi', brans: 'dermatoloji', sehir: 'ankara', tip: 'ds', maxPages: 10, listBase: `${DS}/uzmanlik-alanlari/dermatoloji/ankara` },
  { kaynak: 'doktorsitesi', brans: 'pediatri', sehir: 'izmir', tip: 'ds', maxPages: 15, listBase: `${DS}/uzmanlik-alanlari/cocuk-sagligi-ve-hastaliklari/izmir` },
  { kaynak: 'doktorsitesi', brans: 'kadin-dogum', sehir: 'izmir', tip: 'ds', maxPages: 12, listBase: `${DS}/uzmanlik-alanlari/kadin-hastaliklari-ve-dogum/izmir` },
  { kaynak: 'doktorsitesi', brans: 'dermatoloji', sehir: 'izmir', tip: 'ds', maxPages: 10, listBase: `${DS}/uzmanlik-alanlari/dermatoloji/izmir` },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getir(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(25_000),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.text()
}

function metinTemiz(s) {
  return String(s || '').replace(/\s+/g, ' ').trim()
}

function telNormalize(raw) {
  const digits = metinTemiz(raw).replace(/\D/g, '')
  if (!digits) return ''
  let d = digits
  if (d.startsWith('90') && d.length >= 12) d = d.slice(2)
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  // TR national number = exactly 10 digits
  if (d.length !== 10) return ''
  if (/^0{3,}/.test(d) || /^5{5,}/.test(d)) return ''
  // Doktortakvimi shared click-to-call (not a unique practice line)
  if (d === '8503330388') return ''
  return `+90${d}`
}

function ozelMi(html) {
  const t = html.toLowerCase()
  if (/özel\s*muayenehane|muayenehanesi|özel\s*klinik|kendi\s*(klinik|muayene)|serbest\s*(tabip|muayene)|muayenehanesinde/.test(t)) return true
  if (/"name"\s*:\s*"[^"]*muayenehane[^"]*"/i.test(html)) return true
  if (/hospitalaffiliation[^|]{0,200}muayenehane/i.test(t)) return true
  if (/\bmuayenehane\b/.test(t) && !/sadece\s*hastane/.test(t)) return true
  const hastaneAgir = (t.match(/hastanesi/g) || []).length
  const muayene = (t.match(/muayenehane/g) || []).length
  if (muayene >= 1 && hastaneAgir <= 6) return true
  return false
}

function ilceBul(adres, html) {
  const m = (adres || html || '').match(
    /(Kadıköy|Beşiktaş|Şişli|Üsküdar|Ataşehir|Ümraniye|Bakırköy|Maltepe|Pendik|Kartal|Sarıyer|Beylikdüzü|Başakşehir|Bahçelievler|Fatih|Eyüpsultan|Gaziosmanpaşa|Kağıthane|Zeytinburnu|Sultanbeyli|Çekmeköy|Sancaktepe|Tuzla|Avcılar|Esenyurt|Beykoz|Silivri|Çankaya|Keçiören|Yenimahalle|Mamak|Bornova|Karşıyaka|Konak|Buca|Bayraklı)/i,
  )
  return m ? m[1] : ''
}

function skorHesapla({ ozel, telefon, ilce, website, sehir }) {
  return (
    (ozel ? 50 : 0) +
    (telefon ? 25 : 0) +
    (ilce ? 10 : 0) +
    (website ? 10 : 0) +
    (sehir === 'istanbul' ? 5 : 0) +
    (/Kadıköy|Beşiktaş|Şişli|Ataşehir|Üsküdar|Bakırköy|Çankaya|Bornova/i.test(ilce) ? 5 : 0)
  )
}

/** Doktortakvimi list → profile URLs */
function dtProfilUrlBul(html) {
  const set = new Set()
  const re = /data-doctor-url="(https:\/\/www\.doktortakvimi\.com\/profil\/[^"]+)"/gi
  let m
  while ((m = re.exec(html))) set.add(m[1].split('?')[0])
  return [...set]
}

function dtAlanCikar(html, url, meta) {
  const isim =
    metinTemiz(
      (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, '') ||
        (html.match(/data-doctor-name="([^"]+)"/) || [])[1] ||
        url.split('/').pop()?.replace(/-/g, ' ') ||
        '',
    )
  let telefon = ''
  const telCandidates = [
    ...(html.matchAll(/href="tel:([^"]+)"/gi) || []),
    ...(html.matchAll(/"telephone"\s*:\s*"([^"]+)"/gi) || []),
  ].map((x) => x[1])
  const gsm = html.match(/(?:\+90|0)\s*5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/)
  if (gsm) telCandidates.unshift(gsm[0])
  for (const c of telCandidates) {
    const n = telNormalize(c)
    // Prefer mobile (5xx) over generic 0850 call-center if both exist
    if (n && /(?:\+90|0)?5\d{9}/.test(n.replace(/\D/g, '').replace(/^90/, ''))) {
      telefon = n
      break
    }
    if (!telefon && n) telefon = n
  }

  let adres = ''
  const street = (html.match(/"streetAddress"\s*:\s*"([^"]+)"/) || [])[1]
  const local = (html.match(/"addressLocality"\s*:\s*"([^"]+)"/) || [])[1]
  if (street) adres = metinTemiz([street, local, meta.sehir].filter(Boolean).join(', '))
  if (!adres) {
    const card = html.match(/doctor-card-address[^>]*>([\s\S]{0,200}?)</i) ||
      html.match(/profile-address[^>]*>([\s\S]{0,200}?)</i)
    if (card) adres = metinTemiz(card[1].replace(/<[^>]+>/g, ''))
  }
  // Workplace lines often carry "Muayenehane" vs hospital
  const isYeri = metinTemiz(
    ((html.match(/itemprop="name"[^>]*>([^<]*(?:Muayenehane|Hastanesi|Klinik)[^<]*)</i) || [])[1]) || '',
  )
  if (isYeri && !adres) adres = isYeri

  const ozel = ozelMi(html) || /muayenehane/i.test(isYeri)
  const hastaneOnly = /hastanesi/i.test(adres + isYeri) && !/muayenehane|klinik/i.test(html.slice(0, 12000))
  const ilce = local || ilceBul(adres, html)
  const website =
    ((html.match(/rel="noopener[^"]*"\s+href="(https?:\/\/(?!www\.doktortakvimi)[^"]+)"/) || [])[1]) || ''

  return {
    isim,
    brans: meta.brans,
    sehir: meta.sehir,
    kaynak: meta.kaynak,
    path: url.replace(/^https?:\/\/[^/]+/, ''),
    url,
    telefon,
    adres: adres || isYeri,
    ilce,
    website,
    ozel_muayenehane: ozel && !hastaneOnly ? 'evet' : 'hayir_veya_belirsiz',
    skor: skorHesapla({ ozel: ozel && !hastaneOnly, telefon, ilce, website, sehir: meta.sehir }),
  }
}

/** Doktorsitesi list → relative paths */
function dsProfilUrlBul(html, sehir) {
  const set = new Set()
  const re = new RegExp(`href="(/[^"]+/${sehir})"`, 'gi')
  let m
  while ((m = re.exec(html))) {
    const p = m[1].split('#')[0]
    if (p.includes('/hastaneler/') || p.includes('/uzmanlik-alanlari/') || p.includes('/hastaliklar/')) continue
    if (!/(?:uzm-dr|prof-dr|doc-dr|dr-ogr|\/dr-|\/[a-z0-9-]{4,}\/)/.test(p)) continue
    // specialty path segment present
    if (!/(cocuk-sagligi|kadin-hastaliklari|dermatoloji|deri-ve)/.test(p)) continue
    set.add(p)
  }
  return [...set]
}

function dsAlanCikar(html, path, meta) {
  const isim =
    metinTemiz(
      (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, '') ||
        (html.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] ||
        path.split('/')[1]?.replace(/-/g, ' ') ||
        '',
    )
  let telefon = ''
  const telM =
    html.match(/tel:(\+?90[\d\s()-]{10,})/i) ||
    html.match(/"(?:telephone|phone)"\s*:\s*"(\+?[\d\s()-]{10,})"/i) ||
    html.match(/(?:\+90|0)\s*\(?5\d{2}\)?\s*[\d\s-]{7,}/)
  if (telM) telefon = telNormalize(telM[1] || telM[0])

  let adres = ''
  const street = (html.match(/"streetAddress"\s*:\s*"([^"]+)"/) || [])[1]
  const local = (html.match(/"addressLocality"\s*:\s*"([^"]+)"/) || [])[1]
  const region = (html.match(/"addressRegion"\s*:\s*"([^"]+)"/) || [])[1]
  if (street) adres = metinTemiz([street, local, region].filter(Boolean).join(', '))

  const ilce = local || ilceBul(adres, html)
  const website = ((html.match(/rel="noopener[^"]*" href="(https?:\/\/(?!www\.doktorsitesi)[^"]+)"/) || [])[1]) || ''
  const ozel = ozelMi(html)
  const hastaneOnly = /hastanesi/i.test(adres) && !/muayenehane|klinik/i.test(html.slice(0, 8000))

  return {
    isim,
    brans: meta.brans,
    sehir: meta.sehir,
    kaynak: meta.kaynak,
    path,
    url: `${DS}${path}`,
    telefon,
    adres,
    ilce,
    website,
    ozel_muayenehane: ozel && !hastaneOnly ? 'evet' : 'hayir_veya_belirsiz',
    skor: skorHesapla({ ozel: ozel && !hastaneOnly, telefon, ilce, website, sehir: meta.sehir }),
  }
}

function csvYaz(rows) {
  const cols = ['skor', 'isim', 'brans', 'sehir', 'ilce', 'telefon', 'adres', 'website', 'ozel_muayenehane', 'kaynak', 'url', 'demo_cta', 'trial_cta', 'durum']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.join(',')]
  for (const r of rows) {
    lines.push(
      cols
        .map((c) => {
          if (c === 'demo_cta') return esc(`${DEMO} (Cal: ${CAL})`)
          if (c === 'trial_cta') return esc(TRIAL)
          if (c === 'durum') return esc('yeni')
          return esc(r[c])
        })
        .join(','),
    )
  }
  return lines.join('\n') + '\n'
}

function dedupeKey(r) {
  // Prefer stable profile URL. Do NOT key on 0850 — Doktortakvimi shares click-to-call across doctors.
  if (r.url) return `u:${r.url.replace(/\/$/, '').toLowerCase()}`
  const isim = (r.isim || '').toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, '')
  const tel = (r.telefon || '').replace(/\D/g, '').slice(-10)
  const mobile = tel.length === 10 && tel.startsWith('5')
  if (mobile) return `m:${tel}`
  return `n:${isim}:${r.brans}:${r.sehir}`
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(ART, { recursive: true })

  /** @type {{ url: string, meta: typeof LISTELER[0] }[]} */
  const kuyruk = []
  const gorulen = new Set()

  for (const liste of LISTELER) {
    let bos = 0
    for (let page = 1; page <= liste.maxPages; page++) {
      let url
      if (liste.tip === 'dt') url = page === 1 ? liste.listBase : `${liste.listBase}/${page}`
      else url = page === 1 ? liste.listBase : `${liste.listBase}?page=${page}`
      process.stderr.write(`list ${liste.kaynak}/${liste.brans}/${liste.sehir} p${page}… `)
      try {
        const html = await getir(url)
        const found =
          liste.tip === 'dt' ? dtProfilUrlBul(html) : dsProfilUrlBul(html, liste.sehir).map((p) => `${DS}${p}`)
        let ek = 0
        for (const u of found) {
          if (gorulen.has(u)) continue
          gorulen.add(u)
          kuyruk.push({ url: u, meta: liste })
          ek++
        }
        process.stderr.write(`+${ek} (queue ${kuyruk.length})\n`)
        if (found.length === 0 || ek === 0) {
          bos++
          if (bos >= 2) break
        } else bos = 0
      } catch (e) {
        process.stderr.write(`fail ${e.message}\n`)
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
      const row = meta.tip === 'dt' ? dtAlanCikar(html, url, meta) : dsAlanCikar(html, url.replace(DS, ''), meta)
      leads.push(row)
    } catch (e) {
      leads.push({
        isim: url,
        brans: meta.brans,
        sehir: meta.sehir,
        kaynak: meta.kaynak,
        path: url,
        url,
        telefon: '',
        adres: '',
        ilce: '',
        website: '',
        ozel_muayenehane: 'hata',
        skor: 0,
        hata: e.message,
      })
    }
    await sleep(DELAY_MS)
  }

  // Dedupe: prefer higher skor / telefon
  const map = new Map()
  for (const r of leads) {
    const k = dedupeKey(r)
    const prev = map.get(k)
    if (!prev || r.skor > prev.skor || (r.telefon && !prev.telefon)) map.set(k, r)
  }
  const birlesik = [...map.values()]
  const ozel = birlesik.filter((l) => l.ozel_muayenehane === 'evet').sort((a, b) => b.skor - a.skor)
  const diger = birlesik.filter((l) => l.ozel_muayenehane !== 'evet').sort((a, b) => b.skor - a.skor)
  const sirali = [...ozel, ...diger]

  const csv = csvYaz(sirali)
  const csvPath = join(OUT_DIR, 'tr-istanbul-pedi-leads.csv')
  const jsonPath = join(OUT_DIR, 'tr-istanbul-pedi-leads.json')
  const ozelTel = ozel.filter((x) => x.telefon)
  const ozet = {
    tarih: new Date().toISOString(),
    kaynaklar: ['Doktortakvimi', 'Doktorsitesi'],
    branşlar: ['pediatri', 'kadin-dogum', 'dermatoloji'],
    sehirler: ['istanbul', 'ankara', 'izmir'],
    demo: {
      page: DEMO,
      cal: CAL,
      host: 'Dr. Gökhan Mamur (US, remote video, visitor TZ)',
      trial: TRIAL,
    },
    sayim: {
      profil_taranan: leads.length,
      tekil: birlesik.length,
      ozel_muayenehane: ozel.length,
      telefonu_olan_ozel: ozelTel.length,
      telefonu_olan_hepsi: birlesik.filter((x) => x.telefon).length,
    },
    oncelik_hedef: ozelTel.slice(0, 40).map((r) => ({ isim: r.isim, brans: r.brans, sehir: r.sehir, ilce: r.ilce, telefon: r.telefon })),
    not: 'Gökhan ABD’de — demolar Cal.com video. Stand yok. Free trial + peer invite = WOM. Outreach onay kuyruğu ile.',
  }
  writeFileSync(csvPath, csv)
  writeFileSync(jsonPath, JSON.stringify({ ozet, leads: sirali }, null, 2))
  writeFileSync(join(ART, 'tr-leads.csv'), csv)
  writeFileSync(join(ART, 'ozet.json'), JSON.stringify(ozet, null, 2))
  // Call-ready pack (özel + telefon only)
  const callReady = csvYaz(ozelTel)
  writeFileSync(join(OUT_DIR, 'tr-call-ready-leads.csv'), callReady)
  writeFileSync(join(ART, 'tr-call-ready-leads.csv'), callReady)
  console.log(JSON.stringify(ozet, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
