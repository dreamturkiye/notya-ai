#!/usr/bin/env node
/**
 * NOTYA-UZ-RANDEVU-01 — PROOF ON A REAL POSTGRESQL that the country migrations 130–135 run, and that the two things
 * the appointment slice leaves to the database really behave as the application assumes:
 *
 *   - the NO-DOUBLE-BOOKING constraint of migration 135 (also for two transactions at the same moment);
 *   - `ulke_not_onayla`, the all-or-nothing approval of a visit note (a failure in the middle changes nothing).
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
 * STUBS. A Supabase project brings objects these migrations expect. Here each is the smallest thing that lets the
 * SQL run — so this proves the migrations' own SQL, not Supabase's side:
 *   roles           anon, authenticated, service_role (service_role with BYPASSRLS and all table privileges)
 *   auth            schema `auth`, table auth.users(id), function auth.uid() reading `request.jwt.claim.sub`
 *   storage         schema `storage`, tables storage.buckets and storage.objects (row-level security on),
 *                   function storage.foldername(text)
 *   core tables     public.patients, public.sessions, public.notes with only the columns these migrations and the
 *                   function use; public.schema_migrations; an owner policy and a read grant on public.patients
 * NOT covered: migrations 128 and 129 (they alter the core `users` table), every migration below 128, PostgREST
 * (how `supabase.rpc` reaches the function), and the real storage policies.
 *
 * Exit code 0 = every check passed. Last run: 2026-10-08, PostgreSQL 18.4, 59 checks, all passed.
 */
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
const baglan = async () => { const c = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', password: 'yalniz-yerel', database: 'postgres' }); await c.connect(); return c }
const c = await baglan()
let hata = 0
const ok = (ad, kosul, ek = '') => { console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ek ? ` — ${ek}` : ''}`); if (!kosul) hata++ }
const bekle = async (ad, sql, par, kod) => { try { await c.query(sql, par); ok(ad, false, 'no error was raised') } catch (e) { ok(ad, e.code === kod, `sqlstate ${e.code}: ${e.message}`) } }

console.log((await c.query('select version()')).rows[0].version)

// ── STUBS for what Supabase provides and the migrations expect ──
await c.query(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  create table public.schema_migrations (version text primary key, filename text, checksum text, applied_at timestamptz, backfilled boolean, note text);
  create table public.patients (id uuid primary key default gen_random_uuid(), doctor_id uuid not null references auth.users(id) on delete cascade);
  create table public.sessions (id uuid primary key default gen_random_uuid(), doctor_id uuid not null, patient_id uuid references public.patients(id) on delete cascade);
  create table public.notes (id uuid primary key default gen_random_uuid(), session_id uuid references public.sessions(id) on delete cascade, doctor_id uuid not null,
    content_subjektif text, content_objektif text, content_degerlendirme text, content_plan text, approved_at timestamptz, approved_by uuid);
  grant usage on schema public, auth to anon, authenticated, service_role;
  -- As in a Supabase project: the browser roles may read patients, narrowed by its own owner policy.
  alter table public.patients enable row level security;
  create policy "stub_patients_owner" on public.patients for select to authenticated using (doctor_id = auth.uid());
  grant select on public.patients to authenticated, anon;
`)

// ── 1. the migrations, in order, each as it is written; then all of them a second time ──
const DOSYALAR = ['130_hekim_dil_tercihleri.sql', '131_hasta_ulke_bilgisi.sql', '132_muayene_dil_kaydi.sql', '133_not_dil_kaydi.sql', '134_hekim_rolu.sql', '135_ulke_randevu.sql']
for (const tur of ['first run', 'second run (must be repeatable)']) {
  for (const d of DOSYALAR) {
    try { await c.query(readFileSync(join(REPO, 'lib/db/migrations', d), 'utf8')); ok(`${tur}: ${d}`, true) }
    catch (e) { ok(`${tur}: ${d}`, false, `sqlstate ${e.code} at position ${e.position ?? '?'}: ${e.message}`) }
  }
}
ok('schema_migrations has 130–135 once each', (await c.query(`select string_agg(version, ',' order by version) v from schema_migrations`)).rows[0].v === '130,131,132,133,134,135')
// The service role of a Supabase project owns everything; here it is granted what the server uses.
await c.query(`grant all on all tables in schema public to service_role`)

