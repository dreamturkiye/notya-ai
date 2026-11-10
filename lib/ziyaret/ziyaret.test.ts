/**
 * ZIYARET-SAYACI-01 (Kaan, 2026-11-10) — the public-site visit counter. The SAME file on main and on every release branch.
 * Synthetic data only; the database is a stand-in (no network).
 *
 *   1. bots, previews and non-browsers are dropped; real browsers are counted;
 *   2. nothing but day, path, referrer HOST, device and an opaque hash reaches the database — never the raw IP or UA;
 *   3. the salt is per UTC day: a new day fetches a new salt, the same visitor hashes differently, and the migration
 *      deletes old salts and old uniqueness rows;
 *   4. the beacon is mounted only on public marketing pages, never inside the signed-in app;
 *   5. the console maths: zero and missing days, "not enough data yet", no division by zero, honest funnel.
 *   (The founder-only refusal of the stats is tested with each build's real route: lib/kurucu/kurucu.test.ts on main,
 *   lib/ulke/kurucu/kurucuUlke.test.ts in a country build.)
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import {
  botMu, cihazSinifi, refHostuTemizle, SAYILAN_SAYFALAR, sayilanYolMu, tuzOnbellegi, yolTemizle, ziyaretciOzeti, ziyaretIsle,
  ziyaretSiniriniTemizle, type ZiyaretKaydi,
} from './ziyaret'
import { ziyaretOzetiTemizle, type ZiyaretOzeti } from './tipler'
import { aralikBasi, donemKiyas, gunEkle, haftaKiyas, hareketliOrtalama, huni, kayitGunlugu, kumulatif, ozetKutulari, seriDoldur, toplamOzet } from './grafik'

const KOK = resolve(__dirname, '../..')
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0'
const IP = '203.0.113.77'

function sahteDepo(tuzlar: Record<string, string> = {}) {
  const kayitlar: ZiyaretKaydi[] = []
  const tuzIstekleri: string[] = []
  return {
    kayitlar,
    tuzIstekleri,
    depo: {
      tuzAl: async (ulke: string, gun: string) => { tuzIstekleri.push(`${ulke}:${gun}`); return tuzlar[gun] ?? 'a'.repeat(64) },
      kaydet: async (k: ZiyaretKaydi) => { kayitlar.push(k) },
    },
  }
}
const istek = (ua: string | null, p: unknown = '/doktor', r: unknown = 'www.google.com', ip = IP) => ({ ua, ip, host: 'www.notya.io', govde: JSON.stringify({ p, r }) })

beforeEach(() => ziyaretSiniriniTemizle())

describe('visit counter — bots and paths', () => {
  it('bot, crawler, preview, headless, Lighthouse, Vercel screenshot and non-browser agents are dropped', async () => {
    const botlar = [
      null, '', 'curl/8.4.0', 'python-requests/2.31', 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 Chrome-Lighthouse',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 vercel-screenshot/1.0',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/8.0.2 Safari/600.2.5 (Applebot/0.1)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'WhatsApp/2.23.20.0', 'Mozilla/5.0 (compatible; AhrefsBot/7.0)',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Prerender (+https://github.com/prerender/prerender)',
    ]
    for (const ua of botlar) assert.equal(botMu(ua), true, String(ua))
    for (const ua of [CHROME, IPHONE, FIREFOX]) assert.equal(botMu(ua), false, ua)
    const { depo, kayitlar, tuzIstekleri } = sahteDepo()
    for (const ua of botlar) assert.equal(await ziyaretIsle(istek(ua), depo, { ulke: 'tr' }), 'bot')
    assert.equal(kayitlar.length, 0)
    assert.equal(tuzIstekleri.length, 0, 'a bot costs no database call at all')
  })

  it('only the listed public pages are counted; the query string is never part of the path', async () => {
    assert.equal(yolTemizle('/doktor?utm_source=x#fiyat'), '/doktor')
    assert.equal(yolTemizle('/giris/doktor/'), '/giris/doktor')
    const { depo, kayitlar } = sahteDepo()
    for (const p of ['/dashboard/doktor', '/today', '/patients', '/portal', '/kurucu', '/asistan', 'https://evil.test/doktor', 42, null]) {
      assert.equal(await ziyaretIsle(istek(CHROME, p), depo, { ulke: 'tr' }), 'gecersiz', String(p))
    }
    assert.equal(await ziyaretIsle(istek(CHROME, '/doktor?ref=abc'), depo, { ulke: 'tr' }), 'sayildi')
    assert.equal(kayitlar[0].yol, '/doktor')
    assert.equal(await ziyaretIsle({ ...istek(CHROME), govde: 'x'.repeat(2000) }, depo, { ulke: 'tr' }), 'gecersiz')
    assert.equal(await ziyaretIsle({ ...istek(CHROME), govde: 'not json' }, depo, { ulke: 'tr' }), 'gecersiz')
  })

  it('referrer: host only, lower-case, own host is "(internal)", junk is dropped; device class from the agent', () => {
    assert.equal(refHostuTemizle('WWW.Google.com', 'www.notya.io'), 'google.com')
    assert.equal(refHostuTemizle('www.notya.io', 'www.notya.io'), '(internal)')
    assert.equal(refHostuTemizle('notya.io', 'www.notya.io:443'), '(internal)')
    assert.equal(refHostuTemizle('https://x.test/a?b', 'www.notya.io'), '')
    assert.equal(refHostuTemizle('<script>', 'www.notya.io'), '')
    assert.equal(refHostuTemizle('a'.repeat(120) + '.com', 'www.notya.io'), '')
    assert.equal(cihazSinifi(IPHONE), 'mobile')
    assert.equal(cihazSinifi(CHROME), 'desktop')
  })

  it('a reload loop is capped per visitor (30 per 10 minutes); another visitor is still counted', async () => {
    const { depo } = sahteDepo()
    const sonuclar: string[] = []
    for (let i = 0; i < 32; i++) sonuclar.push(await ziyaretIsle(istek(CHROME), depo, { ulke: 'tr' }))
    assert.equal(sonuclar.filter((s) => s === 'sayildi').length, 30)
    assert.equal(sonuclar.at(-1), 'sinir')
    assert.equal(await ziyaretIsle(istek(CHROME, '/doktor', '', '198.51.100.9'), depo, { ulke: 'tr' }), 'sayildi')
  })

  it('a database failure is swallowed (the page never sees it)', async () => {
    const depo = { tuzAl: async () => { throw new Error('down') }, kaydet: async () => {} }
    assert.equal(await ziyaretIsle(istek(CHROME), depo, { ulke: 'tr' }), 'hata')
  })
})

describe('visit counter — privacy', () => {
  it('no raw IP and no user-agent string is ever passed to the database; only an opaque 64-hex hash', async () => {
    const { depo, kayitlar } = sahteDepo()
    await ziyaretIsle(istek(CHROME, '/doktor', 'news.ycombinator.com'), depo, { ulke: 'au' })
    await ziyaretIsle(istek(IPHONE, '/kayit', ''), depo, { ulke: 'au' })
    assert.equal(kayitlar.length, 2)
    const yazilan = JSON.stringify(kayitlar)
    assert.doesNotMatch(yazilan, /203\.0\.113\.77/)
    assert.doesNotMatch(yazilan, /Mozilla|AppleWebKit|iPhone|Chrome\/|Safari/)
    for (const k of kayitlar) {
      assert.deepEqual(Object.keys(k).sort(), ['cihaz', 'gun', 'ozet', 'ref', 'ulke', 'yol'])
      assert.match(k.ozet, /^[0-9a-f]{64}$/)
      assert.equal(k.ulke, 'au')
    }
    assert.equal(kayitlar[0].ref, 'news.ycombinator.com')
  })

  it('the migration stores no IP, user agent or full referrer column, and gives browsers no access', () => {
    const sql = readFileSync(join(KOK, 'lib/db/migrations/194_site_ziyaret_sayaci.sql'), 'utf8')
    const yorumsuz = sql.replace(/--[^\n]*/g, '')
    for (const t of ['site_visits_daily', 'site_visit_uniques', 'site_visit_salts']) {
      const govde = new RegExp(`create table if not exists public\\.${t} \\(([\\s\\S]*?)\\n\\);`).exec(yorumsuz)?.[1]
      assert.ok(govde, t)
      assert.doesNotMatch(govde!, /\b(ip|ip_address|user_agent|ua|referrer_url|referer|url)\b/i, `${t} has a column that could hold a raw identifier`)
      assert.match(yorumsuz, new RegExp(`alter table public\\.${t} enable row level security;`))
      assert.match(yorumsuz, new RegExp(`revoke all on table public\\.${t} from anon, authenticated;`))
      assert.doesNotMatch(yorumsuz, new RegExp(`create policy[^;]*${t}`), `${t}: no browser rule at all`)
    }
    for (const f of ['site_visit_salt', 'site_visit_record', 'site_visit_stats']) {
      assert.match(yorumsuz, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`))
      assert.match(yorumsuz, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role;`))
    }
    assert.ok(existsSync(join(KOK, 'lib/db/migrations/geri-al/194_site_ziyaret_sayaci.geri-al.sql')))
  })

  it('the beacon sends the path and the referrer HOST only, sets no cookie and stores no identifier', () => {
    const k = readFileSync(join(KOK, 'components/ziyaret/ZiyaretSayaci.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    assert.match(k, /new URL\(document\.referrer\)\.hostname/)
    assert.doesNotMatch(k, /document\.cookie|setItem|sessionStorage|location\.search|location\.href|indexedDB/)
    assert.match(k, /sendBeacon/)
    assert.match(k, /keepalive: true/)
  })
})

