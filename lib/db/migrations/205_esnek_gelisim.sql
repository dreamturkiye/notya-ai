-- 205 — ESNEK-GELISIM (Kaan, 2026-11-24): "As we have more users and more beta testers make sure that our system will
-- improve and get better as we go." The El Notu improvement loop on top of the per-doctor learning (202 / 203):
--
--   esnek_muayene_ayarlari (+cols)  gelistirme_onayi — the doctor's explicit consent (default OFF) that masked page packages
--                                   of his El Notu pages + the clinical facts of his approved notes enter the regression set.
--   brans_sozluk_onerileri          branş lexicon growth: an abbreviation -> meaning pair confirmed independently by >= 3
--                                   different doctors of the same branş is PROPOSED (abbreviation + meaning only, no doctor,
--                                   no patient, no text around it); the founder approves / rejects; approved pairs join that
--                                   branş' seed for every doctor of the branş (the doctor's own lexicon still wins).
--   el_notu_regresyon_sayfalari     the consented, de-identified regression set: one row per masked page package (the
--                                   package itself is an object in the private bucket 'el-notu-regresyon' under a random
--                                   name) + the clinical facts derived from the doctor's approved note. No patient id, no
--                                   session id, no note id. kaynak_id is only a pending link (page read, note not yet
--                                   approved) and is set to NULL when the page becomes part of the set. doctor_id is kept
--                                   only so withdrawing consent deletes exactly his pages.
--   el_notu_regresyon_olcumleri     weekly re-read metrics per set page (numbers and the reader build only).
--   el_notu_kalite_haftalik(n)      founder dashboard aggregate: per doctor and week, counts only (pages, Doğrula questions,
--                                   words auto-accepted, approved El Notu notes and their corrected fields, shadow matches,
--                                   documentation time) — computed in SQL so no reading text ever leaves the database.
--
-- Access: every new table is service-role only (RLS on, no policy, nothing granted to anon / authenticated); the function
-- is executable by service_role only. The application scopes by doctor_id where a doctor is involved (hasta-izolasyon).
-- Number 205: 204 is the latest on main; the release branches end at 200.

alter table public.esnek_muayene_ayarlari add column if not exists gelistirme_onayi boolean not null default false;
alter table public.esnek_muayene_ayarlari add column if not exists gelistirme_onayi_at timestamptz;

create table if not exists public.brans_sozluk_onerileri (
  id uuid primary key default gen_random_uuid(),
  brans text not null check (char_length(brans) between 1 and 64),
  kisaltma text not null check (char_length(kisaltma) between 1 and 24),
  kisaltma_anahtar text not null check (char_length(kisaltma_anahtar) between 1 and 24),
  anlam text not null check (char_length(anlam) between 1 and 80),
  anlam_anahtar text not null check (char_length(anlam_anahtar) between 1 and 80),
  doktor_sayisi integer not null check (doktor_sayisi >= 0),
  durum text not null default 'oneri' check (durum in ('oneri', 'onayli', 'reddedildi')),
  karar_veren_user_id uuid,
  karar_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brans, kisaltma_anahtar, anlam_anahtar)
);
create index if not exists brans_sozluk_onerileri_onayli_idx on public.brans_sozluk_onerileri (brans) where durum = 'onayli';

create table if not exists public.el_notu_regresyon_sayfalari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  kaynak_id uuid,
  sayfa integer not null check (sayfa between 1 and 40),
  brans text,
  depo_yolu text not null check (depo_yolu ~ '^[0-9a-f-]{36}\.json$'),
  gercekler jsonb not null default '[]'::jsonb,
  gercek_sayisi integer not null default 0,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'hazir')),
  created_at timestamptz not null default now(),
  hazir_at timestamptz,
  unique (doctor_id, kaynak_id, sayfa),
  -- a set page carries no link back to the visit
  check (durum = 'bekliyor' or kaynak_id is null)
);
create index if not exists el_notu_regresyon_sayfalari_durum_idx on public.el_notu_regresyon_sayfalari (durum, created_at);
create index if not exists el_notu_regresyon_sayfalari_doktor_idx on public.el_notu_regresyon_sayfalari (doctor_id);

