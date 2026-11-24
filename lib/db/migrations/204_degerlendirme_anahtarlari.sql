-- ESNEK-A-EVAL (2026-11-24): short-lived, single-purpose evaluation passes for founder-only admin routes
-- (app/api/kurucu/el-notu-degerlendir). Only the SHA-256 hash of a random token is stored; the plaintext never reaches
-- the database, the repo or a log. A pass lives at most 2 hours, serves one purpose, and is revoked (or deleted) when the
-- run ends. Service role only: RLS on, no policy, nothing granted to anon / authenticated.
create table if not exists public.degerlendirme_anahtarlari (
  id uuid primary key default gen_random_uuid(),
  anahtar_ozeti text not null unique check (anahtar_ozeti ~ '^[0-9a-f]{64}$'),
  amac text not null check (amac in ('el-notu-degerlendir')),
  olusturma timestamptz not null default now(),
  son_kullanma timestamptz not null,
  iptal boolean not null default false,
  not_ text,
  constraint degerlendirme_anahtarlari_en_cok_2_saat check (son_kullanma > olusturma and son_kullanma <= olusturma + interval '2 hours')
);

alter table public.degerlendirme_anahtarlari enable row level security;
revoke all on public.degerlendirme_anahtarlari from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('204', '204_degerlendirme_anahtarlari.sql', null, now(), false,
  'ESNEK-A-EVAL: degerlendirme_anahtarlari — hashed, ≤ 2 h, single-purpose evaluation passes for the founder El Notu evaluation route; RLS on, service role only')
on conflict (version) do nothing;
