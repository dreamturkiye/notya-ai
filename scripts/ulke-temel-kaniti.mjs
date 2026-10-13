#!/usr/bin/env node
/**
 * NOTYA-ULKE-PORTAL-01 — PROOF ON A REAL POSTGRESQL that the one-file baseline of a new country database
 * (lib/db/ulke/000_yeni_ulke_veritabani.sql) gives EXACTLY the schema the country migrations give.
 *
 * ONE DATABASE PER COUNTRY (Kaan, 2026-10-09). A new country's database is created empty and the baseline is run on
 * it once. This script creates several EMPTY databases inside one throwaway local server and compares them:
 *
 *   A   the ledger, then every country migration of lib/db/ulke/gocler.json, each file as it is written
 *   A2  the same, with every file run a second time (the migrations are repeatable; nothing may change)
 *   U   the way the first country's database was really built: the migrations that were applied BY HAND through a
 *       tool that refuses `drop … if exists` (the list `elleUygulanan`), those lines left out; then every later
 *       migration as its file is written
 *   B   the baseline, once
 *
 * A, A2, U and B must be IDENTICAL in: tables and their row-level-security switches, columns (name, type, null rule,
 * default, order), constraints with their definitions, indexes with their definitions, row-level policies with their
 * definitions (the storage one included), triggers, function definitions (bodies included) and who may execute them,
 * table privileges of every role, extensions, the storage bucket, and the ledger's rows.
 *
 * And the baseline keeps its own promises:
 *   - it holds no `drop` statement and is one transaction;
 *   - it REFUSES a database whose public schema already holds a table, and leaves nothing behind there;
 *   - it refuses a second run and changes nothing;
 *   - a failure anywhere inside it leaves nothing behind;
 *   - the ledger is closed to the browser roles;
 *   - a database made from it holds the walls: the country in every key, no double booking, own-country reads only.
 *
 * It starts a THROWAWAY PostgreSQL inside this machine, in a temporary folder, and removes it afterwards. It connects
 * to 127.0.0.1 only. It never touches a Supabase project or any other remote database, and applies nothing anywhere.
 *
 * The server comes from the npm package `embedded-postgres`, which is NOT a dependency of this repository. Install it
 * outside the repository and run the script from there (same folder as scripts/ulke-goc-kaniti.mjs uses):
 *
 *     mkdir /var/tmp/notya-pg-check && cd /var/tmp/notya-pg-check && npm init -y && npm install embedded-postgres pg
 *     node /path/to/notya-ai/scripts/ulke-temel-kaniti.mjs
 *
 * STUBS. A new project of the database provider brings objects these files expect. Here each is the smallest thing
 * that lets the SQL run — so this proves the files' own SQL, not the provider's side:
 *   roles     anon, authenticated, service_role (service_role with BYPASSRLS)
 *   grants    the provider's default: every new table and function in `public` is granted to all three roles —
 *             so "closed to the browser" below is something the files had to do, not something they got for free
 *   auth      schema `auth`, table auth.users, functions auth.uid() and auth.jwt() reading `request.jwt.claims`
 *   storage   schema `storage`, tables storage.buckets and storage.objects (row-level security on),
 *             function storage.foldername(text)
 * NOT covered: the provider's real roles, grants and storage rules, its API layer, and whether the role that runs
 * the file there may create a rule on storage.objects and the extension btree_gist. (On the first country's real
 * database, migrations 129 to 135 were applied by hand on 2026-10-09 and did run.)
 *
 * Exit code 0 = every check passed.
 */
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dropsuz, gocListesi, temelUret } from './ulke-temel-uret.mjs'

const buradan = createRequire(join(process.cwd(), 'x.js'))
const yukle = async (ad) => { try { return await import(pathToFileURL(buradan.resolve(ad)).href) } catch { console.error(`"${ad}" is not installed in ${process.cwd()} — see the top of this file.`); process.exit(2) } }
const EmbeddedPostgres = (await yukle('embedded-postgres')).default
const pg = (await yukle('pg')).default

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.NOTYA_PG_PORT || 54392)
const VERI = mkdtempSync(join(process.cwd(), 'pg-temel-'))
rmSync(VERI, { recursive: true, force: true })
const epg = new EmbeddedPostgres({ databaseDir: VERI, user: 'postgres', password: 'yalniz-yerel', port: PORT, persistent: false, createPostgresUser: true, onLog: () => {}, onError: () => {} })
await epg.initialise()
await epg.start()
const baglan = async (database = 'postgres') => { const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', password: 'yalniz-yerel', database }); await c.connect(); return c }
let hata = 0, toplam = 0
const ok = (ad, kosul, ek = '') => { toplam++; console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ek && !kosul ? ` — ${ek}` : ''}`); if (!kosul) hata++ }

const kok = await baglan()
console.log((await kok.query('select version()')).rows[0].version)
await kok.query(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;`)

