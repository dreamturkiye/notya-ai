# Country packs: database rollout on the shared database

Written 2026-10-08 for Kaan (NOTYA-ULKE-SABLON-01). Plain English; the SQL is in the files it names.

Kaan, 2026-10-08 19:09: *"use the same database as what we are using for notya turkiye"*. Every country (Uzbekistan first; the US, UK, Canada, Australia and New Zealand next) lives in the **same Supabase database as Türkiye**, not in a database of its own.

**Nothing in this document has been run on the live database, or on any remote database.** The scripts have run only on a throwaway PostgreSQL inside the build machine. Running them on the live Turkish beta database waits on Kaan's word (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-SABLON-01a).

## The short version

1. **No existing Turkish table is altered.** Not a column, a row, an index, a rule or a trigger of `users`, `patients`, `sessions`, `notes` or any other table of Türkiye changes. The migrations create **thirteen new tables, five functions and one storage bucket**, and nothing else.
2. **A country never writes into a Turkish table.** Its accounts, patients, visits, notes and appointments go into its own tables. Türkiye's screens, scheduled jobs and reports therefore never meet a foreign row. (One exception, a log: see "What Türkiye will notice afterwards".)
3. **Countries are kept apart from each other** by the database itself and by the code: every country table carries the country code, the country is part of every key, and every read and write names the build's country.
4. **Seven files to run, 129 to 135, in order.** Each is all-or-nothing and safe to run twice. Each has a rollback file.
5. **Migration 128 is superseded and must not be run.** It was the only one that changed a Turkish table (`users`), and nothing needs it any more.
6. **One thing is not solved by the database and needs your decision: the shared login pool** (last section). Until it is closed, **no invitation code should be issued for any country.**

## What changed in this job, and why

Before this job the Uzbek build stored its accounts in Türkiye's `users`, its patients in `patients`, its visits in `sessions` and its notes in `notes`, and added side tables next to them. That was sound while Uzbekistan was going to have its own database. In a shared database it is not: about 160 files of Türkiye's own code read those tables, including scheduled jobs that act on whole tables, and an Uzbek patient is encrypted with a different key, so Turkish code would have met rows it cannot read.

So the country application now has tables of its own for everything:

| Country table (new) | Holds | Replaces the use of |
|---|---|---|
| `ulke_hesaplari` | the account of a country build: its country, name, interface language, time zone | `users` |
| `ulke_hastalar` | patients | `patients` |
| `ulke_muayeneler` | visits and their transcripts | `sessions` |
| `ulke_notlar` | visit notes | `notes` |
| `ulke_kullanim` | the daily counter behind the ceiling on visits | `ai_kullanim` |
| `hekim_dil_tercihleri`, `hekim_rolu`, `hekim_calisma_duzeni` | per-account choices: note language, role, working pattern | (were already country tables) |
| `hasta_ulke_bilgisi`, `muayene_dil_kaydi`, `not_dil_kaydi` | what a country records beside a patient, a visit, a note | (were already country tables) |
| `ulke_randevulari` | appointments | (was already a country table) |
| `davet_kodlari` | invitation codes, one country each | (was already a country table) |

## How countries are kept apart inside one database

Four layers. Each one alone would stop a leak.

1. **The country is on every row.** Every country table has a column `ulke` (two lower-case letters), required, with **no default**: a write that forgets the country fails.
2. **The country is part of every key.** A patient belongs to (country, doctor). A visit belongs to (country, doctor, patient). A note belongs to (country, doctor, visit). The database refuses a row of one country that points at a row of another country, **and** a row that points at another doctor's patient, even when the id is valid. An account has exactly one country and can never change it.
3. **Every statement names the country.** Country code reaches the database through one door (`lib/ulke/uygulama/tablolar.ts`). The door stamps the build's country on every row it inserts and adds "country = this build's country" to every read, update and delete. A test fails if any country code talks to the database any other way, or names a Turkish table.
4. **Row-level rules.** A signed-in browser session can read only rows that carry its own account id **and** the country stamped on its session, and can write nothing. A Turkish account (no country stamp) reads nothing in any country table.

