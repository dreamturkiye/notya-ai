#!/usr/bin/env node
/**
 * NOTYA-ULKE-SABLON-01 — PROOF ON A REAL POSTGRESQL of the country migrations, for the SHARED DATABASE
 * (Kaan, 2026-10-08: every country lives in the same database as Türkiye). docs/COUNTRY-PACK-DB-ROLLOUT.md.
 *
 *   A. TÜRKİYE IS UNCHANGED. Tables shaped like Türkiye's (`users`, `patients`, `sessions`, `notes`, `ai_kullanim`,
 *      `randevular`, plus auth.users and the storage tables) are created and seeded FIRST. Their definitions
 *      (columns, constraints, indexes, policies, triggers, row-level security) and their rows are fingerprinted
 *      before the migrations and after them: nothing may differ, except the three things the rollout document
 *      names (one new bucket row, one new policy on storage.objects, the ledger rows).
 *   B. THE MIGRATIONS RUN: 129–135 in order, each as it is written, then all of them a second time.
 *   C. COUNTRIES ARE KEPT APART BY THE DATABASE ITSELF: the country is part of every key — a row of one country
 *      cannot point at a row of another, nor at another doctor's; an account never changes country; row-level
 *      security shows a session only rows of its own account AND its own country; the recordings bucket accepts an
 *      upload only under `<the session's country>/<the session's account>/`; the approval function and the
 *      invitation functions act only inside the country they are called for.
 *   D. What the appointment slice leaves to the database still holds: NO DOUBLE BOOKING (also for two transactions
 *      at the same moment) and the ALL-OR-NOTHING approval of a note.
 *   E. THE ROLLBACK SCRIPTS (lib/db/migrations/geri-al/) refuse while data exists, run twice, and leave Türkiye's
 *      tables exactly as they were at the start.
 *   G. THE OWNER'S BEFORE/AFTER CHECK (scripts/ulke-goc-kontrol.sql) is run as the rollout document says: it reports
 *      exactly the three expected lines after 129–135, and it does notice a change to a table of Türkiye (128).
 *   F. MIGRATION 128 IS SUPERSEDED and is not part of the run above. It is exercised separately at the end, only to
 *      put on record what it WOULD change in Türkiye's `users` and that its rollback undoes it.
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
 *   auth            schema `auth`, table auth.users, functions auth.uid() and auth.jwt() reading `request.jwt.claims`
 *   storage         schema `storage`, tables storage.buckets and storage.objects (row-level security on, one policy
 *                   of Türkiye's already there), function storage.foldername(text)
 *   Türkiye         the six tables named in A, with a few columns each, an index, a policy, a trigger and rows —
 *                   SHAPED LIKE the live tables, not copies of them
 * NOT covered: the real definitions of Türkiye's tables, every migration below 128, PostgREST (how `supabase.rpc`
 * and the row filters reach the database), Supabase's real roles, grants and storage policies, real lock waits
 * under live traffic.
 *
 * Exit code 0 = every check passed.
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
let hata = 0, toplam = 0
const ok = (ad, kosul, ek = '') => { toplam++; console.log(`${kosul ? 'ok  ' : 'FAIL'} ${ad}${ek && !kosul ? ` — ${ek}` : ''}`); if (!kosul) hata++ }
const bekle = async (ad, sql, par, kod) => { try { await c.query(sql, par); ok(ad, false, 'no error was raised') } catch (e) { ok(ad, e.code === kod, `sqlstate ${e.code}: ${e.message}`) } }

console.log((await c.query('select version()')).rows[0].version)

// ── STUBS for what Supabase provides and the migrations expect ──
await c.query(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  create table public.schema_migrations (version text primary key, filename text, checksum text, applied_at timestamptz, backfilled boolean, note text);
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant insert, select on storage.objects to authenticated;
`)

// ── A. TABLES SHAPED LIKE TÜRKİYE'S, seeded before any migration runs ──
const TR1 = 'aaaaaaaa-1111-4111-8111-111111111111', TR2 = 'aaaaaaaa-2222-4222-8222-222222222222'
await c.query(`
  create table public.users (id uuid primary key references auth.users(id) on delete cascade, email text not null, full_name text, specialty text, profession_type text, onboarding_completed boolean default false, subscription_tier text default 'trial', created_at timestamptz default now(), updated_at timestamptz default now());
  create table public.patients (id uuid primary key default gen_random_uuid(), doctor_id uuid not null references public.users(id) on delete cascade, name_encrypted text, dob_encrypted text, tc_kimlik_hash text, is_active boolean default true, deleted_at timestamptz, created_at timestamptz default now());
  create index patients_doctor_idx on public.patients (doctor_id);
  create table public.sessions (id uuid primary key default gen_random_uuid(), doctor_id uuid not null references public.users(id), patient_id uuid references public.patients(id) on delete cascade, session_type text check (session_type in ('muayene', 'kontrol')), status text, transcript_cleaned text, started_at timestamptz default now(), created_at timestamptz default now());
  create table public.notes (id uuid primary key default gen_random_uuid(), session_id uuid references public.sessions(id) on delete cascade, doctor_id uuid not null, note_type text, content_subjektif text, content_objektif text, content_degerlendirme text, content_plan text, approved_at timestamptz, approved_by uuid, created_at timestamptz default now());
  create table public.ai_kullanim (doctor_id uuid not null, gun date not null, kova text not null, sayac integer not null default 0, primary key (doctor_id, gun, kova));
  create table public.randevular (id uuid primary key default gen_random_uuid(), doctor_id uuid not null, patient_id uuid references public.patients(id), baslangic timestamptz not null, durum text default 'planlandi');
  alter table public.patients enable row level security;
  alter table public.sessions enable row level security;
  alter table public.notes enable row level security;
  create policy "tr_patients_owner" on public.patients for all to authenticated using (doctor_id = auth.uid());
  create policy "tr_sessions_owner" on public.sessions for all to authenticated using (doctor_id = auth.uid());
  create policy "tr_notes_owner" on public.notes for all to authenticated using (doctor_id = auth.uid());
  create function public.tr_users_updated() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
  create trigger tr_users_updated before update on public.users for each row execute function public.tr_users_updated();
  grant select, insert, update, delete on public.patients, public.sessions, public.notes to authenticated;
  insert into storage.buckets (id, name, public) values ('hasta-belgeler', 'hasta-belgeler', false);
  create policy "tr_belgeler_kendi_klasoru" on storage.objects for insert to authenticated with check (bucket_id = 'hasta-belgeler' and (storage.foldername(name))[1] = auth.uid()::text);
`)
await c.query(`insert into auth.users (id, email) values ($1, 'qa-tr-1@notya.test'), ($2, 'qa-tr-2@notya.test')`, [TR1, TR2])
await c.query(`insert into public.users (id, email, full_name, specialty, profession_type, onboarding_completed) values ($1, 'qa-tr-1@notya.test', 'QA Hekim Bir', 'pediatri', 'doktor', true), ($2, 'qa-tr-2@notya.test', 'QA Hekim İki', 'kardiyoloji', 'doktor', true)`, [TR1, TR2])
{
  const h1 = (await c.query(`insert into public.patients (doctor_id, name_encrypted, tc_kimlik_hash) values ($1, 'sifreli-ad-1', 'hash-1') returning id`, [TR1])).rows[0].id
  const h2 = (await c.query(`insert into public.patients (doctor_id, name_encrypted) values ($1, 'sifreli-ad-2') returning id`, [TR2])).rows[0].id
  const s1 = (await c.query(`insert into public.sessions (doctor_id, patient_id, session_type, status, transcript_cleaned) values ($1, $2, 'muayene', 'completed', 'QA sentetik döküm') returning id`, [TR1, h1])).rows[0].id
  await c.query(`insert into public.notes (session_id, doctor_id, note_type, content_subjektif, content_plan, approved_at, approved_by) values ($1, $2, 'soap', 'QA öykü', 'QA plan', now(), $2)`, [s1, TR1])
  await c.query(`insert into public.notes (session_id, doctor_id, note_type, content_subjektif) values ($1, $2, 'soap', 'QA taslak')`, [s1, TR1])
  await c.query(`insert into public.ai_kullanim (doctor_id, gun, kova, sayac) values ($1, current_date, 'soap', 3)`, [TR1])
  await c.query(`insert into public.randevular (doctor_id, patient_id, baslangic) values ($1, $2, now() + interval '1 day'), ($3, $4, now() + interval '2 days')`, [TR1, h1, TR2, h2])
  await c.query(`insert into storage.objects (bucket_id, name, owner) values ('hasta-belgeler', $1, $2)`, [`${TR1}/rapor.pdf`, TR1])
}

/** Everything about a table that Türkiye's application could notice: its definition, and its rows. */
const TURKIYE = ['public.users', 'public.patients', 'public.sessions', 'public.notes', 'public.ai_kullanim', 'public.randevular', 'auth.users', 'storage.objects', 'storage.buckets']
async function parmakIzi(tablo) {
  const [sema, ad] = tablo.split('.')
  const q = async (sql) => JSON.stringify((await c.query(sql, [sema, ad])).rows)
  return {
    kolonlar: await q(`select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = $1 and table_name = $2 order by ordinal_position`),
    // Constraints ON the table. A foreign key that POINTS AT it from a new table belongs to the new table.
    kisitlar: await q(`select conname, pg_get_constraintdef(oid) as tanim from pg_constraint where conrelid = (quote_ident($1) || '.' || quote_ident($2))::regclass order by conname`),
    indeksler: await q(`select indexname, indexdef from pg_indexes where schemaname = $1 and tablename = $2 order by indexname`),
    politikalar: await q(`select policyname, permissive, roles::text, cmd, qual, with_check from pg_policies where schemaname = $1 and tablename = $2 order by policyname`),
    tetikleyiciler: await q(`select tgname, pg_get_triggerdef(oid) as tanim from pg_trigger where tgrelid = (quote_ident($1) || '.' || quote_ident($2))::regclass and not tgisinternal order by tgname`),
    rls: await q(`select relrowsecurity, relforcerowsecurity from pg_class where oid = (quote_ident($1) || '.' || quote_ident($2))::regclass`),
    satirSayisi: (await c.query(`select count(*)::int n from ${tablo}`)).rows[0].n,
    satirlar: (await c.query(`select coalesce(md5(string_agg(t::text, '|' order by t::text)), '') h from ${tablo} t`)).rows[0].h,
  }
}
const hepsininIzi = async () => { const iz = {}; for (const t of TURKIYE) iz[t] = await parmakIzi(t); return iz }
const farklar = (a, b) => TURKIYE.flatMap((t) => Object.keys(a[t]).filter((k) => a[t][k] !== b[t][k]).map((k) => `${t}.${k}`))
const ONCE = await hepsininIzi()
// G. The owner's own before/after check (scripts/ulke-goc-kontrol.sql), exactly as the rollout document tells it to be run.
const KONTROL = readFileSync(join(REPO, 'scripts/ulke-goc-kontrol.sql'), 'utf8')
const kontrol = async () => Object.fromEntries((await c.query(KONTROL)).rows.map((r) => [r.what, r.value]))
const kontrolFarki = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).sort()
const KONTROL_ONCE = await kontrol()
ok('G. the before/after check file runs and covers the Türkiye-shaped tables (rows and definition for each)', ['public.users', 'public.patients', 'public.sessions', 'public.notes', 'public.ai_kullanim', 'public.randevular', 'auth.users', 'storage.objects', 'storage.buckets'].every((t) => `rows ${t}` in KONTROL_ONCE && `definition ${t}` in KONTROL_ONCE), Object.keys(KONTROL_ONCE).join(', '))
ok('A. Türkiye-shaped tables are seeded (2 accounts, 2 patients, 1 visit, 2 notes, 1 counter, 2 appointments, 1 stored file)', ONCE['public.users'].satirSayisi === 2 && ONCE['public.patients'].satirSayisi === 2 && ONCE['public.notes'].satirSayisi === 2 && ONCE['storage.objects'].satirSayisi === 1)

