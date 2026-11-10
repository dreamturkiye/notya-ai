-- 194 (Claude, 2026-11-10) — ZIYARET-SAYACI-01 (Kaan, 2026-11-10): daily visitor numbers of the PUBLIC site for the founder
-- console (/kurucu). Our own cookie-free counter; no third-party service, no consent banner.
--
-- The SAME file on main and on every release branch, run on EVERY database: Türkiye and each country database. It is
-- site infrastructure, not doctor or patient data: no doctor id, no patient id, nothing a signed-in user wrote. That is
-- why it is not one of the country-data migrations in lib/db/ulke/gocler.json (those carry a doctor key and the
-- country's row rules); a new country database runs this file once after its baseline (docs/OPEN-COMMITMENTS.md
-- ZIYARET-SAYACI-01).
--
--   site_visits_daily    the only thing kept: per UTC day, page path, referrer HOST and device class (mobile/desktop),
--                        a page-view count and a unique-visitor count. Aggregates only.
--   site_visit_uniques   day + SHA-256(daily salt + IP + user agent + host) — only so the same visitor is counted once
--                        that day. Purged after two days. The raw IP and the user-agent string are never stored here
--                        or anywhere else (the hash is computed in the API route, lib/ziyaret/ziyaret.ts).
--   site_visit_salts     one random salt per UTC day. Deleted once the day is over (by site_visit_salt, called on the
--                        first counted visit of the next day), so hashes of two days can never be linked.
--
-- Writes: one round trip per page view (site_visit_record: one insert on the uniqueness key + one upsert on the
-- aggregate key, both primary-key lookups). Reads: site_visit_stats aggregates in SQL — the console never receives rows.
-- Row-level security is on and no browser role holds any privilege or rule: only the service role (the API route and
-- the founder stats endpoints) can reach the tables, and only it can execute the functions.
begin;
set local lock_timeout = '4s';

create table if not exists public.site_visits_daily (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  day date not null,
  path text not null check (char_length(path) between 1 and 120),
  referrer_host text not null default '' check (char_length(referrer_host) <= 100),
  device text not null default '' check (device in ('', 'mobile', 'desktop')),
  views integer not null default 0 check (views >= 0),
  unique_visitors integer not null default 0 check (unique_visitors >= 0),
  primary key (ulke, day, path, referrer_host, device)
);

create table if not exists public.site_visit_uniques (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  day date not null,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  primary key (ulke, day, visitor_hash)
);

create table if not exists public.site_visit_salts (
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  day date not null,
  salt text not null check (salt ~ '^[0-9a-f]{64}$'),
  primary key (ulke, day)
);

alter table public.site_visits_daily enable row level security;
alter table public.site_visit_uniques enable row level security;
alter table public.site_visit_salts enable row level security;
revoke all on table public.site_visits_daily from anon, authenticated;
revoke all on table public.site_visit_uniques from anon, authenticated;
revoke all on table public.site_visit_salts from anon, authenticated;