// ── 2. data ──
const D1 = '11111111-1111-4111-8111-111111111111', D2 = '22222222-2222-4222-8222-222222222222'
await c.query(`insert into auth.users (id) values ($1), ($2)`, [D1, D2])
const hasta = async (d) => (await c.query(`insert into patients (doctor_id) values ($1) returning id`, [d])).rows[0].id
const H1 = await hasta(D1), H1b = await hasta(D1), H2 = await hasta(D2)
const ekle = (d, h, bas, bit, durum = 'planlandi', istemci = c) => istemci.query(`insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis, durum) values ($1, $2, $3, $4, $5) returning id`, [d, h, bas, bit, durum])
const G = '2026-10-12T'

// ── 3. the double-booking constraint ──
const r1 = (await ekle(D1, H1, `${G}05:00:00Z`, `${G}05:30:00Z`)).rows[0].id
await bekle('same time, same doctor → refused 23P01', `insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis) values ($1,$2,$3,$4)`, [D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`], '23P01')
await bekle('overlapping time → refused 23P01', `insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis) values ($1,$2,$3,$4)`, [D1, H1b, `${G}05:15:00Z`, `${G}05:45:00Z`], '23P01')
await bekle('a longer one around it → refused 23P01', `insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis) values ($1,$2,$3,$4)`, [D1, H1b, `${G}04:30:00Z`, `${G}06:00:00Z`], '23P01')
try { await ekle(D1, H1b, `${G}05:30:00Z`, `${G}06:00:00Z`); await ekle(D1, H1b, `${G}04:30:00Z`, `${G}05:00:00Z`); ok('touching times (right before, right after) → allowed', true) } catch (e) { ok('touching times → allowed', false, e.message) }
try { await ekle(D2, H2, `${G}05:00:00Z`, `${G}05:30:00Z`); ok('another doctor, same time → allowed', true) } catch (e) { ok('another doctor, same time → allowed', false, e.message) }
let iptalId, gelmediId
try { iptalId = (await ekle(D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`, 'iptal')).rows[0].id; gelmediId = (await ekle(D1, H1b, `${G}05:10:00Z`, `${G}05:20:00Z`, 'gelmedi')).rows[0].id; ok('cancelled and did-not-come rows over a taken time → allowed', true) } catch (e) { ok('cancelled / did-not-come over a taken time → allowed', false, e.message) }
await bekle('cancelled → planned onto a taken time → refused 23P01', `update ulke_randevulari set durum = 'planlandi' where id = $1`, [iptalId], '23P01')
await bekle('did-not-come → arrived onto a taken time → refused 23P01', `update ulke_randevulari set durum = 'geldi' where id = $1`, [gelmediId], '23P01')
await bekle('moving onto a taken time → refused 23P01', `update ulke_randevulari set baslangic = $2, bitis = $3 where id = $1`, [r1, `${G}05:40:00Z`, `${G}05:50:00Z`], '23P01')
try { await c.query(`update ulke_randevulari set durum = 'geldi' where id = $1`, [r1]); await c.query(`update ulke_randevulari set durum = 'tamamlandi' where id = $1`, [r1]); await c.query(`update ulke_randevulari set durum = 'planlandi' where id = $1`, [r1]); ok('status changes of a row that holds its time → allowed', true) } catch (e) { ok('status changes of a row that holds its time', false, e.message) }
await c.query(`update ulke_randevulari set durum = 'iptal' where id = $1`, [r1])
try { await ekle(D1, H1b, `${G}05:00:00Z`, `${G}05:30:00Z`); ok('a cancelled appointment gives its time back', true) } catch (e) { ok('a cancelled appointment gives its time back', false, e.message) }
await bekle('end before start → refused 23514', `insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis) values ($1,$2,$3,$4)`, [D1, H1, `${G}09:00:00Z`, `${G}08:00:00Z`], '23514')
await bekle('unknown status → refused 23514', `insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis, durum) values ($1,$2,$3,$4,'kechikdi')`, [D1, H1, `${G}09:00:00Z`, `${G}09:30:00Z`], '23514')
// TWO REQUESTS AT THE SAME MOMENT: two connections, two open transactions, the same time.
{
  const a = await baglan(), b = await baglan()
  await a.query('begin'); await b.query('begin')
  await ekle(D1, H1, `${G}11:00:00Z`, `${G}11:30:00Z`, 'planlandi', a)
  let bSonucu = 'pending'
  const bIstegi = ekle(D1, H1b, `${G}11:00:00Z`, `${G}11:30:00Z`, 'planlandi', b).then(() => { bSonucu = 'inserted' }, (e) => { bSonucu = e.code })
  await new Promise((r) => setTimeout(r, 400))
  ok('two at the same moment: the second waits while the first is undecided', bSonucu === 'pending', bSonucu)
  await a.query('commit'); await bIstegi; await b.query('rollback')
  ok('two at the same moment: once the first commits, the second is refused 23P01', bSonucu === '23P01', bSonucu)
  ok('two at the same moment: exactly one row', (await c.query(`select count(*)::int n from ulke_randevulari where doctor_id = $1 and baslangic = $2`, [D1, `${G}11:00:00Z`])).rows[0].n === 1)
  // And when the first one rolls back, the second goes through.
  await a.query('begin'); await b.query('begin')
  await ekle(D1, H1, `${G}12:00:00Z`, `${G}12:30:00Z`, 'planlandi', a)
  bSonucu = 'pending'
  const bIstegi2 = ekle(D1, H1b, `${G}12:00:00Z`, `${G}12:30:00Z`, 'planlandi', b).then(() => { bSonucu = 'inserted' }, (e) => { bSonucu = e.code })
  await new Promise((r) => setTimeout(r, 300)); await a.query('rollback'); await bIstegi2; await b.query('commit')
  ok('two at the same moment: if the first is undone, the second is booked', bSonucu === 'inserted', bSonucu)
  await a.end(); await b.end()
}
await bekle('working pattern: a weekday 8 → refused 23514', `insert into hekim_calisma_duzeni (doctor_id, gunler, baslangic_dk, bitis_dk, sure_dk) values ($1, '{1,8}', 540, 1080, 30)`, [D1], '23514')
await bekle('working pattern: ends before it begins → refused 23514', `insert into hekim_calisma_duzeni (doctor_id, gunler, baslangic_dk, bitis_dk, sure_dk) values ($1, '{1,2}', 1080, 540, 30)`, [D1], '23514')
try { await c.query(`insert into hekim_calisma_duzeni (doctor_id, gunler, baslangic_dk, bitis_dk, sure_dk, molalar) values ($1, '{1,2,3,4,5}', 540, 1080, 30, $2::jsonb)`, [D1, JSON.stringify([{ bas: 780, bit: 840 }])]); ok('working pattern: a valid row is stored', true) } catch (e) { ok('working pattern: a valid row is stored', false, e.message) }