// ── B. the migrations, in order, each as it is written; then all of them a second time. 128 is NOT among them. ──
const DOSYALAR = ['129_davet_kodlari.sql', '130_hekim_dil_tercihleri.sql', '131_hasta_ulke_bilgisi.sql', '132_muayene_dil_kaydi.sql', '133_not_dil_kaydi.sql', '134_hekim_rolu.sql', '135_ulke_randevu.sql']
const dosyaOku = (d) => readFileSync(join(REPO, 'lib/db/migrations', d), 'utf8')
let IKINCI_ONCESI = null
for (const tur of ['first run', 'second run (must be repeatable)']) {
  if (tur !== 'first run') IKINCI_ONCESI = await hepsininIzi()
  for (const d of DOSYALAR) {
    try { await c.query(dosyaOku(d)); ok(`B. ${tur}: ${d}`, true) }
    catch (e) { await c.query('rollback').catch(() => {}); ok(`B. ${tur}: ${d}`, false, `sqlstate ${e.code} at position ${e.position ?? '?'}: ${e.message}`) }
  }
}
ok('B. schema_migrations has 129–135 once each, and no 128', (await c.query(`select string_agg(version, ',' order by version) v from schema_migrations`)).rows[0].v === '129,130,131,132,133,134,135')
ok('B. a failed statement leaves nothing of its file behind (each file is one transaction)', await (async () => {
  // The same file with a statement that cannot succeed appended before its commit: nothing of it may remain.
  const bozuk = dosyaOku('134_hekim_rolu.sql').replace(/commit;\s*$/, `create table public.kanit_yarim (x int);\nselect 1 / 0;\ncommit;`)
  try { await c.query(bozuk); return false } catch { await c.query('rollback').catch(() => {}) }
  return (await c.query(`select to_regclass('public.kanit_yarim') r`)).rows[0].r === null
})())

