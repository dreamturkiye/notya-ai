-- 203 — ESNEK-MUAYENE-B (Kaan, 2026-11-23): "Notya hekime uyar, hekim Notya'ya değil." Phase B data model.
--
--   esnek_muayene_ayarlari (+cols)  shadow mode per doctor (on/off, start/end, target), the offer state, "sekreter yazmasın"
--                                   (from a given day: the secretary only uploads pages, Notya drafts, the doctor approves),
--                                   batch approval (B3) opened by the doctor.
--   golge_karsilastirmalari         one shadow comparison per uploaded page set: the secretary's own note (pasted / typed /
--                                   an existing note), her measured typing time or declared minutes (time-meter baseline),
--                                   Notya's hidden draft from the pages, the fact-level result. Nothing here is a visit note.
--   esnek_ogrenme_adaylari          overnight learning candidates (lexicon / format / re-tested phrasing rules), evidence,
--                                   regression result, what was written when activated (exact one-tap undo).
--   alan_ozerklik                   field-level autonomy ladder per doctor and field (B0..B3, uncorrected streak, his ceiling).
--   esnek_olaylar                   idempotent per-note events: field corrected / uncorrected at approval, suggestion
--                                   accepted / rejected, note opened and protected item acknowledged (batch approval).
--   oneri_profili_kararlari         the doctor's own choice per suggestion type (show / quiet) — wins over the learned profile
--                                   (never for safety warnings; enforced in code).
--   hekim_el_sozlugu.kaynak         + 'gece' (an entry activated by the overnight loop; undo deletes exactly that row).
--
-- Isolation: every table carries doctor_id; the application scopes every query by doctor_id (service role, hasta-izolasyon);
-- RLS on, authenticated clients read only their own rows, anon nothing; patient_id tables get the 052 restrictive policy.
-- Number 203: 202 is the latest on main; the release branches end at 200.

alter table public.esnek_muayene_ayarlari add column if not exists golge_modu boolean not null default false;
alter table public.esnek_muayene_ayarlari add column if not exists golge_baslangic timestamptz;
alter table public.esnek_muayene_ayarlari add column if not exists golge_bitis timestamptz;
alter table public.esnek_muayene_ayarlari add column if not exists golge_hedef numeric(4, 3) not null default 0.900 check (golge_hedef > 0 and golge_hedef <= 1);
alter table public.esnek_muayene_ayarlari add column if not exists golge_teklif text not null default 'yok' check (golge_teklif in ('yok', 'teklif', 'kabul', 'ertele'));
alter table public.esnek_muayene_ayarlari add column if not exists golge_teklif_at timestamptz;
alter table public.esnek_muayene_ayarlari add column if not exists sekreter_yazmasin_gun date;
alter table public.esnek_muayene_ayarlari add column if not exists toplu_onay_izni boolean not null default false;
alter table public.esnek_muayene_ayarlari add column if not exists hekim_duzeltmeleri jsonb not null default '{}'::jsonb;

create table if not exists public.golge_karsilastirmalari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null,
  kaynak_id uuid not null,
  sekreter_metni text not null check (char_length(sekreter_metni) between 1 and 20000),
  sekreter_kaynagi text not null default 'yapistir' check (sekreter_kaynagi in ('yapistir', 'yazdi', 'not')),
  sekreter_sure_ms integer check (sekreter_sure_ms is null or sekreter_sure_ms between 0 and 3600000),
  sekreter_beyan_dk numeric(5, 1) check (sekreter_beyan_dk is null or (sekreter_beyan_dk > 0 and sekreter_beyan_dk <= 120)),
  notya_taslak jsonb,
  sonuc jsonb,
  skor numeric(4, 3),
  ayni_icerik boolean,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'karsilastirildi', 'hata')),
  hata_kodu text,
  ogrenildi boolean not null default false,
  gun date not null default (now() at time zone 'Europe/Istanbul')::date,
  ekleyen_user_id uuid not null,
  ekleyen_rol text not null default 'sekreter' check (ekleyen_rol in ('doktor', 'sekreter', 'asistan', 'hasta_danismani')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, kaynak_id)
);
create index if not exists golge_karsilastirmalari_gun_idx on public.golge_karsilastirmalari (doctor_id, gun desc);
create index if not exists golge_karsilastirmalari_ogren_idx on public.golge_karsilastirmalari (doctor_id, ogrenildi) where not ogrenildi;

