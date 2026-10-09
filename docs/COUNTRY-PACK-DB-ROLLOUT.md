# Country packs: one database per country

Rewritten 2026-10-09 (NOTYA-ULKE-PORTAL-01) for Kaan's decision of the same day. Plain English; the SQL is in the files it names.

**The decision.** Kaan, 2026-10-09 02:26: *"We had issues with common databases before. Keep seperation between the two and any other future country versions"*. Every country has **a database of its own**: Uzbekistan now, and the United States, the United Kingdom, Canada, Australia and New Zealand when they come. It replaces the decision of 2026-10-08 19:09 (one database shared with Türkiye), on which the earlier version of this page was written.

**Two rules follow, and they do not bend:**

1. **No country script is ever run on the Turkish database.** Not a migration, not the baseline, not a check. The Turkish database is not part of any step on this page.
2. **No country script is run on another country's database.** Each country's database receives the same files, separately.

## The short version

1. A new country needs **one new, empty database** (its own project at the database provider). Creating it costs money and is the owner's decision each time.
2. **One file is run on it, once:** `lib/db/ulke/000_yeni_ulke_veritabani.sql`, the baseline. It creates everything a country build needs. It is one transaction, it holds no `drop` statement, and **it refuses to run on a database that is not empty**.
3. Migrations written after the baseline was generated are run on each country's database one by one, in order. The ledger in each database says which it holds.
4. **The country code stays on every row and in every key**, as before. With a database per country it is no longer what keeps countries apart; it is the **second wall**: if two countries' data ever met in one database by mistake, no row of one could be read, changed or pointed at from the other.
5. **The shared login pool is gone.** Each database has its own sign-in service, so an account of one country does not exist at another. See "Logins".
6. Uzbekistan's database exists and holds migrations 129 to 135 (`docs/COUNTRY-PACK-UZBEKISTAN.md`, "The Uzbek database").

## What a country database holds

Fourteen tables, five functions, one private storage bucket with one upload rule. Nothing else, and no table of the Turkish product.

| Table | Holds |
|---|---|
| `schema_migrations` | the ledger: one row per country migration applied to this database. Server only. |
| `davet_kodlari` | invitation codes, stored only as a hash |
| `ulke_hesaplari` | the account: its country, name, interface language, time zone |
| `hekim_dil_tercihleri`, `hekim_rolu`, `hekim_calisma_duzeni` | per-account choices: note language, role, working pattern |
| `ulke_hastalar`, `hasta_ulke_bilgisi` | patients, and what the country records beside a patient (second name, the patient's language, optional identity number) |
| `ulke_muayeneler`, `muayene_dil_kaydi` | visits and their transcripts; the consent and speech record of a visit |
| `ulke_notlar`, `not_dil_kaydi` | visit notes; the note's language, second-language draft and role fields |
| `ulke_randevulari` | appointments |
| `ulke_kullanim` | the daily counter behind the ceiling on visits |

Tables added by later migrations are listed in the migration files themselves and in `lib/db/ulke/gocler.json`.

**Not in a country database, on purpose:** the model gateway's usage log (`ai_token_kullanim`). The gateway is shared code and tries to write one row per model call; in a country database that table does not exist, the write fails quietly and the call goes on. So **model usage of a country build is not recorded anywhere today.** Closing that needs a country table and a small change to shared code that the Turkish build also runs; it is an open item (`docs/OPEN-COMMITMENTS.md`, NOTYA-ULKE-PORTAL-01).

## The two walls

**First wall: a database of its own.** A country build is pointed at its own database by its deployment's settings (database address, public key, secret server key) and has its own encryption key for patient data. It has no address and no key of any other country's database, so it cannot reach one.

**Second wall: the country on every row.** Four layers, unchanged from before, each of which alone would stop a leak inside one database:

1. **The country is on every row.** Every country table has a column `ulke` (two lower-case letters), required, with **no default**: a write that forgets the country fails.
2. **The country is part of every key.** A patient belongs to (country, doctor). A visit belongs to (country, doctor, patient). A note belongs to (country, doctor, visit). The database refuses a row of one country that points at a row of another, and a row that points at another doctor's patient, even when the id is valid. An account has exactly one country and can never change it.
3. **Every statement names the country.** Country code reaches the database through one door (`lib/ulke/uygulama/tablolar.ts`), which stamps the build's country on every row it inserts and adds "country = this build's country" to every read, update and delete. A test fails if country code talks to the database any other way.
4. **Row-level rules.** A signed-in browser session can read only rows that carry its own account id **and** the country stamped on its session, and can write nothing.

Patient isolation between doctors sits underneath both walls and is unchanged: every statement carries the doctor's id, and the keys carry it too.

**Recordings.** One private bucket per database, `muayene-sesleri`. A recording lies under `<country>/<account id>/<file>`; the upload rule checks both folders against the session, and the server checks both again as text. Recordings are removed as soon as they have been transcribed.

## Creating a new country's database

In this order. Steps 1 and 5 are the owner's; the rest can be done for him on his word.

1. **The owner creates the project**: a new, empty database of its own for the country, in a region the country's data law allows (checklist A1). It has a monthly cost; the owner sees the figure first. (The organisation's free plan holds two projects, and Türkiye and Uzbekistan use them: every further country needs a paid plan.)
2. **Check that it is the right database and that it is empty.** This must return no row:
   ```sql
   select relname from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r', 'p', 'v', 'm', 'f');
   ```
   If it returns anything, stop: this is not a new country database.
