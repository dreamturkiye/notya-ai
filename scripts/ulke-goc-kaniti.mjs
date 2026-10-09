#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 · NOTYA-ULKE-PORTAL-01 · NOTYA-ULKE-KLINIK-01 — PROOF ON A REAL POSTGRESQL of the country migrations, on a COUNTRY
 * DATABASE OF ITS OWN.
 *
 * ONE DATABASE PER COUNTRY (Kaan, 2026-10-09: "We had issues with common databases before. Keep seperation between
 * the two and any other future country versions"). A country's migrations are run only on that country's own
 * database and NEVER on the Turkish one. The list of migrations is lib/db/ulke/gocler.json; a new country's database
 * is made from the one-file baseline, whose proof is scripts/ulke-temel-kaniti.mjs. This script proves what the
 * migrations make the DATABASE ITSELF hold — the second wall and everything the application leaves to it:
 *
 *   B. THE MIGRATIONS RUN on an empty country database: every file of the list in order, each as it is written, then
 *      all of them a second time (nothing may change). A file that fails half-way leaves nothing behind.
 *   C. THE SECOND WALL — THE COUNTRY ON EVERY ROW. The country is part of every key: a row of one country cannot
 *      point at a row of another, nor at another doctor's; an account never changes country; row-level security
 *      shows a session only rows of its own account AND its own country; the recordings bucket accepts an upload
 *      only under `<the session's country>/<the session's account>/`; the approval function and the invitation
 *      functions act only inside the country they are called for.
 *   D. NO DOUBLE BOOKING (also for two transactions at the same moment) and the ALL-OR-NOTHING approval of a note.
 *   P. THE PATIENT PORTAL AND THE USAGE RECORD (migrations 136, 137): a link belongs to one patient of one doctor in
 *      one country; the PIN try is counted before it is looked at, also for two requests at the same moment, and the
 *      link locks; a summary exists only for an approved note of that patient; sharing and its record happen
 *      together; accepting a request books under the no-double-booking rule or not at all; none of these tables can
 *      be read by a browser session, and none of the functions called by one.
 *   F. THE INTAKE FORM (migration 138): asking for the form gives the patient access in the same step or writes
 *      nothing; one open form per patient, also for two requests at the same moment; a form belongs to one patient
 *      of one doctor in one country and never moves; the answers of a submitted form do not change and a withdrawn
 *      form does not change at all; the table cannot be read by a browser session, nor the function called by one.
 *   K. THE TOOL RECORDS (migration 139): a record belongs to one patient of one doctor in one country and never
 *      moves; its tool, its content and its follow-up day never change; a closed follow-up stays closed; only a
 *      follow-up that exists can be closed; the tool key has the shape of a key; the content is one value; the table
 *      cannot be read by a browser session; removing the patient removes the records.
 *   M. MESSAGES BETWEEN A DOCTOR AND A PATIENT (migration 140): a conversation belongs to one patient of one doctor
 *      in one country and never moves; one open conversation per patient; a closed conversation stays closed and
 *      takes no message; a message names its own patient's conversation, never changes, and "read" is set once;
 *      there is no column for an attachment; neither table can be read by a browser session.
 *   S. "MY TEMPLATES" (migration 141): a template belongs to one doctor in one country and never moves; the table
 *      has no column that could name a patient; deleting is soft and a deleted template does not come back; the
 *      table cannot be read by a browser session.
 *   N. CONSULTATION BETWEEN DOCTORS (migration 142): the consulted account is of the same country and never the
 *      asking one; only an APPROVED note of THIS patient is shared; the row is the record (who, whom, which
 *      patient, what, which consent wording, when) and none of it changes; an answer is given once and only while
 *      open; closed stays closed with its end of reading; a code names one account; neither table can be read by a
 *      browser session, the asking doctor's or the consulted one's.
 *   L. CLINIC ACCOUNTS (migration 145): NO EXISTING OBJECT IS ALTERED (compared with a database built from the
 *      migrations before it); a clinic keeps its owner and an account is a member of at most one clinic; an
 *      invitation is a hash with an expiry, used once, also for two accounts at the same moment; a grant names one
 *      capability, both of its accounts are members of the same clinic by key, its patient is its doctor's by key,
 *      and it fits the position it is given to; it never changes and is withdrawn once; removing a member or
 *      changing a position ends every grant in the same step, also when done by a plain statement; the record is
 *      append-only and names who, whose patient, what and when; a visit by another doctor on a patient is still
 *      refused by the key it always had; none of the five tables can be read by a browser session, and none of the
 *      functions called by one.
 *   E. THE ROLLBACK SCRIPTS (lib/db/migrations/geri-al/) refuse while data exists, run twice, and leave nothing.
 *   T. NOT ON ANY OTHER DATABASE. On a database that is NOT a country database — here one shaped like the Turkish
 *      product's, with its own tables and rows — the baseline refuses, and every migration written since the first
 *      country's database exists refuses, each leaving that database exactly as it was.
 *
 * (Until 2026-10-09 this script proved another plan's question — every country inside the Turkish database, "is
 * Türkiye left unchanged?" — with a before/after check file, scripts/ulke-goc-kontrol.sql. That plan was replaced;
 * the file and those sections are gone. Migration 128, which belongs to the Turkish account table and is superseded,
 * is not a country migration and is not run here at all.)
 *
 * It starts a THROWAWAY PostgreSQL inside this machine, in a temporary folder, and removes it afterwards. It connects
 * to 127.0.0.1 only. It never touches a Supabase project or any other remote database, and it applies nothing anywhere.
 *
 * The server comes from the npm package `embedded-postgres`, which is NOT a dependency of this repository (and must
 * not become one for this). Install it outside the repository and run the script from there:
 *
 *     mkdir /var/tmp/notya-pg-check && cd /var/tmp/notya-pg-check && npm init -y && npm install embedded-postgres pg
 *     node /path/to/notya-ai/scripts/ulke-goc-kaniti.mjs
 *
 * The folder must be reachable by an unprivileged system user (PostgreSQL refuses to run as root; the package creates
 * a `postgres` user for it), so not under a folder only root may enter.
 *
 * STUBS. A new project of the database provider brings objects these migrations expect. Here each is the smallest
 * thing that lets the SQL run — so this proves the migrations' own SQL, not the provider's side:
 *   roles     anon, authenticated, service_role (service_role with BYPASSRLS)
 *   grants    the provider's default: every new table and function in `public` is granted to all three roles —
 *             so "closed to the browser" is something the migrations had to do
 *   auth      schema `auth`, table auth.users, functions auth.uid() and auth.jwt() reading `request.jwt.claims`
 *   storage   schema `storage`, tables storage.buckets and storage.objects (row-level security on),
 *             function storage.foldername(text)
 * NOT covered: the provider's real roles, grants and storage rules, its API layer (how `supabase.rpc` and the row
 * filters reach the database), and real lock waits under traffic.
 *
 * Exit code 0 = every check passed.
 */
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gocListesi, temelUret } from './ulke-temel-uret.mjs'

// The two packages are resolved from the folder the script is RUN in, not from the repository.
const buradan = createRequire(join(process.cwd(), 'x.js'))
const yukle = async (ad) => { try { return await import(pathToFileURL(buradan.resolve(ad)).href) } catch { console.error(`"${ad}" is not installed in ${process.cwd()} — see the top of this file.`); process.exit(2) } }
const EmbeddedPostgres = (await yukle('embedded-postgres')).default
const pg = (await yukle('pg')).default

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.NOTYA_PG_PORT || 54391)
const VERI = mkdtempSync(join(process.cwd(), 'pg-veri-'))
rmSync(VERI, { recursive: true, force: true })
const epg = new EmbeddedPostgres({ databaseDir: VERI, user: 'postgres', password: 'yalniz-yerel', port: PORT, persistent: false, createPostgresUser: true, onLog: () => {}, onError: () => {} })
await epg.initialise()
await epg.start()
const baglan = async (database = 'postgres') => { const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', password: 'yalniz-yerel', database }); await c.connect(); return c }
const c = await baglan()
let hata = 0, toplam = 0
const ok = (ad, kosul, ek = '') => { toplam++; console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ek && !kosul ? ` — ${ek}` : ''}`); if (!kosul) hata++ }
const bekle = async (ad, sql, par, kod) => { try { await c.query(sql, par); ok(ad, false, 'no error was raised') } catch (e) { ok(ad, e.code === kod, `sqlstate ${e.code}: ${e.message}`) } }

console.log((await c.query('select version()')).rows[0].version)

// ── STUBS for what a new project of the provider brings and the migrations expect ──
await c.query(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;`)
const STUBLAR = `
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
`
await c.query(STUBLAR)
const LISTE = gocListesi(REPO)
// The ledger of a country database (lib/db/ulke/defter.sql): the first thing the baseline creates.
await c.query(readFileSync(join(REPO, LISTE.defter), 'utf8'))
// A login that is NOT a country account: it exists in the sign-in service and has no row in ulke_hesaplari, no country stamp.
const L0 = 'aaaaaaaa-1111-4111-8111-111111111111'
await c.query(`insert into auth.users (id, email) values ($1, 'qa-no-country@notya.test')`, [L0])

// ── B. the migrations, in order, each as it is written; then all of them a second time. 128 is NOT among them. ──
// The list every script and test reads (lib/db/ulke/gocler.json): 129 on, never 128.
const DOSYALAR = LISTE.gocler
const SURUMLER = DOSYALAR.map((d) => d.slice(0, 3)).join(',')
const dosyaOku = (d) => readFileSync(join(REPO, 'lib/db/migrations', d), 'utf8')
/** Everything in `public`, by name and definition: what a second run of the migrations must leave untouched. */
const sema = async (istemci = c) => JSON.stringify((await istemci.query(`
  select 'table' tur, c.relname ad, c.relrowsecurity::text || coalesce(c.relacl::text, '') tanim from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p')
  union all select 'column', c.relname || '.' || a.attname, format_type(a.atttypid, a.atttypmod) || a.attnotnull::text || coalesce(pg_get_expr(d.adbin, d.adrelid), '') from pg_attribute a join pg_class c on c.oid = a.attrelid left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped
  union all select 'constraint', k.conrelid::regclass::text || '.' || k.conname, pg_get_constraintdef(k.oid) from pg_constraint k where k.connamespace = 'public'::regnamespace
  union all select 'index', indexname, indexdef from pg_indexes where schemaname = 'public'
  union all select 'policy', schemaname || '.' || tablename || '.' || policyname, cmd || permissive || roles::text || coalesce(qual, '') || coalesce(with_check, '') from pg_policies where schemaname in ('public', 'storage')
  union all select 'trigger', g.tgrelid::regclass::text || '.' || g.tgname, pg_get_triggerdef(g.oid) from pg_trigger g join pg_class c on c.oid = g.tgrelid where c.relnamespace = 'public'::regnamespace and not g.tgisinternal
  union all select 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', pg_get_functiondef(p.oid) || coalesce(p.proacl::text, '') from pg_proc p where p.pronamespace = 'public'::regnamespace and not exists (select 1 from pg_depend x where x.objid = p.oid and x.deptype = 'e')
  union all select 'bucket', id, public::text from storage.buckets
  order by 1, 2`)).rows)
let ILK_KOSU = ''
for (const tur of ['first run', 'second run (must be repeatable)']) {
  if (tur !== 'first run') ILK_KOSU = await sema()
  for (const d of DOSYALAR) {
    try { await c.query(dosyaOku(d)); ok(`B. ${tur}: ${d}`, true) }
    catch (e) { await c.query('rollback').catch(() => {}); ok(`B. ${tur}: ${d}`, false, `sqlstate ${e.code} at position ${e.position ?? '?'}: ${e.message}`) }
  }
}
ok('B. the second run changed nothing at all: every table, column, constraint, index, rule, trigger, function and grant is as the first run left it', ILK_KOSU !== '' && ILK_KOSU === await sema())
ok(`B. the ledger has ${SURUMLER} once each, and no 128`, (await c.query(`select string_agg(version, ',' order by version) v from schema_migrations`)).rows[0].v === SURUMLER)
ok('B. a failed statement leaves nothing of its file behind (each file is one transaction)', await (async () => {
  // The same file with a statement that cannot succeed appended before its commit: nothing of it may remain.
  const bozuk = dosyaOku('134_hekim_rolu.sql').replace(/commit;\s*$/, `create table public.kanit_yarim (x int);\nselect 1 / 0;\ncommit;`)
  try { await c.query(bozuk); return false } catch { await c.query('rollback').catch(() => {}) }
  return (await c.query(`select to_regclass('public.kanit_yarim') r`)).rows[0].r === null
})())

// The service role of a Supabase project owns everything; here it is granted what the server uses.
await c.query(`grant all on all tables in schema public to service_role`)

// ── data: two countries, two doctors in the first, one in the second ──
const D1 = '11111111-1111-4111-8111-111111111111', D2 = '22222222-2222-4222-8222-222222222222', K1 = '33333333-3333-4333-8333-333333333333'
const U = 'uz', V = 'kz'
await c.query(`insert into auth.users (id, raw_app_meta_data) values ($1, '{"country":"uz"}'), ($2, '{"country":"uz"}'), ($3, '{"country":"kz"}')`, [D1, D2, K1])
await c.query(`insert into ulke_hesaplari (id, ulke, full_name, ui_language) values ($1, 'uz', 'QA Bir', 'uz-Latn'), ($2, 'uz', 'QA Ikki', 'ru'), ($3, 'kz', 'QA Kz', 'ru')`, [D1, D2, K1])
const hasta = async (d, ulke = U) => (await c.query(`insert into ulke_hastalar (ulke, doctor_id) values ($2, $1) returning id`, [d, ulke])).rows[0].id
const H1 = await hasta(D1), H1b = await hasta(D1), H2 = await hasta(D2), HK = await hasta(K1, V)
const ekle = (d, h, bas, bit, durum = 'planlandi', istemci = c, ulke = U) => istemci.query(`insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis, durum) values ($6, $1, $2, $3, $4, $5) returning id`, [d, h, bas, bit, durum, ulke])
const G = '2026-10-12T'

// ── C. countries are kept apart by the keys ──
await bekle('C. a row without the country → refused 23502 (ulke has no default)', `insert into ulke_hastalar (doctor_id) values ($1)`, [D1], '23502')
await bekle('C. a malformed country code → refused 23514', `insert into ulke_hesaplari (id, ulke, ui_language) values ($1, 'UZB', 'ru')`, [L0], '23514')
await bekle('C. a patient of country kz for an account of country uz → refused 23503', `insert into ulke_hastalar (ulke, doctor_id) values ('kz', $1)`, [D1], '23503')
await bekle('C. a patient for a login that is not a country account → refused 23503', `insert into ulke_hastalar (ulke, doctor_id) values ('uz', $1)`, [L0], '23503')
await bekle('C. a visit of country kz that points at an uz patient (valid id) → refused 23503', `insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('kz', $1, $2)`, [K1, H1], '23503')
await bekle('C. a visit of one doctor that points at ANOTHER doctor\'s patient in the same country → refused 23503', `insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('uz', $1, $2)`, [D2, H1], '23503')
await bekle('C. an appointment of country kz for an uz patient → refused 23503', `insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis) values ('kz', $1, $2, now(), now() + interval '30 minutes')`, [K1, H1], '23503')
await bekle('C. the side row of a patient under another country → refused 23503', `insert into hasta_ulke_bilgisi (patient_id, ulke, doctor_id, dil) values ($1, 'kz', $2, 'ru')`, [H1, K1], '23503')
await bekle('C. a role row under a country the account does not belong to → refused 23503', `insert into hekim_rolu (doctor_id, ulke, rol) values ($1, 'kz', 'pediatri')`, [D1], '23503')
await bekle('C. an account cannot change country → refused 23514', `update ulke_hesaplari set ulke = 'kz' where id = $1`, [D1], '23514')
await bekle('C. an account cannot exist in two countries (one row per account) → refused 23505', `insert into ulke_hesaplari (id, ulke, ui_language) values ($1, 'kz', 'ru')`, [D1], '23505')
await bekle('C. a patient cannot be moved to another country → refused 23503', `update ulke_hastalar set ulke = 'kz' where id = $1`, [H1], '23503')
await bekle('C. a note approved by somebody who is not its doctor → refused 23514', `with s as (insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('uz', $1, $2) returning id) insert into ulke_notlar (ulke, doctor_id, session_id, approved_at, approved_by) select 'uz', $1, id, now(), $3 from s`, [D1, H1, D2], '23514')
{
  // Invitation codes belong to one country.
  const kod = 'a'.repeat(64)
  await c.query(`insert into davet_kodlari (kod_hash, ulke) values ($1, 'uz')`, [kod])
  ok('C. an uz invitation code is not usable from a kz build', (await c.query(`select davet_kodu_kullan($1, 'kz') r`, [kod])).rows[0].r === false && (await c.query(`select kullanim from davet_kodlari where kod_hash = $1`, [kod])).rows[0].kullanim === 0)
  ok('C. … and is usable once from an uz build', (await c.query(`select davet_kodu_kullan($1, 'uz') r`, [kod])).rows[0].r === true && (await c.query(`select davet_kodu_kullan($1, 'uz') r`, [kod])).rows[0].r === false)
  await c.query(`select davet_kodu_iade($1, 'kz')`, [kod])
  ok('C. a kz build cannot give an uz code back', (await c.query(`select kullanim from davet_kodlari where kod_hash = $1`, [kod])).rows[0].kullanim === 1)
  await c.query(`select davet_kodu_iade($1, 'uz')`, [kod])
  ok('C. the uz build can', (await c.query(`select kullanim from davet_kodlari where kod_hash = $1`, [kod])).rows[0].kullanim === 0)
  await c.query(`delete from davet_kodlari`)
}

