-- 190 — GENITAL-ESTETIK-01 (Kaan, 2026-11-06): cosmetic gynaecology / genital aesthetics (obstetrics and gynaecology only).
--   1) genital_estetik_kayitlari   one record per row: an energy-based session, an injection, a whitening session, an
--                                  outcome-measure total, or a separate photo consent. The clinical content is encrypted
--                                  (veri_encrypted). Plain columns are only what a list, a follow-up date and a PRODUCT
--                                  RECALL need: the kind, the day, the indication class, the product name and its LOT
--                                  NUMBER (kept upper case, no spaces: lib/clinical/genitalEstetik.ts -> lotNoDogrula).
--   2) genital_estetik_fotolar     intimate photos, kept APART from the document vault on purpose: no other part of the
--                                  application (document list, patient portal, consultations, document analysis, photo
--                                  archive, export) reads this table, so none of them can show, thumbnail, export or send
--                                  one to a model. Bytes are encrypted (AES envelope, lib/vault/crypto.ts). No thumbnail
--                                  column exists. Every view is written to audit_logs by the route BEFORE the bytes leave.
-- Same definition in all seven databases (Turkiye and the six country builds keep one schema).
-- HASTA-IZOLASYON: RLS on; anon and authenticated get NOTHING on the photo table and only their own rows (select) on the
-- record table, under the restrictive patient-ownership policy (052 / 186 pattern). The application uses the service role.

create table if not exists public.genital_estetik_kayitlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  tur text not null check (tur in ('enerji', 'enjeksiyon', 'beyazlatma', 'olcek', 'foto_onam')),
  islem_tarihi date not null,
  endikasyon text check (endikasyon is null or endikasyon in ('kozmetik', 'medikal')),
  urun_adi text check (urun_adi is null or char_length(urun_adi) <= 160),
  lot_no text check (lot_no is null or lot_no ~ '^[A-Z0-9][A-Z0-9./-]{1,39}$'),
  sonraki_tarih date,
  veri_encrypted text not null check (char_length(veri_encrypted) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists genital_estetik_kayitlari_hasta_idx on public.genital_estetik_kayitlari (doctor_id, patient_id, islem_tarihi desc);
create index if not exists genital_estetik_kayitlari_lot_idx on public.genital_estetik_kayitlari (doctor_id, lot_no) where lot_no is not null;

create table if not exists public.genital_estetik_fotolar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  gorunum text not null check (gorunum in ('on_ayakta', 'litotomi_istirahat', 'litotomi_ayrilmis', 'perine', 'yakin_plan')),
  cekim_tarihi date not null,
  mime text not null check (mime in ('image/jpeg', 'image/png')),
  boyut integer not null check (boyut > 0 and boyut <= 3000000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  veri_encrypted text not null check (char_length(veri_encrypted) > 0),
  created_at timestamptz not null default now()
);
create index if not exists genital_estetik_fotolar_hasta_idx on public.genital_estetik_fotolar (doctor_id, patient_id, cekim_tarihi desc);

alter table public.genital_estetik_kayitlari enable row level security;
alter table public.genital_estetik_fotolar enable row level security;
revoke all on public.genital_estetik_kayitlari from anon, authenticated;
revoke all on public.genital_estetik_fotolar from anon, authenticated;
grant select on public.genital_estetik_kayitlari to authenticated;

do $$
declare t text;
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'genital_estetik_kayitlari' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.genital_estetik_kayitlari for select to authenticated using (doctor_id = auth.uid());
  end if;
  foreach t in array array['genital_estetik_kayitlari', 'genital_estetik_fotolar'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'hasta_izolasyon_hasta_sahipligi') then
      execute format(
        'create policy hasta_izolasyon_hasta_sahipligi on public.%I as restrictive for all to authenticated, anon
           using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    end if;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('190', '190_genital_estetik.sql', null, now(), false,
  'GENITAL-ESTETIK-01: genital_estetik_kayitlari (sifreli, lot_no geri cagirma, RLS + restrictive hasta_izolasyon); genital_estetik_fotolar (sifreli, ayri depo, anon/authenticated erisimi yok)')
on conflict (version) do nothing;

-- Rollback (manual, never automatic):
--   drop table if exists public.genital_estetik_fotolar; drop table if exists public.genital_estetik_kayitlari;