-- Today's salt (created on first use). Also the purge: salts of earlier days and uniqueness rows older than yesterday.
create or replace function public.site_visit_salt(p_ulke text, p_day date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salt text;
begin
  if p_ulke !~ '^[a-z]{2}$' or p_day is null then
    raise exception 'site_visit_salt: bad arguments';
  end if;
  delete from public.site_visit_salts where day < p_day;
  delete from public.site_visit_uniques where day < p_day - 1;
  insert into public.site_visit_salts (ulke, day, salt)
  values (p_ulke, p_day, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (ulke, day) do nothing;
  select s.salt into v_salt from public.site_visit_salts s where s.ulke = p_ulke and s.day = p_day;
  return v_salt;
end $$;

-- One page view: the visitor is unique for the day only if its hash was not yet seen; the aggregate row is upserted.
create or replace function public.site_visit_record(p_ulke text, p_day date, p_hash text, p_path text, p_referrer_host text, p_device text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yeni integer := 0;
begin
  if p_day is null or p_day < current_date - 1 or p_day > current_date + 1 then
    return;
  end if;
  insert into public.site_visit_uniques (ulke, day, visitor_hash)
  values (p_ulke, p_day, p_hash)
  on conflict (ulke, day, visitor_hash) do nothing;
  get diagnostics v_yeni = row_count;
  insert into public.site_visits_daily as d (ulke, day, path, referrer_host, device, views, unique_visitors)
  values (p_ulke, p_day, p_path, coalesce(p_referrer_host, ''), coalesce(p_device, ''), 1, v_yeni)
  on conflict (ulke, day, path, referrer_host, device)
  do update set views = d.views + 1, unique_visitors = d.unique_visitors + excluded.unique_visitors;
end $$;

-- Everything the console shows, aggregated here: every day since the first counted day (missing days as zero), ISO-week
-- roll-ups, and for the last 30 days the top pages, top referrer hosts and the device split.
create or replace function public.site_visit_stats(p_ulke text, p_today date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ilk as (
    select min(day) as gun from public.site_visits_daily where ulke = p_ulke
  ), gunler as (
    select g::date as d
      from ilk, generate_series(ilk.gun, p_today, interval '1 day') g
     where ilk.gun is not null and ilk.gun <= p_today
  ), toplam as (
    select day, sum(unique_visitors)::int as v, sum(views)::int as p
      from public.site_visits_daily where ulke = p_ulke group by day
  ), gunluk as (
    select gunler.d, coalesce(toplam.v, 0) as v, coalesce(toplam.p, 0) as p
      from gunler left join toplam on toplam.day = gunler.d
  ), hafta as (
    select date_trunc('week', d)::date as bas, to_char(d, 'IYYY-"W"IW') as w, sum(v)::int as v, sum(p)::int as p
      from gunluk group by 1, 2
  ), son30 as (
    select * from public.site_visits_daily where ulke = p_ulke and day > p_today - 30 and day <= p_today
  )
  select jsonb_build_object(
    'ilkGun', (select gun from ilk),
    'bugun', p_today,
    'gunluk', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'v', v, 'p', p) order by d) from gunluk), '[]'::jsonb),
    'haftalik', coalesce((select jsonb_agg(jsonb_build_object('w', w, 'bas', bas, 'v', v, 'p', p) order by bas) from hafta), '[]'::jsonb),
    'sayfalar', coalesce((select jsonb_agg(x.j order by x.p desc, x.ad) from (
        select path as ad, sum(views)::int as p, jsonb_build_object('ad', path, 'v', sum(unique_visitors)::int, 'p', sum(views)::int) as j
          from son30 group by path order by sum(views) desc, path limit 10) x), '[]'::jsonb),
    'kaynaklar', coalesce((select jsonb_agg(x.j order by x.v desc, x.ad) from (
        select referrer_host as ad, sum(unique_visitors)::int as v, jsonb_build_object('ad', referrer_host, 'v', sum(unique_visitors)::int, 'p', sum(views)::int) as j
          from son30 where referrer_host not in ('', '(internal)') group by referrer_host order by sum(unique_visitors) desc, referrer_host limit 10) x), '[]'::jsonb),
    'cihazlar', coalesce((select jsonb_agg(jsonb_build_object('ad', ad, 'v', v, 'p', p) order by ad) from (
        select device as ad, sum(unique_visitors)::int as v, sum(views)::int as p from son30 group by device) c), '[]'::jsonb)
  )
$$;

revoke all on function public.site_visit_salt(text, date) from public, anon, authenticated;
revoke all on function public.site_visit_record(text, date, text, text, text, text) from public, anon, authenticated;
revoke all on function public.site_visit_stats(text, date) from public, anon, authenticated;
grant execute on function public.site_visit_salt(text, date) to service_role;
grant execute on function public.site_visit_record(text, date, text, text, text, text) to service_role;
grant execute on function public.site_visit_stats(text, date) to service_role;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('194', '194_site_ziyaret_sayaci.sql', null, now(), false,
  'ZIYARET-SAYACI-01: cookie-free public-site visit counter (daily aggregates, 2-day uniqueness hashes, daily salt)')
on conflict (version) do nothing;

commit;
