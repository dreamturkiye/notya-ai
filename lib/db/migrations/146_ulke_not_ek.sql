-- 146 NOTYA-ULKE — an ADDENDUM on an approved visit note of a country build.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one and never
-- on another country's database. A new country's database gets it through the baseline
-- (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database that already exists gets this file, once, after 145.
-- docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
-- THE APPROVED NOTE IS NOT CHANGED. `ek_metin` is a separate column on the same row of ulke_notlar. The four SOAP
-- columns and approved_at stay as they are. The application writes this column only when approved_at is set, and
-- reads it in a second query so a database that has not taken this file still opens every note.
--
-- Plain text, like the note itself (the note's sections are not encrypted). At most 4000 characters.
-- It alters no other table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 146 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
  if to_regclass('public.ulke_notlar') is null then
    raise exception 'country migration 146 refused: the note table of a country database (public.ulke_notlar) is missing. Run the earlier country migrations first.';
  end if;
end $$;

alter table public.ulke_notlar
  add column if not exists ek_metin text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_notlar_ek_metin_uzunluk') then
    alter table public.ulke_notlar
      add constraint ulke_notlar_ek_metin_uzunluk check (ek_metin is null or char_length(ek_metin) <= 4000);
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('146', '146_ulke_not_ek.sql', null, now(), false,
  'NOTYA-ULKE: addendum text on ulke_notlar (ek_metin, at most 4000 characters). The approved note is not overwritten. No other table is altered.')
on conflict (version) do nothing;

commit;