create table if not exists public.el_notu_regresyon_olcumleri (
  id uuid primary key default gen_random_uuid(),
  hafta date not null,
  sayfa_id uuid references public.el_notu_regresyon_sayfalari (id) on delete set null,
  brans text,
  okuyucu_surumu text,
  gercek integer not null default 0,
  kesin integer not null default 0,
  dogrulamada integer not null default 0,
  adayda integer not null default 0,
  isaretli integer not null default 0,
  kacan integer not null default 0,
  dogrula integer not null default 0,
  korumali_soru integer not null default 0,
  korumali_gercek integer not null default 0,
  korumali_dogrula_ile integer not null default 0,
  uydurma integer not null default 0,
  ms integer,
  hata text check (hata is null or char_length(hata) <= 40),
  created_at timestamptz not null default now(),
  unique (hafta, sayfa_id)
);
create index if not exists el_notu_regresyon_olcumleri_hafta_idx on public.el_notu_regresyon_olcumleri (hafta desc);

alter table public.brans_sozluk_onerileri enable row level security;
alter table public.el_notu_regresyon_sayfalari enable row level security;
alter table public.el_notu_regresyon_olcumleri enable row level security;
revoke all on public.brans_sozluk_onerileri from anon, authenticated;
revoke all on public.el_notu_regresyon_sayfalari from anon, authenticated;
revoke all on public.el_notu_regresyon_olcumleri from anon, authenticated;

-- private bucket for the masked page packages of the set (random object names; service role only)
insert into storage.buckets (id, name, public)
values ('el-notu-regresyon', 'el-notu-regresyon', false)
on conflict (id) do update set public = false;