describe('visit counter — daily salt rotation', () => {
  it('one salt fetch per instance per day; a new UTC day fetches a new salt and the same visitor hashes differently', async () => {
    const tuzlar: Record<string, string> = { '2026-11-10': '1'.repeat(64), '2026-11-11': '2'.repeat(64) }
    const { depo, kayitlar, tuzIstekleri } = sahteDepo(tuzlar)
    const onbellek = tuzOnbellegi(depo.tuzAl)
    const d = { tuzAl: (u: string, g: string) => onbellek.al(u, g), kaydet: depo.kaydet }
    const gun1 = Date.parse('2026-11-10T22:00:00Z')
    const gun2 = Date.parse('2026-11-11T08:00:00Z')
    await ziyaretIsle(istek(CHROME), d, { ulke: 'tr', simdi: gun1 })
    await ziyaretIsle(istek(CHROME, '/kayit'), d, { ulke: 'tr', simdi: gun1 + 1000 })
    await ziyaretIsle(istek(CHROME), d, { ulke: 'tr', simdi: gun2 })
    assert.deepEqual(tuzIstekleri, ['tr:2026-11-10', 'tr:2026-11-11'])
    assert.equal(kayitlar[0].ozet, kayitlar[1].ozet, 'same visitor, same day: one key')
    assert.notEqual(kayitlar[0].ozet, kayitlar[2].ozet, 'same visitor, next day: unlinkable key')
    assert.equal(kayitlar[2].gun, '2026-11-11')
    assert.notEqual(ziyaretciOzeti('1'.repeat(64), IP, CHROME, 'www.notya.io'), ziyaretciOzeti('1'.repeat(64), IP, CHROME, 'au.notya.io'), 'the host is part of the key')
  })

  it('a malformed salt is never used or cached', async () => {
    const o = tuzOnbellegi(async () => 'short')
    assert.equal(await o.al('tr', '2026-11-10'), null)
  })

  it('the database deletes earlier salts and uniqueness rows older than two days, and refuses writes for other days', () => {
    const sql = readFileSync(join(KOK, 'lib/db/migrations/194_site_ziyaret_sayaci.sql'), 'utf8')
    assert.match(sql, /delete from public\.site_visit_salts where day < p_day;/)
    assert.match(sql, /delete from public\.site_visit_uniques where day < p_day - 1;/)
    assert.match(sql, /p_day < current_date - 1 or p_day > current_date \+ 1/)
    assert.match(sql, /gen_random_uuid\(\)::text \|\| gen_random_uuid\(\)::text/)
  })
})