// ── A (continued). Türkiye after the migrations ──
const SONRA = await hepsininIzi()
{
  const f = farklar(ONCE, SONRA)
  // Exactly three differences are allowed, all named in the rollout document.
  ok('A. after 129–135: every Türkiye-shaped table has the same definition and the same rows; the only differences are the new bucket row and the new upload policy', JSON.stringify(f.sort()) === JSON.stringify(['storage.buckets.satirSayisi', 'storage.buckets.satirlar', 'storage.objects.politikalar'].sort()), f.join(', ') || 'no difference at all')
  for (const t of ['public.users', 'public.patients', 'public.sessions', 'public.notes', 'public.ai_kullanim', 'public.randevular', 'auth.users']) {
    ok(`A. ${t}: definition and ${ONCE[t].satirSayisi} row(s) identical before and after`, JSON.stringify(ONCE[t]) === JSON.stringify(SONRA[t]))
  }
  ok('A. storage.objects: rows identical; policies = the one Türkiye had + exactly one new one that names only the recordings bucket', ONCE['storage.objects'].satirlar === SONRA['storage.objects'].satirlar && (await c.query(`select string_agg(policyname, ',' order by policyname) p from pg_policies where schemaname = 'storage' and tablename = 'objects'`)).rows[0].p === 'muayene_sesleri_ulke_ve_kendi_klasorune_yukle,tr_belgeler_kendi_klasoru')
  ok('A. storage.buckets: Türkiye\'s bucket untouched, one new private bucket', (await c.query(`select string_agg(id || ':' || public::text, ',' order by id) b from storage.buckets`)).rows[0].b === 'hasta-belgeler:false,muayene-sesleri:false')
  ok('A. the second run changed nothing at all in Türkiye\'s tables (not even a policy)', farklar(IKINCI_ONCESI, SONRA).length === 0)
  ok('A. no new table, function or trigger hangs on a Türkiye table except one foreign key to auth.users', (await c.query(`select string_agg(conrelid::regclass::text || '→' || confrelid::regclass::text, ',' order by 1) k from pg_constraint where contype = 'f' and confrelid in ('auth.users'::regclass, 'public.users'::regclass, 'public.patients'::regclass, 'public.sessions'::regclass, 'public.notes'::regclass) and conrelid::regclass::text !~ '^(users|patients|sessions|notes|randevular)$'`)).rows[0].k === 'ulke_hesaplari→auth.users')
}
{
  const f = kontrolFarki(KONTROL_ONCE, await kontrol())
  ok('G. the check file, before vs after 129–135: exactly the three lines the rollout document names differ, and no line appeared or disappeared', JSON.stringify(f) === JSON.stringify(['definition storage.objects', 'rows public.schema_migrations', 'rows storage.buckets']), f.join(' | ') || 'no difference')
  ok('G. … row counts it reports are exact (2 accounts, 2 patients, 2 notes; ledger 0 → 7)', KONTROL_ONCE['rows public.users'] === '2' && KONTROL_ONCE['rows public.notes'] === '2' && KONTROL_ONCE['rows public.schema_migrations'] === '0' && (await kontrol())['rows public.schema_migrations'] === '7')
}
{
  // The individual post-check queries of the rollout document, as written there, with the answers it promises.
  const q = async (sql) => (await c.query(sql)).rows
  ok('G. post-check: ledger holds 129–135 and no 128', (await q(`select version from schema_migrations where version >= '128' order by 1`)).map((r) => r.version).join() === '129,130,131,132,133,134,135')
  ok('G. post-check: `users` has neither country nor ui_language', (await q(`select count(*)::int n from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name in ('country', 'ui_language')`))[0].n === 0)
  ok('G. post-check: the only foreign key from a country table to anything of Türkiye\'s is ulke_hesaplari → auth.users', JSON.stringify(await q(`select conrelid::regclass::text a, confrelid::regclass::text b from pg_constraint where contype = 'f' and conrelid::regclass::text in ('ulke_hesaplari','hekim_dil_tercihleri','ulke_hastalar','hasta_ulke_bilgisi','ulke_muayeneler','muayene_dil_kaydi','ulke_kullanim','ulke_notlar','not_dil_kaydi','hekim_rolu','hekim_calisma_duzeni','ulke_randevulari') and confrelid::regclass::text !~ '^(ulke_|hekim_)'`)) === JSON.stringify([{ a: 'ulke_hesaplari', b: 'auth.users' }]))
  ok('G. post-check: the approval function is closed to browser sessions and open to the server', JSON.stringify(await q(`select has_function_privilege('authenticated', 'public.ulke_not_onayla(text,uuid,uuid,timestamptz,text,text,text,text,jsonb)', 'execute') a, has_function_privilege('service_role', 'public.ulke_not_onayla(text,uuid,uuid,timestamptz,text,text,text,text,jsonb)', 'execute') b`)) === JSON.stringify([{ a: false, b: true }]))
  ok('G. pre-flight: the "no name is taken" query finds the thirteen tables once they exist (so it would have caught a clash)', (await q(`select relname from pg_class where relnamespace = 'public'::regnamespace and relname in ('davet_kodlari','ulke_hesaplari','hekim_dil_tercihleri','ulke_hastalar','hasta_ulke_bilgisi','ulke_muayeneler','muayene_dil_kaydi','ulke_kullanim','ulke_notlar','not_dil_kaydi','hekim_rolu','hekim_calisma_duzeni','ulke_randevulari')`)).length === 13)
}
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
await bekle('C. a malformed country code → refused 23514', `insert into ulke_hesaplari (id, ulke, ui_language) values ($1, 'UZB', 'ru')`, [TR1], '23514')
await bekle('C. a patient of country kz for an account of country uz → refused 23503', `insert into ulke_hastalar (ulke, doctor_id) values ('kz', $1)`, [D1], '23503')
await bekle('C. a patient for an account that is not a country account (a Türkiye account) → refused 23503', `insert into ulke_hastalar (ulke, doctor_id) values ('uz', $1)`, [TR1], '23503')
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
  ok('C. RLS: the same account id with no country on the session (a Türkiye-style session) reads nothing at all', Object.values(await sayilar()).every((n) => n === 0))
  await cik(); await oturum(TR1, null)
  ok('C. RLS: an account of Türkiye reads nothing in any country table', Object.values(await sayilar()).every((n) => n === 0))
  ok('C. … and still reads its own Türkiye rows exactly as before', (await c.query(`select count(*)::int n from public.patients`)).rows[0].n === 1 && (await c.query(`select count(*)::int n from public.notes`)).rows[0].n === 2)
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
  await yukle('an account of Türkiye (no country on the session) cannot upload into the recordings bucket at all', TR1, null, `uz/${TR1}/kayit-1.webm`, '42501')
  await yukle('… not even under a folder named after an empty country', TR1, null, `/${TR1}/kayit-1.webm`, '42501')
  await yukle('an account of Türkiye still uploads into Türkiye\'s own bucket exactly as before', TR1, null, `${TR1}/yeni-rapor.pdf`, 'allowed', 'hasta-belgeler')
  await yukle('a country account cannot upload into Türkiye\'s bucket under another account\'s folder (Türkiye\'s own rule, unchanged)', D1, 'uz', `${TR1}/x.pdf`, '42501', 'hasta-belgeler')
  await c.query(`delete from storage.objects where bucket_id = 'muayene-sesleri' or name like '%yeni-rapor.pdf'`)
}
await bekle('134: a role key with a capital letter → refused 23514', `insert into hekim_rolu (doctor_id, ulke, rol) values ($1, 'uz', 'Pediatri')`, [D2], '23514')
await bekle('133: second draft in the note\'s own language → refused 23514', `update not_dil_kaydi set ikinci_dil = not_dili where note_id = (select note_id from not_dil_kaydi limit 1)`, [], '23514')
ok('132: the private bucket exists once', (await c.query(`select count(*)::int n from storage.buckets where id = 'muayene-sesleri' and public = false`)).rows[0].n === 1)
ok('A. after all of the above (rows written for two countries): Türkiye\'s six tables and auth.users still have their own rows only', await (async () => {
  const simdi = await hepsininIzi()
  return ['public.users', 'public.patients', 'public.sessions', 'public.notes', 'public.ai_kullanim', 'public.randevular'].every((t) => JSON.stringify(simdi[t]) === JSON.stringify(ONCE[t])) && simdi['auth.users'].satirSayisi === ONCE['auth.users'].satirSayisi + 3
})())

