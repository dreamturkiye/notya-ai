-- 182 (Claude, 2026-10-24) — the doctor's own address book of colleagues to consult (Türkiye gold: Araçlar › Konsültasyonlar › Defter).
-- Country databases only (never the Turkish one). Idempotent. One row per colleague; name, phones, email, address and note are
-- encrypted together (lib/security/encryption.ts, the country deployment's own key); only the speciality label and the
-- in-house flag are plain. Read and written only by its own signed-in doctor, through the server: the browser has no grant.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 182 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

create table if not exists public.ulke_konsultan_defteri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  brans text not null default '' check (char_length(brans) <= 80),
  kurum_ici boolean not null default false,
  veri_encrypted text not null check (char_length(veri_encrypted) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_konsultan_defteri_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

create index if not exists ulke_konsultan_defteri_doktor_idx on public.ulke_konsultan_defteri (ulke, doctor_id);

alter table public.ulke_konsultan_defteri enable row level security;
revoke all on table public.ulke_konsultan_defteri from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('182', '182_ulke_konsultan_defteri.sql', null, now(), false,
  'Colleague address book for consultations: encrypted rows per doctor, server only.')
on conflict (version) do nothing;

commit;
