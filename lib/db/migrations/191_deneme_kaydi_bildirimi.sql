-- 191 — DENEME-BILDIRIM-01 (Kaan, 2026-11-07): the internal "new trial signup" e-mail to kaan@notya.io is sent exactly once
-- per account. Türkiye database only (the country databases get 192 on their own users table, ulke_hesaplari).
--   users.deneme_bildirim_at   set once, atomically, by the first request that records the account's specialty
--                              (update … where deneme_bildirim_at is null; only the call that flips it sends).
-- Backfill: every EXISTING doctor account is stamped with its own created_at, so no old account is announced as "new"
-- when it next saves its profile, and the "total doctor signups" count starts from the real number. Not stamped (never
-- counted, never notified by the code either): accountant/lawyer accounts, invited staff, Kaan's test account.
-- No patient data. No RLS change: the column is on the doctor's own row; browser roles keep their existing row rules.
begin;
set local lock_timeout = '4s';

alter table public.users add column if not exists deneme_bildirim_at timestamptz;

update public.users u
   set deneme_bildirim_at = coalesce(u.created_at, now())
 where u.deneme_bildirim_at is null
   and coalesce(u.profession_type, '') not in ('mali', 'mali_musavirlik', 'avukat')
   and lower(coalesce(u.email, '')) <> 'kaanari@mac.com'
   and not exists (select 1 from public.personel p where p.user_id = u.id);

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('191', '191_deneme_kaydi_bildirimi.sql', null, now(), false,
  'DENEME-BILDIRIM-01: users.deneme_bildirim_at (once-only trial signup e-mail); existing doctor accounts backfilled with created_at')
on conflict (version) do nothing;

commit;

-- Rollback (manual, never automatic):
--   alter table public.users drop column if exists deneme_bildirim_at;
