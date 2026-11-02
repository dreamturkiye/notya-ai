-- 186 (Claude, 2026-11-02) — the founder exemption (Kaan, 2026-11-02: "Be nice and give the founder an exemption would you. :-)").
-- Country databases only (never the Turkish one). Idempotent. One boolean on the country account: true = the account is
-- exempt from the in-app free trial's limits (trial end / read-only, the visit cap) and from both live-voice minute caps,
-- and is never shown an upgrade prompt (lib/billing/deneme.ts, lib/ulke/uygulama/deneme.ts, sesDakikaSiniri.ts). It is
-- set by hand, by the operator, for named accounts only: the browser roles hold no write privilege on ulke_hesaplari, so
-- a doctor cannot set it on their own account. Default false: every other account is unchanged.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 186 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

alter table public.ulke_hesaplari add column if not exists ozel_muafiyet boolean not null default false;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('186', '186_ulke_hesap_muafiyeti.sql', null, now(), false,
  'Founder exemption flag on the country account: no trial limits, no voice caps, no upgrade prompts. Set by the operator only.')
on conflict (version) do nothing;

commit;