Patient isolation between doctors is unchanged in the code (every statement still carries the doctor's id) and is now also held by the keys.

**Recordings.** One private bucket for every country, `muayene-sesleri`. A recording lies under `<country>/<account id>/<file>`. The bucket's upload rule checks both folders against the session; the server checks both again as text before it touches storage. A Turkish account cannot upload there at all. Recordings are still removed as soon as they have been transcribed.

**Accounts.** An account is created only by the country's sign-up route, with a valid invitation code of that country, and is stamped with the country in a place the account cannot write. Every screen and every route of a country build refuses a session stamped with another country, an unstamped session, and an account whose row belongs to another country.

## The order

Run these seven files, in this order, each in one go, in the SQL editor of the database. Folder: `lib/db/migrations/`.

| # | File | Run? |
|---|---|---|
| — | `128_hesap_ulke_dil.sql` | **NO. Superseded. Do not run.** |
| 1 | `129_davet_kodlari.sql` | yes |
| 2 | `130_hekim_dil_tercihleri.sql` | yes |
| 3 | `131_hasta_ulke_bilgisi.sql` | yes |
| 4 | `132_muayene_dil_kaydi.sql` | yes |
| 5 | `133_not_dil_kaydi.sql` | yes |
| 6 | `134_hekim_rolu.sql` | yes |
| 7 | `135_ulke_randevu.sql` | yes |

The order matters: each file's tables hang from the tables of the files before it. A file that is run out of order fails and leaves nothing behind.

Every file is **one transaction**: it is applied completely or not at all. Every file sets a **lock timeout of 4 seconds**: if it would have to wait behind a long-running query, it gives up with an error and changes nothing, instead of queueing and making other requests queue behind it. If that happens, simply run the file again.

## File by file

"Touches a Turkish table" means: any statement that reads, writes, locks or hangs something on a table Türkiye already uses. Lock times are for a small database like the beta's.

### 128_hesap_ulke_dil.sql — SUPERSEDED, DO NOT RUN

- **What it would do:** add two columns (`country`, `ui_language`), two checks and a guard trigger to Türkiye's `users`.
- **Why it is out:** it is the only file that changes a Turkish table, and no country build reads or writes `users` any more. A test fails if one does.
- **Does the Turkish application need it for its own country check?** No. That check (pull request #565, not on `main`) reads the country stamped on the **session**: no stamp means a Turkish account, another country's stamp is refused. It needs nothing in the database. Two places on that branch also touch `users.country` (a second look at the row, and a best-effort stamp at first onboarding); both already tolerate the column being absent. The smallest version of the Turkish check is therefore **the session check alone, with no migration.** Whether those two extra places are removed, or this file is revived for them, is a separate, later decision (NOTYA-ULKE-SABLON-01c).
- The file is kept in the branch with "SUPERSEDED — DO NOT RUN" at its top, so the record stays. The local proof runs it once, apart from the others, only to put on record what it would change (`users` and nothing else) and that its rollback undoes it.

### 129_davet_kodlari.sql

- **Creates:** table `davet_kodlari` (invitation codes, stored only as a hash, one country each); functions `davet_kodu_kullan` and `davet_kodu_iade`, both bound to a country and closed to browser sessions.
- **Touches a Turkish table:** one row added to the migration ledger `schema_migrations`. A row-level lock for an instant; no table is rewritten or redefined.
- **Safe to run twice:** yes.

### 130_hekim_dil_tercihleri.sql

- **Creates:** function `ulke_oturum_ulkesi` (reads the country from the session; used by the row-level rules); table `ulke_hesaplari` with a trigger that stops an account from ever changing country; table `hekim_dil_tercihleri`.
- **Touches a Turkish table:**
  - `auth.users` (Supabase's login table, which Türkiye uses): `ulke_hesaplari.id` is a foreign key to it, so that deleting a login deletes the country account. **Change:** none to `auth.users` itself — no column, no row, no rule; the foreign key belongs to the new table. Internally PostgreSQL attaches its own bookkeeping to `auth.users` for the cascade. **Rewrite:** none. **Lock:** a "share row exclusive" lock on `auth.users` while the key is created: reads go on; logins and sign-ups that write to `auth.users` wait. **How long:** milliseconds (the new table is empty, there is nothing to check). Worst case 4 seconds, then the file gives up.
  - `schema_migrations`: one ledger row.
- **Safe to run twice:** yes.

### 131_hasta_ulke_bilgisi.sql

- **Creates:** tables `ulke_hastalar` and `hasta_ulke_bilgisi`, with their row-level rules.
- **Touches a Turkish table:** one ledger row. Nothing else.
- **Safe to run twice:** yes.

### 132_muayene_dil_kaydi.sql

- **Creates:** tables `ulke_muayeneler`, `muayene_dil_kaydi`, `ulke_kullanim`; the private bucket `muayene-sesleri`; its upload rule.
- **Touches a Turkish table:**
  - `storage.buckets` (Supabase's list of buckets): **one new row.** Türkiye's buckets are not changed. A row-level lock for an instant.
  - `storage.objects` (Supabase's list of stored files, which Türkiye uses): **one new upload rule (policy)** that names only the new bucket. **Change:** the table's definition gains one rule; no column, no row and no existing rule changes. The rule can only *allow* an upload into `muayene-sesleri`; it cannot widen or narrow access to any Turkish bucket. **Rewrite:** none. **Lock:** an "access exclusive" lock on `storage.objects` while the rule is added: for that instant, file uploads, downloads and listings wait. **How long:** milliseconds. Worst case 4 seconds, then the file gives up. **On a second run the rule already exists and no lock is taken at all.**
  - `schema_migrations`: one ledger row.
- **Safe to run twice:** yes.

### 133_not_dil_kaydi.sql

- **Creates:** tables `ulke_notlar` and `not_dil_kaydi`.
- **Touches a Turkish table:** one ledger row. Nothing else.
- **Safe to run twice:** yes.

### 134_hekim_rolu.sql

- **Creates:** table `hekim_rolu`; two columns on the country table `not_dil_kaydi` (created by 133).
- **Touches a Turkish table:** one ledger row. Nothing else.
- **Safe to run twice:** yes.

### 135_ulke_randevu.sql

- **Creates:** tables `hekim_calisma_duzeni` and `ulke_randevulari`; the rule that one doctor cannot be double-booked; the function `ulke_not_onayla`, which approves a note in one step and is closed to browser sessions.
- **Also:** switches on the PostgreSQL extension `btree_gist` if it is not on already (the double-booking rule needs it). It adds building blocks to the database; it does not change any existing table, index or query. If the database refuses to create it, the file fails and leaves nothing behind.
- **Touches a Turkish table:** one ledger row. Nothing else. The function reads and writes country tables only.
- **Safe to run twice:** yes.

## What was changed to make the files safe to run twice, and safer to run once

All eight files were already written to be repeatable (`if not exists`, `or replace`, `on conflict do nothing`). Changed in this job:

| File | Change |
|---|---|
| all eight | Wrapped in **one transaction**. Before, a failure half-way left the first half applied. Now a failed file leaves nothing, so "run it again" is always a clean first run. |
| all eight | **Lock timeout of 4 seconds**, so a file can never sit in a queue in front of live traffic. |
| 129 | The give-back function now takes the country. The old one-argument form is dropped first (it was never applied anywhere). |
| 132 | The upload rule on `storage.objects` was "drop it, then create it", which took the exclusive lock on that Turkish table on every run. Now it is created **only if missing**. |
| 135 | The approval function takes the country; the old form is dropped first. The grant to the server role is skipped where that role does not exist. |
| 130–135 | Reshaped for the shared database as described above: own tables, country on every row and in every key. |

## Rollback

One file per migration, in `lib/db/migrations/geri-al/`, named like the migration with `.geri-al.sql`. Run them in **reverse order** (135 first, 129 last).

- Each is one transaction with the same lock timeout, and is safe to run twice.
- **Each refuses to run while a table it would drop still holds a row.** A rollback never destroys a country's data silently; export and empty the tables by hand first.
- What they touch of Türkiye's: the rollback of 132 drops the one upload rule (the same instant-long exclusive lock on `storage.objects`; skipped if the rule is not there); the rollback of 130 drops `ulke_hesaplari` and with it the foreign key to `auth.users` (a short lock, no row touched). Each removes its own ledger row. Nothing else.
- **Not undone by the scripts:** the bucket `muayene-sesleri` (Supabase refuses direct deletes from its storage tables; delete the empty bucket in the dashboard), the extension `btree_gist` (harmless; left in place), and the logins of country accounts in Supabase Auth (remove them there by hand if they must go).

## Pre-flight checklist

Do not start until every line is ticked.

- [ ] **Kaan has said go**, for this database, on this day. Not before the beta onboarding is over.
- [ ] **Backup.** A fresh backup of the database exists and its time is written down. Know how to restore it (Supabase dashboard, Database, Backups) before you need to.
- [ ] **Quiet hour.** No beta doctor is in a visit. The Turkish scheduled jobs (`vercel.json` on `main`) run every ten minutes from 03:00 to 19:59 UTC, at half past every hour, and at 00:30, 03:00 and 07:00 UTC. The quietest window is **20:00 to 00:25 UTC (23:00 to 03:25 in Türkiye), away from the half hour.** A job that happens to run at the same moment is not harmed; at worst the lock timeout makes a file give up once, and it is run again.
- [ ] **Who watches.** One person runs the files; Kaan (or whoever he names) watches the Turkish site and can say stop. The Turkish site is opened in a browser before, during and after: login, the patient list, one patient file.
- [ ] **Scratch project first.** The same seven files have been run on an empty scratch Supabase project, followed by one booking, one double booking and one note approval through the application with synthetic data. The local proof stubs Supabase's own parts (below), so this step is not optional.
- [ ] **The database is what the files expect.** In the SQL editor: `select version();` (PostgreSQL 13 or newer); `select to_regclass('public.schema_migrations'), to_regproc('auth.jwt'), to_regproc('storage.foldername');` (none is empty); `select name from pg_available_extensions where name = 'btree_gist';` (one row).
- [ ] **No name is taken.** This returns no row: `select relname from pg_class where relnamespace = 'public'::regnamespace and relname in ('davet_kodlari','ulke_hesaplari','hekim_dil_tercihleri','ulke_hastalar','hasta_ulke_bilgisi','ulke_muayeneler','muayene_dil_kaydi','ulke_kullanim','ulke_notlar','not_dil_kaydi','hekim_rolu','hekim_calisma_duzeni','ulke_randevulari');`
- [ ] **The "before" picture is saved.** Run `scripts/ulke-goc-kontrol.sql` (one read-only query) and save its whole result.
- [ ] **128 is not in the list** of files about to be run.
- [ ] The shared login pool decision below has been read.

## Post-check: proof that Türkiye is unchanged

1. Run `scripts/ulke-goc-kontrol.sql` again and compare with the saved "before" result, line by line. For every table that existed before, it gives the **exact row count** and a **fingerprint of its definition** (columns, constraints, indexes, rules, triggers). **Every line must be identical except these three:**

   | Line | Expected difference |
   |---|---|
   | `definition storage.objects` | changed: one more upload rule |
   | `rows storage.buckets` | one more: the recordings bucket |
   | `rows public.schema_migrations` | seven more: 129 to 135 |

   Any other line that differs means something of Türkiye's changed: stop, and do not continue until it is understood. (If a doctor worked between the two runs, row counts of the tables they touched differ too. That is why the quiet hour.)

2. Individual queries, each with its expected answer:

   | Query | Expected |
   |---|---|
   | `select version from schema_migrations where version >= '128' order by 1;` | 129, 130, 131, 132, 133, 134, 135. No 128. |
   | `select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name in ('country', 'ui_language');` | 0 |
   | `select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' order by 1;` | the same list as before, plus `muayene_sesleri_ulke_ve_kendi_klasorune_yukle` |
   | `select id, public from storage.buckets order by 1;` | the same list as before, plus `muayene-sesleri`, `false` |
   | `select conrelid::regclass, confrelid::regclass from pg_constraint where contype = 'f' and conrelid::regclass::text in ('ulke_hesaplari','hekim_dil_tercihleri','ulke_hastalar','hasta_ulke_bilgisi','ulke_muayeneler','muayene_dil_kaydi','ulke_kullanim','ulke_notlar','not_dil_kaydi','hekim_rolu','hekim_calisma_duzeni','ulke_randevulari') and confrelid::regclass::text !~ '^(ulke_|hekim_)';` | one row: `ulke_hesaplari`, `auth.users`. No country table points at any other Turkish table. |
   | `select count(*) from ulke_hesaplari;` and the same for the other twelve new tables | 0 each |
   | `select has_function_privilege('authenticated', 'public.ulke_not_onayla(text,uuid,uuid,timestamptz,text,text,text,text,jsonb)', 'execute'), has_function_privilege('service_role', 'public.ulke_not_onayla(text,uuid,uuid,timestamptz,text,text,text,text,jsonb)', 'execute');` | `false`, `true` |

3. The Turkish site, by hand: log in as a beta doctor, open the patient list, open one patient file, open one note, upload one document. All as before.

## What Türkiye will notice afterwards

Honest list of every lasting effect on the Turkish side. None changes a Turkish screen or answer.

- **Thirteen new empty tables** exist in the database. No Turkish code knows them.
- **Deleting a login** in Supabase Auth now also looks into `ulke_hesaplari` for a row to delete (one indexed look-up; there is none for a Turkish account).
- **Uploading a file** as a signed-in user evaluates one more upload rule, which never matches a Turkish upload.
- **Once a country is in use** (not at migration time): the shared model gateway writes one row per model call into Türkiye's usage log `ai_token_kullanim` (task, model, token counts, the account's id; no patient data). This is the one Turkish table a country build writes to, through shared code it does not own. Turkish cost reports will include those rows. Separating them needs a small change to shared code that Türkiye runs (NOTYA-ULKE-SABLON-01e).
- **Logins are shared.** See the next section.

## The shared login pool (needs Kaan's decision)

With one database there is **one Supabase Auth**: every country's accounts and Türkiye's accounts are in the same pool, and a session token from one is technically valid at the other.

**The country builds check the country.** The live Turkish application (`main`) does not. Read on `main` today (read only): `app/giris/doktor/page.tsx`, `app/api/users/me/route.ts`, `app/api/users/profile/route.ts`, `app/kayit/page.tsx`, `lib/doktor/serverAuth.ts`.

**An account created by the Uzbek build signs in at the Turkish site** (`notya.io/giris/doktor`):

1. The password is accepted, because it is the same pool.
2. The Turkish login asks `/api/users/me` for the profile. The account has no row in `users`, so the answer is "onboarding not completed".
3. The doctor is sent to the **Turkish onboarding** (`/onboarding?p=doktor`). If they complete it, `/api/users/profile` creates a `users` row for them: **they become a Turkish account as well**, with the same login. From then on they can use the Turkish product like anyone who signed up at `/kayit`.
4. Even without onboarding, their session is accepted by every Turkish `/api/doktor/*` route, because `doktorOturum` on `main` checks only that the token is valid.

What this does **not** do: it shows them no Turkish patient and no data of any other doctor (Turkish routes are scoped by the doctor's id), and it mixes no data, because the Uzbek data is in country tables the Turkish application never reads. It gives them nothing they could not get by signing up at the public Turkish sign-up page. What it **does** do: an invited foreign doctor can open a Turkish trial without being asked, sees a Turkish product, and one login then exists in two products.

**A Turkish account signs in at the Uzbek site** (`/uzbek/login`): refused. The form signs the session out again and shows the sentence a wrong password gets; every Uzbek route answers "no session". A Turkish account has no country stamp and no row in `ulke_hesaplari`.

**Also true in a shared pool:**

- **One e-mail address, one account.** A doctor who has a Turkish account cannot be invited to a country with the same address, and the reverse. Each side answers that it could not create the account.
- **Public sign-up stays on** in the shared project, because the Turkish `/kayit` page uses it. That does not open a country: an account made that way has no country stamp (only the server can write one) and every country build refuses it.
- **E-mails sent by Supabase Auth** (password reset, confirmation) use one set of templates and one site address for the whole project: Turkish, pointing at notya.io. Country builds send no such e-mail today (the invitation is the confirmation, and there is no password reset yet).
- **Sign-in limits** of Supabase Auth are counted for the whole project.

**Ways to close the gap:**

| # | Way | Needs a change to the Turkish application? | Closes it? |
|---|---|---|---|
| 1 | Leave it; keep countries invitation-only; watch with a query for a country account that gained a `users` row | No | No. Limits who can do it to invited doctors. |
| 2 | A database trigger on Türkiye's `users` that refuses a new row for a login stamped with another country | No code change, **but it changes a Turkish table**, and it would sit on the Turkish sign-up path | Partly. Stops the onboarding step; Turkish routes still accept the session. |
| 3 | A Supabase Auth hook | No code change, but **a project setting** | No. A hook cannot tell which site a password login came from. |
| 4 | **The country check already written in pull request #565**: the Turkish login pages, `/api/users/me`, `/api/users/profile` and the two session helpers refuse a session stamped with another country, with the sentence a wrong password gets | **Yes**: it is a change to the Turkish application (about ten small edits, already written and tested on that branch; no migration) | **Yes, completely.** |
| 5 | A separate Supabase project for the countries' logins | No | It would, but it contradicts "the same database" and needs new plumbing. Not recommended. |

**Recommendation: way 4, after tomorrow's beta onboarding, as its own small release.** It is the only one that closes the gap, it is already written, and it needs no database change. It cannot be done now, because it changes the Turkish application.

**Until it is live on the Turkish site: no invitation code is issued for any country.** With no code there is no country account, and the gap cannot be used. This waits on Kaan (NOTYA-ULKE-SABLON-01b).

A query to watch with, once country accounts exist (it should always return no row):

```sql
select u.id from public.users u join public.ulke_hesaplari h on h.id = u.id;
```

## What was proven, and what was not

**Proven on a throwaway local PostgreSQL 18.4** (`scripts/ulke-goc-kaniti.mjs`, 152 checks, all passed on 2026-10-08):

- Tables **shaped like** Türkiye's (`users`, `patients`, `sessions`, `notes`, `ai_kullanim`, `randevular`, `auth.users`, the storage tables) were created and seeded first. After files 129–135, run twice, **every one of them had the same definition and the same rows**; the only differences were the three expected lines. The second run changed nothing at all.
- The before/after check file reports exactly those three lines, and it does report a change when a Turkish table really changes (it catches 128).
- A file that fails half-way leaves nothing behind.
- The keys refuse a row of one country pointing at another country, or at another doctor. An account cannot change country or exist in two. Row-level rules: the same account id with another country's session reads nothing; a Turkish account reads nothing in country tables and still reads its own Turkish rows. The bucket accepts an upload only under the session's own country and account; a Turkish account cannot upload there and still uploads to its own bucket.
- Invitation codes and note approval act only inside the country they are called for.
- No double booking, also for two requests at the same moment; note approval is all-or-nothing.
- The rollbacks refuse while data exists, run twice, and leave the Turkish-shaped tables exactly as at the start.

**Not proven, so the scratch project and the first live run must watch for it:**

1. **The real Turkish tables.** The local ones are stand-ins with a few columns. The claim "no Turkish table is altered" rests on what the files contain (a test reads them and fails if one names a Turkish table), not on having run them against the real schema.
2. **Supabase's own parts** were stand-ins: its roles and default grants, `auth.users`, `auth.jwt()`, the storage tables and `storage.foldername`, and whether the SQL editor's role may create a rule on `storage.objects` and the extension `btree_gist`.
3. **PostgREST.** The application calls the functions and filters through Supabase's API; the proof called them in SQL.
4. **Lock waits under live traffic.** The times above are what PostgreSQL does on a small table; nothing was measured against the live database.
5. **The live database's PostgreSQL version.** The proof ran on 18.4. The files use nothing newer than PostgreSQL 13.
6. **The application against a real database.** Every application test uses a stand-in database.

How to run the proof again (it needs a package that is not a dependency of the repository, installed outside it):

```
mkdir /var/tmp/notya-pg-check && cd /var/tmp/notya-pg-check && npm init -y && npm install embedded-postgres pg
node <repo>/scripts/ulke-goc-kaniti.mjs        # exit code 0 = every check passed
```