const L = gocListesi(REPO)
const oku = (yol) => readFileSync(join(REPO, yol), 'utf8')
const gocOku = (ad) => oku(join(L.dizin, ad))
const TEMEL_DOSYA = oku(L.temel)

/** A new, EMPTY database with what a new project of the provider brings (stubs; see the top of this file). */
async function yeniVeritabani(ad) {
  await kok.query(`create database ${ad}`)
  const c = await baglan(ad)
  await c.query(`
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant insert, select on storage.objects to authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  `)
  return c
}

const calistir = async (c, sql) => { try { await c.query(sql); return null } catch (e) { await c.query('rollback').catch(() => {}); return e } }

/** Everything that makes up the schema, by name and definition (never by an internal number), in a fixed order. */
async function resim(c) {
  const q = async (sql) => (await c.query(sql)).rows
  const acl = (kolon) => `coalesce((select array_agg(x::text order by x::text) from unnest(${kolon}) x), '{}')::text`
  return {
    tablolar: await q(`select c.relname ad, c.relkind::text tur, c.relrowsecurity rls, c.relforcerowsecurity rls_zorla, ${acl('c.relacl')} haklar
                         from pg_class c join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S') order by 1`),
    kolonlar: await q(`select c.relname tablo, a.attnum sira, a.attname ad, format_type(a.atttypid, a.atttypmod) tip, a.attnotnull zorunlu, coalesce(pg_get_expr(d.adbin, d.adrelid), '') varsayilan, ${acl('a.attacl')} haklar
                         from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                         left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                        where n.nspname = 'public' and c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped order by 1, 2`),
    kisitlar: await q(`select c.relname tablo, k.conname ad, k.contype::text tur, pg_get_constraintdef(k.oid) tanim
                         from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'public' order by 1, 2`),
    indeksler: await q(`select schemaname sema, tablename tablo, indexname ad, indexdef tanim from pg_indexes where schemaname = 'public' order by 2, 3`),
    politikalar: await q(`select schemaname sema, tablename tablo, policyname ad, permissive, roles::text roller, cmd, coalesce(qual, '') kosul, coalesce(with_check, '') yazma_kosulu
                            from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3`),
    tetikleyiciler: await q(`select c.relname tablo, g.tgname ad, pg_get_triggerdef(g.oid) tanim
                               from pg_trigger g join pg_class c on c.oid = g.tgrelid join pg_namespace n on n.oid = c.relnamespace
                              where n.nspname = 'public' and not g.tgisinternal order by 1, 2`),
    // Functions the files themselves create: those an extension brought (btree_gist) are covered by "uzantilar".
    islevler: await q(`select p.proname ad, pg_get_function_identity_arguments(p.oid) argumanlar, pg_get_functiondef(p.oid) tanim, p.prosecdef tanimlayan_hakkiyla, ${acl('p.proacl')} haklar
                         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname = 'public' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') order by 1, 2`),
    uzantilar: await q(`select e.extname ad, n.nspname sema from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname <> 'plpgsql' order by 1`),
    kovalar: await q(`select id, name, public from storage.buckets order by 1`),
    defter: (await q(`select to_regclass('public.schema_migrations') r`))[0].r ? await q(`select version, filename, checksum, backfilled, note, applied_at is not null uygulandi from public.schema_migrations order by 1`) : [],
  }
}
const farklar = (a, b) => Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
const ayrinti = (a, b, k) => { const x = new Set(a[k].map((s) => JSON.stringify(s))), y = new Set(b[k].map((s) => JSON.stringify(s))); return [...[...x].filter((s) => !y.has(s)).map((s) => `only in the first: ${s}`), ...[...y].filter((s) => !x.has(s)).map((s) => `only in the second: ${s}`)].slice(0, 4).join(' ‖ ') }
const esit = (ad, a, b) => { const f = farklar(a, b); ok(ad, f.length === 0, f.map((k) => `${k}: ${ayrinti(a, b, k)}`).join(' ¦ ')) }