// ── D. the double-booking constraint ──
const r1 = (await ekle(D1, H1, `${G}05:00:00Z`, `${G}05:30:00Z`)).rows[0].id
const RAND = `insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis) values ('uz', $1,$2,$3,$4)`
await bekle('D. same time, same doctor → refused 23P01', RAND, [D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`], '23P01')
await bekle('D. overlapping time → refused 23P01', RAND, [D1, H1b, `${G}05:15:00Z`, `${G}05:45:00Z`], '23P01')
await bekle('D. a longer one around it → refused 23P01', RAND, [D1, H1b, `${G}04:30:00Z`, `${G}06:00:00Z`], '23P01')
try { await ekle(D1, H1b, `${G}05:30:00Z`, `${G}06:00:00Z`); await ekle(D1, H1b, `${G}04:30:00Z`, `${G}05:00:00Z`); ok('D. touching times (right before, right after) → allowed', true) } catch (e) { ok('D. touching times → allowed', false, e.message) }
try { await ekle(D2, H2, `${G}05:00:00Z`, `${G}05:30:00Z`); ok('D. another doctor, same time → allowed', true) } catch (e) { ok('D. another doctor, same time → allowed', false, e.message) }
try { await ekle(K1, HK, `${G}05:00:00Z`, `${G}05:30:00Z`, 'planlandi', c, V); ok('D. a doctor of another country, same time → allowed', true) } catch (e) { ok('D. a doctor of another country, same time → allowed', false, e.message) }
let iptalId, gelmediId
try { iptalId = (await ekle(D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`, 'iptal')).rows[0].id; gelmediId = (await ekle(D1, H1b, `${G}05:10:00Z`, `${G}05:20:00Z`, 'gelmedi')).rows[0].id; ok('D. cancelled and did-not-come rows over a taken time → allowed', true) } catch (e) { ok('D. cancelled / did-not-come over a taken time → allowed', false, e.message) }
await bekle('D. cancelled → planned onto a taken time → refused 23P01', `update ulke_randevulari set durum = 'planlandi' where id = $1`, [iptalId], '23P01')
await bekle('D. did-not-come → arrived onto a taken time → refused 23P01', `update ulke_randevulari set durum = 'geldi' where id = $1`, [gelmediId], '23P01')
await bekle('D. moving onto a taken time → refused 23P01', `update ulke_randevulari set baslangic = $2, bitis = $3 where id = $1`, [r1, `${G}05:40:00Z`, `${G}05:50:00Z`], '23P01')
try { await c.query(`update ulke_randevulari set durum = 'geldi' where id = $1`, [r1]); await c.query(`update ulke_randevulari set durum = 'tamamlandi' where id = $1`, [r1]); await c.query(`update ulke_randevulari set durum = 'planlandi' where id = $1`, [r1]); ok('D. status changes of a row that holds its time → allowed', true) } catch (e) { ok('D. status changes of a row that holds its time', false, e.message) }
await c.query(`update ulke_randevulari set durum = 'iptal' where id = $1`, [r1])
try { await ekle(D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`); ok('D. a cancelled appointment gives its time back', true) } catch (e) { ok('D. a cancelled appointment gives its time back', false, e.message) }
await bekle('D. end before start → refused 23514', RAND, [D1, H1, `${G}09:00:00Z`, `${G}08:00:00Z`], '23514')
await bekle('D. unknown status → refused 23514', `insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis, durum) values ('uz', $1,$2,$3,$4,'kechikdi')`, [D1, H1, `${G}09:00:00Z`, `${G}09:30:00Z`], '23514')
// TWO REQUESTS AT THE SAME MOMENT: two connections, two open transactions, the same time.
{
  const a = await baglan(), b = await baglan()
  await a.query('begin'); await b.query('begin')
  await ekle(D1, H1, `${G}11:00:00Z`, `${G}11:30:00Z`, 'planlandi', a)
  let bSonucu = 'pending'
  const bIstegi = ekle(D1, H1b, `${G}11:00:00Z`, `${G}11:30:00Z`, 'planlandi', b).then(() => { bSonucu = 'inserted' }, (e) => { bSonucu = e.code })
  await new Promise((r) => setTimeout(r, 400))
  ok('D. two at the same moment: the second waits while the first is undecided', bSonucu === 'pending', bSonucu)
  await a.query('commit'); await bIstegi; await b.query('rollback')
  ok('D. two at the same moment: once the first commits, the second is refused 23P01', bSonucu === '23P01', bSonucu)
  ok('D. two at the same moment: exactly one row', (await c.query(`select count(*)::int n from ulke_randevulari where doctor_id = $1 and baslangic = $2`, [D1, `${G}11:00:00Z`])).rows[0].n === 1)
  // And when the first one rolls back, the second goes through.
  await a.query('begin'); await b.query('begin')
  await ekle(D1, H1, `${G}12:00:00Z`, `${G}12:30:00Z`, 'planlandi', a)
  bSonucu = 'pending'
  const bIstegi2 = ekle(D1, H1b, `${G}12:00:00Z`, `${G}12:30:00Z`, 'planlandi', b).then(() => { bSonucu = 'inserted' }, (e) => { bSonucu = e.code })
  await new Promise((r) => setTimeout(r, 300)); await a.query('rollback'); await bIstegi2; await b.query('commit')
  ok('D. two at the same moment: if the first is undone, the second is booked', bSonucu === 'inserted', bSonucu)
  await a.end(); await b.end()
}
await bekle('D. working pattern: a weekday 8 → refused 23514', `insert into hekim_calisma_duzeni (doctor_id, ulke, gunler, baslangic_dk, bitis_dk, sure_dk) values ($1, 'uz', '{1,8}', 540, 1080, 30)`, [D1], '23514')
await bekle('D. working pattern: ends before it begins → refused 23514', `insert into hekim_calisma_duzeni (doctor_id, ulke, gunler, baslangic_dk, bitis_dk, sure_dk) values ($1, 'uz', '{1,2}', 1080, 540, 30)`, [D1], '23514')
try { await c.query(`insert into hekim_calisma_duzeni (doctor_id, ulke, gunler, baslangic_dk, bitis_dk, sure_dk, molalar) values ($1, 'uz', '{1,2,3,4,5}', 540, 1080, 30, $2::jsonb)`, [D1, JSON.stringify([{ bas: 780, bit: 840 }])]); ok('D. working pattern: a valid row is stored', true) } catch (e) { ok('D. working pattern: a valid row is stored', false, e.message) }

// ── D. ulke_not_onayla ──
let sayac = 0
const notKur = async (d, h, randevuDurumu, ulke = U) => {
  const s = (await c.query(`insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ($3, $1, $2) returning id`, [d, h, ulke])).rows[0].id
  const n = (await c.query(`insert into ulke_notlar (ulke, session_id, doctor_id, content_subjektif, content_objektif, content_degerlendirme, content_plan) values ($3, $1, $2, 'S taslak', 'O taslak', 'A taslak', 'P taslak') returning id`, [s, d, ulke])).rows[0].id
  await c.query(`insert into not_dil_kaydi (note_id, ulke, doctor_id, patient_id, not_dili, alanlar) values ($1, $4, $2, $3, 'uz-Latn', '{"ecg":"taslak"}')`, [n, d, h, ulke])
  let r = null
  if (randevuDurumu) {
    // Each on a day of its own, so that these rows never meet the double-booking constraint by accident.
    const bas = new Date(Date.UTC(2027, 0, 1 + sayac++, 5, 0)).toISOString()
    r = (await c.query(`insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis, durum, session_id) values ($6, $1, $2, $3::timestamptz, $3::timestamptz + interval '30 minutes', $4, $5) returning id`, [d, h, bas, randevuDurumu, s, ulke])).rows[0].id
  }
  return { s, n, r }
}
const onayla = (n, d, k, istemci = c, ulke = U) => istemci.query(`select public.ulke_not_onayla($5, $1, $2, $3, 'S ekran', 'O ekran', 'A ekran', 'P ekran', $4::jsonb) as sonuc`, [n, d, '2026-10-08T10:00:00Z', k === null ? null : JSON.stringify(k), ulke])
const durum = async (x) => JSON.stringify([(await c.query(`select * from ulke_notlar where id = $1`, [x.n])).rows, (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows, x.r ? (await c.query(`select * from ulke_randevulari where id = $1`, [x.r])).rows : []])

{
  const x = await notKur(D1, H1, 'geldi')
  const once = await durum(x)
  ok('D. another doctor\'s id → NOT_FOUND, nothing changed', (await onayla(x.n, D2, { alanlar: { ecg: 'x' } })).rows[0].sonuc === 'NOT_FOUND' && (await durum(x)) === once)
  // C. THE COUNTRY: the right note id and the right doctor id, called for ANOTHER country.
  ok('C. the right note and doctor ids, called for another country → NOT_FOUND, nothing changed', (await onayla(x.n, D1, { alanlar: { ecg: 'x' } }, c, V)).rows[0].sonuc === 'NOT_FOUND' && (await durum(x)) === once)
  // A FAILURE IN THE MIDDLE, for real: the note's text and approval are written first, then the second statement
  // violates a constraint of not_dil_kaydi (ikinci_dil must differ from not_dili).
  try { await onayla(x.n, D1, { alanlar: { ecg: 'ekran' }, ikinci_dil: 'uz-Latn' }); ok('D. failure in the middle raises', false) } catch (e) { ok('D. failure in the middle raises', e.code === '23514', `sqlstate ${e.code}`) }
  ok('D. failure in the middle: the note is unapproved and every row is unchanged', (await durum(x)) === once)
  const r = (await onayla(x.n, D1, { alanlar: { ecg: 'ekran', yangi: 'maydon' } })).rows[0].sonuc
  const n = (await c.query(`select * from ulke_notlar where id = $1`, [x.n])).rows[0]
  const d = (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows[0]
  const a = (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0]
  ok('D. approval → TAMAM', r === 'TAMAM', String(r))
  ok('D. approval: text, approved_at, approved_by written', n.content_subjektif === 'S ekran' && n.content_plan === 'P ekran' && n.approved_at?.toISOString() === '2026-10-08T10:00:00.000Z' && n.approved_by === D1)
  ok('D. approval: role fields written; untouched columns left alone', JSON.stringify(d.alanlar) === JSON.stringify({ ecg: 'ekran', yangi: 'maydon' }) && d.not_dili === 'uz-Latn' && d.ikinci_dil === null)
  ok('D. approval: the linked appointment is done', a.durum === 'tamamlandi', a.durum)
  const sonra = await durum(x)
  ok('D. approving again → ONAYLI, nothing changed', (await onayla(x.n, D1, { alanlar: { ecg: 'KECH' } })).rows[0].sonuc === 'ONAYLI' && (await durum(x)) === sonra)
}
{
  // The other draft is approved: the two drafts change places; `alanlar: null` clears the column.
  const x = await notKur(D1, H1, 'planlandi')
  await c.query(`update not_dil_kaydi set ikinci_dil = 'ru', ikinci_s = 'S ru', ikinci_o = 'O ru', ikinci_a = 'A ru', ikinci_p = 'P ru', ikinci_alanlar = '{"ecg":"ru"}' where note_id = $1`, [x.n])
  const r = (await onayla(x.n, D1, { not_dili: 'ru', ikinci_dil: 'uz-Latn', ikinci_s: 'S taslak', ikinci_o: 'O taslak', ikinci_a: 'A taslak', ikinci_p: 'P taslak', alanlar: null, ikinci_alanlar: { ecg: 'taslak' } })).rows[0].sonuc
  const d = (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows[0]
  ok('D. approving the other draft: the drafts change places, alanlar null clears the column', r === 'TAMAM' && d.not_dili === 'ru' && d.ikinci_dil === 'uz-Latn' && d.ikinci_s === 'S taslak' && d.alanlar === null && JSON.stringify(d.ikinci_alanlar) === '{"ecg":"taslak"}', JSON.stringify(d))
  ok('D. approving: a planned appointment becomes done too', (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0].durum === 'tamamlandi')
}
{
  // p_dil_kaydi null leaves not_dil_kaydi alone; a cancelled appointment is not reopened; a note without an appointment works.
  const x = await notKur(D1, H1, 'iptal')
  const dOnce = JSON.stringify((await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows)
  ok('D. p_dil_kaydi null → TAMAM, not_dil_kaydi untouched, a cancelled appointment stays cancelled', (await onayla(x.n, D1, null)).rows[0].sonuc === 'TAMAM' && JSON.stringify((await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows) === dOnce && (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0].durum === 'iptal')
  const y = await notKur(D1, H1, null)
  ok('D. a visit without an appointment → TAMAM', (await onayla(y.n, D1, { alanlar: { ecg: 'e' } })).rows[0].sonuc === 'TAMAM')
  // A note whose language record is missing is not approved at all.
  const z = await notKur(D1, H1, 'geldi')
  await c.query(`delete from not_dil_kaydi where note_id = $1`, [z.n])
  const once = await durum(z)
  try { await onayla(z.n, D1, { alanlar: { ecg: 'e' } }); ok('D. missing language record raises', false) } catch (e) { ok('D. missing language record raises', e.code === 'P0002', `sqlstate ${e.code}`) }
  ok('D. missing language record: note unapproved, appointment unchanged', (await durum(z)) === once)
}
{
  // Two approvals of the same note at the same moment: one TAMAM, one ONAYLI.
  const x = await notKur(D1, H1, 'geldi')
  const a = await baglan(), b = await baglan()
  const [ra, rb] = await Promise.all([onayla(x.n, D1, { alanlar: { ecg: 'A' } }, a), onayla(x.n, D1, { alanlar: { ecg: 'B' } }, b)])
  ok('D. two approvals at the same moment: one TAMAM, one ONAYLI', [ra.rows[0].sonuc, rb.rows[0].sonuc].sort().join() === 'ONAYLI,TAMAM', `${ra.rows[0].sonuc}, ${rb.rows[0].sonuc}`)
  await a.end(); await b.end()
}
{
  // The same function, for the other country's own note: it works there, and only there.
  const k = await notKur(K1, HK, 'geldi', V)
  ok('C. the kz note is approved by a call for kz', (await onayla(k.n, K1, null, c, V)).rows[0].sonuc === 'TAMAM')
}

// ── C. who may call the function; what a browser session may see: its own account AND its own country ──
const oturum = async (sub, ulke) => { await c.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub, ...(ulke === null ? {} : { app_metadata: { country: ulke } }) })]); await c.query('set role authenticated') }
const cik = async () => { await c.query('reset role'); await c.query(`select set_config('request.jwt.claims', '', false)`) }
{
  const x = await notKur(D1, H1, 'geldi')
  for (const rol of ['authenticated', 'anon']) {
    await c.query(`set role ${rol}`)
    try { await onayla(x.n, D1, null); ok(`C. ${rol} may NOT call ulke_not_onayla`, false) } catch (e) { ok(`C. ${rol} may NOT call ulke_not_onayla`, e.code === '42501', `sqlstate ${e.code}`) }
    try { await c.query(`select davet_kodu_kullan('x', 'uz')`); ok(`C. ${rol} may NOT call davet_kodu_kullan`, false) } catch (e) { ok(`C. ${rol} may NOT call davet_kodu_kullan`, e.code === '42501', `sqlstate ${e.code}`) }
    await c.query('reset role')
  }
  await c.query('set role service_role')
  try { ok('C. service_role may call ulke_not_onayla', (await onayla(x.n, D1, null)).rows[0].sonuc === 'TAMAM') } catch (e) { ok('C. service_role may call ulke_not_onayla', false, `sqlstate ${e.code}: ${e.message}`) }
  await c.query('reset role')

  const OKUNAN = ['ulke_hesaplari', 'hekim_dil_tercihleri', 'hekim_rolu', 'hekim_calisma_duzeni', 'ulke_hastalar', 'hasta_ulke_bilgisi', 'ulke_muayeneler', 'muayene_dil_kaydi', 'ulke_notlar', 'not_dil_kaydi', 'ulke_randevulari']
  // One row in every table for doctor 1 (uz), so that "sees nothing" below is about the rule and not about emptiness.
  await c.query(`insert into hekim_dil_tercihleri (doctor_id, ulke, not_dili, soruldu_at) values ($1, 'uz', 'uz-Cyrl', now())`, [D1])
  await c.query(`insert into hasta_ulke_bilgisi (patient_id, ulke, doctor_id, dil) values ($1, 'uz', $2, 'uz')`, [H1, D1])
  const s = (await c.query(`insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('uz', $1, $2) returning id`, [D1, H1])).rows[0].id
  await c.query(`insert into muayene_dil_kaydi (session_id, ulke, doctor_id, patient_id, riza_at, riza_surumu, stt_model, not_dili, sablon) values ($1, 'uz', $2, $3, now(), 'uz-taslak-2026-10-08', 'scribe_v2', 'uz-Latn', 'pediatri')`, [s, D1, H1])
  await c.query(`insert into hekim_rolu (doctor_id, ulke, rol) values ($1, 'uz', 'kadin-hastaliklari-dogum')`, [D1])
  await c.query(`insert into ulke_kullanim (ulke, doctor_id, gun, kova, sayac) values ('uz', $1, current_date, 'soap', 1)`, [D1])
  { const n = []; for (const t of OKUNAN) n.push((await c.query(`select count(*)::int n from ${t} where ${t === 'ulke_hesaplari' ? 'id' : 'doctor_id'} = $1`, [D1])).rows[0].n); ok('130–135: one valid row in every country table for doctor 1', n.every((x) => x >= 1), n.join()) }
  const sayilar = async () => { const o = {}; for (const t of OKUNAN) o[t] = (await c.query(`select count(*)::int n from ${t}`)).rows[0].n; return o }
  const kimler = async (t) => (await c.query(`select distinct ${t === 'ulke_hesaplari' ? 'id' : 'doctor_id'} d from ${t}`)).rows.map((r) => r.d)
  const hepsiKimler = async () => { const l = []; for (const t of OKUNAN) l.push(await kimler(t)); return l }

  await oturum(D1, 'uz')
  const kendi = await sayilar()
  ok('C. RLS: doctor 1 with an uz session reads rows in every table, and only its own', Object.values(kendi).every((n) => n >= 1) && (await hepsiKimler()).every((d) => d.length === 1 && d[0] === D1), JSON.stringify(kendi))
  await cik(); await oturum(D2, 'uz')
  ok('C. RLS: doctor 2 sees nothing of doctor 1 (same country)', (await hepsiKimler()).every((d) => d.every((x) => x === D2)))
  await cik(); await oturum(D1, 'kz')
  ok('C. RLS: THE SAME ACCOUNT ID with a session of another country reads nothing at all', Object.values(await sayilar()).every((n) => n === 0), JSON.stringify(await sayilar()))
  await cik(); await oturum(D1, null)
  ok('C. RLS: the same account id with NO country on the session reads nothing at all', Object.values(await sayilar()).every((n) => n === 0))
  await cik(); await oturum(L0, null)
  ok('C. RLS: a login that is not a country account reads nothing in any country table', Object.values(await sayilar()).every((n) => n === 0))
  await cik(); await oturum(D2, 'uz')
  try { await c.query(`insert into ulke_randevulari (ulke, doctor_id, patient_id, baslangic, bitis) values ('uz', $1,$2,now(),now() + interval '10 minutes')`, [D2, H2]); ok('C. RLS: a signed-in doctor cannot write appointments from the browser', false) } catch (e) { ok('C. RLS: a signed-in doctor cannot write appointments from the browser', e.code === '42501', `sqlstate ${e.code}`) }
  try { await c.query(`update ulke_hesaplari set full_name = 'x' where id = $1`, [D2]); ok('C. RLS: a signed-in account cannot write its own account row from the browser', false) } catch (e) { ok('C. RLS: a signed-in account cannot write its own account row from the browser', e.code === '42501', `sqlstate ${e.code}`) }
  try { await c.query(`select 1 from ulke_kullanim limit 1`); ok('C. the daily counter is closed to the browser', false) } catch (e) { ok('C. the daily counter is closed to the browser', e.code === '42501', `sqlstate ${e.code}`) }
  await cik(); await c.query('set role anon')
  try { await c.query(`select 1 from ulke_randevulari limit 1`); ok('C. anon cannot read appointments', false) } catch (e) { ok('C. anon cannot read appointments', e.code === '42501', `sqlstate ${e.code}`) }
  await c.query('reset role')
}

// ── C. storage: a recording is uploaded under <the session's country>/<the session's account>/ and nowhere else ──
{
  const yukle = async (ad, sub, ulke, yol, beklenen, kova = 'muayene-sesleri') => {
    await oturum(sub, ulke)
    let sonuc = 'allowed'
    try { await c.query(`insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)`, [kova, yol, sub]) } catch (e) { sonuc = e.code }
    await cik()
    ok(`C. storage: ${ad}`, sonuc === beklenen, sonuc)
  }
  await yukle('an uz account uploads under uz/<its id>/ → allowed', D1, 'uz', `uz/${D1}/kayit-1.webm`, 'allowed')
  await yukle('… under another country\'s folder with its own id → refused', D1, 'uz', `kz/${D1}/kayit-1.webm`, '42501')
  await yukle('… under its country but another account\'s folder → refused', D1, 'uz', `uz/${D2}/kayit-1.webm`, '42501')
  await yukle('… with no country folder (the path shape before the shared bucket) → refused', D1, 'uz', `${D1}/kayit-1.webm`, '42501')
  await yukle('… a folder deeper → refused', D1, 'uz', `uz/${D1}/alt/kayit-1.webm`, '42501')
  await yukle('a kz account uploads under kz/<its id>/ → allowed', K1, 'kz', `kz/${K1}/kayit-1.webm`, 'allowed')
  await yukle('a kz account under uz/<its id>/ → refused', K1, 'kz', `uz/${K1}/kayit-1.webm`, '42501')
  await yukle('a login with no country on its session cannot upload into the recordings bucket at all', L0, null, `uz/${L0}/kayit-1.webm`, '42501')
  await yukle('… not even under a folder named after an empty country', L0, null, `/${L0}/kayit-1.webm`, '42501')
  await c.query(`delete from storage.objects where bucket_id = 'muayene-sesleri'`)
}
await bekle('134: a role key with a capital letter → refused 23514', `insert into hekim_rolu (doctor_id, ulke, rol) values ($1, 'uz', 'Pediatri')`, [D2], '23514')
await bekle('133: second draft in the note\'s own language → refused 23514', `update not_dil_kaydi set ikinci_dil = not_dili where note_id = (select note_id from not_dil_kaydi limit 1)`, [], '23514')
ok('132: the private bucket exists once', (await c.query(`select count(*)::int n from storage.buckets where id = 'muayene-sesleri' and public = false`)).rows[0].n === 1)
// ── P. the usage record (migration 136) and the patient portal (migration 137) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (tablo, kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ${tablo} where ${kosul}`, par)).rows[0].n

  // usage: counts that add up, also at the same moment
  await c.query(`select public.ulke_kullanim_ekle('uz', $1, '2026-10-12', 'not', 1, 0, 900, 220)`, [D1])
  await c.query(`select public.ulke_kullanim_ekle('uz', $1, '2026-10-12', 'not', 1, null, 100, 30)`, [D1])
  await c.query(`select public.ulke_kullanim_ekle('uz', $1, '2026-10-12', 'konusma-ilk', 1, 61.5, null, null)`, [D1])
  ok('P. usage: two calls for the same account, day and task ADD UP; another task is its own row', JSON.stringify(await q(`select gorev, adet, saniye::float8 saniye, giris_token::int g, cikis_token::int c from ulke_kullanim_olcumu where doctor_id = $1 order by gorev`, [D1])) === JSON.stringify([{ gorev: 'konusma-ilk', adet: 1, saniye: 61.5, g: 0, c: 0 }, { gorev: 'not', adet: 2, saniye: 0, g: 1000, c: 250 }]))
  {
    const a = await baglan(), b = await baglan()
    const yirmi = async (istemci) => { for (let i = 0; i < 20; i++) await istemci.query(`select public.ulke_kullanim_ekle('uz', $1, '2026-10-13', 'hasta-ozeti', 1, 0, 10, 1)`, [D1]) }
    await Promise.all([yirmi(a), yirmi(b)])
    ok('P. usage: forty calls from two connections at the same moment lose no count', JSON.stringify(await q(`select adet, giris_token::int g, cikis_token::int c from ulke_kullanim_olcumu where gun = '2026-10-13'`)) === JSON.stringify([{ adet: 40, g: 400, c: 40 }]))
    await a.end(); await b.end()
  }
  await bekle('P. usage: a row for an account under ANOTHER country → refused 23503', `select public.ulke_kullanim_ekle('kz', $1, '2026-10-12', 'not', 1, 0, 0, 0)`, [D1], '23503')
  await bekle('P. usage: a login that is not a country account → refused 23503', `select public.ulke_kullanim_ekle('uz', $1, '2026-10-12', 'not', 1, 0, 0, 0)`, [L0], '23503')
  await bekle('P. usage: a task key that is not one → refused 23514', `select public.ulke_kullanim_ekle('uz', $1, '2026-10-12', 'Not A Task', 1, 0, 0, 0)`, [D1], '23514')
  ok('P. usage: the table has no column for a patient, a visit or a text', (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_kullanim_olcumu'`))[0].k === 'ulke,doctor_id,gun,gorev,adet,saniye,giris_token,cikis_token,updated_at')

  // links: one patient of one doctor in one country
  const PINH = `scrypt$16384$8$1$${'A'.repeat(22)}==$${'B'.repeat(43)}=`
  const T = (h) => h.repeat(64)
  const BITIS = '2027-01-01T00:00:00Z'
  const ver = async (ulke, d, h, token, bitis = BITIS, simdi = '2026-10-12T05:00:00Z') => (await c.query(`select public.ulke_portal_erisim_ver($1, $2, $3, $4, $5, $6, $7) id`, [ulke, d, h, token, PINH, bitis, simdi])).rows[0].id
  const e1 = await ver('uz', D1, H1, T('a'))
  ok('P. link: a link is given for the doctor\'s own patient, and recorded', Boolean(e1) && (await say('ulke_portal_kayitlari', `olay = 'erisim' and patient_id = $1`, [H1])) === 1)
  ok('P. link: asked for ANOTHER doctor\'s patient → no link, nothing written', (await ver('uz', D2, H1, T('c'))) === null && (await say('ulke_portal_erisimleri')) === 1)
  ok('P. link: asked for under ANOTHER country → no link, nothing written', (await ver('kz', D1, H1, T('c'))) === null && (await ver('kz', K1, H1, T('c'))) === null && (await say('ulke_portal_erisimleri')) === 1)
  const EKLE = `insert into ulke_portal_erisimleri (ulke, doctor_id, patient_id, token_hash, pin_hash, son_gecerlilik) values ($1, $2, $3, $4, $5, now() + interval '1 day')`
  await bekle('P. link: written past the function — a second link of the same patient that is not withdrawn → refused 23505', EKLE, ['uz', D1, H1, T('d'), PINH], '23505')
  await bekle('P. link: one doctor\'s link for another doctor\'s patient → refused 23503', EKLE, ['uz', D2, H1, T('d'), PINH], '23503')
  await bekle('P. link: a link of another country for this patient → refused 23503', EKLE, ['kz', K1, H1, T('d'), PINH], '23503')
  await bekle('P. link: a PIN in the clear instead of its hash → refused 23514', EKLE, ['uz', D1, H1b, T('d'), '123456'], '23514')
  await bekle('P. link: a token in the clear instead of its SHA-256 → refused 23514', EKLE, ['uz', D1, H1b, 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCdE', PINH], '23514')

  // the PIN: a try is counted before it is looked at; the link locks
  const al = async (ulke, token, simdi, istemci = c) => (await istemci.query(`select public.ulke_portal_deneme_al($1, $2, 5, 2, $3) r`, [ulke, token, simdi])).rows[0].r
  const sonuc = async (ulke, id, dogru, simdi, oturum = null, bitis = '2026-10-12T06:00:00Z') => (await c.query(`select public.ulke_portal_deneme_sonucu($1, $2, $3, 5, $4, $5, $6) r`, [ulke, id, dogru, oturum, bitis, simdi])).rows[0].r
  const link = async (id) => (await q(`select hatali_deneme::int n, kilitlendi_at is not null kilitli, iptal_at is not null iptal from ulke_portal_erisimleri where id = $1`, [id]))[0]
  ok('P. PIN: a token that does not exist, and the right token asked for under another country, answer the same "no such link"', JSON.stringify([await al('uz', T('0'), '2026-10-12T05:01:00Z'), await al('kz', T('a'), '2026-10-12T05:01:00Z')]) === JSON.stringify([{ durum: 'YOK' }, { durum: 'YOK' }]) && (await link(e1)).n === 0)
  {
    const r = await al('uz', T('a'), '2026-10-12T05:01:00Z')
    ok('P. PIN: a try is TAKEN (counted) before the PIN is looked at, and only then is the hash handed to the server', r.durum === 'DENE' && r.erisim_id === e1 && r.pin_hash === PINH && r.patient_id === H1 && (await link(e1)).n === 1)
    ok('P. PIN: a try one second later is not looked at and not counted', (await al('uz', T('a'), '2026-10-12T05:01:01Z')).durum === 'YAVAS' && (await link(e1)).n === 1)
    ok('P. PIN: a wrong PIN says how many tries are left', JSON.stringify(await sonuc('uz', e1, false, '2026-10-12T05:01:02Z')) === JSON.stringify({ durum: 'YANLIS', kalan: 4 }))
    ok('P. PIN: the result of a try reported under another country changes nothing', (await sonuc('kz', e1, true, '2026-10-12T05:01:02Z', T('9'))).durum === 'YOK' && (await say('ulke_portal_oturumlari')) === 0)
    await al('uz', T('a'), '2026-10-12T05:01:10Z')
    const g = await sonuc('uz', e1, true, '2026-10-12T05:01:11Z', T('e'), '2028-01-01T00:00:00Z')
    const o = (await q(`select ulke, doctor_id, patient_id, erisim_id, son_gecerlilik from ulke_portal_oturumlari where oturum_hash = $1`, [T('e')]))[0]
    ok('P. PIN: the right PIN gives the tries back, opens a session of that link\'s own country, doctor and patient, and is recorded', g.durum === 'TAMAM' && (await link(e1)).n === 0 && o.ulke === 'uz' && o.doctor_id === D1 && o.patient_id === H1 && o.erisim_id === e1 && (await say('ulke_portal_kayitlari', `olay = 'giris' and patient_id = $1`, [H1])) === 1)
    ok('P. PIN: a session never outlives its link, whatever end is asked for', o.son_gecerlilik.toISOString() === new Date(BITIS).toISOString())
  }
  {
    // TWO REQUESTS AT THE SAME MOMENT cannot share one try: the second waits for the first, then is "too fast".
    const a = await baglan(), b = await baglan()
    await a.query('begin')
    const ilk = await al('uz', T('a'), '2026-10-12T05:02:00Z', a)
    let ikinci = 'pending'
    const bekleyen = al('uz', T('a'), '2026-10-12T05:02:00Z', b).then((r) => { ikinci = r.durum }, (e) => { ikinci = e.code })
    await new Promise((r) => setTimeout(r, 400))
    ok('P. PIN: two tries at the same moment — the second waits while the first is undecided', ilk.durum === 'DENE' && ikinci === 'pending', ikinci)
    await a.query('commit'); await bekleyen
    ok('P. PIN: … and once the first is counted, the second is refused as too fast: exactly one try was taken', ikinci === 'YAVAS' && (await link(e1)).n === 1, `${ikinci}, ${(await link(e1)).n}`)
    await a.end(); await b.end()
    await sonuc('uz', e1, false, '2026-10-12T05:02:01Z')
  }
  {
    // four more wrong tries: the fifth locks the link for good and closes the session that was open
    let son = null
    for (let i = 0; i < 4; i++) { await al('uz', T('a'), `2026-10-12T05:03:${String(i * 5).padStart(2, '0')}Z`); son = await sonuc('uz', e1, false, `2026-10-12T05:03:${String(i * 5 + 1).padStart(2, '0')}Z`) }
    const l = await link(e1)
    ok('P. PIN: the fifth wrong PIN LOCKS the link, closes its open session, and the lock is recorded once', son.durum === 'KILITLI' && l.kilitli && (await say('ulke_portal_oturumlari', `erisim_id = $1 and kapandi_at is null`, [e1])) === 0 && (await say('ulke_portal_kayitlari', `olay = 'kilit' and patient_id = $1`, [H1])) === 1, JSON.stringify([son, l]))
    ok('P. PIN: a locked link stays locked — for a new try and for a right PIN reported late', (await al('uz', T('a'), '2026-10-13T05:00:00Z')).durum === 'KILITLI' && (await sonuc('uz', e1, true, '2026-10-13T05:00:01Z', T('8'))).durum === 'KILITLI' && (await say('ulke_portal_oturumlari', `oturum_hash = $1`, [T('8')])) === 0)
  }
  // a NEW link withdraws the old one in the same step
  const e2 = await ver('uz', D1, H1, T('b'), BITIS, '2026-10-13T06:00:00Z')
  ok('P. link: a new link withdraws the one before it: one link of the patient is not withdrawn, and the old token is "no such link"', Boolean(e2) && (await link(e1)).iptal && (await say('ulke_portal_erisimleri', `patient_id = $1 and iptal_at is null`, [H1])) === 1 && (await al('uz', T('a'), '2026-10-13T06:01:00Z')).durum === 'YOK')
  {
    // five tries taken and never reported back (requests cut off after the first step): the sixth finds none left
    for (let i = 0; i < 5; i++) await al('uz', T('b'), `2026-10-13T07:00:${String(i * 5).padStart(2, '0')}Z`)
    ok('P. PIN: tries that were taken and never reported still count: the sixth request locks the link', (await al('uz', T('b'), '2026-10-13T07:01:00Z')).durum === 'KILITLI' && (await link(e2)).kilitli)
  }
  const e3 = await ver('uz', D1, H1, T('f'), '2026-10-20T00:00:00Z', '2026-10-13T08:00:00Z')
  ok('P. link: after its end a link is "no such link", and a try reported late opens nothing', (await al('uz', T('f'), '2026-10-20T00:00:00Z')).durum === 'YOK' && (await sonuc('uz', e3, true, '2026-10-20T00:00:01Z', T('7'))).durum === 'YOK' && (await say('ulke_portal_oturumlari', `oturum_hash = $1`, [T('7')])) === 0)
  {
    const iptal = async (ulke, d, h) => (await c.query(`select public.ulke_portal_erisim_iptal($1, $2, $3, '2026-10-13T09:00:00Z') r`, [ulke, d, h])).rows[0].r
    ok('P. link: another doctor, or a call under another country, cannot withdraw it', (await iptal('uz', D2, H1)) === false && (await iptal('kz', D1, H1)) === false && (await link(e3)).iptal === false)
    ok('P. link: its own doctor withdraws it, once; a second time there is nothing to withdraw and nothing is recorded', (await iptal('uz', D1, H1)) === true && (await iptal('uz', D1, H1)) === false && (await link(e3)).iptal && (await say('ulke_portal_kayitlari', `olay = 'iptal' and patient_id = $1`, [H1])) === 1)
  }
  const e4 = await ver('uz', D1, H1b, T('1'), BITIS, '2026-10-13T10:00:00Z')
  await bekle('P. session: a session of one patient hung from ANOTHER patient\'s link → refused 23503', `insert into ulke_portal_oturumlari (ulke, doctor_id, patient_id, erisim_id, oturum_hash, son_gecerlilik) values ('uz', $1, $2, $3, $4, now() + interval '1 hour')`, [D1, H1, e4, T('6')], '23503')
  await bekle('P. session: a session of another country hung from this link → refused 23503', `insert into ulke_portal_oturumlari (ulke, doctor_id, patient_id, erisim_id, oturum_hash, son_gecerlilik) values ('kz', $1, $2, $3, $4, now() + interval '1 hour')`, [D1, H1b, e4, T('6')], '23503')

  // summaries: only of an approved note, only for that note's patient; sharing and its record together
  const x = await notKur(D1, H1, null)
  const OZET = `insert into ulke_hasta_ozetleri (ulke, doctor_id, patient_id, note_id, dil, ozet_encrypted, paylasildi_at) values ($1, $2, $3, $4, 'uz-Latn', 'sifreli', $5) returning id`
  await bekle('P. summary: of a note that is NOT approved → refused 23514', OZET, ['uz', D1, H1, x.n, null], '23514')
  await bekle('P. summary: … not even already marked shared → refused 23514', OZET, ['uz', D1, H1, x.n, '2026-10-13T10:00:00Z'], '23514')
  await onayla(x.n, D1, null)
  await bekle('P. summary: of an approved note, for ANOTHER patient of the same doctor → refused 23514', OZET, ['uz', D1, H1b, x.n, null], '23514')
  await bekle('P. summary: of an approved note, under another doctor → refused 23514', OZET, ['uz', D2, H2, x.n, null], '23514')
  await bekle('P. summary: of an approved note, under another country → refused 23514', OZET, ['kz', K1, HK, x.n, null], '23514')
  const z = (await c.query(OZET, ['uz', D1, H1, x.n, null])).rows[0].id
  ok('P. summary: of an approved note, for its own patient → stored, NOT shared', Boolean(z) && (await say('ulke_hasta_ozetleri', 'paylasildi_at is null')) === 1)
  await bekle('P. summary: a second summary of the same note → refused 23505', OZET, ['uz', D1, H1, x.n, null], '23505')
  {
    const paylas = async (ulke, d, id, p, simdi = '2026-10-13T11:00:00Z') => (await c.query(`select public.ulke_ozet_paylas($1, $2, $3, $4, $5) r`, [ulke, d, id, p, simdi])).rows[0].r
    const durum = async () => JSON.stringify([(await q(`select paylasildi_at is not null p from ulke_hasta_ozetleri where id = $1`, [z]))[0].p, (await q(`select olay from ulke_portal_kayitlari where ozet_id = $1 order by created_at, olay`, [z])).map((r) => r.olay)])
    ok('P. sharing: another doctor, or a call under another country → NOT_FOUND, nothing changed', (await paylas('uz', D2, z, true)) === 'NOT_FOUND' && (await paylas('kz', D1, z, true)) === 'NOT_FOUND' && (await durum()) === JSON.stringify([false, []]))
    ok('P. sharing: shared and recorded together', (await paylas('uz', D1, z, true)) === 'TAMAM' && (await durum()) === JSON.stringify([true, ['paylasim']]))
    ok('P. sharing: sharing what is already shared changes nothing and records nothing', (await paylas('uz', D1, z, true, '2026-10-13T11:05:00Z')) === 'AYNI' && (await durum()) === JSON.stringify([true, ['paylasim']]))
    ok('P. sharing: taken back and recorded together', (await paylas('uz', D1, z, false, '2026-10-13T11:10:00Z')) === 'TAMAM' && (await durum()) === JSON.stringify([false, ['paylasim', 'geri-alma']]))
    // A note that lost its approval (the application never does this; done here by hand) cannot be shared.
    await c.query(`update ulke_notlar set approved_at = null, approved_by = null where id = $1`, [x.n])
    await bekle('P. sharing: if the note is not approved, the share is refused by the table\'s own rule → 23514', `select public.ulke_ozet_paylas('uz', $1, $2, true, '2026-10-13T11:20:00Z')`, [D1, z], '23514')
    ok('P. sharing: … and after that refusal nothing was shared and nothing recorded', (await durum()) === JSON.stringify([false, ['paylasim', 'geri-alma']]))
    await c.query(`update ulke_notlar set approved_at = now(), approved_by = $2 where id = $1`, [x.n, D1])
  }
  await bekle('P. record: an event that is not one of the six → refused 23514', `insert into ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay) values ('uz', $1, $2, 'okundu')`, [D1, H1], '23514')
  await bekle('P. record: an event of one doctor about another doctor\'s patient → refused 23503', `insert into ulke_portal_kayitlari (ulke, doctor_id, patient_id, olay) values ('uz', $1, $2, 'giris')`, [D2, H1], '23503')

  // appointment requests: one waiting; accepting books under the no-double-booking rule, or nothing happens
  const ISTEK = `insert into ulke_randevu_istekleri (ulke, doctor_id, patient_id, gunler) values ($1, $2, $3, $4) returning id`
  const i1 = (await c.query(ISTEK, ['uz', D1, H1, '{2027-03-01,2027-03-02}'])).rows[0].id
  await bekle('P. request: a second unanswered request of the same patient → refused 23505', ISTEK, ['uz', D1, H1, '{2027-03-03}'], '23505')
  await bekle('P. request: of one doctor for another doctor\'s patient → refused 23503', ISTEK, ['uz', D2, H1b, '{2027-03-03}'], '23503')
  await bekle('P. request: under another country for this patient → refused 23503', ISTEK, ['kz', K1, H1b, '{2027-03-03}'], '23503')
  await bekle('P. request: without a day, or with more than five → refused 23514', ISTEK, ['uz', D1, H1b, '{}'], '23514')
  await bekle('P. request: marked accepted without an appointment → refused 23514', `update ulke_randevu_istekleri set durum = 'kabul', cevap_at = now() where id = $1`, [i1], '23514')
  {
    const kabul = (ulke, d, id, bas) => c.query(`select public.ulke_randevu_istegi_kabul($1, $2, $3, $4::timestamptz, $4::timestamptz + interval '30 minutes', null, false, '2026-10-13T12:00:00Z') r`, [ulke, d, id, bas]).then((r) => r.rows[0].r)
    const dolu = (await ekle(D1, H1b, '2027-03-01T05:00:00Z', '2027-03-01T05:30:00Z')).rows[0].id
    const randevuSayisi = await say('ulke_randevulari')
    ok('P. request: another doctor, or a call under another country → NOT_FOUND', (await kabul('uz', D2, i1, '2027-03-01T06:00:00Z')).durum === 'NOT_FOUND' && (await kabul('kz', D1, i1, '2027-03-01T06:00:00Z')).durum === 'NOT_FOUND')
    let kod = 'accepted'
    try { await kabul('uz', D1, i1, '2027-03-01T05:15:00Z') } catch (e) { kod = e.code }
    ok('P. request: accepted onto a TAKEN time → refused 23P01 by the no-double-booking rule', kod === '23P01', kod)
    ok('P. request: … and nothing happened: no appointment was written and the request still waits', (await say('ulke_randevulari')) === randevuSayisi && (await q(`select durum, randevu_id from ulke_randevu_istekleri where id = $1`, [i1]))[0].durum === 'bekliyor')
    const r = await kabul('uz', D1, i1, '2027-03-01T05:30:00Z')
    const satir = (await q(`select i.durum, i.randevu_id, r.patient_id, r.doctor_id, r.ulke, r.durum rdurum from ulke_randevu_istekleri i join ulke_randevulari r on r.id = i.randevu_id where i.id = $1`, [i1]))[0]
    ok('P. request: accepted onto a free time → the appointment is booked for the request\'s own patient and the request is marked, together', r.durum === 'TAMAM' && satir.durum === 'kabul' && satir.randevu_id === r.randevu_id && satir.patient_id === H1 && satir.doctor_id === D1 && satir.ulke === 'uz' && satir.rdurum === 'planlandi')
    ok('P. request: an answered request is not answered again', (await kabul('uz', D1, i1, '2027-03-02T05:00:00Z')).durum === 'CEVAPLANDI' && (await say('ulke_randevulari')) === randevuSayisi + 1)
    await bekle('P. request: pointed at ANOTHER patient\'s appointment → refused 23503', `update ulke_randevu_istekleri set randevu_id = $2 where id = $1`, [i1, dolu], '23503')
    ok('P. request: the patient may ask again once the first is answered', Boolean((await c.query(ISTEK, ['uz', D1, H1, '{2027-03-05}'])).rows[0].id))
  }

  // SERVER ONLY: no browser session reads any of it, not even its own rows; none of the functions can be called by one
  {
    const TABLOLAR = ['ulke_kullanim_olcumu', 'ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_hasta_ozetleri', 'ulke_portal_kayitlari', 'ulke_randevu_istekleri']
    const ISLEVLER = [`ulke_kullanim_ekle('uz', '${D1}', '2026-10-12', 'not', 1, 0, 0, 0)`, `ulke_portal_erisim_ver('uz', '${D1}', '${H1}', '${T('5')}', '${PINH}', now(), now())`, `ulke_portal_erisim_iptal('uz', '${D1}', '${H1}', now())`, `ulke_portal_deneme_al('uz', '${T('1')}', 5, 2, now())`, `ulke_portal_deneme_sonucu('uz', '${e4}', true, 5, '${T('4')}', now(), now())`, `ulke_ozet_paylas('uz', '${D1}', '${z}', true, now())`, `ulke_randevu_istegi_kabul('uz', '${D1}', '${i1}', now(), now() + interval '30 minutes', null, false, now())`]
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(D1, ulke); else await c.query(`set role ${rol}`)
      for (const t of TABLOLAR) { try { await c.query(`select 1 from ${t} limit 1`); cikti.push(`${t}: read`) } catch (e) { if (e.code !== '42501') cikti.push(`${t}: ${e.code}`) } }
      for (const t of TABLOLAR) { try { await c.query(`delete from ${t}`); cikti.push(`${t}: write`) } catch (e) { if (e.code !== '42501') cikti.push(`${t}: ${e.code}`) } }
      for (const f of ISLEVLER) { try { await c.query(`select public.${f}`); cikti.push(`${f.split('(')[0]}: called`) } catch (e) { if (e.code !== '42501') cikti.push(`${f.split('(')[0]}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('P. server only: the doctor\'s own signed-in browser session can read, write and call NONE of it (its own rows included)', girisli.length === 0, girisli.join('; '))
    ok('P. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select public.ulke_kullanim_ekle('uz', $1, '2026-10-14', 'not', 1, 0, 1, 1)`, [D1]); await c.query(`select count(*) from ulke_portal_erisimleri`) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('P. server only: the server\'s role can', sunucu === 'ok', sunucu)
  }
}

// ── F. the intake form (migration 138) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (tablo, kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ${tablo} where ${kosul}`, par)).rows[0].n
  const PINH = `scrypt$16384$8$1$${'A'.repeat(22)}==$${'B'.repeat(43)}=`
  // Token hashes of this section's own (section P used the one-letter ones).
  const T = (h) => `f${h}`.repeat(32)
  const SON = '2027-06-01T00:00:00Z', SIMDI = '2027-01-10T08:00:00Z'
  const iste = async (ulke, d, h, s = {}, istemci = c) => (await istemci.query(`select public.ulke_hasta_formu_iste($1, $2, $3, $4, $5, 'surum-1', $6, $7, $8, $9, $10, $11) as r`, [ulke, d, h, s.randevu ?? null, s.rol ?? 'kardiyoloji', s.veli ?? false, s.yeni ?? false, 'token' in s ? s.token : T('a'), 'pin' in s ? s.pin : PINH, SON, s.simdi ?? SIMDI])).rows[0].r
  const F1 = await hasta(D1), F2 = await hasta(D1), F3 = await hasta(D2)

  // asking for the form gives access in the same step
  const r1 = await iste('uz', D1, F1)
  ok('F. asking: a patient without a link gets the form AND a link in one call', r1.durum === 'TAMAM' && r1.yeni_form === true && r1.erisim === 'YENI' && (await say('ulke_hasta_formlari', 'patient_id = $1', [F1])) === 1 && (await say('ulke_portal_erisimleri', 'patient_id = $1 and iptal_at is null', [F1])) === 1, JSON.stringify(r1))
  ok('F. asking: the form is stamped with its country, doctor, patient, role, version and guardian mark; nothing is saved yet', JSON.stringify(await q(`select ulke, doctor_id, patient_id, rol, soru_surumu, veli, durum, cevaplar_encrypted from ulke_hasta_formlari where id = $1`, [r1.form_id])) === JSON.stringify([{ ulke: 'uz', doctor_id: D1, patient_id: F1, rol: 'kardiyoloji', soru_surumu: 'surum-1', veli: false, durum: 'bekliyor', cevaplar_encrypted: null }]))
  ok('F. asking: the link is recorded for the doctor exactly as when access is given by hand', (await say('ulke_portal_kayitlari', `patient_id = $1 and olay = 'erisim'`, [F1])) === 1)
  const r2 = await iste('uz', D1, F1, { token: T('b') })
  ok('F. asking again: the open form is kept and the working link is left alone', r2.durum === 'TAMAM' && r2.form_id === r1.form_id && r2.yeni_form === false && r2.erisim === 'VAR' && (await say('ulke_portal_erisimleri', 'patient_id = $1', [F1])) === 1, JSON.stringify(r2))
  const r3 = await iste('uz', D1, F1, { token: T('c'), yeni: true })
  ok('F. asking with "a new link": the link before it is withdrawn in the same step', r3.erisim === 'YENI' && r3.form_id === r1.form_id && JSON.stringify(await q(`select token_hash, iptal_at is null acik from ulke_portal_erisimleri where patient_id = $1 order by created_at, token_hash`, [F1])) === JSON.stringify([{ token_hash: T('a'), acik: false }, { token_hash: T('c'), acik: true }]), JSON.stringify(r3))
  await c.query(`update ulke_portal_erisimleri set kilitlendi_at = now() where patient_id = $1 and iptal_at is null`, [F1])
  ok('F. asking: a locked link is not access — a new one is made', (await iste('uz', D1, F1, { token: T('d') })).erisim === 'YENI')
  const once = await say('ulke_hasta_formlari') + await say('ulke_portal_erisimleri')
  ok('F. asking for ANOTHER doctor\'s patient → NOT_FOUND', (await iste('uz', D1, F3)).durum === 'NOT_FOUND')
  ok('F. asking under ANOTHER country → NOT_FOUND', (await iste('kz', D1, F1)).durum === 'NOT_FOUND' && (await iste('uz', K1, HK)).durum === 'NOT_FOUND')
  const ra = (await ekle(D1, F1, '2027-04-01T05:00:00Z', '2027-04-01T05:30:00Z')).rows[0].id, rb = (await ekle(D1, F2, '2027-04-01T06:00:00Z', '2027-04-01T06:30:00Z')).rows[0].id
  ok('F. asking from ANOTHER patient\'s appointment → NOT_FOUND', (await iste('uz', D1, F1, { randevu: rb })).durum === 'NOT_FOUND')
  ok('F. asking where a link is needed and no token or PIN hash is given → GECERSIZ', (await iste('uz', D1, F2, { token: null })).durum === 'GECERSIZ' && (await iste('uz', D1, F2, { pin: null })).durum === 'GECERSIZ')
  ok('F. … and none of the refused calls wrote anything', (await say('ulke_hasta_formlari') + await say('ulke_portal_erisimleri')) === once)
  ok('F. asking from the patient\'s own appointment: the open form is linked to it', (await iste('uz', D1, F1, { randevu: ra })).durum === 'TAMAM' && (await q(`select randevu_id from ulke_hasta_formlari where id = $1`, [r1.form_id]))[0].randevu_id === ra)
  {
    // The link's own constraint fails INSIDE the call (a token hash that is already taken): the form is not left behind.
    let kod = 'none'
    try { await iste('uz', D1, F2, { token: T('c') }) } catch (e) { kod = e.code }
    ok('F. all or nothing: when giving access fails inside the call, no form is left behind', kod === '23505' && (await say('ulke_hasta_formlari', 'patient_id = $1', [F2])) === 0, kod)
  }
  {
    const a = await baglan(), b = await baglan()
    // (Two tokens nobody holds yet. The second was T('f') — sixty-four f's, the very token section P gave a link — so
    // the check passed only while the first request won the race, and stopped the proof whenever the second did.)
    const [x, y] = await Promise.all([iste('uz', D1, F2, { token: T('e') }, a), iste('uz', D1, F2, { token: T('9') }, b)])
    ok('F. two requests for the same patient at the same moment: ONE form, ONE link', x.form_id === y.form_id && [x.yeni_form, y.yeni_form].filter(Boolean).length === 1 && [x.erisim, y.erisim].sort().join() === 'VAR,YENI' && (await say('ulke_hasta_formlari', 'patient_id = $1', [F2])) === 1 && (await say('ulke_portal_erisimleri', 'patient_id = $1', [F2])) === 1, JSON.stringify([x, y]))
    await a.end(); await b.end()
  }

  // the keys
  const FORM = `insert into ulke_hasta_formlari (ulke, doctor_id, patient_id, rol, soru_surumu, veli, randevu_id) values ($1, $2, $3, null, 's', false, $4) returning id`
  await bekle('F. keys: a second OPEN form for the same patient → refused 23505', FORM, ['uz', D1, F1, null], '23505')
  await bekle('F. keys: a form for ANOTHER doctor\'s patient → refused 23503', FORM, ['uz', D1, F3, null], '23503')
  await bekle('F. keys: a form under ANOTHER country for this patient → refused 23503', FORM, ['kz', D1, F1, null], '23503')
  await bekle('F. keys: a form that names ANOTHER patient\'s appointment → refused 23503', `update ulke_hasta_formlari set randevu_id = $2 where id = $1`, [r1.form_id, rb], '23503')
  await bekle('F. keys: a role that is not a key → refused 23514', `insert into ulke_hasta_formlari (ulke, doctor_id, patient_id, rol, soru_surumu, veli) values ('uz', $1, $2, 'Not A Role', 's', false)`, [D2, F3], '23514')

  // answers and state
  const KAYDET = `update ulke_hasta_formlari set durum = 'taslak', cevaplar_encrypted = $2, dil = 'ru', riza_surumu = 'r1', riza_at = now() where id = $1`
  await bekle('F. state: answers without the consent stamp → refused 23514', `update ulke_hasta_formlari set durum = 'taslak', cevaplar_encrypted = 'x' where id = $1`, [r1.form_id], '23514')
  await bekle('F. state: "submitted" without answers → refused 23514', `update ulke_hasta_formlari set durum = 'gonderildi', gonderildi_at = now() where id = $1`, [r1.form_id], '23514')
  await bekle('F. state: "submitted" without its moment → refused 23514', `update ulke_hasta_formlari set durum = 'gonderildi', cevaplar_encrypted = 'x', dil = 'ru', riza_surumu = 'r1', riza_at = now() where id = $1`, [r1.form_id], '23514')
  await c.query(KAYDET, [r1.form_id, 'sifreli-1'])
  await c.query(`update ulke_hasta_formlari set cevaplar_encrypted = 'sifreli-2' where id = $1`, [r1.form_id])
  ok('F. state: a draft is saved and saved again', (await q(`select durum, cevaplar_encrypted from ulke_hasta_formlari where id = $1`, [r1.form_id]))[0].cevaplar_encrypted === 'sifreli-2')
  await bekle('F. trigger: the role of a form is fixed when it is asked for → refused 23514', `update ulke_hasta_formlari set rol = 'pediatri' where id = $1`, [r1.form_id], '23514')
  await bekle('F. trigger: so is the guardian mark → refused 23514', `update ulke_hasta_formlari set veli = true where id = $1`, [r1.form_id], '23514')
  await bekle('F. trigger: a form never moves to another patient → refused 23514', `update ulke_hasta_formlari set patient_id = $2 where id = $1`, [r1.form_id, F2], '23514')
  await bekle('F. trigger: nor to another country → refused 23514', `update ulke_hasta_formlari set ulke = 'kz' where id = $1`, [r1.form_id], '23514')
  await c.query(`update ulke_hasta_formlari set durum = 'gonderildi', gonderildi_at = now() where id = $1`, [r1.form_id])
  await bekle('F. trigger: the answers of a SUBMITTED form do not change → refused 23514', `update ulke_hasta_formlari set cevaplar_encrypted = 'sifreli-3' where id = $1`, [r1.form_id], '23514')
  await bekle('F. trigger: a submitted form is not withdrawn → refused 23514', `update ulke_hasta_formlari set durum = 'iptal', gonderildi_at = null, iptal_at = now() where id = $1`, [r1.form_id], '23514')
  const r4 = await iste('uz', D1, F1, { token: T('9') })
  ok('F. after a submitted form, a new one can be asked for; the submitted one stays', r4.yeni_form === true && r4.form_id !== r1.form_id && (await say('ulke_hasta_formlari', 'patient_id = $1', [F1])) === 2)
  await bekle('F. reopening a submitted form while another is open → refused 23505', `update ulke_hasta_formlari set durum = 'taslak', gonderildi_at = null, yeniden_acildi_at = now() where id = $1`, [r1.form_id], '23505')
  await c.query(`update ulke_hasta_formlari set durum = 'iptal', iptal_at = now() where id = $1`, [r4.form_id])
  await bekle('F. trigger: a WITHDRAWN form does not change at all → refused 23514', `update ulke_hasta_formlari set durum = 'bekliyor', iptal_at = null where id = $1`, [r4.form_id], '23514')
  await c.query(`update ulke_hasta_formlari set durum = 'taslak', gonderildi_at = null, yeniden_acildi_at = now() where id = $1`, [r1.form_id])
  await c.query(`update ulke_hasta_formlari set cevaplar_encrypted = 'sifreli-4' where id = $1`, [r1.form_id])
  ok('F. reopened by the doctor: a draft again, the answers change again', JSON.stringify(await q(`select durum, cevaplar_encrypted, gonderildi_at, yeniden_acildi_at is not null y from ulke_hasta_formlari where id = $1`, [r1.form_id])) === JSON.stringify([{ durum: 'taslak', cevaplar_encrypted: 'sifreli-4', gonderildi_at: null, y: true }]))
  ok('F. the table has ONE column for answers and none per answer', (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_hasta_formlari'`))[0].k === 'id,ulke,doctor_id,patient_id,randevu_id,rol,soru_surumu,veli,durum,cevaplar_encrypted,dil,riza_surumu,riza_at,gonderildi_at,yeniden_acildi_at,iptal_at,created_at,updated_at')

  // SERVER ONLY
  {
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(D1, ulke); else await c.query(`set role ${rol}`)
      for (const sql of [`select 1 from ulke_hasta_formlari limit 1`, `delete from ulke_hasta_formlari`, `update ulke_hasta_formlari set updated_at = now()`, `select public.ulke_hasta_formu_iste('uz', '${D1}', '${F1}', null, null, 's', false, false, '${T('8')}', '${PINH}', now(), now())`, `select public.ulke_hasta_formu_kilidi()`]) { try { await c.query(sql); cikti.push(`${sql.slice(0, 40)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 40)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('F. server only: the doctor\'s own signed-in browser session can read, write and call NONE of it (its own rows included)', girisli.length === 0, girisli.join('; '))
    ok('F. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select count(*) from ulke_hasta_formlari`); await c.query(`select public.ulke_hasta_formu_iste('uz', $1, $2, null, null, 's', false, false, $3, $4, now() + interval '1 day', now())`, [D2, F3, T('7'), PINH]) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('F. server only: the server\'s role can', sunucu === 'ok' && (await say('ulke_hasta_formlari', 'patient_id = $1', [F3])) === 1, sunucu)
  }
}

// ── K. the tool records (migration 139) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ulke_arac_kayitlari where ${kosul}`, par)).rows[0].n
  const A1 = await hasta(D1), A2 = await hasta(D1), A3 = await hasta(D2), SIL = await hasta(D1)
  const EKLE = `insert into ulke_arac_kayitlari (ulke, doctor_id, patient_id, arac, kayit_encrypted, takip_tarihi) values ($1, $2, $3, $4, $5, $6) returning id`
  const k1 = (await q(EKLE, ['uz', D1, A1, 'kdigo-evre', 'sifreli-1', '2027-05-01']))[0].id
  const k2 = (await q(EKLE, ['uz', D1, A1, 'das28', 'sifreli-2', null]))[0].id
  ok('K. a record is stamped with its country, doctor, patient and tool; its follow-up is open', JSON.stringify(await q(`select ulke, doctor_id, patient_id, arac, kayit_encrypted, takip_tarihi::text t, kapandi_at from ulke_arac_kayitlari where id = $1`, [k1])) === JSON.stringify([{ ulke: 'uz', doctor_id: D1, patient_id: A1, arac: 'kdigo-evre', kayit_encrypted: 'sifreli-1', t: '2027-05-01', kapandi_at: null }]))
  ok('K. a patient may have many records, of the same tool too', (await q(EKLE, ['uz', D1, A1, 'kdigo-evre', 'sifreli-3', '2027-06-01'])).length === 1 && (await say('patient_id = $1', [A1])) === 3)

  // the keys
  await bekle('K. keys: a record for ANOTHER doctor\'s patient → refused 23503', EKLE, ['uz', D1, A3, 'das28', 'x', null], '23503')
  await bekle('K. keys: a record under ANOTHER country for this patient → refused 23503', EKLE, ['kz', D1, A1, 'das28', 'x', null], '23503')
  await bekle('K. keys: a record for a patient of ANOTHER country\'s doctor → refused 23503', EKLE, ['uz', K1, HK, 'das28', 'x', null], '23503')
  await bekle('K. keys: a tool key that is not a key → refused 23514', EKLE, ['uz', D1, A1, 'Not A Tool', 'x', null], '23514')
  await bekle('K. keys: a record without content → refused 23514', EKLE, ['uz', D1, A1, 'das28', '', null], '23514')
  await bekle('K. keys: a record without content (null) → refused 23502', EKLE, ['uz', D1, A1, 'das28', null, null], '23502')
  await bekle('K. state: closing a follow-up that does not exist → refused 23514', `update ulke_arac_kayitlari set kapandi_at = now() where id = $1`, [k2], '23514')

  // what a record may never do
  await bekle('K. trigger: a record never moves to another patient → refused 23514', `update ulke_arac_kayitlari set patient_id = $2 where id = $1`, [k1, A2], '23514')
  await bekle('K. trigger: nor to another doctor → refused 23514', `update ulke_arac_kayitlari set doctor_id = $2 where id = $1`, [k1, D2], '23514')
  await bekle('K. trigger: nor to another country → refused 23514', `update ulke_arac_kayitlari set ulke = 'kz' where id = $1`, [k1], '23514')
  await bekle('K. trigger: its tool does not change → refused 23514', `update ulke_arac_kayitlari set arac = 'das28' where id = $1`, [k1], '23514')
  await bekle('K. trigger: its content does not change → refused 23514', `update ulke_arac_kayitlari set kayit_encrypted = 'baska' where id = $1`, [k1], '23514')
  await bekle('K. trigger: its follow-up day does not change → refused 23514', `update ulke_arac_kayitlari set takip_tarihi = '2028-01-01' where id = $1`, [k1], '23514')
  await bekle('K. trigger: a follow-up day is not added afterwards → refused 23514', `update ulke_arac_kayitlari set takip_tarihi = '2028-01-01' where id = $1`, [k2], '23514')
  await c.query(`update ulke_arac_kayitlari set kapandi_at = '2027-05-02T08:00:00Z', updated_at = now() where id = $1`, [k1])
  ok('K. the doctor closes a follow-up', (await say('id = $1 and kapandi_at is not null', [k1])) === 1)
  await bekle('K. trigger: a closed follow-up is not opened again → refused 23514', `update ulke_arac_kayitlari set kapandi_at = null where id = $1`, [k1], '23514')
  await bekle('K. trigger: nor is its moment moved → refused 23514', `update ulke_arac_kayitlari set kapandi_at = now() where id = $1`, [k1], '23514')
  ok('K. the follow-up list of a doctor is the open follow-ups only, by day', JSON.stringify(await q(`select takip_tarihi::text t from ulke_arac_kayitlari where ulke = 'uz' and doctor_id = $1 and takip_tarihi is not null and kapandi_at is null order by takip_tarihi`, [D1])) === JSON.stringify([{ t: '2027-06-01' }]))
  ok('K. the table has ONE column for the content and none per field', (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_arac_kayitlari'`))[0].k === 'id,ulke,doctor_id,patient_id,arac,kayit_encrypted,takip_tarihi,kapandi_at,created_at,updated_at')

  // removing the patient removes the records
  await q(EKLE, ['uz', D1, SIL, 'das28', 'sifreli-4', null])
  await c.query(`delete from ulke_hastalar where id = $1 and doctor_id = $2 and ulke = 'uz'`, [SIL, D1])
  ok('K. removing a patient removes that patient\'s records and no one else\'s', (await say('patient_id = $1', [SIL])) === 0 && (await say('patient_id = $1', [A1])) === 3)

  // SERVER ONLY
  {
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(D1, ulke); else await c.query(`set role ${rol}`)
      for (const sql of [`select 1 from ulke_arac_kayitlari limit 1`, `delete from ulke_arac_kayitlari`, `update ulke_arac_kayitlari set updated_at = now()`, `insert into ulke_arac_kayitlari (ulke, doctor_id, patient_id, arac, kayit_encrypted) values ('uz', '${D1}', '${A1}', 'das28', 'x')`, `select public.ulke_arac_kaydi_kilidi()`]) { try { await c.query(sql); cikti.push(`${sql.slice(0, 40)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 40)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('K. server only: the doctor\'s own signed-in browser session can read and write NONE of it (its own rows included)', girisli.length === 0, girisli.join('; '))
    ok('K. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select count(*) from ulke_arac_kayitlari`); await c.query(EKLE, ['uz', D2, A3, 'das28', 'sifreli-5', null]) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('K. server only: the server\'s role can', sunucu === 'ok' && (await say('patient_id = $1', [A3])) === 1, sunucu)
  }
}

// ── M. messages between a doctor and a patient (migration 140) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (tablo, kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ${tablo} where ${kosul}`, par)).rows[0].n
  const A1 = await hasta(D1), A2 = await hasta(D1), A3 = await hasta(D2), SIL = await hasta(D1)
  const YAZ = `insert into ulke_mesaj_yazismalari (ulke, doctor_id, patient_id) values ($1, $2, $3) returning id`
  const MES = `insert into ulke_hasta_mesajlari (ulke, doctor_id, patient_id, yazisma_id, gonderen, metin_encrypted) values ($1, $2, $3, $4, $5, $6) returning id`
  const y1 = (await q(YAZ, ['uz', D1, A1]))[0].id
  const m1 = (await q(MES, ['uz', D1, A1, y1, 'hekim', 'sifreli-1']))[0].id
  const m2 = (await q(MES, ['uz', D1, A1, y1, 'hasta', 'sifreli-2']))[0].id
  ok('M. a conversation is stamped with its country, doctor and patient and begins open; a message with its writer, unread', JSON.stringify(await q(`select y.ulke, y.doctor_id, y.patient_id, y.kapandi_at, m.gonderen, m.metin_encrypted, m.okundu_at from ulke_mesaj_yazismalari y join ulke_hasta_mesajlari m on m.yazisma_id = y.id where m.id = $1`, [m1])) === JSON.stringify([{ ulke: 'uz', doctor_id: D1, patient_id: A1, kapandi_at: null, gonderen: 'hekim', metin_encrypted: 'sifreli-1', okundu_at: null }]))

  // the keys
  await bekle('M. keys: a second OPEN conversation for the same patient → refused 23505', YAZ, ['uz', D1, A1], '23505')
  await bekle('M. keys: a conversation with ANOTHER doctor\'s patient → refused 23503', YAZ, ['uz', D1, A3], '23503')
  await bekle('M. keys: a conversation under ANOTHER country for this patient → refused 23503', YAZ, ['kz', D1, A1], '23503')
  await bekle('M. keys: a conversation with a patient of ANOTHER country\'s doctor → refused 23503', YAZ, ['uz', K1, HK], '23503')
  const y2 = (await q(YAZ, ['uz', D1, A2]))[0].id
  const y3 = (await q(YAZ, ['uz', D2, A3]))[0].id
  await bekle('M. keys: a message that names ANOTHER patient\'s conversation (same doctor) → refused 23503', MES, ['uz', D1, A1, y2, 'hekim', 'x'], '23503')
  await bekle('M. keys: a message that names ANOTHER doctor\'s conversation → refused 23503', MES, ['uz', D1, A1, y3, 'hekim', 'x'], '23503')
  await bekle('M. keys: a message of another doctor into this conversation → refused 23503', MES, ['uz', D2, A1, y1, 'hekim', 'x'], '23503')
  await bekle('M. keys: a message under another country into this conversation → refused 23503', MES, ['kz', D1, A1, y1, 'hekim', 'x'], '23503')
  await bekle('M. keys: a writer that is neither the doctor nor the patient → refused 23514', MES, ['uz', D1, A1, y1, 'sistem', 'x'], '23514')
  await bekle('M. keys: a message without text → refused 23514', MES, ['uz', D1, A1, y1, 'hekim', ''], '23514')
  await bekle('M. keys: a message without text (null) → refused 23502', MES, ['uz', D1, A1, y1, 'hekim', null], '23502')
  await bekle('M. trigger: a message is written unread → refused 23514', `insert into ulke_hasta_mesajlari (ulke, doctor_id, patient_id, yazisma_id, gonderen, metin_encrypted, okundu_at) values ('uz', $1, $2, $3, 'hekim', 'x', now())`, [D1, A1, y1], '23514')

  // what a message may never do
  await bekle('M. trigger: the text of a message does not change → refused 23514', `update ulke_hasta_mesajlari set metin_encrypted = 'baska' where id = $1`, [m1], '23514')
  await bekle('M. trigger: nor its writer → refused 23514', `update ulke_hasta_mesajlari set gonderen = 'hasta' where id = $1`, [m1], '23514')
  await bekle('M. trigger: nor its moment → refused 23514', `update ulke_hasta_mesajlari set created_at = now() + interval '1 day' where id = $1`, [m1], '23514')
  await bekle('M. trigger: a message never moves to another conversation → refused 23514', `update ulke_hasta_mesajlari set patient_id = $2, yazisma_id = $3 where id = $1`, [m1, A2, y2], '23514')
  await bekle('M. trigger: nor to another doctor → refused', `update ulke_hasta_mesajlari set doctor_id = $2 where id = $1`, [m1, D2], '23514')
  await c.query(`update ulke_hasta_mesajlari set okundu_at = '2027-03-01T08:00:00Z' where id = $1`, [m2])
  ok('M. the other side marks a message as read', (await say('ulke_hasta_mesajlari', 'id = $1 and okundu_at is not null', [m2])) === 1)
  await bekle('M. trigger: a message that was read is not made unread → refused 23514', `update ulke_hasta_mesajlari set okundu_at = null where id = $1`, [m2], '23514')
  await bekle('M. trigger: nor is the moment moved → refused 23514', `update ulke_hasta_mesajlari set okundu_at = now() where id = $1`, [m2], '23514')
  ok('M. what a doctor has not read yet is the patients\' unread messages only', JSON.stringify(await q(`select count(*)::int n from ulke_hasta_mesajlari where ulke = 'uz' and doctor_id = $1 and gonderen = 'hasta' and okundu_at is null`, [D1])) === JSON.stringify([{ n: 0 }]) && (await say('ulke_hasta_mesajlari', `doctor_id = $1 and gonderen = 'hekim' and okundu_at is null`, [D1])) === 1)

  // a conversation: never moves; closed stays closed and takes no message
  await bekle('M. trigger: a conversation never moves to another patient → refused 23514', `update ulke_mesaj_yazismalari set patient_id = $2 where id = $1`, [y2, A1], '23514')
  await bekle('M. trigger: nor to another doctor → refused 23514', `update ulke_mesaj_yazismalari set doctor_id = $2 where id = $1`, [y2, D2], '23514')
  await bekle('M. trigger: nor to another country → refused 23514', `update ulke_mesaj_yazismalari set ulke = 'kz' where id = $1`, [y2], '23514')
  await c.query(`update ulke_mesaj_yazismalari set kapandi_at = '2027-03-02T08:00:00Z', updated_at = now() where id = $1`, [y1])
  ok('M. the doctor closes a conversation', (await say('ulke_mesaj_yazismalari', 'id = $1 and kapandi_at is not null', [y1])) === 1)
  await bekle('M. trigger: a closed conversation takes no message from the patient → refused 23514', MES, ['uz', D1, A1, y1, 'hasta', 'x'], '23514')
  await bekle('M. trigger: nor from the doctor → refused 23514', MES, ['uz', D1, A1, y1, 'hekim', 'x'], '23514')
  await bekle('M. trigger: a closed conversation is not opened again → refused 23514', `update ulke_mesaj_yazismalari set kapandi_at = null where id = $1`, [y1], '23514')
  await bekle('M. trigger: nor is its closing moved → refused 23514', `update ulke_mesaj_yazismalari set kapandi_at = now() where id = $1`, [y1], '23514')
  await c.query(`update ulke_hasta_mesajlari set okundu_at = now() where id = $1`, [m1])
  ok('M. a message of a closed conversation can still be marked as read', (await say('ulke_hasta_mesajlari', 'id = $1 and okundu_at is not null', [m1])) === 1)
  const y1b = (await q(YAZ, ['uz', D1, A1]))[0].id
  ok('M. after closing, the doctor opens a NEW conversation with the same patient; the closed one keeps its messages', y1b !== y1 && (await say('ulke_hasta_mesajlari', 'yazisma_id = $1', [y1])) === 2 && (await q(MES, ['uz', D1, A1, y1b, 'hekim', 'sifreli-3'])).length === 1)
  ok('M. the tables have ONE column for the text, and none for an attachment', (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_hasta_mesajlari'`))[0].k === 'id,ulke,doctor_id,patient_id,yazisma_id,gonderen,metin_encrypted,okundu_at,created_at' && (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_mesaj_yazismalari'`))[0].k === 'id,ulke,doctor_id,patient_id,kapandi_at,created_at,updated_at')

  // removing the patient removes the conversations and their messages
  { const ys = (await q(YAZ, ['uz', D1, SIL]))[0].id; await q(MES, ['uz', D1, SIL, ys, 'hekim', 'sifreli-4']) }
  await c.query(`delete from ulke_hastalar where id = $1 and doctor_id = $2 and ulke = 'uz'`, [SIL, D1])
  ok('M. removing a patient removes that patient\'s conversations and messages and no one else\'s', (await say('ulke_mesaj_yazismalari', 'patient_id = $1', [SIL])) === 0 && (await say('ulke_hasta_mesajlari', 'patient_id = $1', [SIL])) === 0 && (await say('ulke_hasta_mesajlari', 'patient_id = $1', [A1])) === 3)

  // SERVER ONLY
  {
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(D1, ulke); else await c.query(`set role ${rol}`)
      for (const sql of [`select 1 from ulke_hasta_mesajlari limit 1`, `select 1 from ulke_mesaj_yazismalari limit 1`, `delete from ulke_hasta_mesajlari`, `update ulke_hasta_mesajlari set okundu_at = now()`, `update ulke_mesaj_yazismalari set kapandi_at = now()`, `insert into ulke_mesaj_yazismalari (ulke, doctor_id, patient_id) values ('uz', '${D1}', '${A2}')`, `insert into ulke_hasta_mesajlari (ulke, doctor_id, patient_id, yazisma_id, gonderen, metin_encrypted) values ('uz', '${D1}', '${A2}', '${y2}', 'hekim', 'x')`, `select public.ulke_hasta_mesaji_kilidi()`, `select public.ulke_mesaj_yazismasi_kilidi()`]) { try { await c.query(sql); cikti.push(`${sql.slice(0, 50)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 50)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('M. server only: the doctor\'s own signed-in browser session can read and write NONE of it (its own rows included)', girisli.length === 0, girisli.join('; '))
    ok('M. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select count(*) from ulke_hasta_mesajlari`); await c.query(MES, ['uz', D2, A3, y3, 'hekim', 'sifreli-5']) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('M. server only: the server\'s role can', sunucu === 'ok' && (await say('ulke_hasta_mesajlari', 'patient_id = $1', [A3])) === 1, sunucu)
  }
}

// ── S. "my templates" (migration 141) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ulke_hekim_sablonlari where ${kosul}`, par)).rows[0].n
  const EKLE = `insert into ulke_hekim_sablonlari (ulke, doctor_id, kapsam, icerik_encrypted) values ($1, $2, $3, $4) returning id`
  const s1 = (await q(EKLE, ['uz', D1, 'not', 'sifreli-1']))[0].id
  const s2 = (await q(EKLE, ['uz', D1, 'mesaj', 'sifreli-2']))[0].id
  await q(EKLE, ['uz', D2, 'hepsi', 'sifreli-3'])
  ok('S. a template is stamped with its country and doctor, and is in use', JSON.stringify(await q(`select ulke, doctor_id, kapsam, icerik_encrypted, silindi_at from ulke_hekim_sablonlari where id = $1`, [s1])) === JSON.stringify([{ ulke: 'uz', doctor_id: D1, kapsam: 'not', icerik_encrypted: 'sifreli-1', silindi_at: null }]))
  ok('S. NO PATIENT IN THE ROW: the table has no column that could name one, and one column for the content', (await q(`select string_agg(column_name, ',' order by ordinal_position) k from information_schema.columns where table_schema = 'public' and table_name = 'ulke_hekim_sablonlari'`))[0].k === 'id,ulke,doctor_id,kapsam,icerik_encrypted,silindi_at,created_at,updated_at')
  await bekle('S. keys: a template of a doctor under ANOTHER country → refused 23503', EKLE, ['kz', D1, 'not', 'x'], '23503')
  await bekle('S. keys: a template of an account that does not exist → refused 23503', EKLE, ['uz', '99999999-9999-4999-8999-999999999999', 'not', 'x'], '23503')
  await bekle('S. keys: a place of use that is not one → refused 23514', EKLE, ['uz', D1, 'her-yer', 'x'], '23514')
  await bekle('S. keys: a template without content → refused 23514', EKLE, ['uz', D1, 'not', ''], '23514')
  await bekle('S. keys: a template without content (null) → refused 23502', EKLE, ['uz', D1, 'not', null], '23502')
  await c.query(`update ulke_hekim_sablonlari set icerik_encrypted = 'sifreli-1b', kapsam = 'hepsi', updated_at = now() where id = $1`, [s1])
  ok('S. the doctor edits a template', (await say(`id = $1 and icerik_encrypted = 'sifreli-1b' and kapsam = 'hepsi'`, [s1])) === 1)
  await bekle('S. trigger: a template never moves to another doctor → refused 23514', `update ulke_hekim_sablonlari set doctor_id = $2 where id = $1`, [s1, D2], '23514')
  await bekle('S. trigger: nor to another country → refused 23514', `update ulke_hekim_sablonlari set ulke = 'kz' where id = $1`, [s1], '23514')
  await c.query(`update ulke_hekim_sablonlari set silindi_at = '2027-04-01T08:00:00Z', updated_at = now() where id = $1`, [s2])
  ok('S. deleting is soft: the row stays, marked', (await say('id = $1 and silindi_at is not null', [s2])) === 1)
  await bekle('S. trigger: a deleted template is not brought back → refused 23514', `update ulke_hekim_sablonlari set silindi_at = null where id = $1`, [s2], '23514')
  await bekle('S. trigger: nor edited → refused 23514', `update ulke_hekim_sablonlari set icerik_encrypted = 'baska' where id = $1`, [s2], '23514')
  ok('S. the list of a doctor is their own templates in use', (await say(`ulke = 'uz' and doctor_id = $1 and silindi_at is null`, [D1])) === 1)
  {
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(D1, ulke); else await c.query(`set role ${rol}`)
      for (const sql of [`select 1 from ulke_hekim_sablonlari limit 1`, `delete from ulke_hekim_sablonlari`, `update ulke_hekim_sablonlari set updated_at = now()`, `insert into ulke_hekim_sablonlari (ulke, doctor_id, kapsam, icerik_encrypted) values ('uz', '${D1}', 'not', 'x')`, `select public.ulke_hekim_sablonu_kilidi()`]) { try { await c.query(sql); cikti.push(`${sql.slice(0, 50)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 50)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('S. server only: the doctor\'s own signed-in browser session can read and write NONE of it (its own rows included)', girisli.length === 0, girisli.join('; '))
    ok('S. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select count(*) from ulke_hekim_sablonlari`); await c.query(EKLE, ['uz', D2, 'not', 'sifreli-4']) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('S. server only: the server\'s role can', sunucu === 'ok' && (await say('doctor_id = $1', [D2])) === 2, sunucu)
  }
}

// ── N. consultation between doctors (migration 142) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (tablo, kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ${tablo} where ${kosul}`, par)).rows[0].n
  const A1 = await hasta(D1), A2 = await hasta(D1), A3 = await hasta(D2), SIL = await hasta(D1)
  // an approved note of A1, a draft of A1, an approved note of A2 (same doctor), an approved note of D2's patient
  const onayli = async (d, h) => { const x = await notKur(d, h, null); await c.query(`update ulke_notlar set approved_at = now(), approved_by = $2 where id = $1`, [x.n, d]); return x.n }
  const N1 = await onayli(D1, A1), N2 = await onayli(D1, A2), N3 = await onayli(D2, A3), TASLAK = (await notKur(D1, A1, null)).n
  const H = (h) => h.repeat(64)
  const KOD = `insert into ulke_konsultasyon_kodlari (ulke, doctor_id, kod_hash, kod_encrypted) values ($1, $2, $3, $4) returning id`
  await q(KOD, ['uz', D2, H('a'), 'sifreli-kod-2'])
  ok('N. a consultation code is stamped with its country and account', (await say('ulke_konsultasyon_kodlari', `ulke = 'uz' and doctor_id = $1 and kod_hash = $2`, [D2, H('a')])) === 1)
  await bekle('N. code: a second code for the same account → refused 23505', KOD, ['uz', D2, H('b'), 'x'], '23505')
  await bekle('N. code: the same code for another account → refused 23505', KOD, ['uz', D1, H('a'), 'x'], '23505')
  await bekle('N. code: a code under another country for this account → refused 23503', KOD, ['kz', D2, H('c'), 'x'], '23503')
  await bekle('N. code: a hash that is not a hash → refused 23514', KOD, ['uz', D1, 'ABCD', 'x'], '23514')
  await c.query(`update ulke_konsultasyon_kodlari set kod_hash = $2, kod_encrypted = 'sifreli-kod-2b', updated_at = now() where ulke = 'uz' and doctor_id = $1`, [D2, H('d')])
  ok('N. code: a new code replaces the old one; the old one finds nobody', (await say('ulke_konsultasyon_kodlari', `kod_hash = $1`, [H('a')])) === 0 && (await say('ulke_konsultasyon_kodlari', `kod_hash = $1`, [H('d')])) === 1)
  await bekle('N. code trigger: a code never moves to another account → refused 23514', `update ulke_konsultasyon_kodlari set doctor_id = $2 where ulke = 'uz' and doctor_id = $1`, [D2, D1], '23514')

  const EKLE = `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, note_id, soru_encrypted, paylasim_encrypted, riza_surumu, riza_at, son_gecerlilik) values ($1, $2, $3, $4, $5, $6, $7, $8, 'riza-1', now(), now() + interval '30 days') returning id`
  const k1 = (await q(EKLE, ['uz', D1, A1, D2, 'not', N1, 'soru-1', 'kopya-1']))[0].id
  const k2 = (await q(EKLE, ['uz', D1, A1, D2, 'yok', null, 'soru-2', null]))[0].id
  ok('N. THE RECORD: who asked whom about which patient, what was shared from which note, on which consent wording, and when', JSON.stringify(await q(`select ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, note_id, soru_encrypted, paylasim_encrypted, riza_surumu, (riza_at is not null) riza, okundu_at, cevap_at, kapandi_at, erisim_bitis, (son_gecerlilik > created_at) sure from ulke_konsultasyonlar where id = $1`, [k1])) === JSON.stringify([{ ulke: 'uz', doctor_id: D1, patient_id: A1, danisilan_id: D2, paylasim_turu: 'not', note_id: N1, soru_encrypted: 'soru-1', paylasim_encrypted: 'kopya-1', riza_surumu: 'riza-1', riza: true, okundu_at: null, cevap_at: null, kapandi_at: null, erisim_bitis: null, sure: true }]))

  // the keys
  await bekle('N. keys: about ANOTHER doctor\'s patient → refused 23503', EKLE, ['uz', D1, A3, D2, 'yok', null, 's', null], '23503')
  await bekle('N. keys: under ANOTHER country for this patient → refused 23503', EKLE, ['kz', D1, A1, K1, 'yok', null, 's', null], '23503')
  await bekle('N. keys: A COLLEAGUE OF ANOTHER COUNTRY → refused 23503', EKLE, ['uz', D1, A1, K1, 'yok', null, 's', null], '23503')
  await bekle('N. keys: a colleague that is no account → refused 23503', EKLE, ['uz', D1, A1, '99999999-9999-4999-8999-999999999999', 'yok', null, 's', null], '23503')
  await bekle('N. keys: oneself as the colleague → refused 23514', EKLE, ['uz', D1, A1, D1, 'yok', null, 's', null], '23514')
  await bekle('N. keys: a consultation without a question → refused 23514', EKLE, ['uz', D1, A1, D2, 'yok', null, '', null], '23514')
  await bekle('N. keys: "a note is shared" without the copy → refused 23514', EKLE, ['uz', D1, A1, D2, 'not', N1, 's', null], '23514')
  await bekle('N. keys: a copy without saying what it is → refused 23514', EKLE, ['uz', D1, A1, D2, 'yok', null, 's', 'kopya'], '23514')
  await bekle('N. keys: a copy without the note it was taken from → refused 23514', EKLE, ['uz', D1, A1, D2, 'ozet', null, 's', 'kopya'], '23514')
  await bekle('N. keys: without the consent wording\'s stamp → refused 23502', `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, soru_encrypted, riza_surumu, riza_at, son_gecerlilik) values ('uz', $1, $2, $3, 'yok', 's', null, now(), now() + interval '1 day')`, [D1, A1, D2], '23502')
  await bekle('N. keys: without the moment of the consent → refused 23502', `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, soru_encrypted, riza_surumu, riza_at, son_gecerlilik) values ('uz', $1, $2, $3, 'yok', 's', 'riza-1', null, now() + interval '1 day')`, [D1, A1, D2], '23502')
  await bekle('N. keys: without a period → refused 23502', `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, soru_encrypted, riza_surumu, riza_at, son_gecerlilik) values ('uz', $1, $2, $3, 'yok', 's', 'riza-1', now(), null)`, [D1, A1, D2], '23502')
  // what may be shared
  await bekle('N. trigger: a note that is NOT APPROVED is not shared → refused 23514', EKLE, ['uz', D1, A1, D2, 'not', TASLAK, 's', 'kopya'], '23514')
  await bekle('N. trigger: a note of ANOTHER patient of the same doctor is not shared for this patient → refused 23514', EKLE, ['uz', D1, A1, D2, 'not', N2, 's', 'kopya'], '23514')
  await bekle('N. keys: a note of ANOTHER doctor → refused', EKLE, ['uz', D1, A1, D2, 'not', N3, 's', 'kopya'], '23514')
  await bekle('N. trigger: a consultation begins unread, unanswered and open → refused 23514', `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, soru_encrypted, riza_surumu, riza_at, son_gecerlilik, okundu_at) values ('uz', $1, $2, $3, 'yok', 's', 'riza-1', now(), now() + interval '1 day', now())`, [D1, A1, D2], '23514')

  // what a consultation may never do
  await bekle('N. trigger: a consultation never moves to another patient → refused 23514', `update ulke_konsultasyonlar set patient_id = $2 where id = $1`, [k2, A2], '23514')
  await bekle('N. trigger: nor to another colleague → refused 23514', `update ulke_konsultasyonlar set danisilan_id = $2 where id = $1`, [k2, K1], '23514')
  await bekle('N. trigger: nor to another asking doctor → refused 23514', `update ulke_konsultasyonlar set doctor_id = $2 where id = $1`, [k2, D2], '23514')
  await bekle('N. trigger: the question does not change → refused 23514', `update ulke_konsultasyonlar set soru_encrypted = 'baska' where id = $1`, [k1], '23514')
  await bekle('N. trigger: what was shared does not change → refused 23514', `update ulke_konsultasyonlar set paylasim_encrypted = 'baska' where id = $1`, [k1], '23514')
  await bekle('N. trigger: nor is something shared afterwards → refused 23514', `update ulke_konsultasyonlar set paylasim_turu = 'not', note_id = $2, paylasim_encrypted = 'kopya' where id = $1`, [k2, N1], '23514')
  await bekle('N. trigger: the consent wording\'s stamp does not change → refused 23514', `update ulke_konsultasyonlar set riza_surumu = 'riza-2' where id = $1`, [k1], '23514')
  await bekle('N. trigger: the period is not extended → refused 23514', `update ulke_konsultasyonlar set son_gecerlilik = son_gecerlilik + interval '1 year' where id = $1`, [k1], '23514')
  await c.query(`update ulke_konsultasyonlar set okundu_at = '2027-05-01T08:00:00Z' where id = $1`, [k1])
  await bekle('N. trigger: the first reading is recorded once → refused 23514', `update ulke_konsultasyonlar set okundu_at = now() where id = $1`, [k1], '23514')
  await bekle('N. state: an answer without its moment → refused 23514', `update ulke_konsultasyonlar set cevap_encrypted = 'cevap' where id = $1`, [k1], '23514')
  await c.query(`update ulke_konsultasyonlar set cevap_encrypted = 'cevap-1', cevap_at = '2027-05-02T08:00:00Z', updated_at = now() where id = $1`, [k1])
  ok('N. the consulted doctor answers', (await say('ulke_konsultasyonlar', `id = $1 and cevap_encrypted = 'cevap-1'`, [k1])) === 1)
  await bekle('N. trigger: an answer is given once and does not change → refused 23514', `update ulke_konsultasyonlar set cevap_encrypted = 'cevap-2' where id = $1`, [k1], '23514')
  await bekle('N. state: closing without saying until when it may still be read → refused 23514', `update ulke_konsultasyonlar set kapandi_at = now() where id = $1`, [k2], '23514')
  await bekle('N. state: an end of reading before the closing → refused 23514', `update ulke_konsultasyonlar set kapandi_at = now(), erisim_bitis = now() - interval '1 day' where id = $1`, [k2], '23514')
  await c.query(`update ulke_konsultasyonlar set kapandi_at = '2027-05-03T08:00:00Z', erisim_bitis = '2027-05-10T08:00:00Z', updated_at = now() where id = $1`, [k2])
  ok('N. the asking doctor closes a consultation, with the moment until which it may still be read', (await say('ulke_konsultasyonlar', 'id = $1 and kapandi_at is not null and erisim_bitis > kapandi_at', [k2])) === 1)
  await bekle('N. trigger: a closed consultation is not opened again → refused 23514', `update ulke_konsultasyonlar set kapandi_at = null, erisim_bitis = null where id = $1`, [k2], '23514')
  await bekle('N. trigger: its end of reading is not moved → refused 23514', `update ulke_konsultasyonlar set erisim_bitis = erisim_bitis + interval '1 year' where id = $1`, [k2], '23514')
  await bekle('N. trigger: a closed consultation takes no answer → refused 23514', `update ulke_konsultasyonlar set cevap_encrypted = 'gec', cevap_at = now() where id = $1`, [k2], '23514')
  await c.query(`update ulke_konsultasyonlar set okundu_at = '2027-05-04T08:00:00Z' where id = $1`, [k2])
  ok('N. a first reading after the closing is still recorded', (await say('ulke_konsultasyonlar', 'id = $1 and okundu_at is not null', [k2])) === 1)
  ok('N. what the consulted doctor is listed is only where THEY were asked; the patient\'s own tables name them nowhere', (await say('ulke_konsultasyonlar', `ulke = 'uz' and danisilan_id = $1`, [D2])) === 2 && (await say('ulke_konsultasyonlar', `ulke = 'uz' and danisilan_id = $1`, [D1])) === 0 && (await say('ulke_hastalar', `doctor_id = $1 and id = $2`, [D2, A1])) === 0)

  // removing the patient removes the consultations about them
  await q(EKLE, ['uz', D1, SIL, D2, 'yok', null, 'soru-3', null])
  await c.query(`delete from ulke_hastalar where id = $1 and doctor_id = $2 and ulke = 'uz'`, [SIL, D1])
  ok('N. removing a patient removes the consultations about that patient and no one else\'s', (await say('ulke_konsultasyonlar', 'patient_id = $1', [SIL])) === 0 && (await say('ulke_konsultasyonlar', 'patient_id = $1', [A1])) === 2)

  // SERVER ONLY — for the asking doctor's browser session and for the consulted doctor's
  {
    const kodlar = async (rol, ulke, kim = D1) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(kim, ulke); else await c.query(`set role ${rol}`)
      for (const sql of [`select 1 from ulke_konsultasyonlar limit 1`, `select 1 from ulke_konsultasyon_kodlari limit 1`, `delete from ulke_konsultasyonlar`, `update ulke_konsultasyonlar set updated_at = now()`, `delete from ulke_konsultasyon_kodlari`, `insert into ulke_konsultasyon_kodlari (ulke, doctor_id, kod_hash, kod_encrypted) values ('uz', '${D1}', '${H('e')}', 'x')`, `insert into ulke_konsultasyonlar (ulke, doctor_id, patient_id, danisilan_id, paylasim_turu, soru_encrypted, riza_surumu, riza_at, son_gecerlilik) values ('uz', '${D1}', '${A1}', '${D2}', 'yok', 's', 'r', now(), now() + interval '1 day')`, `select public.ulke_konsultasyon_kilidi()`, `select public.ulke_konsultasyon_kodu_kilidi()`]) { try { await c.query(sql); cikti.push(`${sql.slice(0, 50)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 50)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const isteyen = await kodlar('authenticated', 'uz', D1), danisilan = await kodlar('authenticated', 'uz', D2), anon = await kodlar('anon', null)
    ok('N. server only: the asking doctor\'s signed-in browser session can read and write NONE of it (its own rows included)', isteyen.length === 0, isteyen.join('; '))
    ok('N. server only: nor can the consulted doctor\'s', danisilan.length === 0, danisilan.join('; '))
    ok('N. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { await c.query(`select count(*) from ulke_konsultasyonlar`); await c.query(EKLE, ['uz', D2, A3, D1, 'not', N3, 'soru-4', 'kopya-4']) } catch (e) { sunucu = e.code }
    await c.query('reset role')
    ok('N. server only: the server\'s role can', sunucu === 'ok' && (await say('ulke_konsultasyonlar', 'patient_id = $1', [A3])) === 1, sunucu)
  }
}

// ── L. clinic accounts (migration 145) ──
{
  const q = async (sql, par) => (await c.query(sql, par)).rows
  const say = async (tablo, kosul = 'true', par = []) => (await c.query(`select count(*)::int n from ${tablo} where ${kosul}`, par)).rows[0].n
  const islev = async (sql, par) => Object.values((await c.query(sql, par)).rows[0])[0]
  const durum = async (sql, par) => { const r = await islev(sql, par); return typeof r === 'string' ? r : r.durum }

  // NO EXISTING TABLE WAS ALTERED. A second database is built from the migrations BEFORE 145 only; every object it
  // has must be in the full database exactly as it is there, and everything the full database has beyond it must
  // be an object of the clinic migration.
  {
    await c.query('create database kanit_oncesi')
    const o = await baglan('kanit_oncesi')
    await o.query(STUBLAR)
    await o.query(readFileSync(join(REPO, LISTE.defter), 'utf8'))
    for (const d of DOSYALAR.filter((x) => Number(x.slice(0, 3)) < 145)) await o.query(dosyaOku(d))
    const anahtar = (r) => `${r.tur} ${r.ad}`
    const once = new Map(JSON.parse(await sema(o)).map((r) => [anahtar(r), r.tanim]))
    const tam = new Map(JSON.parse(ILK_KOSU).map((r) => [anahtar(r), r.tanim]))
    await o.end()
    const degisen = [...once].filter(([k, v]) => tam.get(k) !== v).map(([k]) => k)
    const eklenen = [...tam.keys()].filter((k) => !once.has(k))
    ok(`L. NO EXISTING OBJECT WAS ALTERED: every one of the ${once.size} tables, columns, constraints, indexes, rules, triggers and functions a country database had before migration 145 is byte for byte what it was`, once.size > 300 && degisen.length === 0, degisen.slice(0, 5).join('; '))
    ok(`L. … and all ${eklenen.length} objects the migration added are its own (each is named for the clinic)`, eklenen.length > 60 && eklenen.every((k) => /klinik/.test(k)), eklenen.filter((k) => !/klinik/.test(k)).slice(0, 5).join('; '))
  }

  // Accounts of this section's own: an owner, an administrator, two doctors, an allied professional, a front-desk
  // member, the owner of a SECOND clinic, an account without a clinic; and a kz account.
  const [SA, YO, HE, H2x, MU, OB, S2, BO, KZ] = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'].map((x) => `cccccccc-${x}${x}-4ccc-8ccc-cccccccccccc`)
  const HEPSI = [SA, YO, HE, H2x, MU, OB, S2, BO, KZ]
  const hesapAc = async (id, u = 'uz') => {
    await c.query(`insert into auth.users (id, raw_app_meta_data) values ($1, $2)`, [id, JSON.stringify({ country: u })])
    await c.query(`insert into ulke_hesaplari (id, ulke, full_name, ui_language) values ($1, $2, 'QA Klinik', 'ru')`, [id, u])
  }
  for (const id of HEPSI) await hesapAc(id, id === KZ ? 'kz' : 'uz')
  const P1 = await hasta(HE), P2 = await hasta(HE), PH2 = await hasta(H2x), PKZ = await hasta(KZ, V)
  const AN = '2026-10-12T06:00:00Z'
  const KUR = `select public.ulke_klinik_kur($1, $2, $3, $4) r`
  const KATIL = `select public.ulke_klinik_katil($1, $2, $3, $4) r`
  const VER = `select public.ulke_klinik_yetki_ver($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) r`
  const H = (x) => x.repeat(64)

  // creating a clinic
  const k1 = await islev(KUR, ['uz', SA, '  QA Klinika Bir ', AN])
  const KL = k1.klinik_id
  ok('L. an account creates a clinic and is its owner, in one step', k1.durum === 'TAMAM' && JSON.stringify(await q(`select k.ad, k.doctor_id, u.konum from ulke_klinikler k join ulke_klinik_uyeleri u on u.klinik_id = k.id and u.doctor_id = k.doctor_id where k.id = $1`, [KL])) === JSON.stringify([{ ad: 'QA Klinika Bir', doctor_id: SA, konum: 'sahip' }]))
  ok('L. an account that is a member of a clinic cannot create another: nothing is written', (await durum(KUR, ['uz', SA, 'QA Ikkinchi', AN])) === 'UYE' && (await say('ulke_klinikler')) === 1)
  ok('L. a clinic is not created under a country the account does not belong to', (await durum(KUR, ['uz', KZ, 'QA Kz', AN])) === 'NOT_FOUND' && (await say('ulke_klinikler')) === 1)
  const KL2 = (await islev(KUR, ['uz', S2, 'QA Klinika Ikki', AN])).klinik_id
  const KLZ = (await islev(KUR, ['kz', KZ, 'QA Klinika Kz', AN])).klinik_id
  ok('L. a second clinic, and a clinic of another country, exist beside it', Boolean(KL2 && KLZ) && (await say('ulke_klinikler')) === 3)
  await bekle('L. keys: a clinic under a country its owner does not belong to → refused 23503', `insert into ulke_klinikler (ulke, doctor_id, ad) values ('kz', $1, 'QA Yot')`, [HE], '23503')
  await bekle('L. keys: a second clinic for the same owner → refused 23505', `insert into ulke_klinikler (ulke, doctor_id, ad) values ('uz', $1, 'QA Yana')`, [SA], '23505')
  await bekle('L. keys: a clinic without a name → refused 23514', `insert into ulke_klinikler (ulke, doctor_id, ad) values ('uz', $1, ' ')`, [BO], '23514')
  await bekle('L. trigger: a clinic does not change owner → refused 23514', `update ulke_klinikler set doctor_id = $2 where id = $1`, [KL, HE], '23514')
  await bekle('L. trigger: nor country → refused 23514', `update ulke_klinikler set ulke = 'kz' where id = $1`, [KL], '23514')

  // invitations
  const DAVET = `insert into ulke_klinik_davetleri (ulke, klinik_id, doctor_id, konum, kod_hash, son_gecerlilik, created_at) values ($1, $2, $3, $4, $5, $6, $7) returning id`
  const SON = '2026-10-19T06:00:00Z'
  await q(DAVET, ['uz', KL, SA, 'yonetici', H('1'), SON, AN])
  await q(DAVET, ['uz', KL, SA, 'hekim', H('2'), SON, AN])
  await q(DAVET, ['uz', KL, SA, 'hekim', H('3'), SON, AN])
  await q(DAVET, ['uz', KL, SA, 'muttefik', H('4'), SON, AN])
  await q(DAVET, ['uz', KL, SA, 'on-buro', H('5'), SON, AN])
  await bekle('L. invitation: the owner\'s position is never offered → refused 23514', DAVET, ['uz', KL, SA, 'sahip', H('6'), SON, AN], '23514')
  await bekle('L. invitation: issued by somebody who is not a member of that clinic → refused 23514', DAVET, ['uz', KL, S2, 'hekim', H('6'), SON, AN], '23514')
  await bekle('L. invitation: for ANOTHER country\'s clinic → refused 23514', DAVET, ['uz', KLZ, SA, 'hekim', H('6'), SON, AN], '23514')
  await bekle('L. invitation: without an expiry → refused 23502', DAVET, ['uz', KL, SA, 'hekim', H('6'), null, AN], '23502')
  await bekle('L. invitation: an expiry further than 31 days → refused 23514', DAVET, ['uz', KL, SA, 'hekim', H('6'), '2026-12-19T06:00:00Z', AN], '23514')
  await bekle('L. invitation: a code that is not a hash → refused 23514', DAVET, ['uz', KL, SA, 'hekim', 'QA-OCHIQ-KOD', SON, AN], '23514')
  await bekle('L. invitation: the same code twice → refused 23505', DAVET, ['uz', KL, SA, 'hekim', H('2'), SON, AN], '23505')

  // joining
  ok('L. joining: a code that does not exist → KOD', (await durum(KATIL, ['uz', H('9'), YO, AN])) === 'KOD')
  ok('L. joining: an uz code from a kz build → KOD, and the code is not used up', (await durum(KATIL, ['kz', H('1'), YO, AN])) === 'KOD' && (await say('ulke_klinik_davetleri', 'kullanildi_at is not null')) === 0)
  ok('L. joining: an account of another country with an uz code → KOD', (await durum(KATIL, ['uz', H('1'), KZ, AN])) === 'KOD' && (await say('ulke_klinik_uyeleri', 'doctor_id = $1 and klinik_id = $2', [KZ, KL])) === 0)
  ok('L. joining: an expired code → KOD', (await durum(KATIL, ['uz', H('1'), YO, SON])) === 'KOD')
  const j1 = await islev(KATIL, ['uz', H('1'), YO, AN])
  ok('L. joining: the administrator joins with the position of the invitation', j1.durum === 'TAMAM' && j1.konum === 'yonetici' && j1.klinik_id === KL && (await say('ulke_klinik_uyeleri', `doctor_id = $1 and klinik_id = $2 and konum = 'yonetici'`, [YO, KL])) === 1)
  ok('L. joining: ONE USE — the same code a second time → KOD', (await durum(KATIL, ['uz', H('1'), HE, AN])) === 'KOD' && (await say('ulke_klinik_uyeleri', 'doctor_id = $1', [HE])) === 0)
  for (const [kod, kim] of [['2', HE], ['3', H2x], ['4', MU], ['5', OB]]) await islev(KATIL, ['uz', H(kod), kim, AN])
  ok('L. joining: the clinic has its owner, administrator, two doctors, an allied professional and a front-desk member', JSON.stringify(await q(`select konum, count(*)::int n from ulke_klinik_uyeleri where klinik_id = $1 group by 1 order by 1`, [KL])) === JSON.stringify([{ konum: 'hekim', n: 2 }, { konum: 'muttefik', n: 1 }, { konum: 'on-buro', n: 1 }, { konum: 'sahip', n: 1 }, { konum: 'yonetici', n: 1 }]))
  await q(DAVET, ['uz', KL2, S2, 'hekim', H('7'), SON, AN])
  ok('L. joining: a member of one clinic cannot join another — and the code is NOT used up', (await durum(KATIL, ['uz', H('7'), HE, AN])) === 'UYE' && (await say('ulke_klinik_davetleri', `kod_hash = $1 and kullanildi_at is null`, [H('7')])) === 1)
  await bekle('L. keys: AT MOST ONE CLINIC PER ACCOUNT, also by a statement → refused 23505', `insert into ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum) values ('uz', $1, $2, 'hekim')`, [KL2, HE], '23505')
  await bekle('L. invitation: an administrator may not invite an administrator → refused 23514', DAVET, ['uz', KL, YO, 'yonetici', H('8'), SON, AN], '23514')
  await bekle('L. invitation: a doctor may not issue one → refused 23514', DAVET, ['uz', KL, HE, 'on-buro', H('8'), SON, AN], '23514')
  const dv = (await q(DAVET, ['uz', KL, YO, 'on-buro', H('8'), SON, AN]))[0].id
  ok('L. invitation: an administrator may invite a front-desk member', Boolean(dv))
  await bekle('L. trigger: an invitation\'s position does not change → refused 23514', `update ulke_klinik_davetleri set konum = 'hekim' where id = $1`, [dv], '23514')
  await bekle('L. trigger: nor its expiry → refused 23514', `update ulke_klinik_davetleri set son_gecerlilik = son_gecerlilik + interval '1 day' where id = $1`, [dv], '23514')
  await c.query(`update ulke_klinik_davetleri set iptal_at = $2 where id = $1`, [dv, AN])
  ok('L. invitation: a withdrawn code → KOD', (await durum(KATIL, ['uz', H('8'), BO, AN])) === 'KOD' && (await say('ulke_klinik_uyeleri', 'doctor_id = $1', [BO])) === 0)
  await bekle('L. trigger: a withdrawn invitation is not opened again → refused 23514', `update ulke_klinik_davetleri set iptal_at = null where id = $1`, [dv], '23514')
  await bekle('L. trigger: a used invitation is not withdrawn afterwards → refused 23514', `update ulke_klinik_davetleri set iptal_at = now() where kod_hash = $1`, [H('1')], '23514')
  // Two accounts, the same code, the same moment.
  {
    await q(DAVET, ['uz', KL2, S2, 'hekim', H('a'), SON, AN])
    const [X1, X2] = ['b1', 'b2'].map((x) => `cccccccc-${x}${x}-4ccc-8ccc-cccccccccccc`)
    for (const id of [X1, X2]) await hesapAc(id)
    HEPSI.push(X1, X2)
    const a = await baglan(), b = await baglan()
    await a.query('begin'); await b.query('begin')
    const ra = (await a.query(KATIL, ['uz', H('a'), X1, AN])).rows[0].r.durum
    const pb = b.query(KATIL, ['uz', H('a'), X2, AN])
    await a.query('commit')
    const rb = (await pb).rows[0].r.durum
    await b.query('commit'); await a.end(); await b.end()
    ok('L. joining: two accounts with the same code at the same moment — one joins, the other gets KOD', ra === 'TAMAM' && rb === 'KOD' && (await say('ulke_klinik_uyeleri', 'doctor_id in ($1, $2)', [X1, X2])) === 1, `${ra}/${rb}`)
  }

  // members
  await bekle('L. trigger: a second owner by a statement → refused 23514', `insert into ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum) values ('uz', $1, $2, 'sahip')`, [KL, BO], '23514')
  await bekle('L. trigger: the clinic\'s owner in any position but the owner\'s → refused 23514', `update ulke_klinik_uyeleri set konum = 'hekim' where doctor_id = $1`, [SA], '23514')
  await bekle('L. trigger: nobody is made owner by a statement → refused 23514', `update ulke_klinik_uyeleri set konum = 'sahip' where doctor_id = $1`, [YO], '23514')
  await bekle('L. trigger: a member is not moved to another clinic → refused 23514', `update ulke_klinik_uyeleri set klinik_id = $2 where doctor_id = $1`, [HE, KL2], '23514')
  await bekle('L. trigger: the owner is not removed from a clinic that exists → refused 23514', `delete from ulke_klinik_uyeleri where doctor_id = $1`, [SA], '23514')
  await bekle('L. keys: an unknown position → refused 23514', `update ulke_klinik_uyeleri set konum = 'direktor' where doctor_id = $1`, [HE], '23514')
  await bekle('L. keys: a member of a clinic of ANOTHER country → refused 23503', `insert into ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum) values ('uz', $1, $2, 'hekim')`, [KLZ, BO], '23503')
  ok('L. who may act on whom: the owner on anybody but the owner; an administrator on a doctor, an allied professional or a front-desk member; nobody else on anybody', JSON.stringify((await q(`select array_agg(public.ulke_klinik_yonetebilir(a, b) order by a, b) r from unnest(array['sahip','yonetici','hekim','muttefik','on-buro']) a, unnest(array['sahip','yonetici','hekim','muttefik','on-buro']) b`))[0].r) === JSON.stringify([
    /* hekim    */ false, false, false, false, false,
    /* muttefik */ false, false, false, false, false,
    /* on-buro  */ false, false, false, false, false,
    /* sahip    → hekim, muttefik, on-buro, sahip, yonetici */ true, true, true, false, true,
    /* yonetici → hekim, muttefik, on-buro, sahip, yonetici */ true, true, true, false, false,
  ]))

  // grants
  const BAS = '2026-10-12T00:00:00Z', BIT = '2026-10-19T00:00:00Z'
  const ver = (veren, alan, tur, hastaId = null, bas = null, bit = null, kaydeden = veren, klinik = KL, ulke = 'uz') => islev(VER, [ulke, klinik, veren, alan, tur, hastaId, bas, bit, kaydeden, AN])
  const y1 = await ver(HE, OB, 'on-buro-randevu')
  ok('L. grant: a doctor gives the front desk the appointments capability; it is written to the record', y1.durum === 'TAMAM' && JSON.stringify(await q(`select doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, ne from ulke_klinik_erisim_kayitlari`)) === JSON.stringify([{ doctor_id: HE, kisi_id: HE, alan_id: OB, patient_id: null, yetki_id: y1.yetki_id, tur: 'on-buro-randevu', olay: 'verildi', ne: null }]))
  const y1b = await ver(HE, OB, 'on-buro-randevu')
  ok('L. grant: the same grant again → VAR with the same id, nothing written', y1b.durum === 'VAR' && y1b.yetki_id === y1.yetki_id && (await say('ulke_klinik_yetkileri')) === 1 && (await say('ulke_klinik_erisim_kayitlari')) === 1)
  ok('L. grant: EACH CAPABILITY SEPARATELY — the appointments grant is one row of one kind', (await say('ulke_klinik_yetkileri', `alan_id = $1 and tur <> 'on-buro-randevu'`, [OB])) === 0)
  ok('L. grant: a front-desk capability for a doctor → KONUM', (await ver(HE, H2x, 'on-buro-randevu')).durum === 'KONUM')
  ok('L. grant: a share for a front-desk member → KONUM', (await ver(HE, OB, 'paylasim', P1)).durum === 'KONUM')
  ok('L. grant: cover for an allied professional → KONUM', (await ver(HE, MU, 'vekalet', null, BAS, BIT)).durum === 'KONUM')
  ok('L. grant: a front-desk member has no patients to give a grant for → KONUM', (await ver(OB, H2x, 'vekalet', null, BAS, BIT)).durum === 'KONUM')
  ok('L. grant: to oneself → NOT_FOUND', (await ver(HE, HE, 'vekalet', null, BAS, BIT)).durum === 'NOT_FOUND')
  ok('L. grant: to a member of ANOTHER clinic → NOT_FOUND', (await ver(HE, S2, 'vekalet', null, BAS, BIT)).durum === 'NOT_FOUND')
  ok('L. grant: named under ANOTHER clinic → NOT_FOUND', (await ver(HE, OB, 'on-buro-hasta', null, null, null, HE, KL2)).durum === 'NOT_FOUND')
  ok('L. grant: from a kz build → NOT_FOUND', (await ver(HE, OB, 'on-buro-hasta', null, null, null, HE, KL, 'kz')).durum === 'NOT_FOUND')
  ok('L. grant: a share without a patient, a share with a period, cover without a period → GECERSIZ', (await ver(HE, MU, 'paylasim')).durum === 'GECERSIZ' && (await ver(HE, MU, 'paylasim', P1, BAS, BIT)).durum === 'GECERSIZ' && (await ver(HE, H2x, 'vekalet')).durum === 'GECERSIZ')
  ok('L. grant: cover longer than 31 days, cover that has already ended, a capability that does not exist → GECERSIZ', (await ver(HE, H2x, 'vekalet', null, BAS, '2026-11-20T00:00:00Z')).durum === 'GECERSIZ' && (await ver(HE, H2x, 'vekalet', null, '2026-10-01T00:00:00Z', '2026-10-05T00:00:00Z')).durum === 'GECERSIZ' && (await ver(HE, OB, 'hamma-narsa')).durum === 'GECERSIZ')
  ok('L. grant: a share of ANOTHER doctor\'s patient → NOT_FOUND', (await ver(HE, MU, 'paylasim', PH2)).durum === 'NOT_FOUND')
  ok('L. grant: BY THE CLINIC\'S ADMINISTRATOR on a doctor\'s behalf → YETKI_YOK', (await ver(HE, OB, 'on-buro-hasta', null, null, null, YO)).durum === 'YETKI_YOK')
  ok('L. grant: by another doctor on a doctor\'s behalf → YETKI_YOK', (await ver(HE, OB, 'on-buro-hasta', null, null, null, H2x)).durum === 'YETKI_YOK')
  ok('L. … and none of the refused requests wrote a grant or a record row', (await say('ulke_klinik_yetkileri')) === 1 && (await say('ulke_klinik_erisim_kayitlari')) === 1)
  const y2 = await ver(HE, MU, 'paylasim', P1)
  const y3 = await ver(HE, H2x, 'vekalet', null, BAS, BIT)
  ok('L. grant: a share of one named patient with the allied professional; cover for a stated period with the other doctor', y2.durum === 'TAMAM' && y3.durum === 'TAMAM' && (await say('ulke_klinik_yetkileri', `tur = 'paylasim' and patient_id = $1 and alan_id = $2`, [P1, MU])) === 1 && (await say('ulke_klinik_yetkileri', `tur = 'vekalet' and alan_id = $1 and bitis = $2`, [H2x, BIT])) === 1)
  ok('L. grant: a share is PER PATIENT — the second patient of the same doctor has no row', (await say('ulke_klinik_yetkileri', `patient_id = $1`, [P2])) === 0)
  const y3b = await ver(HE, H2x, 'vekalet', null, BAS, '2026-10-15T00:00:00Z')
  ok('L. grant: cover given again replaces the period — the one before it is withdrawn in the same step, and recorded', y3b.durum === 'TAMAM' && (await say('ulke_klinik_yetkileri', `tur = 'vekalet' and iptal_at is null`)) === 1 && (await say('ulke_klinik_yetkileri', `id = $1 and iptal_at is not null`, [y3.yetki_id])) === 1 && (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and olay = 'geri-alindi'`, [y3.yetki_id])) === 1)
  // The pack may let the clinic's owner enter a grant for a doctor; the database allows the owner and nobody else.
  const y4 = await ver(H2x, OB, 'on-buro-randevu', null, null, null, SA)
  ok('L. grant: entered by the clinic\'s OWNER for a doctor — allowed by the database (the application allows it only where the pack says so), and the record names who entered it', y4.durum === 'TAMAM' && (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and kisi_id = $2 and doctor_id = $3`, [y4.yetki_id, SA, H2x])) === 1)

  // the keys and the trigger of a grant, by statements
  const YETKI = `insert into ulke_klinik_yetkileri (ulke, klinik_id, doctor_id, alan_id, tur, patient_id, baslangic, bitis, kaydeden_id) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
  await bekle('L. keys: a grant to an account that is not a member of that clinic → refused 23503', YETKI, ['uz', KL, HE, S2, 'vekalet', null, BAS, BIT, HE], '23503')
  await bekle('L. keys: a grant from an account that is not a member of that clinic → refused 23503', YETKI, ['uz', KL, S2, H2x, 'vekalet', null, BAS, BIT, S2], '23503')
  await bekle('L. keys: a grant under ANOTHER country → refused 23503', YETKI, ['kz', KL, HE, OB, 'on-buro-hasta', null, null, null, HE], '23503')
  await bekle('L. keys: a share of ANOTHER doctor\'s patient → refused 23503', YETKI, ['uz', KL, HE, MU, 'paylasim', PH2, null, null, HE], '23503')
  await bekle('L. keys: a share of a patient of ANOTHER country → refused 23503', YETKI, ['uz', KL, HE, MU, 'paylasim', PKZ, null, null, HE], '23503')
  await bekle('L. keys: a second open grant of the same kind for the same pair → refused 23505', YETKI, ['uz', KL, HE, OB, 'on-buro-randevu', null, null, null, HE], '23505')
  await bekle('L. keys: a share without a patient → refused 23514', YETKI, ['uz', KL, HE, MU, 'paylasim', null, null, null, HE], '23514')
  await bekle('L. keys: cover without a period → refused 23514', YETKI, ['uz', KL, H2x, HE, 'vekalet', null, null, null, H2x], '23514')
  await bekle('L. keys: cover longer than 31 days → refused 23514', YETKI, ['uz', KL, H2x, HE, 'vekalet', null, BAS, '2026-12-01T00:00:00Z', H2x], '23514')
  await bekle('L. keys: a grant to oneself → refused 23514', YETKI, ['uz', KL, HE, HE, 'vekalet', null, BAS, BIT, HE], '23514')
  await bekle('L. trigger: a front-desk capability for a doctor → refused 23514', YETKI, ['uz', KL, H2x, HE, 'on-buro-portal', null, null, null, H2x], '23514')
  await bekle('L. trigger: a share for a front-desk member → refused 23514', YETKI, ['uz', KL, HE, OB, 'paylasim', P2, null, null, HE], '23514')
  await bekle('L. trigger: a grant entered by the administrator → refused 23514', YETKI, ['uz', KL, HE, OB, 'on-buro-hasta', null, null, null, YO], '23514')
  await bekle('L. trigger: a grant does not move to another member → refused 23514', `update ulke_klinik_yetkileri set alan_id = $2 where id = $1`, [y2.yetki_id, OB], '23514')
  await bekle('L. trigger: its capability does not change → refused 23514', `update ulke_klinik_yetkileri set tur = 'on-buro-hasta' where id = $1`, [y1.yetki_id], '23514')
  await bekle('L. trigger: its patient does not change → refused 23514', `update ulke_klinik_yetkileri set patient_id = $2 where id = $1`, [y2.yetki_id, P2], '23514')
  await bekle('L. trigger: the period of cover is not stretched → refused 23514', `update ulke_klinik_yetkileri set bitis = bitis + interval '10 days' where id = $1`, [y3b.yetki_id], '23514')

  // withdrawing
  const GERI_AL = `select public.ulke_klinik_yetki_geri_al($1, $2, $3, $4) r`
  ok('L. withdrawal: by somebody who is neither the doctor nor the member — the administrator, the owner → NOT_FOUND, nothing changed', (await durum(GERI_AL, ['uz', y2.yetki_id, YO, AN])) === 'NOT_FOUND' && (await durum(GERI_AL, ['uz', y2.yetki_id, SA, AN])) === 'NOT_FOUND' && (await say('ulke_klinik_yetkileri', 'id = $1 and iptal_at is null', [y2.yetki_id])) === 1)
  ok('L. withdrawal: from a kz build → NOT_FOUND', (await durum(GERI_AL, ['kz', y2.yetki_id, HE, AN])) === 'NOT_FOUND')
  ok('L. withdrawal: the doctor withdraws the share; it ends at once and is recorded', (await durum(GERI_AL, ['uz', y2.yetki_id, HE, AN])) === 'TAMAM' && (await say('ulke_klinik_yetkileri', 'id = $1 and iptal_at is not null and iptal_eden_id = $2', [y2.yetki_id, HE])) === 1 && (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and olay = 'geri-alindi' and kisi_id = $2 and patient_id = $3`, [y2.yetki_id, HE, P1])) === 1)
  ok('L. withdrawal: a second time → AYNI, nothing written', (await durum(GERI_AL, ['uz', y2.yetki_id, HE, AN])) === 'AYNI' && (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and olay = 'geri-alindi'`, [y2.yetki_id])) === 1)
  await bekle('L. trigger: a withdrawn grant is not opened again → refused 23514', `update ulke_klinik_yetkileri set iptal_at = null, iptal_eden_id = null where id = $1`, [y2.yetki_id], '23514')
  ok('L. withdrawal: the member gives a grant up themselves', (await durum(GERI_AL, ['uz', y4.yetki_id, OB, AN])) === 'TAMAM')
  const y2b = await ver(HE, MU, 'paylasim', P1)
  ok('L. grant: after a withdrawal the same share can be given again, as a new row', y2b.durum === 'TAMAM' && y2b.yetki_id !== y2.yetki_id)

  // the record
  const KAYIT = `insert into ulke_klinik_erisim_kayitlari (ulke, doctor_id, kisi_id, alan_id, patient_id, yetki_id, tur, olay, ne) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`
  const kr = (await q(KAYIT, ['uz', HE, OB, OB, P1, y1.yetki_id, 'on-buro-randevu', 'okuma', 'hasta-karti']))[0].id
  ok('L. record: a read through a grant is one row — who, whose patient, what kind, when', Boolean(kr) && (await say('ulke_klinik_erisim_kayitlari', `id = $1 and created_at is not null`, [kr])) === 1)
  await bekle('L. record: a read without saying what was read → refused 23514', KAYIT, ['uz', HE, OB, OB, P1, y1.yetki_id, 'on-buro-randevu', 'okuma', null], '23514')
  await bekle('L. record: a row for a patient who is not that doctor\'s → refused 23503', KAYIT, ['uz', HE, OB, OB, PH2, y1.yetki_id, 'on-buro-randevu', 'okuma', 'hasta-karti'], '23503')
  await bekle('L. record: a row under another country → refused 23503', KAYIT, ['kz', HE, OB, OB, null, y1.yetki_id, 'on-buro-randevu', 'okuma', 'randevu-listesi'], '23503')
  await bekle('L. record: a row naming an account that is not a country account → refused 23503', KAYIT, ['uz', HE, L0, L0, null, y1.yetki_id, 'on-buro-randevu', 'okuma', 'randevu-listesi'], '23503')
  await bekle('L. record: APPEND-ONLY — a row does not change → refused 23514', `update ulke_klinik_erisim_kayitlari set kisi_id = $2 where id = $1`, [kr, HE], '23514')
  await bekle('L. record: APPEND-ONLY — a row is not deleted by a statement → refused 23514', `delete from ulke_klinik_erisim_kayitlari where id = $1`, [kr], '23514')
  await bekle('L. record: … not by the doctor\'s id either → refused 23514', `delete from ulke_klinik_erisim_kayitlari where doctor_id = $1`, [HE], '23514')
  await bekle('L. record: an account that appears in ANOTHER doctor\'s record cannot be removed while that record stands → refused 23503', `delete from auth.users where id = $1`, [OB], '23503')
  ok('L. record: … and the refused removal left the account, its membership and its grants as they were', (await say('ulke_hesaplari', 'id = $1', [OB])) === 1 && (await say('ulke_klinik_uyeleri', 'doctor_id = $1', [OB])) === 1 && (await say('ulke_klinik_yetkileri', 'id = $1 and iptal_at is null', [y1.yetki_id])) === 1)

  // a position that changes
  const KONUM = `select public.ulke_klinik_konum_degistir($1, $2, $3, $4, $5, $6) r`
  ok('L. position: an administrator may not change the owner, an administrator, or make an administrator', (await durum(KONUM, ['uz', KL, SA, 'hekim', YO, AN])) === 'SAHIP' && (await durum(KONUM, ['uz', KL, HE, 'yonetici', YO, AN])) === 'YETKI_YOK' && (await durum(KONUM, ['uz', KL, YO, 'hekim', YO, AN])) === 'YETKI_YOK')
  ok('L. position: a doctor or a front-desk member may change nobody\'s; nobody is made owner; an unknown position is refused', (await durum(KONUM, ['uz', KL, OB, 'hekim', HE, AN])) === 'YETKI_YOK' && (await durum(KONUM, ['uz', KL, HE, 'hekim', OB, AN])) === 'YETKI_YOK' && (await durum(KONUM, ['uz', KL, HE, 'sahip', SA, AN])) === 'SAHIP' && (await durum(KONUM, ['uz', KL, HE, 'direktor', SA, AN])) === 'YETKI_YOK')
  ok('L. position: the owner of ANOTHER clinic, and a kz build → NOT_FOUND', (await durum(KONUM, ['uz', KL, OB, 'hekim', S2, AN])) === 'NOT_FOUND' && (await durum(KONUM, ['kz', KL, OB, 'hekim', SA, AN])) === 'NOT_FOUND')
  ok('L. position: the same position → AYNI, and the grants stand', (await durum(KONUM, ['uz', KL, OB, 'on-buro', YO, AN])) === 'AYNI' && (await say('ulke_klinik_yetkileri', 'alan_id = $1 and iptal_at is null', [OB])) === 1)
  ok('L. position: the front-desk member becomes an allied professional — EVERY grant they held ends in the same step and is recorded', (await durum(KONUM, ['uz', KL, OB, 'muttefik', YO, AN])) === 'TAMAM' && (await say('ulke_klinik_yetkileri', 'alan_id = $1 and iptal_at is null', [OB])) === 0 && (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and olay = 'bitti' and kisi_id = $2`, [y1.yetki_id, YO])) === 1)
  await c.query(`update ulke_klinik_uyeleri set konum = 'on-buro' where doctor_id = $1`, [OB])
  const y5 = await ver(HE, OB, 'on-buro-portal')
  await c.query(`update ulke_klinik_uyeleri set konum = 'muttefik' where doctor_id = $1`, [OB])
  ok('L. position: changed by a STATEMENT, past the function — the trigger still ends every grant', y5.durum === 'TAMAM' && (await say('ulke_klinik_yetkileri', 'id = $1 and iptal_at is not null', [y5.yetki_id])) === 1)
  await c.query(`update ulke_klinik_uyeleri set konum = 'on-buro' where doctor_id = $1`, [OB])

  // removing a member
  const CIKAR = `select public.ulke_klinik_uye_cikar($1, $2, $3, $4, $5) r`
  const y6 = await ver(HE, OB, 'on-buro-randevu')
  ok('L. removal: the owner is not removed, not by themselves and not by an administrator', (await durum(CIKAR, ['uz', KL, SA, SA, AN])) === 'SAHIP' && (await durum(CIKAR, ['uz', KL, SA, YO, AN])) === 'SAHIP')
  ok('L. removal: a doctor removes nobody else; a front-desk member removes nobody else', (await durum(CIKAR, ['uz', KL, OB, HE, AN])) === 'YETKI_YOK' && (await durum(CIKAR, ['uz', KL, YO, HE, AN])) === 'YETKI_YOK' && (await durum(CIKAR, ['uz', KL, MU, OB, AN])) === 'YETKI_YOK')
  ok('L. removal: by the owner of ANOTHER clinic, and from a kz build → NOT_FOUND, nobody removed', (await durum(CIKAR, ['uz', KL, OB, S2, AN])) === 'NOT_FOUND' && (await durum(CIKAR, ['kz', KL, OB, SA, AN])) === 'NOT_FOUND' && (await say('ulke_klinik_uyeleri', 'klinik_id = $1', [KL])) === 6)
  ok('L. REMOVAL IS IMMEDIATE: the administrator removes the front-desk member — the member\'s row AND every grant given to them are gone in the same step', y6.durum === 'TAMAM' && (await durum(CIKAR, ['uz', KL, OB, YO, AN])) === 'TAMAM' && (await say('ulke_klinik_uyeleri', 'doctor_id = $1', [OB])) === 0 && (await say('ulke_klinik_yetkileri', 'alan_id = $1', [OB])) === 0)
  ok('L. removal: the grant that was open is written to the record first, and the record keeps every earlier row', (await say('ulke_klinik_erisim_kayitlari', `yetki_id = $1 and olay = 'bitti' and kisi_id = $2 and alan_id = $3`, [y6.yetki_id, YO, OB])) === 1 && (await say('ulke_klinik_erisim_kayitlari', 'id = $1', [kr])) === 1)
  await bekle('L. removal: afterwards no grant can be written for the removed member → refused 23503', `insert into ulke_klinik_yetkileri (ulke, klinik_id, doctor_id, alan_id, tur, kaydeden_id) values ('uz', $1, $2, $3, 'on-buro-randevu', $2)`, [KL, H2x, OB], '23503')
  ok('L. removal: a removed member joins again only with a NEW invitation (the used one answers KOD)', (await durum(KATIL, ['uz', H('5'), OB, AN])) === 'KOD')
  await c.query(`delete from ulke_klinik_uyeleri where ulke = 'uz' and doctor_id = $1`, [MU])
  ok('L. removal by a STATEMENT, past the function: the grants still go with the membership, by key', (await say('ulke_klinik_yetkileri', 'alan_id = $1', [MU])) === 0 && (await say('ulke_klinik_yetkileri', 'id = $1', [y2b.yetki_id])) === 0)
  await q(DAVET, ['uz', KL, SA, 'muttefik', H('b'), SON, AN])
  await islev(KATIL, ['uz', H('b'), MU, AN])
  ok('L. removal: a member who joins again starts with NO grant', (await say('ulke_klinik_uyeleri', `doctor_id = $1 and konum = 'muttefik'`, [MU])) === 1 && (await say('ulke_klinik_yetkileri', 'alan_id = $1', [MU])) === 0)
  ok('L. removal: a doctor leaves by themselves — the grants THEY gave end with them', (await durum(CIKAR, ['uz', KL, HE, HE, AN])) === 'TAMAM' && (await say('ulke_klinik_yetkileri', 'doctor_id = $1', [HE])) === 0 && (await say('ulke_klinik_uyeleri', 'doctor_id = $1', [HE])) === 0)
  ok('L. removal: the patients of a doctor who left are still that doctor\'s, untouched', (await say('ulke_hastalar', 'doctor_id = $1', [HE])) === 2)
  ok('L. A PATIENT STILL BELONGS TO ONE DOCTOR: a visit by another doctor of the clinic on that patient is refused by the key the visit table always had', await (async () => { try { await c.query(`insert into ulke_muayeneler (ulke, doctor_id, patient_id) values ('uz', $1, $2)`, [H2x, P1]); return false } catch (e) { return e.code === '23503' } })())

  // SERVER ONLY
  {
    const TABLOLAR = ['ulke_klinikler', 'ulke_klinik_uyeleri', 'ulke_klinik_davetleri', 'ulke_klinik_yetkileri', 'ulke_klinik_erisim_kayitlari']
    const kodlar = async (rol, ulke) => {
      const cikti = []
      if (rol === 'authenticated') await oturum(SA, ulke); else await c.query(`set role ${rol}`)
      const denenen = [
        ...TABLOLAR.flatMap((t) => [`select 1 from ${t} limit 1`, `delete from ${t}`, `update ${t} set created_at = now()`]),
        `insert into ulke_klinikler (ulke, doctor_id, ad) values ('uz', '${BO}', 'QA Ochiq')`,
        `insert into ulke_klinik_uyeleri (ulke, klinik_id, doctor_id, konum) values ('uz', '${KL}', '${BO}', 'hekim')`,
        `insert into ulke_klinik_yetkileri (ulke, klinik_id, doctor_id, alan_id, tur, kaydeden_id) values ('uz', '${KL}', '${H2x}', '${MU}', 'on-buro-randevu', '${H2x}')`,
        `select public.ulke_klinik_kur('uz', '${BO}', 'QA Ochiq', now())`,
        `select public.ulke_klinik_katil('uz', '${H('7')}', '${BO}', now())`,
        `select public.ulke_klinik_uye_cikar('uz', '${KL}', '${MU}', '${SA}', now())`,
        `select public.ulke_klinik_konum_degistir('uz', '${KL}', '${MU}', 'yonetici', '${SA}', now())`,
        `select public.ulke_klinik_yetki_ver('uz', '${KL}', '${H2x}', '${MU}', 'paylasim', '${PH2}', null, null, '${H2x}', now())`,
        `select public.ulke_klinik_yetki_geri_al('uz', '${y3b.yetki_id}', '${SA}', now())`,
        `select public.ulke_klinik_yonetebilir('sahip', 'hekim')`,
      ]
      for (const sql of denenen) { try { await c.query(sql); cikti.push(`${sql.slice(0, 60)}: allowed`) } catch (e) { if (e.code !== '42501') cikti.push(`${sql.slice(0, 60)}: ${e.code}`) } }
      await cik()
      return cikti
    }
    const girisli = await kodlar('authenticated', 'uz'), anon = await kodlar('anon', null)
    ok('L. server only: the OWNER\'s own signed-in browser session can read, write and call NONE of it (its own clinic included)', girisli.length === 0, girisli.join('; '))
    ok('L. server only: nor can a request that is not signed in', anon.length === 0, anon.join('; '))
    await c.query('set role service_role')
    let sunucu = 'ok'
    try { for (const t of TABLOLAR) await c.query(`select count(*) from ${t}`); await c.query(`select public.ulke_klinik_yetki_ver('uz', $1, $2, $3, 'paylasim', $4, null, null, $2, now())`, [KL, H2x, MU, PH2]) } catch (e) { sunucu = `${e.code} ${e.message}` }
    await c.query('reset role')
    ok('L. server only: the server\'s role can', sunucu === 'ok' && (await say('ulke_klinik_yetkileri', 'patient_id = $1 and iptal_at is null', [PH2])) === 1, sunucu)
  }

  // removing a patient, and the accounts
  await c.query(`delete from ulke_hastalar where id = $1 and doctor_id = $2 and ulke = 'uz'`, [PH2, H2x])
  ok('L. removing a patient removes that patient\'s share and that patient\'s record rows (the only way a record row goes), and no one else\'s', (await say('ulke_klinik_yetkileri', 'patient_id = $1', [PH2])) === 0 && (await say('ulke_klinik_erisim_kayitlari', 'patient_id = $1', [PH2])) === 0 && (await say('ulke_klinik_erisim_kayitlari', 'id = $1', [kr])) === 1)
  // The doctors whose records these are go first (their record goes with them); then everybody else.
  await c.query(`delete from auth.users where id = $1`, [HE])
  await c.query(`delete from auth.users where id = $1`, [H2x])
  ok('L. removing a doctor\'s account removes that doctor\'s record with it, after which the accounts named in it can be removed', (await say('ulke_klinik_erisim_kayitlari')) === 0)
  await c.query(`delete from auth.users where id = any($1::uuid[])`, [HEPSI])
  const kalan = []
  for (const t of ['ulke_klinikler', 'ulke_klinik_uyeleri', 'ulke_klinik_davetleri', 'ulke_klinik_yetkileri', 'ulke_klinik_erisim_kayitlari']) { const n = await say(t); if (n) kalan.push(`${t}: ${n}`) }
  ok('L. removing the accounts removes every clinic they own, every membership, invitation, grant and record row (cascade) — an OWNER\'s account included, with its clinic', kalan.length === 0, kalan.join(', '))

  // For section E: clinic data of the accounts IT removes — a clinic of D1 with D2 as a doctor, an invitation, a
  // grant and its record row — so that the rollback of 145 has data to refuse over, and the removal of those
  // accounts has it to cascade through. (The record is D1's: the doctor whose record it is goes first.)
  const KE = (await islev(KUR, ['uz', D1, 'QA Klinika Qoladi', AN])).klinik_id
  await q(DAVET, ['uz', KE, D1, 'hekim', H('c'), SON, AN])
  await islev(KATIL, ['uz', H('c'), D2, AN])
  const ye = await ver(D1, D2, 'vekalet', null, BAS, BIT, D1, KE)
  ok('L. (for section E) a clinic, two members, an invitation, a grant and a record row are left for the rollback to refuse over', ye.durum === 'TAMAM' && (await say('ulke_klinik_erisim_kayitlari')) === 1)
}

// ── E. the rollback scripts ──
const GERI = [...DOSYALAR].reverse().map((d) => d.replace(/\.sql$/, '.geri-al.sql'))
const geriOku = (d) => readFileSync(join(REPO, 'lib/db/migrations/geri-al', d), 'utf8')
{
  // While a country's data exists, a rollback refuses and changes nothing. (129's table was emptied above.)
  const once = await sema()
  const denenen = GERI.filter((x) => !x.startsWith('129'))
  let reddedildi = 0
  for (const d of denenen) { try { await c.query(geriOku(d)) } catch (e) { await c.query('rollback').catch(() => {}); if (/rollback refused/.test(e.message)) reddedildi++ } }
  ok(`E. with country data present, every rollback of ${denenen.length} migrations refuses`, reddedildi === denenen.length, `${reddedildi} of ${denenen.length} refused`)
  ok('E. … and nothing was dropped or changed', (await sema()) === once && (await c.query(`select count(*)::int n from schema_migrations`)).rows[0].n === DOSYALAR.length)
  // Emptied by hand (here: by removing the three country accounts, which cascades through every country table).
  await c.query(`delete from auth.users where id in ($1, $2, $3)`, [D1, D2, K1])
  const kalan = []
  for (const t of (await c.query(`select tablename t from pg_tables where schemaname = 'public' and tablename not in ('schema_migrations') order by 1`)).rows.map((r) => r.t)) { const n = (await c.query(`select count(*)::int n from public.${t}`)).rows[0].n; if (n) kalan.push(`${t}: ${n}`) }
  ok('E. removing a country account removes every row of it in every country table (cascade): usage, links, sessions, summaries, the record, requests, intake forms, tool records, conversations and messages, templates, consultations and consultation codes included', kalan.length === 0, kalan.join(', '))
  for (const tur of ['first run', 'second run (must be repeatable)']) {
    for (const d of GERI) {
      try { await c.query(geriOku(d)); ok(`E. rollback, ${tur}: ${d}`, true) }
      catch (e) { await c.query('rollback').catch(() => {}); ok(`E. rollback, ${tur}: ${d}`, false, `sqlstate ${e.code}: ${e.message}`) }
    }
  }
  const tablolar = (await c.query(`select string_agg(tablename, ',' order by tablename) t from pg_tables where schemaname = 'public'`)).rows[0].t
  const islevler = (await c.query(`select count(*)::int n from pg_proc p where p.pronamespace = 'public'::regnamespace and not exists (select 1 from pg_depend x where x.objid = p.oid and x.deptype = 'e')`)).rows[0].n
  ok('E. after the rollbacks nothing of the migrations is left: no table but the (empty) ledger, no function, no rule on storage', tablolar === 'schema_migrations' && islevler === 0 && (await c.query(`select count(*)::int n from schema_migrations`)).rows[0].n === 0 && (await c.query(`select count(*)::int n from pg_policies where schemaname = 'storage'`)).rows[0].n === 0, `${tablolar}; ${islevler} function(s)`)
  ok('E. … except what the scripts say they leave: the (empty) recordings bucket, removed in the dashboard', (await c.query(`select string_agg(id, ',') b from storage.buckets`)).rows[0].b === 'muayene-sesleri')
}

// ── T. NOT ON ANY OTHER DATABASE: a database that is not a country database is refused and left exactly as it was ──
{
  await c.query('create database kanit_baska')
  const t = await baglan('kanit_baska')
  await t.query(STUBLAR)
  // Shaped like the Turkish product's database: its own tables, its own ledger with its own rows. Stand-ins, not copies.
  await t.query(`
    create table public.schema_migrations (version text primary key, filename text not null, checksum text, applied_at timestamptz, backfilled boolean not null default false, note text);
    insert into public.schema_migrations (version, filename) values ('126', '126_x.sql'), ('127', '127_y.sql');
    create table public.users (id uuid primary key references auth.users(id) on delete cascade, email text not null, full_name text);
    create table public.patients (id uuid primary key default gen_random_uuid(), doctor_id uuid not null references public.users(id), name_encrypted text);
    create table public.randevular (id uuid primary key default gen_random_uuid(), doctor_id uuid not null, patient_id uuid references public.patients(id), baslangic timestamptz not null);
    alter table public.patients enable row level security;
    create policy "own" on public.patients for all to authenticated using (doctor_id = auth.uid());
    insert into auth.users (id, email) values ('aaaaaaaa-2222-4222-8222-222222222222', 'qa-other@notya.test');
    insert into public.users (id, email, full_name) values ('aaaaaaaa-2222-4222-8222-222222222222', 'qa-other@notya.test', 'QA Other');
    insert into public.patients (doctor_id, name_encrypted) values ('aaaaaaaa-2222-4222-8222-222222222222', 'sifreli');
  `)
  const hal = async () => `${await sema(t)}#${(await t.query(`select (select count(*) from public.users) || '/' || (select count(*) from public.patients) || '/' || (select string_agg(version, ',' order by version) from public.schema_migrations) || '/' || (select count(*) from storage.buckets) || '/' || (select count(*) from pg_extension) x`)).rows[0].x}`
  const once = await hal()
  const dene = async (sql) => { try { await t.query(sql); return 'IT RAN' } catch (e) { await t.query('rollback').catch(() => {}); return e.message } }
  {
    const m = await dene(temelUret(REPO))
    ok('T. on a database that is not empty, the BASELINE refuses', /baseline refused/.test(m), m)
    ok('T. … and leaves it exactly as it was: tables, rows, rules, its own ledger, storage, extensions', (await hal()) === once)
  }
  const sonrakiler = DOSYALAR.filter((d) => !LISTE.elleUygulanan.includes(d))
  ok('T. there are migrations written since the first country\'s database exists, and each is tried here', sonrakiler.length >= 2, sonrakiler.join(', '))
  for (const d of sonrakiler) {
    const m = await dene(dosyaOku(d))
    ok(`T. on a database that is not a country database, ${d} refuses`, new RegExp(`country migration ${d.slice(0, 3)} refused`).test(m), m)
    ok(`T. … and leaves it exactly as it was (${d})`, (await hal()) === once)
  }
  await t.end()
}

await c.end(); await epg.stop(); rmSync(VERI, { recursive: true, force: true })
console.log(hata ? `\n${hata} CHECK(S) FAILED` : `\nALL ${toplam} CHECKS PASSED`)
process.exit(hata ? 1 : 0)