// ── E. the rollback scripts ──
const GERI = [...DOSYALAR].reverse().map((d) => d.replace(/\.sql$/, '.geri-al.sql'))
const geriOku = (d) => readFileSync(join(REPO, 'lib/db/migrations/geri-al', d), 'utf8')
{
  // While a country's data exists, a rollback refuses and changes nothing.
  let reddedildi = 0
  for (const d of GERI.filter((x) => !x.startsWith('129'))) { try { await c.query(geriOku(d)) } catch (e) { await c.query('rollback').catch(() => {}); if (/rollback refused/.test(e.message)) reddedildi++ } }
  ok('E. with country data present, every rollback of 130–135 refuses', reddedildi === 6, `${reddedildi} of 6 refused`)
  ok('E. … and nothing was dropped', (await c.query(`select count(*)::int n from pg_tables where schemaname = 'public' and tablename in ('ulke_hesaplari','ulke_hastalar','ulke_muayeneler','ulke_notlar','ulke_randevulari','hekim_rolu','ulke_kullanim')`)).rows[0].n === 7 && (await c.query(`select count(*)::int n from schema_migrations`)).rows[0].n === 7)
  // Emptied by hand (here: by removing the three country accounts, which cascades through every country table).
  await c.query(`delete from auth.users where id in ($1, $2, $3)`, [D1, D2, K1])
  ok('E. removing a country account removes every row of it in every country table (cascade), and nothing of Türkiye', (await c.query(`select (select count(*) from ulke_hesaplari) + (select count(*) from ulke_hastalar) + (select count(*) from ulke_muayeneler) + (select count(*) from ulke_notlar) + (select count(*) from not_dil_kaydi) + (select count(*) from ulke_randevulari) + (select count(*) from hekim_rolu) + (select count(*) from ulke_kullanim) as n`)).rows[0].n === '0' && (await c.query(`select count(*)::int n from public.patients`)).rows[0].n === 2)
  for (const tur of ['first run', 'second run (must be repeatable)']) {
    for (const d of GERI) {
      try { await c.query(geriOku(d)); ok(`E. rollback, ${tur}: ${d}`, true) }
      catch (e) { await c.query('rollback').catch(() => {}); ok(`E. rollback, ${tur}: ${d}`, false, `sqlstate ${e.code}: ${e.message}`) }
    }
  }
  const geri = await hepsininIzi()
  const f = farklar(ONCE, geri)
  ok('E. after the rollbacks: Türkiye\'s tables are exactly as at the start; the only thing left is the (empty) recordings bucket, removed in the dashboard', JSON.stringify(f.sort()) === JSON.stringify(['storage.buckets.satirSayisi', 'storage.buckets.satirlar']), f.join(', ') || 'no difference')
  ok('G. the check file after the rollbacks: only the left-over bucket row differs from the very first run', JSON.stringify(kontrolFarki(KONTROL_ONCE, await kontrol())) === JSON.stringify(['rows storage.buckets']), kontrolFarki(KONTROL_ONCE, await kontrol()).join(' | '))
  ok('E. no country table, function or ledger row is left', (await c.query(`select count(*)::int n from pg_tables where schemaname = 'public' and (tablename like 'ulke\\_%' or tablename like 'hekim\\_%' or tablename in ('hasta_ulke_bilgisi','muayene_dil_kaydi','not_dil_kaydi','davet_kodlari'))`)).rows[0].n === 0 && (await c.query(`select count(*)::int n from pg_proc where proname in ('ulke_not_onayla','ulke_oturum_ulkesi','ulke_hesaplari_ulke_kilidi','davet_kodu_kullan','davet_kodu_iade')`)).rows[0].n === 0 && (await c.query(`select count(*)::int n from schema_migrations`)).rows[0].n === 0)
}