3. **Run the baseline, once:** the whole of `lib/db/ulke/000_yeni_ulke_veritabani.sql`, in one go. It checks step 2 by itself before it does anything, and refuses otherwise. It is applied completely or not at all.
4. **Check the result against the file.** With migrations 129 to 135 the answer is 14, 136, 17, 5, and the ledger lists 129 to 135:
   ```sql
   select (select count(*) from pg_tables where schemaname = 'public') as tables,
          (select count(*) from information_schema.columns where table_schema = 'public') as columns,
          (select count(*) from pg_policies where schemaname in ('public', 'storage')) as policies,
          (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
              and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')) as functions;
   select version, filename from schema_migrations order by 1;
   ```
   The figures for the current baseline are printed by the baseline proof (`scripts/ulke-temel-kaniti.mjs`). (`policies` counts the rules the database had before as well: on a new project, the storage schema has none.)
5. **Settings of the country's own project and deployment** (the owner, or on his word): public sign-up switched **off** in the project (accounts are created only by the country's own invitation route); the country's deployment given its country code, the database's address, its public key, its secret server key and **an encryption key of its own**; the deployment's build command set to `npm run build:ulke`.
6. **Run every migration written after the baseline was generated**, if the database was created from an older copy of the file. The ledger says what it holds; `lib/db/ulke/gocler.json` says what exists.
7. Record all of it, with the date, in the country's own document (`docs/COUNTRY-PACK-<CODE>.md`, checklist section M).

## The baseline

`lib/db/ulke/000_yeni_ulke_veritabani.sql` is **generated**, never written by hand:

```
node scripts/ulke-temel-uret.mjs              # writes it
node scripts/ulke-temel-uret.mjs --kontrol    # says whether it is up to date
```

It is put together from `lib/db/ulke/defter.sql` (the ledger) and the country migrations listed in `lib/db/ulke/gocler.json`, in order, each exactly as written, with three things taken out: the migration's own `begin` and `commit` (the baseline is one transaction), every `drop … if exists` statement (they exist only so that a migration can be run twice; on an empty database there is nothing to drop), and comment lines outside function bodies (the commented source is the migration file). A function's text is kept byte for byte.

What the file promises, and how each promise is held:

| Promise | Held by |
|---|---|
| It gives exactly the schema the migrations give | the proof below, on a real PostgreSQL |
| It is up to date with the migrations | a test (`lib/ulke/ulkeTemel.test.ts`): the file must equal what the generator gives |
| No migration can be left out | the same test: every migration that creates or alters a country table must be on the list |
| It holds no `drop` statement | the generator refuses to write one; the test and the proof check the file |
| It names nothing that exists only in the Turkish database | the test, over statements and comments |
| It cannot be run on a database that is in use, or twice | its first statement: it refuses a `public` schema that holds any table. Proven. |
| It is all or nothing | one transaction. Proven with a failure forced at its end. |

## Later migrations

A country migration is a file in `lib/db/migrations/` with the next free number, **added to `lib/db/ulke/gocler.json`**; then the baseline is regenerated. The tests fail until both are done.

Rules for writing one (a test checks each):

- one transaction, with a lock timeout of 4 seconds;
- **no `drop … if exists`**: the tool that applies SQL to a hosted database by hand refuses those. Write "create only if missing" instead;
- it **refuses a database that has no country tables**, as its first statement: run by mistake on a database that is not a country's, it stops and changes nothing;
- country on every row and in every key, row-level security on, no write from the browser;
- its own row in the ledger; a rollback file in `lib/db/migrations/geri-al/`;
- it names no table of the Turkish database.

Applying one: on **each** country's database, separately, in order, each file in one go. A file that fails leaves nothing behind; a file run twice changes nothing.

## The files today

| File | Creates |
|---|---|
| `128_hesap_ulke_dil.sql` | **Not a country migration. Superseded; never run.** It would add two columns to the Turkish account table. No country build needs it. The file is kept, with that written at its top, so the record stays. |
| `129_davet_kodlari.sql` | `davet_kodlari`; the functions `davet_kodu_kullan` and `davet_kodu_iade`, closed to browser sessions |
| `130_hekim_dil_tercihleri.sql` | the function `ulke_oturum_ulkesi`; `ulke_hesaplari` with the trigger that stops an account changing country; `hekim_dil_tercihleri` |
| `131_hasta_ulke_bilgisi.sql` | `ulke_hastalar`, `hasta_ulke_bilgisi` |
| `132_muayene_dil_kaydi.sql` | `ulke_muayeneler`, `muayene_dil_kaydi`, `ulke_kullanim`; the private bucket `muayene-sesleri` and its upload rule |
| `133_not_dil_kaydi.sql` | `ulke_notlar`, `not_dil_kaydi` |
| `134_hekim_rolu.sql` | `hekim_rolu`; two columns on `not_dil_kaydi` |
| `135_ulke_randevu.sql` | `hekim_calisma_duzeni`, `ulke_randevulari`, the rule against double booking (needs the extension `btree_gist`, which the file switches on), the function `ulke_not_onayla` |

