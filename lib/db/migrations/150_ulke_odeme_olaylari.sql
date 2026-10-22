-- 150 — AU-BETA-02: payment webhook event ledger (idempotency / replay tolerance).
-- Country database only. Initial compliance draft – external legal review later.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 150 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

-- One row per provider event already processed for one doctor's connection. A second delivery of the same event hits the
-- unique key and is acknowledged without being processed again.
create table if not exists public.ulke_odeme_olaylari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  saglayici text not null check (saglayici in ('stripe', 'tyro')),
  olay_id text not null check (char_length(olay_id) between 1 and 300),
  tur text not null check (char_length(tur) between 1 and 120),
  alindi_at timestamptz not null default now(),
  constraint ulke_odeme_olaylari_tekil unique (ulke, doctor_id, saglayici, olay_id),
  constraint ulke_odeme_olaylari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);
create index if not exists ulke_odeme_olaylari_zaman_idx on public.ulke_odeme_olaylari (ulke, doctor_id, alindi_at desc);
alter table public.ulke_odeme_olaylari enable row level security;
revoke all on table public.ulke_odeme_olaylari from anon, authenticated;

-- 149 first shipped ulke_odeme_baglantilari without its account foreign key (and 150 may meet a database that created ulke_odeme_olaylari without it): add what is missing, once.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_odeme_baglantilari_hesap_fk') then
    alter table public.ulke_odeme_baglantilari add constraint ulke_odeme_baglantilari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ulke_odeme_olaylari_hesap_fk') then
    alter table public.ulke_odeme_olaylari add constraint ulke_odeme_olaylari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('150', '150_ulke_odeme_olaylari.sql', null, now(), false,
  'AU-BETA-02: payment webhook event ledger and the account foreign keys. Server only.')
on conflict (version) do nothing;

commit;