// ── the text of the baseline ──
ok('the baseline file is exactly what the generator gives from the migrations (it is not stale and was not edited by hand)', TEMEL_DOSYA === temelUret(REPO))
{
  const yorumsuz = TEMEL_DOSYA.split('\n').filter((s) => !/^\s*--/.test(s)).join('\n')
  ok('the baseline holds no "drop" statement of any kind', !/\bdrop\b/i.test(yorumsuz))
  ok('the baseline is one transaction with a lock timeout', /^begin;\nset local lock_timeout = '4s';$/m.test(yorumsuz) && (yorumsuz.match(/^begin;$/gm) ?? []).length === 1 && /\ncommit;\n$/.test(yorumsuz) && (yorumsuz.match(/^commit;$/gm) ?? []).length === 1)
  ok('the baseline names every migration of the list, in order', L.gocler.map((g) => TEMEL_DOSYA.indexOf(`-- ── ${g} ──`)).every((i, n, d) => i > 0 && (n === 0 || i > d[n - 1])))
}

// ── A: the ledger, then every migration as written. A2: every file a second time. ──
const A = await yeniVeritabani('kanit_a')
ok('A. the ledger file runs on an empty database', (await calistir(A, oku(L.defter))) === null)
for (const g of L.gocler) { const e = await calistir(A, gocOku(g)); ok(`A. ${g} runs as written`, e === null, e ? `sqlstate ${e.code}: ${e.message}` : '') }
const RESIM_A = await resim(A)
for (const g of L.gocler) { const e = await calistir(A, gocOku(g)); ok(`A2. ${g} runs a second time`, e === null, e ? `sqlstate ${e.code}: ${e.message}` : '') }
esit('A2. running every migration a second time changes nothing at all', RESIM_A, await resim(A))

// ── U: the first country's database as it was really built ──
const U = await yeniVeritabani('kanit_u')
await calistir(U, oku(L.defter))
for (const g of L.gocler) {
  const elle = L.elleUygulanan.includes(g)
  const e = await calistir(U, elle ? dropsuz(gocOku(g)) : gocOku(g))
  ok(`U. ${g} ${elle ? 'as applied by hand (every "drop … if exists" line left out)' : 'as its file is written'}`, e === null, e ? `sqlstate ${e.code}: ${e.message}` : '')
}
ok('U. the hand-applied form really holds no "drop … if exists"', L.elleUygulanan.every((g) => !/^\s*drop\s+\w+\s+if\s+exists/im.test(dropsuz(gocOku(g)))))
ok('U. every migration written after the hand-applied ones holds no "drop … if exists" at all, so it can be applied through the same tool as it is', L.gocler.filter((g) => !L.elleUygulanan.includes(g)).every((g) => !/^\s*drop\s+\w+\s+if\s+exists/im.test(gocOku(g))))
const RESIM_U = await resim(U)

// ── B: the baseline, once ──
const B = await yeniVeritabani('kanit_b')
{ const e = await calistir(B, TEMEL_DOSYA); ok('B. the baseline runs on a new, empty database', e === null, e ? `sqlstate ${e.code} at position ${e.position ?? '?'}: ${e.message}` : '') }
const RESIM_B = await resim(B)

for (const [k, ad] of [['tablolar', 'tables, their row-level-security switches and the privileges of every role on them'], ['kolonlar', 'columns: name, type, null rule, default, order'], ['kisitlar', 'constraints with their definitions'], ['indeksler', 'indexes with their definitions'], ['politikalar', 'row-level policies with their definitions (public and storage)'], ['tetikleyiciler', 'triggers'], ['islevler', 'functions: definition with body, and who may execute'], ['uzantilar', 'extensions'], ['kovalar', 'the storage bucket'], ['defter', 'the ledger\'s rows']]) {
  ok(`B = A: ${ad}`, JSON.stringify(RESIM_A[k]) === JSON.stringify(RESIM_B[k]), ayrinti(RESIM_A, RESIM_B, k))
  ok(`B = U: ${ad}`, JSON.stringify(RESIM_U[k]) === JSON.stringify(RESIM_B[k]), ayrinti(RESIM_U, RESIM_B, k))
}
esit('B = A as a whole: the baseline gives exactly the schema the migrations give', RESIM_A, RESIM_B)
esit('B = U as a whole: … and exactly the schema of a database built the way the first country\'s was', RESIM_U, RESIM_B)
{
  const say = { tables: RESIM_B.tablolar.filter((t) => t.tur === 'r').length, columns: RESIM_B.kolonlar.length, policies: RESIM_B.politikalar.length, functions: RESIM_B.islevler.length, constraints: RESIM_B.kisitlar.length, indexes: RESIM_B.indeksler.length, triggers: RESIM_B.tetikleyiciler.length, buckets: RESIM_B.kovalar.length, ledger: RESIM_B.defter.length }
  console.log(`     a database made from the baseline holds: ${Object.entries(say).map(([k, v]) => `${v} ${k}`).join(', ')}`)
  ok('the comparison is not empty: it saw the ledger, every country table, policies, functions, the bucket and one ledger row per migration', say.tables >= 14 && say.columns >= 136 && say.policies >= 17 && say.functions >= 5 && say.buckets === 1 && say.ledger === L.gocler.length && RESIM_B.defter.every((d) => d.uygulandi))
  ok('the ledger holds exactly the migrations of the list, once each', RESIM_B.defter.map((d) => d.filename).join() === L.gocler.join())
  if (L.gocler.join() === L.elleUygulanan.join()) ok('with migrations 129 to 135 only: 14 tables, 136 columns, 17 policies, 5 functions — the figures counted on the first country\'s real database on 2026-10-09', say.tables === 14 && say.columns === 136 && say.policies === 17 && say.functions === 5, JSON.stringify(say))
}

