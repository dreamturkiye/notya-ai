-- 111 — NOTYA-RANDEVU-V2 PR1 (2026-10-04): hasta portalından randevu, onay akışı, hatırlatma işleri.
-- Architecture: docs/RANDEVU-V2.md. Everything here is ADDITIVE:
--   • new tables only (settings, exceptions, event log, reminder jobs);
--   • new nullable columns on randevular (NULL on every existing row);
--   • randevular.durum CHECK widened with ONE new value ('talep') — a strict superset, added NOT VALID so
--     existing rows are never re-checked and this file can never fail on them;
--   • the double-booking guarantee is scoped to rows written by the new flow (kaynak IS NOT NULL): every
--     existing row has kaynak NULL, so neither the exclusion constraint nor the trigger can fail on, or
--     change the behaviour of, anything that exists today.
-- With randevu_portal_ayarlari.acik = false (the default) no code path writes kaynak or 'talep'.
-- Safe to re-run.

create extension if not exists btree_gist;

-- ── 1. Per-doctor switch + booking policy ────────────────────────────────────────────────────────────
create table if not exists public.randevu_portal_ayarlari (
  doktor_id uuid primary key references auth.users(id) on delete cascade,
  acik boolean not null default false,
  -- Existing randevular.tur values; per type: open to patients + duration in minutes.
  turler jsonb not null default '{"ilk_muayene":{"acik":true,"sure":30},"muayene":{"acik":true,"sure":20},"kontrol":{"acik":true,"sure":15}}'::jsonb,
  tampon_dk integer not null default 0 check (tampon_dk between 0 and 120),
  min_bildirim_saat integer not null default 2 check (min_bildirim_saat between 0 and 720),
  max_ileri_gun integer not null default 30 check (max_ileri_gun between 1 and 365),
  iptal_sinir_saat integer not null default 24 check (iptal_sinir_saat between 0 and 720),
  onay_modu text not null default 'hepsi_onay' check (onay_modu in ('hepsi_onay', 'mevcut_hasta_otomatik')),
  eskalasyon_saat integer not null default 4 check (eskalasyon_saat between 1 and 168),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 2. Exceptions to working hours (izin, tatil) ─────────────────────────────────────────────────────
-- Official holidays come from lib/randevu/resmiTatiller.ts; this table holds the doctor's own days off.
create table if not exists public.randevu_istisnalari (
  id uuid primary key default gen_random_uuid(),
  doktor_id uuid not null references auth.users(id) on delete cascade,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  neden text not null default 'izin' check (neden in ('izin', 'tatil')),
  created_at timestamptz not null default now(),
  check (bitis > baslangic)
);
create index if not exists idx_randevu_istisnalari_doktor on public.randevu_istisnalari (doktor_id, baslangic);

-- ── 3. New columns on randevular (NULL on every existing row) ────────────────────────────────────────
alter table public.randevular add column if not exists kaynak text;
alter table public.randevular add column if not exists talep_at timestamptz;
alter table public.randevular add column if not exists oneri_at timestamptz;
alter table public.randevular add column if not exists hasta_teyit_at timestamptz;
alter table public.randevular add column if not exists eskalasyon_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'randevular_kaynak_check' and conrelid = 'public.randevular'::regclass) then
    alter table public.randevular add constraint randevular_kaynak_check check (kaynak is null or kaynak in ('portal')) not valid;
  end if;
end $$;

-- durum: existing five values + 'talep' (patient request holding the slot). Every other V2 state maps onto
-- an existing value (onaylandi, tamamlandi = geldi, gelmedi, iptal) or a column (teyit = hasta_teyit_at).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.randevular'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%durum%planlandi%'
  loop
    execute format('alter table public.randevular drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.randevular add constraint randevular_durum_check
  check (durum in ('planlandi', 'onaylandi', 'tamamlandi', 'iptal', 'gelmedi', 'talep')) not valid;

create index if not exists idx_randevular_talep on public.randevular (doktor_id, talep_at) where durum = 'talep';

-- ── 4. Double booking: database-level guarantee for the new flow ─────────────────────────────────────
-- (a) Exclusion constraint: two active new-flow rows of one doctor can never overlap — no race possible.
--     Scoped by `kaynak is not null` because existing rows were checked only in application code and may
--     already overlap; an unscoped constraint could fail to build on live data.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'randevular_v2_cakisma_yok') then
    alter table public.randevular add constraint randevular_v2_cakisma_yok
      exclude using gist (doktor_id with =, tstzrange(baslangic, bitis, '[)') with &&)
      where (kaynak is not null and durum <> 'iptal');
  end if;
end $$;

