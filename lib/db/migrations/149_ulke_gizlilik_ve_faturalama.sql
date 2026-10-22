-- 149 AU-BETA-01 (country build, Claude, 2026-10-22) — consent ledger, access/correction requests, invoices and the
-- bring-your-own payment connection. Country-generic tables (every column is neutral); only Australia's pack switches the
-- screens on (`uzanti` on the pack). Server only: no select policy, no privilege for the browser roles.
--
--   1. ulke_riza_kayitlari     APPEND-ONLY consent ledger: which notice version a patient accepted, when, from where.
--                               The only column that may change afterwards is `geri_cekildi_at` (withdrawal).
--   2. ulke_erisim_talepleri   a patient's request to see (`erisim`) or correct (`duzeltme`) their information, with
--                               the day it is due (30 days after receipt: a starting value of the pack) and the answer.
--   3. ulke_faturalar          invoices. The lines and the seller/buyer particulars are one encrypted value (health
--                               information); amounts and status are plain so they can be summed.
--   4. ulke_odeme_baglantilari the doctor's OWN merchant-account connection (provider, mode, encrypted credential).
--                               This product holds no funds and no balance: there is no ledger of customer money here.
--
-- ONE DATABASE PER COUNTRY. Idempotent; one transaction. NOT APPLIED by the job that wrote it unless its report says so.

begin;
set local lock_timeout = '4s';

do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 149 refused: public.ulke_hesaplari is missing. Not a country database.';
  end if;
end $$;

create table if not exists public.ulke_riza_kayitlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  surum text not null check (char_length(surum) between 1 and 80),
  metin_ozeti text not null check (char_length(metin_ozeti) = 64),
  kaynak text not null check (kaynak in ('portal', 'hasta_formu', 'hekim')),
  verildi_at timestamptz not null default now(),
  geri_cekildi_at timestamptz,
  constraint ulke_riza_kayitlari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);
create index if not exists ulke_riza_kayitlari_hasta_idx on public.ulke_riza_kayitlari (ulke, doctor_id, patient_id, verildi_at desc);

create or replace function public.ulke_riza_kayitlari_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id
     or new.patient_id is distinct from old.patient_id or new.surum is distinct from old.surum
     or new.metin_ozeti is distinct from old.metin_ozeti or new.kaynak is distinct from old.kaynak
     or new.verildi_at is distinct from old.verildi_at
     or (old.geri_cekildi_at is not null and new.geri_cekildi_at is distinct from old.geri_cekildi_at) then
    raise exception 'ulke_riza_kayitlari: a consent record is append-only; only a first withdrawal may be set' using errcode = '23514';
  end if;
  return new;
end $$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_riza_kayitlari_kilidi' and tgrelid = 'public.ulke_riza_kayitlari'::regclass) then
    create trigger ulke_riza_kayitlari_kilidi before update on public.ulke_riza_kayitlari for each row execute function public.ulke_riza_kayitlari_kilidi();
  end if;
end $$;

create table if not exists public.ulke_erisim_talepleri (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  tur text not null check (tur in ('erisim', 'duzeltme')),
  ayrinti_encrypted text,
  durum text not null default 'yeni' check (durum in ('yeni', 'islemde', 'tamamlandi', 'reddedildi')),
  alindi_at timestamptz not null default now(),
  son_tarih date not null,
  yanit_encrypted text,
  yanitlandi_at timestamptz,
  constraint ulke_erisim_talepleri_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);
create index if not exists ulke_erisim_talepleri_hekim_idx on public.ulke_erisim_talepleri (ulke, doctor_id, durum, son_tarih);
create index if not exists ulke_erisim_talepleri_hasta_idx on public.ulke_erisim_talepleri (ulke, doctor_id, patient_id, alindi_at desc);

create table if not exists public.ulke_faturalar (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  session_id uuid,
  fatura_no integer not null check (fatura_no > 0),
  govde_encrypted text not null check (char_length(govde_encrypted) > 0),
  alt_toplam_kurus bigint not null check (alt_toplam_kurus > 0),
  vergi_kurus bigint not null check (vergi_kurus >= 0),
  toplam_kurus bigint not null check (toplam_kurus > 0),
  iade_kurus bigint not null default 0 check (iade_kurus >= 0 and iade_kurus <= toplam_kurus),
  para_kodu text not null check (para_kodu ~ '^[A-Z]{3}$'),
  durum text not null default 'taslak' check (durum in ('taslak', 'odendi', 'iptal')),
  saglayici text check (saglayici in ('demo', 'stripe', 'tyro')),
  odeme_ref text,
  odendi_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ulke_faturalar_no_tekil unique (ulke, doctor_id, fatura_no),
  constraint ulke_faturalar_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade
);
create index if not exists ulke_faturalar_hekim_idx on public.ulke_faturalar (ulke, doctor_id, created_at desc);
create index if not exists ulke_faturalar_hasta_idx on public.ulke_faturalar (ulke, doctor_id, patient_id, created_at desc);

create table if not exists public.ulke_odeme_baglantilari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  saglayici text not null check (saglayici in ('stripe', 'tyro')),
  mod text not null default 'test' check (mod in ('test')),
  kimlik_encrypted text not null check (char_length(kimlik_encrypted) > 0),
  created_at timestamptz not null default now(),
  constraint ulke_odeme_baglantilari_tekil unique (ulke, doctor_id),
  constraint ulke_odeme_baglantilari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.ulke_riza_kayitlari enable row level security;
alter table public.ulke_erisim_talepleri enable row level security;
alter table public.ulke_faturalar enable row level security;
alter table public.ulke_odeme_baglantilari enable row level security;
revoke all on table public.ulke_riza_kayitlari from anon, authenticated;
revoke all on table public.ulke_erisim_talepleri from anon, authenticated;
revoke all on table public.ulke_faturalar from anon, authenticated;
revoke all on table public.ulke_odeme_baglantilari from anon, authenticated;
revoke all on function public.ulke_riza_kayitlari_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('149', '149_ulke_gizlilik_ve_faturalama.sql', null, now(), false,
  'AU-BETA-01: consent ledger, access/correction requests, invoices, the doctors own payment connection. Server only.')
on conflict (version) do nothing;

commit;