create table if not exists public.esnek_ogrenme_adaylari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  tur text not null check (tur in ('sozluk', 'bicim', 'kural')),
  anahtar text not null check (char_length(anahtar) between 1 and 120),
  oneri jsonb not null,
  kaynak text not null check (kaynak in ('golge', 'dogrula', 'duzeltme')),
  kanit_sayisi integer not null default 1,
  kanit_idler text[] not null default '{}',
  durum text not null default 'aday' check (durum in ('aday', 'aktif', 'kirdi', 'celiski', 'geri_alindi')),
  regresyon jsonb,
  uygulama jsonb,
  son_deneme_at timestamptz,
  aktif_at timestamptz,
  geri_alindi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, tur, anahtar)
);
create index if not exists esnek_ogrenme_adaylari_durum_idx on public.esnek_ogrenme_adaylari (doctor_id, durum, aktif_at desc);

create table if not exists public.alan_ozerklik (
  doctor_id uuid not null,
  alan text not null check (char_length(alan) between 1 and 40),
  basamak smallint not null default 0 check (basamak between 0 and 3),
  seri integer not null default 0 check (seri >= 0),
  hekim_tavani smallint not null default 3 check (hekim_tavani between 0 and 3),
  son_duzeltme_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (doctor_id, alan)
);

create table if not exists public.esnek_olaylar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  note_id uuid not null,
  patient_id uuid,
  tur text not null check (tur in ('alan', 'oneri', 'acildi', 'gordum')),
  anahtar text not null check (char_length(anahtar) between 1 and 160),
  deger jsonb,
  user_id uuid,
  created_at timestamptz not null default now(),
  unique (doctor_id, note_id, tur, anahtar)
);
create index if not exists esnek_olaylar_tur_idx on public.esnek_olaylar (doctor_id, tur, created_at desc);

create table if not exists public.oneri_profili_kararlari (
  doctor_id uuid not null,
  tur text not null check (char_length(tur) between 1 and 40),
  karar text not null check (karar in ('sessiz', 'goster')),
  updated_at timestamptz not null default now(),
  primary key (doctor_id, tur)
);

-- an entry written by the overnight learning loop is marked, so its one-tap undo deletes exactly that row
alter table public.hekim_el_sozlugu drop constraint if exists hekim_el_sozlugu_kaynak_check;
alter table public.hekim_el_sozlugu add constraint hekim_el_sozlugu_kaynak_check check (kaynak in ('dogrulama', 'elle', 'ice_aktarim', 'gece'));

alter table public.golge_karsilastirmalari enable row level security;
alter table public.esnek_ogrenme_adaylari enable row level security;
alter table public.alan_ozerklik enable row level security;
alter table public.esnek_olaylar enable row level security;
alter table public.oneri_profili_kararlari enable row level security;

do $$
declare t text;
begin
  foreach t in array array['golge_karsilastirmalari', 'esnek_ogrenme_adaylari', 'alan_ozerklik', 'esnek_olaylar', 'oneri_profili_kararlari'] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
  end loop;
  -- 052's restrictive patient-ownership policy for the new patient_id tables.
  foreach t in array array['golge_karsilastirmalari', 'esnek_olaylar'] loop
    begin
      execute format(
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon
           using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('203', '203_esnek_muayene_b.sql', null, now(), false,
  'ESNEK-MUAYENE-B: shadow mode + offer + sekreter_yazmasin + toplu_onay_izni on esnek_muayene_ayarlari; golge_karsilastirmalari, esnek_ogrenme_adaylari, alan_ozerklik, esnek_olaylar, oneri_profili_kararlari; hekim_el_sozlugu kaynak gece; RLS own rows')
on conflict (version) do nothing;