// ── the comparison is not blind ──
{
  const K = await yeniVeritabani('kanit_k')
  await calistir(K, TEMEL_DOSYA)
  const temiz = await resim(K)
  const dene = async (ad, sql, geri, bolum) => { await K.query(sql); const f = farklar(temiz, await resim(K)); await K.query(geri); ok(`the comparison notices ${ad}`, f.includes(bolum), f.join() || 'no difference seen') }
  await dene('a changed column default', `alter table public.ulke_randevulari alter column durum set default 'geldi'`, `alter table public.ulke_randevulari alter column durum set default 'planlandi'`, 'kolonlar')
  await dene('a widened policy', `alter policy "hasta_izolasyon_kendi_satiri" on public.ulke_hastalar using (doctor_id = auth.uid())`, `alter policy "hasta_izolasyon_kendi_satiri" on public.ulke_hastalar using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi())`, 'politikalar')
  await dene('a privilege given to a browser role', `grant insert on public.ulke_hastalar to authenticated`, `revoke insert on public.ulke_hastalar from authenticated`, 'tablolar')
  await dene('a function opened to a browser role', `grant execute on function public.davet_kodu_kullan(text, text) to anon`, `revoke execute on function public.davet_kodu_kullan(text, text) from anon`, 'islevler')
  await dene('a changed function body', `create or replace function public.ulke_oturum_ulkesi() returns text language sql stable set search_path = public as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'country', 'xx') $$`, `create or replace function public.ulke_oturum_ulkesi() returns text language sql stable set search_path = public as $$\n  select coalesce(auth.jwt() -> 'app_metadata' ->> 'country', '')\n$$`, 'islevler')
  await dene('a missing index', `drop index public.ulke_hastalar_doctor_idx`, `create index if not exists ulke_hastalar_doctor_idx on public.ulke_hastalar (ulke, doctor_id, created_at desc)`, 'indeksler')
  await dene('a bucket made public', `update storage.buckets set public = true`, `update storage.buckets set public = false`, 'kovalar')
  esit('… and after each change was undone the database is again exactly the baseline', temiz, await resim(K))
  await K.end()
}

// ── the baseline's own promises ──
{
  const once = await resim(B)
  const e = await calistir(B, TEMEL_DOSYA)
  ok('a SECOND run of the baseline is refused', e !== null && /baseline refused/.test(e.message), e ? e.message : 'it ran')
  esit('… and changed nothing', once, await resim(B))
}
{
  // A database that is already in use by somebody: one table in `public` is enough.
  const D = await yeniVeritabani('kanit_dolu')
  await D.query(`create table public.baskasinin_tablosu (id uuid primary key default gen_random_uuid(), ad text); insert into public.baskasinin_tablosu (ad) values ('QA row')`)
  const once = await resim(D)
  const e = await calistir(D, TEMEL_DOSYA)
  ok('on a database whose public schema already holds a table, the baseline is refused', e !== null && /baseline refused/.test(e.message), e ? e.message : 'it ran')
  esit('… and left nothing behind there: no table, no rule, no function, no bucket, no extension', once, await resim(D))
  ok('… and the table that was there still holds its row', (await D.query(`select count(*)::int n from public.baskasinin_tablosu`)).rows[0].n === 1)
  await D.end()
}
{
  const Y = await yeniVeritabani('kanit_yarim')
  const bos = await resim(Y)
  const bozuk = TEMEL_DOSYA.replace(/\ncommit;\n$/, `\nselect 1 / 0;\ncommit;\n`)
  const e = await calistir(Y, bozuk)
  ok('a failure at the very end of the baseline raises', e !== null && e.code === '22012', e ? `sqlstate ${e.code}` : 'no error')
  esit('… and leaves nothing behind (one transaction)', bos, await resim(Y))
  await Y.end()
}

