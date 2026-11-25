-- 209 — AKKS, Ayşe Klinik Kalite Standardı (Kaan, 2026-11-24): Notya's INTERNAL clinical quality bar for Ayşe and the
-- specialty assistants. Measured and continuously run; not a certification (docs/AKKS.md).
--
--   akks_kosular            one evaluation run (baseline / weekly / gate / manual): the planned items, summary, gate decision
--   akks_cevaplar           one item of a run: the production assistant's answer (no patient data — the evaluation doctors
--                           have no patients), the automated grade, the review-queue flag
--   akks_insan_inceleme     the human decision on a queued answer (every fail + a random 10% of passes)
--   akks_soru_inceleme      clinician review of a gold item (bound to the item's content hash)
--   akks_panel_davetleri    pseudonymous panel invites (blind Prof. comparison, gold-item review) — only the SHA-256 of the
--                           link token is stored; ≤ 30 days; revocable
--   akks_prof_cevaplar      a panel member's own answer to an item (written without seeing Ayşe's)
--   akks_kor_puanlar        a third reviewer's blind grades of the two answers (A/B mapping kept server-side)
--   degerlendirme_anahtarlari.amac + 'ayse-kalite-degerlendir'  (the short-lived evaluation pass of migration 204)
--
-- No patient data anywhere. RLS on every table, no policy: service role only (founder routes / cron / panel route check
-- access themselves). ADDITIVE ONLY; idempotent.

alter table public.degerlendirme_anahtarlari drop constraint if exists degerlendirme_anahtarlari_amac_check;
alter table public.degerlendirme_anahtarlari add constraint degerlendirme_anahtarlari_amac_check
  check (amac in ('el-notu-degerlendir', 'ayse-kalite-degerlendir'));

create table if not exists public.akks_kosular (
  id uuid primary key default gen_random_uuid(),
  etiket text not null check (char_length(etiket) between 1 and 80),
  tur text not null check (tur in ('taban', 'haftalik', 'kapi', 'elle')),
  durum text not null default 'calisiyor' check (durum in ('calisiyor', 'tamam', 'iptal')),
  soru_idleri text[] not null check (cardinality(soru_idleri) between 1 and 2000),
  branslar text[] not null check (cardinality(branslar) between 1 and 40),
  -- hash of the AKKS-watched prompt / model / routing files of the build that ran it (core/akks/izlenen.json)
  izlenen_ozet text check (izlenen_ozet is null or izlenen_ozet ~ '^[0-9a-f]{16,64}$'),
  surum text check (surum is null or char_length(surum) <= 64),
  ozet jsonb,
  kapi jsonb,
  maliyet jsonb,
  taban_mi boolean not null default false,
  olusturan uuid references auth.users(id) on delete set null,
  basladi_at timestamptz not null default now(),
  bitti_at timestamptz
);
create index if not exists akks_kosular_basladi_idx on public.akks_kosular (basladi_at desc);
create index if not exists akks_kosular_acik_idx on public.akks_kosular (basladi_at) where durum = 'calisiyor';
alter table public.akks_kosular enable row level security;

create table if not exists public.akks_cevaplar (
  id uuid primary key default gen_random_uuid(),
  kosu_id uuid not null references public.akks_kosular(id) on delete cascade,
  soru_id text not null check (char_length(soru_id) between 3 and 20),
  soru_ozeti text not null check (soru_ozeti ~ '^[0-9a-f]{16}$'),
  brans text not null check (char_length(brans) between 2 and 40),
  kategori text not null check (kategori in ('yaygin', 'kilavuz', 'kirmizi', 'ilac', 'sgk', 'tuzak')),
  zorluk smallint not null check (zorluk between 1 and 3),
  cevap text check (cevap is null or char_length(cevap) <= 20000),
  rota text check (rota is null or char_length(rota) <= 20),
  kaynak_idleri text[] not null default '{}',
  ms integer check (ms is null or ms >= 0),
  notlama jsonb,
  puan numeric(5,4) check (puan is null or (puan >= 0 and puan <= 1)),
  zararli boolean,
  kilavuz smallint check (kilavuz is null or kilavuz between 0 and 2),
  atif_var boolean,
  atif smallint check (atif is null or atif between 0 and 2),
  gecti boolean,
  inceleme text check (inceleme is null or inceleme in ('fail', 'orneklem')),
  hata text check (hata is null or char_length(hata) <= 200),
  created_at timestamptz not null default now(),
  unique (kosu_id, soru_id)
);
create index if not exists akks_cevaplar_soru_idx on public.akks_cevaplar (soru_id, created_at desc);
create index if not exists akks_cevaplar_inceleme_idx on public.akks_cevaplar (created_at desc) where inceleme is not null;
alter table public.akks_cevaplar enable row level security;