-- (b) A new-flow row must also not overlap ANY active row (legacy bookings included). Serialised per doctor
--     with a transaction advisory lock; raises 23P01 like the constraint so the API answers 409 for both.
--     Legacy rows (kaynak NULL) skip this entirely — today's behaviour is untouched.
create or replace function public.randevu_v2_cakisma_kontrol() returns trigger
language plpgsql as $$
begin
  if new.kaynak is null or new.durum = 'iptal' then
    return new;
  end if;
  -- A status change on a row that already held this window (onaylandi → tamamlandi, …) needs no re-check.
  if tg_op = 'UPDATE' and old.kaynak is not null and old.durum <> 'iptal'
     and new.baslangic = old.baslangic and new.bitis = old.bitis then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('randevu:' || new.doktor_id::text, 0));
  if exists (
    select 1 from public.randevular r
    where r.doktor_id = new.doktor_id
      and r.id <> new.id
      and r.durum <> 'iptal'
      and r.baslangic < new.bitis
      and r.bitis > new.baslangic
  ) then
    raise exception 'randevu_cakisma' using errcode = '23P01';
  end if;
  return new;
end $$;

drop trigger if exists trg_randevu_v2_cakisma on public.randevular;
create trigger trg_randevu_v2_cakisma
  before insert or update of baslangic, bitis, durum, kaynak on public.randevular
  for each row execute function public.randevu_v2_cakisma_kontrol();

-- ── 5. Append-only event log ──────────────────────────────────────────────────────────────────────────
-- No FK to randevular on purpose: the existing DELETE route removes mis-entries, and the log must outlive
-- the row. Rows can be inserted, never updated; deleted only by an account-deletion cascade.
create table if not exists public.randevu_olaylari (
  id uuid primary key default gen_random_uuid(),
  randevu_id uuid not null,
  doktor_id uuid not null references auth.users(id) on delete cascade,
  olay text not null,
  yapan text not null check (yapan in ('hasta', 'doktor', 'sekreter', 'sistem')),
  yapan_id uuid,
  detay jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_randevu_olaylari_randevu on public.randevu_olaylari (randevu_id, created_at);
create index if not exists idx_randevu_olaylari_doktor on public.randevu_olaylari (doktor_id, created_at);

create or replace function public.randevu_olaylari_salt_ekle() returns trigger
language plpgsql as $$
begin
  -- pg_trigger_depth() > 1 → we are inside the FK cascade of an auth.users delete (KVKK account erasure).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'randevu_olaylari is append-only';
end $$;

drop trigger if exists trg_randevu_olaylari_salt_ekle on public.randevu_olaylari;
create trigger trg_randevu_olaylari_salt_ekle
  before update or delete on public.randevu_olaylari
  for each row execute function public.randevu_olaylari_salt_ekle();

-- ── 6. Reminder / notification jobs (idempotent: one row per appointment, kind and time) ──────────────
create table if not exists public.randevu_isleri (
  id uuid primary key default gen_random_uuid(),
  randevu_id uuid not null references public.randevular(id) on delete cascade,
  doktor_id uuid not null references auth.users(id) on delete cascade,
  tur text not null check (tur in ('onay_eposta', 'oneri_eposta', 'red_eposta', 'iptal_eposta', 'gun_once', 'sabah')),
  zaman timestamptz not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'isleniyor', 'gonderildi', 'atlandi', 'iptal', 'hata')),
  sonuc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (randevu_id, tur, zaman)
);
create index if not exists idx_randevu_isleri_vade on public.randevu_isleri (zaman) where durum = 'bekliyor';
create index if not exists idx_randevu_isleri_doktor on public.randevu_isleri (doktor_id, randevu_id);

-- ── 7. RLS (second line of defence; routes use the service role and scope by doktor_id in code) ───────
alter table public.randevu_portal_ayarlari enable row level security;
alter table public.randevu_istisnalari enable row level security;
alter table public.randevu_olaylari enable row level security;
alter table public.randevu_isleri enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'randevu_portal_ayarlari' and policyname = 'randevu_portal_ayarlari_doktor') then
    create policy randevu_portal_ayarlari_doktor on public.randevu_portal_ayarlari for all using (auth.uid() = doktor_id) with check (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_istisnalari' and policyname = 'randevu_istisnalari_doktor') then
    create policy randevu_istisnalari_doktor on public.randevu_istisnalari for all using (auth.uid() = doktor_id) with check (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_olaylari' and policyname = 'randevu_olaylari_doktor_okur') then
    create policy randevu_olaylari_doktor_okur on public.randevu_olaylari for select using (auth.uid() = doktor_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'randevu_isleri' and policyname = 'randevu_isleri_doktor_okur') then
    create policy randevu_isleri_doktor_okur on public.randevu_isleri for select using (auth.uid() = doktor_id);
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('111', '111_randevu_v2.sql', null, now(), false, 'NOTYA-RANDEVU-V2 PR1: portal randevu ayarları, istisnalar, talep durumu, v2 çakışma garantisi, olay günlüğü, hatırlatma işleri')
on conflict (version) do nothing;