// ── the ledger is closed to the browser; a database made from the baseline holds the walls ──
{
  for (const rol of ['anon', 'authenticated']) {
    await B.query(`set role ${rol}`)
    let kod = 'allowed'
    try { await B.query(`select 1 from public.schema_migrations limit 1`) } catch (x) { kod = x.code }
    ok(`the ledger cannot be read by ${rol}`, kod === '42501', kod)
    kod = 'allowed'
    try { await B.query(`insert into public.schema_migrations (version, filename) values ('999', 'x.sql')`) } catch (x) { kod = x.code }
    ok(`the ledger cannot be written by ${rol}`, kod === '42501', kod)
    await B.query('reset role')
  }
  await B.query('set role service_role')
  ok('the ledger is read by the server\'s role', (await B.query(`select count(*)::int n from public.schema_migrations`)).rows[0].n === L.gocler.length)
  await B.query('reset role')

  const bekle = async (ad, sql, par, kod) => { try { await B.query(sql, par); ok(ad, false, 'no error was raised') } catch (x) { ok(ad, x.code === kod, `sqlstate ${x.code}: ${x.message}`) } }
  const D1 = '11111111-1111-4111-8111-111111111111', D2 = '22222222-2222-4222-8222-222222222222'
  await B.query(`insert into auth.users (id, raw_app_meta_data) values ($1, '{"country":"uz"}'), ($2, '{"country":"uz"}')`, [D1, D2])
  await B.query(`insert into ulke_hesaplari (id, ulke, full_name, ui_language) values ($1, 'uz', 'QA One', 'uz-Latn'), ($2, 'uz', 'QA Two', 'ru')`, [D1, D2])
  const H1 = (await B.query(`insert into ulke_hastalar (ulke, doctor_id) values ('uz', $1) returning id`, [D1])).rows[0].id
  await bekle('B holds the walls: a row without the country → refused 23502', `insert into ulke_hastalar (doctor_id) values ($1)`, [D1], '23502')
  await bekle('B holds the walls: a patient of another country for this account → refused 23503', `insert into ulke_hastalar (ulke, doctor_id) values ('kz', $1)`, [D1], '23503')
  await bekle('B holds the walls: a visit of one doctor on another doctor\'s patient → refused 23503', `insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('uz', $1, $2)`, [D2, H1], '23503')
  await bekle('B holds the walls: an account cannot change country → refused 23514', `update ulke_hesaplari set ulke = 'kz' where id = $1`, [D1], '23514')
  await B.query(`insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis) values ('uz', $1, $2, '2027-01-04T05:00:00Z', '2027-01-04T05:30:00Z')`, [D1, H1])
  await bekle('B holds the walls: no double booking → refused 23P01', `insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis) values ('uz', $1, $2, '2027-01-04T05:15:00Z', '2027-01-04T05:45:00Z')`, [D1, H1], '23P01')
  const oturum = async (sub, ulke) => { await B.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub, app_metadata: { country: ulke } })]); await B.query('set role authenticated') }
  const cik = async () => { await B.query('reset role'); await B.query(`select set_config('request.jwt.claims', '', false)`) }
  await oturum(D1, 'uz'); const kendi = (await B.query(`select count(*)::int n from ulke_hastalar`)).rows[0].n; await cik()
  await oturum(D2, 'uz'); const baska = (await B.query(`select count(*)::int n from ulke_hastalar`)).rows[0].n; await cik()
  await oturum(D1, 'kz'); const baskaUlke = (await B.query(`select count(*)::int n from ulke_hastalar`)).rows[0].n; await cik()
  ok('B holds the walls: a signed-in doctor reads their own patient; another doctor reads none; the same id with another country\'s session reads none', kendi === 1 && baska === 0 && baskaUlke === 0, `${kendi}, ${baska}, ${baskaUlke}`)
  await B.query('set role authenticated')
  let kod = 'allowed'
  try { await B.query(`select public.davet_kodu_kullan('x', 'uz')`) } catch (x) { kod = x.code }
  await B.query('reset role')
  ok('B holds the walls: a browser session may not call a server-only function', kod === '42501', kod)
}

await A.end(); await U.end(); await B.end(); await kok.end(); await epg.stop(); rmSync(VERI, { recursive: true, force: true })
console.log(hata ? `\n${hata} CHECK(S) FAILED` : `\nALL ${toplam} CHECKS PASSED`)
process.exit(hata ? 1 : 0)
