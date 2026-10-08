/**
 * NOTYA-ULKE-01 — invitation codes, and what a TÜRKİYE build (no country configured) does with the core country
 * routes: they are not routes there at all, and if called directly they answer "not found".
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DAVET_ALFABESI, DAVET_KODU_UZUNLUGU, davetKoduBicimiGecerli, davetKoduHash, davetKoduNormalle, davetKoduUret } from './davet'

const KOK = resolve(__dirname, '../..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'sahte-servis-anahtari'

describe('invitation codes', () => {
  it('a generated code has the documented shape and 80 bits', () => {
    const kodlar = new Set(Array.from({ length: 200 }, davetKoduUret))
    assert.equal(kodlar.size, 200)
    for (const k of kodlar) {
      assert.match(k, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/)
      assert.equal(davetKoduBicimiGecerli(k), true)
    }
    assert.equal(DAVET_ALFABESI.length, 32)
    assert.equal(DAVET_KODU_UZUNLUGU * Math.log2(DAVET_ALFABESI.length), 80)
  })

  it('what a person types is forgiven: case, spaces, dashes, O for 0, I and L for 1', () => {
    assert.equal(davetKoduNormalle(' qate-st00 0000_0oIl '), 'QATEST0000000011')
    assert.equal(davetKoduHash('QATE-ST00-0000-0011'), davetKoduHash('qatest0000000oil'))
    assert.match(davetKoduHash('x'), /^[0-9a-f]{64}$/)
    for (const kotu of [undefined, null, '', 'abc', 'ABCD-EFGH-JKMN-PQR', 'ABCD-EFGH-JKMN-PQRS-T', 'UUUU-UUUU-UUUU-UUUU', 12345]) assert.equal(davetKoduBicimiGecerli(kotu), false, String(kotu))
  })

  it('the issuing script uses the same alphabet and length, connects to nothing, and prints only hashes into SQL', () => {
    const betik = oku('scripts/ulke-davet-kodu.mjs')
    assert.ok(betik.includes(`const ALFABE = '${DAVET_ALFABESI}'`))
    assert.ok(betik.includes(`length: ${DAVET_KODU_UZUNLUGU}`))
    assert.doesNotMatch(betik, /createClient|fetch\(|SUPABASE|process\.env/)
    const r = spawnSync('node', [join(KOK, 'scripts/ulke-davet-kodu.mjs'), '--ulke', 'uz', '--adet', '2', '--not', "O'Brien pilot", '--gun', '30'], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    const kodlar = [...r.stdout.matchAll(/^ {3}([0-9A-Z]{4}(?:-[0-9A-Z]{4}){3})$/gm)].map((m) => m[1])
    assert.equal(kodlar.length, 2)
    for (const k of kodlar) {
      assert.ok(r.stdout.includes(`('${davetKoduHash(k)}', 'uz', 'O''Brien pilot', now() + interval '30 days')`), 'the SQL must carry the hash of the printed code')
      assert.equal(r.stdout.split(k.replace(/-/g, '')).length, 1, 'the code itself must not be in the SQL')
    }
    assert.equal(spawnSync('node', [join(KOK, 'scripts/ulke-davet-kodu.mjs'), '--ulke', 'xx'], { encoding: 'utf8' }).status, 1)
  })

  it('migration 129: additive; the table is closed to everyone but the server; a code is taken atomically', () => {
    const sql = oku('lib/db/migrations/129_davet_kodlari.sql')
    assert.match(sql, /create table if not exists public\.davet_kodlari/)
    assert.match(sql, /alter table public\.davet_kodlari enable row level security;/)
    assert.match(sql, /revoke all on table public\.davet_kodlari from anon, authenticated;/)
    assert.match(sql, /where kod_hash = p_hash\s+and ulke = p_ulke\s+and kullanim < azami_kullanim\s+and \(son_gecerlilik is null or son_gecerlilik > now\(\)\)/)
    assert.match(sql, /revoke execute on function public\.davet_kodu_kullan\(text, text\) from public, anon, authenticated;/)
    assert.match(sql, /values \('129', '129_davet_kodlari\.sql'/)
    assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /\bdrop\s+(table|column|policy)\b|\bdelete\s+from\b|\btruncate\b|\balter\s+table\s+public\.(users|patients|notes|sessions)\b/i)
    assert.doesNotMatch(sql, /\bkod\s+text\b/, 'the code itself is never stored')
  })
})

describe('a Türkiye build and the core country routes', () => {
  it('*.ulke.* files are not routes: Next reads page.tsx / route.ts / middleware.ts, exactly as before', () => {
    const config = oku('next.config.mjs')
    // pageExtensions is set ONLY for a build that is not the pre-split application; Türkiye's config carries no such key.
    assert.equal((config.match(/pageExtensions/g) || []).length, 1)
    assert.match(config, /\.\.\.\(ulkeDerleme\.bolunmemisUygulama \? \{\} : \{ pageExtensions:/)
    const varsayilan = /^(page|route|layout|not-found|error|global-error|middleware)\.(tsx|ts|jsx|js)$/
    for (const ad of ['page.ulke.tsx', 'route.ulke.ts', 'layout.ulke.tsx', 'not-found.ulke.tsx', 'error.ulke.tsx', 'global-error.ulke.tsx', 'middleware.ulke.ts']) assert.doesNotMatch(ad, varsayilan, ad)
  })

  it('the root files of the pre-split application know nothing about countries (they are byte-for-byte main)', () => {
    for (const dosya of ['app/layout.tsx', 'app/page.tsx', 'app/not-found.tsx', 'app/error.tsx', 'app/global-error.tsx', 'middleware.ts', 'app/doktor-tools/layout.tsx']) {
      assert.doesNotMatch(oku(dosya), /lib\/ulke|countries\/|NOTYA_COUNTRY|ULKE/, dosya)
    }
  })

  it('called directly in a Türkiye build, sign-up by invitation answers "not found" and the pages refuse to render', async () => {
    const { NextRequest } = await import('next/server')
    const kayit = await import('../../app/api/ulke/kayit/route.ulke')
    const r = await kayit.POST(new NextRequest('https://notya.test/api/ulke/kayit', { method: 'POST', body: JSON.stringify({ adSoyad: 'QA', eposta: 'qa@notya.test', sifre: '12345678', davetKodu: 'QATEST0000000001' }) }))
    assert.equal(r.status, 404)
    assert.deepEqual(await r.json(), { code: 'NOT_FOUND' })
    for (const yol of ['../../app/login/page.ulke', '../../app/signup/page.ulke', '../../app/welcome/page.ulke']) {
      const sayfa = (await import(yol)) as { default: (p: { searchParams?: Record<string, string> }) => unknown }
      assert.throws(() => sayfa.default({ searchParams: {} }), (e: Error & { digest?: string }) => /NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK;404/.test(String(e.digest ?? e.message)), yol)
    }
  })
})