// ── 4. ulke_not_onayla ──
let sayac = 0
const notKur = async (d, h, randevuDurumu) => {
  const s = (await c.query(`insert into sessions (doctor_id, patient_id) values ($1, $2) returning id`, [d, h])).rows[0].id
  const n = (await c.query(`insert into notes (session_id, doctor_id, content_subjektif, content_objektif, content_degerlendirme, content_plan) values ($1, $2, 'S taslak', 'O taslak', 'A taslak', 'P taslak') returning id`, [s, d])).rows[0].id
  await c.query(`insert into not_dil_kaydi (note_id, doctor_id, patient_id, not_dili, alanlar) values ($1, $2, $3, 'uz-Latn', '{"ecg":"taslak"}')`, [n, d, h])
  let r = null
  if (randevuDurumu) {
    // Each on a day of its own, so that these rows never meet the double-booking constraint by accident.
    const bas = new Date(Date.UTC(2027, 0, 1 + sayac++, 5, 0)).toISOString()
    r = (await c.query(`insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis, durum, session_id) values ($1, $2, $3::timestamptz, $3::timestamptz + interval '30 minutes', $4, $5) returning id`, [d, h, bas, randevuDurumu, s])).rows[0].id
  }
  return { s, n, r }
}
const onayla = (n, d, k, istemci = c) => istemci.query(`select public.ulke_not_onayla($1, $2, $3, 'S ekran', 'O ekran', 'A ekran', 'P ekran', $4::jsonb) as sonuc`, [n, d, '2026-10-08T10:00:00Z', k === null ? null : JSON.stringify(k)])
const durum = async (x) => JSON.stringify([(await c.query(`select * from notes where id = $1`, [x.n])).rows, (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows, x.r ? (await c.query(`select * from ulke_randevulari where id = $1`, [x.r])).rows : []])

{
  const x = await notKur(D1, H1, 'geldi')
  const once = await durum(x)
  ok('another doctor\'s id → NOT_FOUND, nothing changed', (await onayla(x.n, D2, { alanlar: { ecg: 'x' } })).rows[0].sonuc === 'NOT_FOUND' && (await durum(x)) === once)
  // A FAILURE IN THE MIDDLE, for real: the note's text and approval are written first, then the second statement
  // violates a constraint of not_dil_kaydi (ikinci_dil must differ from not_dili).
  try { await onayla(x.n, D1, { alanlar: { ecg: 'ekran' }, ikinci_dil: 'uz-Latn' }); ok('failure in the middle raises', false) } catch (e) { ok('failure in the middle raises', e.code === '23514', `sqlstate ${e.code}`) }
  ok('failure in the middle: the note is unapproved and every row is unchanged', (await durum(x)) === once)
  // The same inside the caller's own transaction with a savepoint, as a pooled connection might run it.
  const r = (await onayla(x.n, D1, { alanlar: { ecg: 'ekran', yangi: 'maydon' } })).rows[0].sonuc
  const n = (await c.query(`select * from notes where id = $1`, [x.n])).rows[0]
  const d = (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows[0]
  const a = (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0]
  ok('approval → TAMAM', r === 'TAMAM', String(r))
  ok('approval: text, approved_at, approved_by written', n.content_subjektif === 'S ekran' && n.content_plan === 'P ekran' && n.approved_at?.toISOString() === '2026-10-08T10:00:00.000Z' && n.approved_by === D1)
  ok('approval: role fields written; untouched columns left alone', JSON.stringify(d.alanlar) === JSON.stringify({ ecg: 'ekran', yangi: 'maydon' }) && d.not_dili === 'uz-Latn' && d.ikinci_dil === null)
  ok('approval: the linked appointment is done', a.durum === 'tamamlandi', a.durum)
  const sonra = await durum(x)
  ok('approving again → ONAYLI, nothing changed', (await onayla(x.n, D1, { alanlar: { ecg: 'KECH' } })).rows[0].sonuc === 'ONAYLI' && (await durum(x)) === sonra)
}
{
  // The other draft is approved: the two drafts change places; `alanlar: null` clears the column.
  const x = await notKur(D1, H1, 'planlandi')
  await c.query(`update not_dil_kaydi set ikinci_dil = 'ru', ikinci_s = 'S ru', ikinci_o = 'O ru', ikinci_a = 'A ru', ikinci_p = 'P ru', ikinci_alanlar = '{"ecg":"ru"}' where note_id = $1`, [x.n])
  const r = (await onayla(x.n, D1, { not_dili: 'ru', ikinci_dil: 'uz-Latn', ikinci_s: 'S taslak', ikinci_o: 'O taslak', ikinci_a: 'A taslak', ikinci_p: 'P taslak', alanlar: null, ikinci_alanlar: { ecg: 'taslak' } })).rows[0].sonuc
  const d = (await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows[0]
  ok('approving the other draft: the drafts change places, alanlar null clears the column', r === 'TAMAM' && d.not_dili === 'ru' && d.ikinci_dil === 'uz-Latn' && d.ikinci_s === 'S taslak' && d.alanlar === null && JSON.stringify(d.ikinci_alanlar) === '{"ecg":"taslak"}', JSON.stringify(d))
  ok('approving: a planned appointment becomes done too', (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0].durum === 'tamamlandi')
}
{
  // p_dil_kaydi null leaves not_dil_kaydi alone; a cancelled appointment is not reopened; a note without an appointment works.
  const x = await notKur(D1, H1, 'iptal')
  const dOnce = JSON.stringify((await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows)
  ok('p_dil_kaydi null → TAMAM, not_dil_kaydi untouched, a cancelled appointment stays cancelled', (await onayla(x.n, D1, null)).rows[0].sonuc === 'TAMAM' && JSON.stringify((await c.query(`select * from not_dil_kaydi where note_id = $1`, [x.n])).rows) === dOnce && (await c.query(`select durum from ulke_randevulari where id = $1`, [x.r])).rows[0].durum === 'iptal')
  const y = await notKur(D1, H1, null)
  ok('a visit without an appointment → TAMAM', (await onayla(y.n, D1, { alanlar: { ecg: 'e' } })).rows[0].sonuc === 'TAMAM')
  // A note whose language record is missing is not approved at all.
  const z = await notKur(D1, H1, 'geldi')
  await c.query(`delete from not_dil_kaydi where note_id = $1`, [z.n])
  const once = await durum(z)
  try { await onayla(z.n, D1, { alanlar: { ecg: 'e' } }); ok('missing language record raises', false) } catch (e) { ok('missing language record raises', e.code === 'P0002', `sqlstate ${e.code}`) }
  ok('missing language record: note unapproved, appointment unchanged', (await durum(z)) === once)
}
{
  // Two approvals of the same note at the same moment: one TAMAM, one ONAYLI.
  const x = await notKur(D1, H1, 'geldi')
  const a = await baglan(), b = await baglan()
  const [ra, rb] = await Promise.all([onayla(x.n, D1, { alanlar: { ecg: 'A' } }, a), onayla(x.n, D1, { alanlar: { ecg: 'B' } }, b)])
  ok('two approvals at the same moment: one TAMAM, one ONAYLI', [ra.rows[0].sonuc, rb.rows[0].sonuc].sort().join() === 'ONAYLI,TAMAM', `${ra.rows[0].sonuc}, ${rb.rows[0].sonuc}`)
  await a.end(); await b.end()
}
// ── 5. who may call the function; what the browser roles may see ──
{
  const x = await notKur(D1, H1, 'geldi')
  for (const rol of ['authenticated', 'anon']) {
    await c.query(`set role ${rol}`)
    try { await onayla(x.n, D1, null); ok(`${rol} may NOT call ulke_not_onayla`, false) } catch (e) { ok(`${rol} may NOT call ulke_not_onayla`, e.code === '42501', `sqlstate ${e.code}`) }
    await c.query('reset role')
  }
  await c.query('set role service_role')
  try { ok('service_role may call ulke_not_onayla', (await onayla(x.n, D1, null)).rows[0].sonuc === 'TAMAM') } catch (e) { ok('service_role may call ulke_not_onayla', false, `sqlstate ${e.code}: ${e.message}`) }
  await c.query('reset role')
  // Row-level security, second line: a signed-in doctor reads only their own rows and cannot write.
  await c.query(`select set_config('request.jwt.claim.sub', $1, false)`, [D2]); await c.query('set role authenticated')
  const gorunen = (await c.query(`select distinct doctor_id from ulke_randevulari`)).rows.map((r) => r.doctor_id)
  ok('RLS: doctor 2 sees only doctor 2\'s appointments', gorunen.length === 1 && gorunen[0] === D2, JSON.stringify(gorunen))
  ok('RLS: doctor 2 sees no working pattern of doctor 1', (await c.query(`select count(*)::int n from hekim_calisma_duzeni`)).rows[0].n === 0)
  try { await c.query(`insert into ulke_randevulari (doctor_id, patient_id, baslangic, bitis) values ($1,$2,now(),now() + interval '10 minutes')`, [D2, H2]); ok('RLS: a signed-in doctor cannot write appointments from the browser', false) } catch (e) { ok('RLS: a signed-in doctor cannot write appointments from the browser', e.code === '42501', `sqlstate ${e.code}`) }
  await c.query('reset role'); await c.query('set role anon')
  try { await c.query(`select 1 from ulke_randevulari limit 1`); ok('anon cannot read appointments', false) } catch (e) { ok('anon cannot read appointments', e.code === '42501', `sqlstate ${e.code}`) }
  await c.query('reset role')
}
// The earlier tables (130–134) take a row each, with their constraints.
try {
  await c.query(`insert into hekim_dil_tercihleri (doctor_id, not_dili, soruldu_at) values ($1, 'uz-Cyrl', now())`, [D1])
  await c.query(`insert into hasta_ulke_bilgisi (patient_id, doctor_id, dil) values ($1, $2, 'uz')`, [H1, D1])
  const s = (await c.query(`insert into sessions (doctor_id, patient_id) values ($1, $2) returning id`, [D1, H1])).rows[0].id
  await c.query(`insert into muayene_dil_kaydi (session_id, doctor_id, patient_id, riza_at, riza_surumu, stt_model, not_dili, sablon) values ($1, $2, $3, now(), 'uz-taslak-2026-10-08', 'scribe_v2', 'uz-Latn', 'pediatri')`, [s, D1, H1])
  await c.query(`insert into hekim_rolu (doctor_id, rol) values ($1, 'kadin-hastaliklari-dogum')`, [D1])
  ok('130–134: one valid row into each table', true)
} catch (e) { ok('130–134: one valid row into each table', false, `sqlstate ${e.code}: ${e.message}`) }
await bekle('134: a role key with a capital letter → refused 23514', `insert into hekim_rolu (doctor_id, rol) values ($1, 'Pediatri')`, [D2], '23514')
await bekle('133: second draft in the note\'s own language → refused 23514', `update not_dil_kaydi set ikinci_dil = not_dili where note_id = (select note_id from not_dil_kaydi limit 1)`, [], '23514')
ok('132: the private bucket exists once', (await c.query(`select count(*)::int n from storage.buckets where id = 'muayene-sesleri' and public = false`)).rows[0].n === 1)

await c.end(); await epg.stop(); rmSync(VERI, { recursive: true, force: true })
console.log(hata ? `\n${hata} CHECK(S) FAILED` : '\nALL CHECKS PASSED')
process.exit(hata ? 1 : 0)
