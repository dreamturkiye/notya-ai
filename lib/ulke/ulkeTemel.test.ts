/**
 * NOTYA-ULKE-PORTAL-01 — ONE DATABASE PER COUNTRY: the list of country migrations and the one-file baseline of a new
 * country database stay in step, without a database.
 *
 * Kaan, 2026-10-09: "We had issues with common databases before. Keep seperation between the two and any other
 * future country versions". A country's database is its own; it is created by running
 * lib/db/ulke/000_yeni_ulke_veritabani.sql once, and no country script is ever run on the Turkish database.
 *
 *   1. The baseline is EXACTLY what scripts/ulke-temel-uret.mjs gives from the migrations of lib/db/ulke/gocler.json
 *      — so adding a migration without regenerating it fails here.
 *   2. The list is complete: every migration file that creates or alters a country table is on it, in order.
 *   3. The baseline holds no `drop`, names nothing that exists only in the Turkish database, is one transaction and
 *      refuses a database that is not empty before it does anything else.
 *   4. The ledger is server-only.
 *   5. Every migration written since the first country's database exists can be applied to that database as it is:
 *      no `drop … if exists`, one transaction, its own ledger row, a rollback file, and a refusal on a database that
 *      is not a country database.
 *
 * That the baseline gives the same SCHEMA as the migrations is proven on a real PostgreSQL by
 * scripts/ulke-temel-kaniti.mjs; this file is what `npm run test:ulke` can check on any machine.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const KOK = resolve(__dirname, '../..')
const oku = (yol: string) => readFileSync(join(KOK, yol), 'utf8')
const yorumsuz = (s: string) => s.split('\n').filter((x) => !/^\s*--/.test(x)).join('\n')

type Uretici = {
  gocListesi: (kok?: string) => { defter: string; temel: string; dizin: string; gocler: string[]; elleUygulanan: string[] }
  temelUret: (kok?: string) => string
  sadelestir: (sql: string, secenek?: { dropAt?: boolean; yorumAt?: boolean }) => string
  dropsuz: (sql: string) => string
}
let U: Uretici
let L: ReturnType<Uretici['gocListesi']>
let TEMEL = ''

/** Tables only the Turkish database has. A country database never names one. */
const TURKIYE_TABLOLARI = ['users', 'patients', 'sessions', 'notes', 'ai_kullanim', 'ai_token_kullanim', 'randevular', 'doktor_calisma_saatleri', 'hasta_portal_tokenlari', 'hasta_mesajlar']

before(async () => {
  U = (await import(pathToFileURL(join(KOK, 'scripts/ulke-temel-uret.mjs')).href)) as Uretici
  L = U.gocListesi(KOK)
  TEMEL = oku(L.temel)
})

