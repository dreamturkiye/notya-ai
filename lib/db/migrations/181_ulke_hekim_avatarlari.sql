-- 181 (Claude, 2026-10-24) — the doctor's own profile photo in a country build (Türkiye gold: Hesabım › profile photo).
-- Country databases only (never the Turkish one). Idempotent. One row per account; the picture is encrypted before it
-- is stored (lib/security/encryption.ts, the country deployment's own key) and is returned only to its own signed-in
-- account, as a data URL. No public URL. Server only: the browser has no grant on this table.
begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 181 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

create table if not exists public.ulke_hekim_avatarlari (
  doctor_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_length integer not null check (byte_length > 0 and byte_length <= 4194304),
  image_encrypted text not null check (char_length(image_encrypted) > 0),
  updated_at timestamptz not null default now(),
  constraint ulke_hekim_avatarlari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.ulke_hekim_avatarlari enable row level security;
revoke all on table public.ulke_hekim_avatarlari from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('181', '181_ulke_hekim_avatarlari.sql', null, now(), false,
  'Doctor profile photo in a country build: one encrypted row per account, server only.')
on conflict (version) do nothing;

commit;