-- Founder dashboard aggregate (weeks start on Monday, Europe/Istanbul). Counts only.
create or replace function public.el_notu_kalite_haftalik(p_hafta integer default 12)
returns table (
  doctor_id uuid, hafta date, sayfa bigint, dogrula bigint, kelime bigint, kabul bigint, onayli_not bigint, duzeltme bigint,
  golge bigint, golge_ayni bigint, dok_ms bigint, dok_hasta bigint
)
language sql stable security invoker set search_path = public
as $$
  with sinir as (
    select (date_trunc('week', now() at time zone 'Europe/Istanbul') - make_interval(weeks => greatest(1, least(coalesce(p_hafta, 12), 52)) - 1))::date as bas
  ),
  kaynak as (
    select mk.id, mk.doctor_id, mk.note_id, mk.sayfa_sayisi, mk.okuma, date_trunc('week', mk.created_at at time zone 'Europe/Istanbul')::date as hafta
    from public.muayene_kaynaklari mk, sinir
    where mk.tur in ('el_notu', 'sekreter_yukleme') and mk.created_at >= sinir.bas - interval '14 days'
  ),
  k as (
    select kaynak.doctor_id, kaynak.hafta, sum(kaynak.sayfa_sayisi)::bigint as sayfa,
      sum(case when jsonb_typeof(kaynak.okuma -> 'istatistik' -> 'kelime') = 'number' then (kaynak.okuma -> 'istatistik' ->> 'kelime')::bigint else 0 end) as kelime,
      sum(case when jsonb_typeof(kaynak.okuma -> 'istatistik' -> 'kabul') = 'number' then (kaynak.okuma -> 'istatistik' ->> 'kabul')::bigint else 0 end) as kabul
    from kaynak, sinir where kaynak.sayfa_sayisi > 0 and kaynak.hafta >= sinir.bas group by 1, 2
  ),
  d as (
    select kaynak.doctor_id, kaynak.hafta, count(od.id)::bigint as dogrula
    from public.okuma_dogrulamalari od join kaynak on kaynak.id = od.kaynak_id and kaynak.doctor_id = od.doctor_id, sinir
    where od.sinif <> 'celiski' and kaynak.hafta >= sinir.bas group by 1, 2
  ),
  onayli as (
    select distinct kaynak.doctor_id, nt.id as note_id, date_trunc('week', nt.approved_at at time zone 'Europe/Istanbul')::date as hafta
    from kaynak join public.notes nt on nt.id = kaynak.note_id and nt.doctor_id = kaynak.doctor_id, sinir
    where kaynak.note_id is not null and nt.approved_at >= sinir.bas
  ),
  duz as (
    select e.doctor_id, e.note_id, count(*)::bigint as n
    from public.esnek_olaylar e join onayli o on o.note_id = e.note_id and o.doctor_id = e.doctor_id
    where e.tur = 'alan' and (e.deger ->> 'duzeltildi') = 'true' group by 1, 2
  ),
  o as (
    select onayli.doctor_id, onayli.hafta, count(*)::bigint as onayli_not, coalesce(sum(duz.n), 0)::bigint as duzeltme
    from onayli left join duz on duz.doctor_id = onayli.doctor_id and duz.note_id = onayli.note_id group by 1, 2
  ),
  g as (
    select gk.doctor_id, date_trunc('week', gk.gun::timestamp)::date as hafta, count(*)::bigint as golge, count(*) filter (where gk.ayni_icerik)::bigint as golge_ayni
    from public.golge_karsilastirmalari gk, sinir where gk.durum = 'karsilastirildi' and gk.gun >= sinir.bas group by 1, 2
  ),
  t1 as (
    select ds.doctor_id, ds.gun, sum(least(greatest(ds.sure_ms, 0), 3600000))::bigint as ms, count(distinct coalesce(ds.patient_id, ds.session_id, ds.note_id))::bigint as hasta
    from public.dokumantasyon_sureleri ds, sinir where ds.gun >= sinir.bas group by 1, 2
  ),
  t as (select t1.doctor_id, date_trunc('week', t1.gun::timestamp)::date as hafta, sum(t1.ms)::bigint as dok_ms, sum(t1.hasta)::bigint as dok_hasta from t1 group by 1, 2),
  anah as (
    select k.doctor_id, k.hafta from k union select d.doctor_id, d.hafta from d union select o.doctor_id, o.hafta from o
    union select g.doctor_id, g.hafta from g union select t.doctor_id, t.hafta from t
  )
  select anah.doctor_id, anah.hafta,
    coalesce(k.sayfa, 0), coalesce(d.dogrula, 0), coalesce(k.kelime, 0), coalesce(k.kabul, 0), coalesce(o.onayli_not, 0), coalesce(o.duzeltme, 0),
    coalesce(g.golge, 0), coalesce(g.golge_ayni, 0), coalesce(t.dok_ms, 0), coalesce(t.dok_hasta, 0)
  from anah
  left join k on k.doctor_id = anah.doctor_id and k.hafta = anah.hafta
  left join d on d.doctor_id = anah.doctor_id and d.hafta = anah.hafta
  left join o on o.doctor_id = anah.doctor_id and o.hafta = anah.hafta
  left join g on g.doctor_id = anah.doctor_id and g.hafta = anah.hafta
  left join t on t.doctor_id = anah.doctor_id and t.hafta = anah.hafta
  order by anah.hafta, anah.doctor_id
$$;
revoke all on function public.el_notu_kalite_haftalik(integer) from public, anon, authenticated;
grant execute on function public.el_notu_kalite_haftalik(integer) to service_role;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('205', '205_esnek_gelisim.sql', null, now(), false,
  'ESNEK-GELISIM: esnek_muayene_ayarlari.gelistirme_onayi(+_at); brans_sozluk_onerileri; el_notu_regresyon_sayfalari; el_notu_regresyon_olcumleri; bucket el-notu-regresyon (private); function el_notu_kalite_haftalik (service_role only); RLS on, service role only')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select column_name from information_schema.columns where table_name = 'esnek_muayene_ayarlari' and column_name like 'gelistirme%';
--   select relname, relrowsecurity from pg_class where relname in ('brans_sozluk_onerileri', 'el_notu_regresyon_sayfalari', 'el_notu_regresyon_olcumleri');
--   select grantee, privilege_type from information_schema.role_table_grants where table_name like 'el_notu_regresyon%' or table_name = 'brans_sozluk_onerileri';
--   select id, public from storage.buckets where id = 'el-notu-regresyon';
--   select * from public.el_notu_kalite_haftalik(4) limit 5;