Files 129 to 135 were written when the plan was a shared database, and their own comments still describe that plan; a line at the top of each says what holds now. **They are not run by hand any more**: a new country's database gets the baseline, and the only database that received them one by one, Uzbekistan's, already holds them.

## Rollback

One file per migration, in `lib/db/migrations/geri-al/`, named like the migration with `.geri-al.sql`. Run them in reverse order, on the country's own database only.

- Each is one transaction with the same lock timeout, and is safe to run twice.
- **Each refuses to run while a table it would drop still holds a row.** A rollback never destroys a country's data silently; export and empty the tables by hand first.
- Not undone by the scripts: the bucket `muayene-sesleri` (delete the empty bucket in the dashboard), the extension `btree_gist` (harmless; left in place), and the logins of the country's accounts (remove them in the sign-in service by hand if they must go).
- The rollback files hold `drop` statements by nature. Applying one to a hosted database is a deliberate act with the owner's word, never a routine step.

A whole country database that is no longer wanted is removed by deleting its project. That too is the owner's act.

## Logins

Each country's database has its own sign-in service. An account created by the Uzbek build exists in the Uzbek project only: the Turkish site does not know its e-mail address or password, and the reverse. **The shared-login-pool problem of the earlier plan does not arise**, and the hold that came with it ("no invitation code for any country until the Turkish site checks an account's country") no longer applies.

What remains true:

- **Public sign-up must be switched off in each country's project.** Otherwise somebody could create a login by calling the sign-in service directly. Such a login would still be refused by every screen and route of the country build (it has no country stamp, which only the server can write, and no account row), but it should not exist. A setting, not code.
- **The same person may hold an account in two countries** with the same e-mail address. They are two unrelated accounts.
- E-mails sent by a project's sign-in service (password reset, confirmation) use that project's own templates and site address. Country builds send none today.
- The country check on the Turkish site (pull request #565) is now optional hardening. Whether to ship it is the owner's call, later.
- A country build still refuses a session that is not stamped with its own country, and an account whose row belongs to another country. With separate databases neither can happen through normal use; the checks stay as part of the second wall.

## What was proven, and what was not

**Proven on a throwaway local PostgreSQL 18.4**, with nothing leaving the machine:

- `scripts/ulke-temel-kaniti.mjs` (the baseline proof). Three empty databases are built three ways: every migration as written (and again a second time); the way Uzbekistan's database was really built (129 to 135 with every `drop … if exists` line left out, as the tool applied them); and the baseline, once. **All three are identical** in tables, columns, constraints, indexes, row-level rules with their definitions, triggers, function bodies, who may execute each function, every role's privileges on every table, extensions, the storage bucket and its rule, and the ledger's rows. With 129 to 135 the baseline gives 14 tables, 136 columns, 17 rules and 5 functions: **the same four figures that were counted on the real Uzbek database on 2026-10-09.** The comparison is shown not to be blind (seven deliberate changes, each noticed). The baseline refuses a second run and a database that already holds a table, and leaves nothing behind in either case or after a failure. The ledger cannot be read or written by a browser role.
- `scripts/ulke-goc-kaniti.mjs` (the migration proof): the keys refuse a row of one country pointing at another country or at another doctor; an account cannot change country; row-level rules; the recordings bucket; invitation codes and note approval act only inside the country they are called for; no double booking, also for two requests at the same moment; note approval is all or nothing; the rollbacks refuse while data exists.

**Not proven locally:**

1. **The provider's own parts** are stand-ins in both proofs: its roles and default grants, the sign-in tables and functions, the storage tables, and whether the role that runs a file there may create a rule on `storage.objects` and the extension `btree_gist`. On the real Uzbek database migrations 129 to 135 did run, which answers this for those files as applied by hand; **the baseline file itself has not been run on any hosted database yet.** The first new country is its first real run: follow steps 2 to 4 above.
2. **The provider's API layer.** The application calls the functions and filters through it; the proofs call them in SQL.
3. **The application against a real database.** Every application test uses a stand-in database. The first real use of the Uzbek database by the Uzbek preview is still ahead (it waits on the secret server key).

How to run the proofs again (they need a package that is not a dependency of the repository, installed outside it):

```
mkdir /var/tmp/notya-pg-check && cd /var/tmp/notya-pg-check && npm init -y && npm install embedded-postgres pg
node <repo>/scripts/ulke-temel-kaniti.mjs      # exit code 0 = every check passed
node <repo>/scripts/ulke-goc-kaniti.mjs
```