describe('one database per country — the baseline of a new country database', () => {
  it('the baseline file is exactly what the generator gives from the listed migrations', () => {
    assert.equal(TEMEL, U.temelUret(KOK), `${L.temel} is stale or was edited by hand. Run: node scripts/ulke-temel-uret.mjs`)
  })

  it('the list is in order, starts where the country migrations start, and never holds 128', () => {
    assert.ok(L.gocler.length >= 7)
    assert.deepEqual([...L.gocler].sort(), L.gocler, 'the list must be in ascending order')
    assert.equal(new Set(L.gocler).size, L.gocler.length)
    assert.equal(L.gocler[0], '129_davet_kodlari.sql')
    assert.ok(!L.gocler.some((g) => g.startsWith('128')), '128 changes a table of the Turkish database and is superseded: it is never a country migration')
    for (const g of L.gocler) assert.ok(existsSync(join(KOK, L.dizin, g)), `${g}: listed and not there`)
    // The migrations the first country's database received by hand are the first ones of the list, in the same order.
    assert.deepEqual(L.gocler.slice(0, L.elleUygulanan.length), L.elleUygulanan)
  })

  it('every migration file that creates or alters a country table is on the list (none can be forgotten)', async () => {
    const { ULKE_TABLOLARI } = await import('./uygulama/tablolar')
    const adlar = [...ULKE_TABLOLARI, 'davet_kodlari'] as string[]
    const hepsi = readdirSync(join(KOK, L.dizin)).filter((f) => /^\d{3}_.*\.sql$/.test(f) && Number(f.slice(0, 3)) >= 129)
    for (const f of hepsi) {
      const s = yorumsuz(oku(join(L.dizin, f)))
      const dokunuyor = adlar.some((t) => new RegExp(`\\b(create table if not exists|alter table) public\\.${t}\\b`).test(s))
      if (dokunuyor) assert.ok(L.gocler.includes(f), `${f} creates or alters a country table and is not in lib/db/ulke/gocler.json`)
    }
    // … and every country table of the door is created by a listed migration, so it is in the baseline.
    for (const t of adlar) assert.match(TEMEL, new RegExp(`create table if not exists public\\.${t} \\(`), `${t}: not created by the baseline`)
  })

  it('the baseline holds no "drop", is one transaction with a lock timeout, and names every listed migration in order', () => {
    const s = yorumsuz(TEMEL)
    assert.doesNotMatch(s, /\bdrop\b/i)
    assert.equal(s.match(/^begin;$/gm)?.length, 1)
    assert.equal(s.match(/^commit;$/gm)?.length, 1)
    assert.match(s, /^begin;\nset local lock_timeout = '4s';$/m)
    assert.match(s, /\ncommit;\n$/)
    let son = 0
    for (const g of L.gocler) { const i = TEMEL.indexOf(`-- ── ${g} ──`); assert.ok(i > son, `${g}: missing from the baseline or out of order`); son = i }
    // one ledger row per migration
    assert.equal(s.match(/insert into schema_migrations \(version, filename, checksum, applied_at, backfilled, note\)/g)?.length, L.gocler.length)
  })

  it('the baseline refuses a database that is not empty BEFORE it creates anything', () => {
    const s = yorumsuz(TEMEL)
    const koruma = s.indexOf("raise exception 'baseline refused")
    const ilkNesne = s.search(/\bcreate (table|extension|policy|trigger|index|unique index|or replace function)\b|\binsert into\b|\balter table\b/)
    assert.ok(koruma > 0 && ilkNesne > koruma, 'the guard must come before the first statement that creates or writes anything')
    assert.match(s, /where s\.nspname = 'public' and c\.relkind in \('r', 'p', 'v', 'm', 'f'\)/)
  })

  it('the baseline names nothing that exists only in the Turkish database — in a statement or in a comment', () => {
    // auth.users is the sign-in table of every project of the provider: the one "users" a country database has.
    const metin = TEMEL.replace(/\bauth\.users\b/g, 'auth.<sign-in>')
    // As an object of a statement (the words "patients" and "notes" also occur as plain English in a ledger note).
    for (const t of TURKIYE_TABLOLARI) assert.doesNotMatch(metin, new RegExp(`(\\bpublic\\.|\\b(from|join|into|update|table|references|on|exists)\\s+)${t}\\b`, 'i'), `the baseline names the table "${t}"`)
    for (const t of ['ai_kullanim', 'ai_token_kullanim', 'randevular', 'doktor_calisma_saatleri', 'hasta_portal_tokenlari', 'hasta_mesajlar']) assert.doesNotMatch(metin, new RegExp(`\\b${t}\\b`), `the baseline names "${t}"`)
    assert.doesNotMatch(metin, /t[uü]rk/i, 'the baseline speaks of the Turkish database')
    assert.doesNotMatch(metin, /shared database/i)
    assert.equal(yorumsuz(TEMEL).match(/references auth\.users/g)?.length, 1)
  })

  it('the ledger is server-only: row-level security on, no rule, no privilege for the browser roles', () => {
    const d = yorumsuz(oku(L.defter))
    assert.match(d, /create table if not exists public\.schema_migrations \(/)
    assert.match(d, /alter table public\.schema_migrations enable row level security;/)
    assert.match(d, /revoke all on table public\.schema_migrations from anon, authenticated;/)
    assert.doesNotMatch(d, /create policy|grant /i)
    assert.ok(TEMEL.indexOf('public.schema_migrations (') < TEMEL.indexOf(`-- ── ${L.gocler[0]} ──`), 'the ledger must exist before the first migration writes its row')
  })

  it('every migration written since the first country\'s database exists can be applied to it as it is', () => {
    for (const g of L.gocler.filter((x) => !L.elleUygulanan.includes(x))) {
      const ham = oku(join(L.dizin, g))
      const s = yorumsuz(ham)
      assert.doesNotMatch(s, /\bdrop\s+\w+\s+if\s+exists\b/i, `${g}: a "drop … if exists" is refused by the tool that applies migrations by hand; write the statement so that it needs none`)
      assert.match(s, /^\s*begin;\s*set local lock_timeout = '4s';/, `${g}: must open one transaction with a lock timeout`)
      assert.match(s, /commit;\s*$/, `${g}: must end by committing its one transaction`)
      assert.match(s, new RegExp(`insert into schema_migrations \\(version, filename, checksum, applied_at, backfilled, note\\)\\s*values \\('${g.slice(0, 3)}', '${g}'`), `${g}: must write its own ledger row`)
      assert.match(s, /to_regclass\('public\.ulke_hesaplari'\) is null[\s\S]{0,200}raise exception/, `${g}: must refuse a database that has no country tables (it is not a country database)`)
      for (const t of TURKIYE_TABLOLARI) assert.doesNotMatch(s, new RegExp(`\\bpublic\\.${t}\\b`), `${g}: names a table of the Turkish database`)
      assert.ok(existsSync(join(KOK, L.dizin, 'geri-al', g.replace(/\.sql$/, '.geri-al.sql'))), `${g}: no rollback file`)
    }
  })

  it('the generator keeps a function body byte for byte and takes comments and drops out only outside one', () => {
    const sql = ['-- a comment', 'drop policy if exists "x" on public.t;', 'create function f() returns void language plpgsql as $$', 'begin', '  -- kept: part of the function', '  drop table if exists scratch;', 'end $$;', '   -- another comment', 'select 1;'].join('\n')
    assert.equal(U.sadelestir(sql), ['create function f() returns void language plpgsql as $$', 'begin', '  -- kept: part of the function', '  drop table if exists scratch;', 'end $$;', 'select 1;'].join('\n'))
    assert.equal(U.dropsuz(sql).split('\n')[0], '-- a comment')
    assert.doesNotMatch(U.dropsuz(sql), /^drop policy/m)
  })

  it('both proofs read the same list, and neither connects anywhere but this machine', () => {
    for (const f of ['scripts/ulke-temel-kaniti.mjs', 'scripts/ulke-goc-kaniti.mjs']) {
      const s = oku(f)
      assert.match(s, /gocListesi\(/, `${f} must take the migrations from lib/db/ulke/gocler.json`)
      assert.match(s, /host: '127\.0\.0\.1'/)
      assert.doesNotMatch(s, /supabase\.co|SUPABASE_|DATABASE_URL|process\.env\.PG/, `${f} must not be able to reach a remote database`)
    }
  })
})