describe('visit counter — the beacon is mounted on public pages only', () => {
  // Every file allowed to render <ZiyaretSayaci />: Türkiye's public pages, then the country builds' public pages.
  const IZINLI = new Map<string, string>([
    ['app/doktor/layout.tsx', '/doktor'],
    ['app/notya-klinik/(vitrin)/layout.tsx', '/notya-klinik'],
    ['app/demo/layout.tsx', '/demo'],
    ['app/home/page.tsx', '/home'],
    ['app/avukat/page.tsx', '/avukat'],
    ['app/mali/page.tsx', '/mali'],
    ['app/kayit/page.tsx', '/kayit'],
    ['app/giris/page.tsx', '/giris'],
    ['app/giris/doktor/page.tsx', '/giris/doktor'],
    ['app/giris/notya-klinik/page.tsx', '/giris/notya-klinik'],
    ['app/giris/avukat/page.tsx', '/giris/avukat'],
    ['app/giris/mali/page.tsx', '/giris/mali'],
    ['app/page.ulke.tsx', '/'],
    ['app/for-clinics/page.ulke.tsx', '/for-clinics'],
    ['app/login/page.ulke.tsx', '/login'],
    ['app/signup/page.ulke.tsx', '/signup'],
    ['app/demo/page.ulke.tsx', '/demo'],
    ['app/founding/page.ulke.tsx', '/founding'],
    ['app/dietitian-beta/page.ulke.tsx', '/dietitian-beta'],
  ])
  const UYGULAMA = ['/dashboard', '/dashboard/doktor', '/today', '/patients', '/patient', '/visit', '/portal', '/asistan', '/kurucu', '/settings', '/calendar', '/messages', '/tools', '/clinic', '/desk', '/welcome', '/start', '/onboarding', '/doktor-tools', '/ozel-branslar', '/session', '/intake', '/randevu', '/billing', '/account', '/reports']

  it('no signed-in application route is a counted page', () => {
    for (const y of UYGULAMA) assert.equal(sayilanYolMu(y), false, y)
    for (const y of IZINLI.values()) assert.ok(SAYILAN_SAYFALAR.includes(y), y)
  })

  it('every file that renders the beacon is a public page on the list — none under the doctor, patient or founder app', () => {
    const kullananlar: string[] = []
    const gez = (d: string) => {
      if (!existsSync(d)) return
      for (const ad of readdirSync(d)) {
        if (ad === 'node_modules' || ad === '.next') continue
        const yol = join(d, ad)
        if (statSync(yol).isDirectory()) gez(yol)
        else if (/\.tsx?$/.test(ad) && !/\.test\.tsx?$/.test(ad) && /<ZiyaretSayaci\b/.test(readFileSync(yol, 'utf8'))) kullananlar.push(relative(KOK, yol).split(sep).join('/'))
      }
    }
    for (const d of ['app', 'components', 'countries', 'lib']) gez(join(KOK, d))
    assert.ok(kullananlar.length >= 4, `the beacon is mounted nowhere (${kullananlar.join(', ')})`)
    for (const f of kullananlar) {
      assert.ok(IZINLI.has(f), `${f} renders the beacon but is not a listed public page`)
      assert.doesNotMatch(f, /^app\/(dashboard|asistan|portal|kurucu|today|patients?|visit|settings|calendar|messages|tools|clinic|desk|welcome|start|onboarding|doktor-tools|ozel-branslar|api)\//)
    }
  })
})

describe('visitor maths (console)', () => {
  const ozet = (ilkGun: string | null, bugun: string, gunler: [string, number][]): ZiyaretOzeti => ({
    ilkGun, bugun, gunluk: gunler.map(([d, v]) => ({ d, v, p: v * 2 })), haftalik: [], sayfalar: [], kaynaklar: [], cihazlar: [],
  })

  it('missing days inside the counted range are zero; nothing exists before the first counted day', () => {
    const s = seriDoldur([{ d: '2026-11-03', v: 4, p: 5 }, { d: '2026-11-06', v: 1, p: 1 }], '2026-11-03', '2026-11-07')
    assert.deepEqual(s.map((g) => g.v), [4, 0, 0, 1, 0])
    assert.deepEqual(seriDoldur([], '2026-11-07', '2026-11-03'), [])
    assert.equal(aralikBasi('90', '2026-11-01', '2026-11-10'), '2026-11-01', 'a 90-day range never reaches before counting started')
    assert.equal(aralikBasi('7', '2026-01-01', '2026-11-10'), '2026-11-04')
    assert.deepEqual(kumulatif([0, 3, 0, 2]), [0, 3, 3, 5])
  })

  it('7-day average: null until seven days exist, zeros included', () => {
    const o = hareketliOrtalama([7, 0, 0, 0, 0, 0, 0, 7], 7)
    assert.deepEqual(o.slice(0, 6), [null, null, null, null, null, null])
    assert.equal(o[6], 1)
    assert.equal(o[7], 1)
    assert.deepEqual(hareketliOrtalama([], 7), [])
  })

  it('week vs week and month vs month: "not enough data yet" until both periods are complete and counted', () => {
    assert.deepEqual(donemKiyas(null, 7), { durum: 'yetersiz' })
    assert.deepEqual(donemKiyas(ozet(null, '2026-11-10', []), 7), { durum: 'yetersiz' })
    // counting started 2026-11-01: the previous 7-day period would start 2026-10-27 → not enough
    assert.deepEqual(donemKiyas(ozet('2026-11-01', '2026-11-10', [['2026-11-01', 5]]), 7), { durum: 'yetersiz' })
    // started 2026-10-27, today 2026-11-10: previous = 27 Oct–2 Nov, this = 3–9 Nov (today excluded); missing days count 0
    const k = donemKiyas(ozet('2026-10-27', '2026-11-10', [['2026-10-27', 10], ['2026-11-05', 15], ['2026-11-10', 99]]), 7)
    assert.equal(k.durum, 'tamam')
    if (k.durum === 'tamam') { assert.equal(k.bu, 15); assert.equal(k.onceki, 10); assert.equal(k.fark, 5); assert.equal(k.yuzde, 50) }
    // zero base: growth % is null (never Infinity / NaN)
    const s = donemKiyas(ozet('2026-10-20', '2026-11-10', [['2026-11-08', 3]]), 7)
    assert.equal(s.durum, 'tamam')
    if (s.durum === 'tamam') { assert.equal(s.onceki, 0); assert.equal(s.yuzde, null) }
    const z = donemKiyas(ozet('2026-10-01', '2026-11-10', []), 7)
    if (z.durum === 'tamam') { assert.equal(z.bu, 0); assert.equal(z.fark, 0); assert.equal(z.yuzde, null) }
    assert.deepEqual(donemKiyas(ozet('2026-10-01', '2026-11-10', []), 30), { durum: 'yetersiz' }, 'month needs 60 counted days')
  })

  it('week-over-week uses the last two COMPLETE ISO weeks only', () => {
    // 2026-11-10 is a Tuesday: running week from Mon 9 Nov; last complete = 2–8 Nov; before = 26 Oct–1 Nov
    assert.deepEqual(haftaKiyas(ozet('2026-10-27', '2026-11-10', [])), { durum: 'yetersiz' })
    const k = haftaKiyas(ozet('2026-10-26', '2026-11-10', [['2026-10-26', 4], ['2026-11-01', 4], ['2026-11-02', 2], ['2026-11-09', 50]]))
    assert.equal(k.durum, 'tamam')
    if (k.durum === 'tamam') { assert.equal(k.bu, 2); assert.equal(k.onceki, 8); assert.equal(k.yuzde, -75) }
  })

  it('tiles, totals and funnel handle empty data without inventing numbers', () => {
    assert.deepEqual(ozetKutulari(null).bugun, { v: 0, p: 0 })
    const o = ozet('2026-11-09', '2026-11-10', [['2026-11-09', 3], ['2026-11-10', 2]])
    assert.deepEqual(ozetKutulari(o), { bugun: { v: 2, p: 4 }, dun: { v: 3, p: 6 }, yedi: { v: 5, p: 10 }, otuz: { v: 5, p: 10 } })
    assert.equal(toplamOzet([null, undefined]), null)
    const t = toplamOzet([o, ozet('2026-11-10', '2026-11-10', [['2026-11-10', 1]]), null])!
    assert.equal(t.ilkGun, '2026-11-09')
    assert.deepEqual(t.gunluk.map((g) => g.v), [3, 3])
    const kayit = kayitGunlugu([
      { kayit: '2026-11-10T10:00:00Z', plan: 'trial', denemeKalanGun: 14 },
      { kayit: '2026-11-10T11:00:00Z', plan: 'trial', denemeKalanGun: null },
      { kayit: '2026-10-01T11:00:00Z', plan: 'paid', denemeKalanGun: null },
      { kayit: null, plan: 'trial', denemeKalanGun: 3 },
    ])
    assert.deepEqual(kayit, [{ d: '2026-10-01', k: 1, t: 1 }, { d: '2026-11-10', k: 2, t: 1 }])
    const h = huni(o.gunluk, kayit, '2026-11-09', '2026-11-10')
    assert.deepEqual(h, { ziyaretci: 5, kayit: 2, deneme: 1, kayitOrani: 40, denemeOrani: 50 })
    assert.deepEqual(huni([], [], '2026-11-09', '2026-11-10'), { ziyaretci: 0, kayit: 0, deneme: 0, kayitOrani: null, denemeOrani: null })
    assert.equal(gunEkle('2026-03-01', -1), '2026-02-28')
  })

  it('a summary from a database or a country is cut to the allowed keys and bounds', () => {
    assert.equal(ziyaretOzetiTemizle(null), null)
    assert.equal(ziyaretOzetiTemizle({ bugun: 'x', gunluk: [] }), null)
    const t = ziyaretOzetiTemizle({ ilkGun: '2026-11-10', bugun: '2026-11-10', gunluk: [{ d: '2026-11-10', v: 2, p: -1, ip: '1.2.3.4' }], haftalik: [{ w: '2026-W46', bas: '2026-11-09', v: 2, p: 3 }], sayfalar: [{ ad: '/doktor', v: 1, p: 2, x: 1 }], kaynaklar: [], cihazlar: [], ekstra: 1 })!
    assert.deepEqual(t.gunluk, [{ d: '2026-11-10', v: 2, p: 0 }])
    assert.deepEqual(t.sayfalar, [{ ad: '/doktor', v: 1, p: 2 }])
    assert.equal('ekstra' in t, false)
  })
})
