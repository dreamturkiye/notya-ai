-- KBB-GORUNTU-OKUMA-01 / PLASTIK-GORUNTU-OKUMA-01 (2026-10-14).
-- Each specialty's OWN dual-sign AI-assist bridge, mirroring the shape goz_goruntu_okumalari already
-- proved out (048/053_goz_exceptional.sql) — but genuinely separate tables, fields and vocabulary.
-- Neither borrows dermatoloji's or göz's prompt/fields: KBB documents ear/nose/throat endoscopy
-- findings (its own terms); Plastik Cerrahi documents standardized before/after view photography
-- tied to a procedure category (its own terms). What IS shared, by design, is only the generic
-- plumbing: hasta_goruntulemeler (core pixels + the new visit_id from 128), the Tier A model-call
-- router (core/belgeler/tierA.ts — bransKurali('kbb'|'plastik') already existed and already carries
-- each branş's own persona/modalite rules), the confidence-cap pattern, and the dual-sign state
-- machine (draft → onaylı/düzeltilmiş/reddedildi, asistan can never self-approve).

-- Canonical imaging modality codes — additive to the hasta_goruntulemeler check (027 pattern).
alter table hasta_goruntulemeler drop constraint if exists hasta_goruntulemeler_modalite_check;
alter table hasta_goruntulemeler
  add constraint hasta_goruntulemeler_modalite_check
  check (
    modalite is null or modalite in (
      'xray', 'mri', 'bt', 'us', 'pet', 'ekg', 'eko', 'mamografi', 'diger',
      'dermatoskopi', 'derm', 'yara',
      'oct', 'fundus', 'on_segment',
      'otoskopi', 'nazoendoskopi', 'laringoskopi',
      'plastik_foto'
    )
  );

-- KBB: oto-/naso-/laringoskopi dual-sign okuma. `taraf` only meaningful for otoskopi (TM is per-ear);
-- naso-/laringoskopi have no left/right and leave it null.
create table if not exists kbb_goruntu_okumalari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  goruntu_id uuid references hasta_goruntulemeler(id) on delete cascade,
  belge_id uuid,
  belge_analiz_id uuid references belge_analizleri(id) on delete set null,
  modalite text not null check (modalite in ('otoskopi', 'nazoendoskopi', 'laringoskopi')),
  taraf text check (taraf is null or taraf in ('sag', 'sol', 'iki')),
  kaynak text not null default 'elle' check (kaynak in ('elle', 'ayse_iskelet', 'belge_tier_a')),
  guven_ust_pct int,
  asistan_rapor jsonb,
  taslak text not null default '',
  taslak_yazan text not null default 'asistan' check (taslak_yazan in ('asistan', 'uzman')),
  durum text not null default 'draft' check (durum in ('draft', 'onayli', 'duzeltilmis', 'reddedildi')),
  uzman_metin text,
  onay_at timestamptz,
  disclaimer text not null default 'Bulgu kontrol listesi, tanı değildir. Uzman onayı gerekir.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kbb_goruntu_okumalari_hedef_chk check (goruntu_id is not null or belge_id is not null)
);
create index if not exists kbb_goruntu_okumalari_idx on kbb_goruntu_okumalari (patient_id, created_at desc);
create index if not exists kbb_goruntu_okumalari_belge_idx on kbb_goruntu_okumalari (belge_id) where belge_id is not null;

-- Plastik Cerrahi: standardized before/after view photography dual-sign okuma. `gorunum` is the
-- standardized photographic view (Patel/Karam/Lam, "Pictorial Documentation", in Bailey's Head & Neck
-- Surgery — Otolaryngology, EntoKey 2016 — see specialties/plastik-cerrahi/protocols/sources.ts
-- ref ENTOKEY_PICTORIAL). Never a diagnosis/complication name — dozVeyaTaniKilidiIceriyorMu() still
-- scrubs taslak/uzman_metin at the application layer, same guard foto.ts already uses.
create table if not exists plastik_goruntu_okumalari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  goruntu_id uuid references hasta_goruntulemeler(id) on delete cascade,
  belge_id uuid,
  belge_analiz_id uuid references belge_analizleri(id) on delete set null,
  gorunum text not null check (gorunum in ('frontal', 'oblik_sag', 'oblik_sol', 'lateral_sag', 'lateral_sol', 'bazal', 'posterior', 'yakin_cekim')),
  procedure_kategori text,
  gun_sayisi int check (gun_sayisi is null or gun_sayisi >= 0),
  kaynak text not null default 'elle' check (kaynak in ('elle', 'ayse_iskelet', 'belge_tier_a')),
  guven_ust_pct int,
  asistan_rapor jsonb,
  taslak text not null default '',
  taslak_yazan text not null default 'asistan' check (taslak_yazan in ('asistan', 'uzman')),
  durum text not null default 'draft' check (durum in ('draft', 'onayli', 'duzeltilmis', 'reddedildi')),
  uzman_metin text,
  onay_at timestamptz,
  disclaimer text not null default 'Foto izlem gözlemi, tanı/komplikasyon tespiti değildir. Uzman onayı gerekir.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plastik_goruntu_okumalari_hedef_chk check (goruntu_id is not null or belge_id is not null)
);
create index if not exists plastik_goruntu_okumalari_idx on plastik_goruntu_okumalari (patient_id, created_at desc);
create index if not exists plastik_goruntu_okumalari_belge_idx on plastik_goruntu_okumalari (belge_id) where belge_id is not null;

alter table kbb_goruntu_okumalari enable row level security;
alter table plastik_goruntu_okumalari enable row level security;

do $$ begin
  create policy "doktor kendi kbb_goruntu_okumalari" on kbb_goruntu_okumalari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi plastik_goruntu_okumalari" on plastik_goruntu_okumalari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '129',
  '129_kbb_plastik_goruntu_okuma.sql',
  null,
  now(),
  false,
  'KBB + Plastik Cerrahi own dual-sign imaging bridges (own tables/fields/vocab, not derm/göz copies) + new hasta_goruntulemeler modality codes.'
)
on conflict (version) do nothing;