// ── F. migration 128, SUPERSEDED: not part of the rollout. Run here only to record what it would change. ──
{
  const once = await hepsininIzi()
  const ESKI_KOLONLAR = `select md5(string_agg(row(id, email, full_name, specialty, profession_type, onboarding_completed, subscription_tier, created_at, updated_at)::text, '|' order by id)) h from public.users`
  const eskiKolonlarOnce = (await c.query(ESKI_KOLONLAR)).rows[0].h
  for (const tur of ['first run', 'second run']) {
    try { await c.query(dosyaOku('128_hesap_ulke_dil.sql')); ok(`F. superseded 128, ${tur}: runs`, true) } catch (e) { await c.query('rollback').catch(() => {}); ok(`F. superseded 128, ${tur}: runs`, false, e.message) }
  }
  const sonra = await hepsininIzi()
  const f = farklar(once, sonra)
  ok('F. 128 would change `users` and only `users`: its columns, constraints and triggers (and so the text of each row)', f.length > 0 && f.every((x) => x.startsWith('public.users.')), f.join(', '))
  ok('G. the check file DOES notice a change to a table of Türkiye: after 128 it reports `definition public.users`', JSON.stringify(kontrolFarki(KONTROL_ONCE, await kontrol()).filter((k) => k.includes('public.users'))) === JSON.stringify(['definition public.users']))
  ok('F. 128 would add exactly two columns, with every existing row reading tr / tr', (await c.query(`select string_agg(distinct country || '/' || ui_language, ',') v, count(*)::int n from public.users`)).rows[0].v === 'tr/tr')
  ok('F. … and would leave every other column of every row as it was', (await c.query(ESKI_KOLONLAR)).rows[0].h === eskiKolonlarOnce)
  for (const tur of ['first run', 'second run']) {
    try { await c.query(geriOku('128_hesap_ulke_dil.geri-al.sql')); ok(`F. rollback of 128, ${tur}: runs`, true) } catch (e) { await c.query('rollback').catch(() => {}); ok(`F. rollback of 128, ${tur}: runs`, false, e.message) }
  }
  ok('F. after its rollback `users` is exactly as before 128', JSON.stringify((await hepsininIzi())['public.users']) === JSON.stringify(once['public.users']))
}

await c.end(); await epg.stop(); rmSync(VERI, { recursive: true, force: true })
console.log(hata ? `\n${hata} CHECK(S) FAILED` : `\nALL ${toplam} CHECKS PASSED`)
process.exit(hata ? 1 : 0)
