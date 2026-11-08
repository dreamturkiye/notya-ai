-- 192 (Claude, 2026-11-07) — DENEME-BILDIRIM-01 (Kaan, 2026-11-07): the internal "New trial signup" e-mail to kaan@notya.io
-- is sent exactly once per account. Country databases only (never the Turkish one, which has 191 on its users table).
--   ulke_hesaplari.deneme_bildirim_at   set once, atomically, by the first request that records the account's role
--                                       (update … where deneme_bildirim_at is null; only the call that flips it sends).
-- Backfill: every EXISTING account is stamped with its own created_at, so no old account is announced as "new" when it
-- next changes its role, and the "total doctor signups" count starts from the real number. Not stamped (never counted,
-- never notified): Kaan's test account and clinic front-desk members. Idempotent. No patient data. Browser roles hold no
-- write privilege on ulke_hesaplari, so a doctor cannot set it.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 192 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

alter table public.ulke_hesaplari add column if not exists deneme_bildirim_at timestamptz;

do $$
begin
  update public.ulke_hesaplari h
     set deneme_bildirim_at = coalesce(h.created_at, now())
   where h.deneme_bildirim_at is null
     and not exists (select 1 from auth.users a where a.id = h.id and lower(coalesce(a.email, '')) = 'kaanari@mac.com');
  if to_regclass('public.ulke_klinik_uyeleri') is not null then
    update public.ulke_hesaplari h
       set deneme_bildirim_at = null
     where exists (select 1 from public.ulke_klinik_uyeleri u where u.doctor_id = h.id and u.konum = 'on-buro')
       and not exists (select 1 from public.hekim_rolu r where r.doctor_id = h.id);
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('192', '192_ulke_deneme_bildirimi.sql', null, now(), false,
  'DENEME-BILDIRIM-01: ulke_hesaplari.deneme_bildirim_at (once-only trial signup e-mail); existing accounts backfilled with created_at')
on conflict (version) do nothing;

commit;