create table if not exists public.akks_insan_inceleme (
  cevap_id uuid primary key references public.akks_cevaplar(id) on delete cascade,
  durum text not null check (durum in ('onaylandi', 'duzeltildi')),
  puanlar jsonb,
  zararli boolean,
  not_ text check (not_ is null or char_length(not_) <= 2000),
  inceleyen uuid references auth.users(id) on delete set null,
  inceleyen_kodu text check (inceleyen_kodu is null or char_length(inceleyen_kodu) <= 20),
  karar_at timestamptz not null default now(),
  constraint akks_insan_duzeltme_tam check (durum = 'onaylandi' or (puanlar is not null and zararli is not null))
);
alter table public.akks_insan_inceleme enable row level security;

create table if not exists public.akks_soru_inceleme (
  soru_id text primary key check (char_length(soru_id) between 3 and 20),
  soru_ozeti text not null check (soru_ozeti ~ '^[0-9a-f]{16}$'),
  durum text not null check (durum in ('onaylandi', 'duzeltme-gerekli', 'cikarildi')),
  not_ text check (not_ is null or char_length(not_) <= 2000),
  inceleyen uuid references auth.users(id) on delete set null,
  inceleyen_kodu text check (inceleyen_kodu is null or char_length(inceleyen_kodu) <= 20),
  karar_at timestamptz not null default now()
);
alter table public.akks_soru_inceleme enable row level security;

create table if not exists public.akks_panel_davetleri (
  id uuid primary key default gen_random_uuid(),
  anahtar_ozeti text not null unique check (anahtar_ozeti ~ '^[0-9a-f]{64}$'),
  rol text not null check (rol in ('cevaplayici', 'degerlendirici', 'soru-inceleyici')),
  brans text not null check (char_length(brans) between 2 and 40),
  -- pseudonym only (e.g. "P1"); the panel member's identity lives outside this database
  kod text not null check (kod ~ '^[A-Za-z0-9_-]{1,20}$'),
  soru_idleri text[] not null check (cardinality(soru_idleri) between 1 and 200),
  olusturma timestamptz not null default now(),
  son_kullanma timestamptz not null,
  iptal boolean not null default false,
  olusturan uuid references auth.users(id) on delete set null,
  constraint akks_panel_en_cok_30_gun check (son_kullanma > olusturma and son_kullanma <= olusturma + interval '30 days')
);
alter table public.akks_panel_davetleri enable row level security;

create table if not exists public.akks_prof_cevaplar (
  id uuid primary key default gen_random_uuid(),
  davet_id uuid not null references public.akks_panel_davetleri(id) on delete cascade,
  soru_id text not null check (char_length(soru_id) between 3 and 20),
  soru_ozeti text not null check (soru_ozeti ~ '^[0-9a-f]{16}$'),
  brans text not null check (char_length(brans) between 2 and 40),
  kod text not null check (char_length(kod) between 1 and 20),
  cevap text not null check (char_length(cevap) between 1 and 12000),
  sure_sn integer check (sure_sn is null or sure_sn between 0 and 86400),
  created_at timestamptz not null default now(),
  unique (davet_id, soru_id)
);
alter table public.akks_prof_cevaplar enable row level security;

create table if not exists public.akks_kor_puanlar (
  id uuid primary key default gen_random_uuid(),
  davet_id uuid not null references public.akks_panel_davetleri(id) on delete cascade,
  soru_id text not null check (char_length(soru_id) between 3 and 20),
  brans text not null check (char_length(brans) between 2 and 40),
  prof_cevap_id uuid not null references public.akks_prof_cevaplar(id) on delete cascade,
  ayse_cevap_id uuid not null references public.akks_cevaplar(id) on delete cascade,
  a_kaynak text not null check (a_kaynak in ('ayse', 'prof')),
  puan_a jsonb not null,
  puan_b jsonb not null,
  zararli_a boolean not null,
  zararli_b boolean not null,
  tercih text not null check (tercih in ('A', 'B', 'esit')),
  not_ text check (not_ is null or char_length(not_) <= 2000),
  created_at timestamptz not null default now(),
  unique (davet_id, soru_id)
);
alter table public.akks_kor_puanlar enable row level security;

revoke all on public.akks_kosular, public.akks_cevaplar, public.akks_insan_inceleme, public.akks_soru_inceleme,
  public.akks_panel_davetleri, public.akks_prof_cevaplar, public.akks_kor_puanlar from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('209', '209_akks.sql', null, now(), false,
  'AKKS: akks_kosular, akks_cevaplar, akks_insan_inceleme, akks_soru_inceleme, akks_panel_davetleri, akks_prof_cevaplar, akks_kor_puanlar; degerlendirme_anahtarlari.amac += ayse-kalite-degerlendir; RLS on, service role only, no patient data')
on conflict (version) do nothing;
